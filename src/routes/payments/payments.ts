import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";
import BookingHistoryModel from "../../db/models/bookings/BookingHistoryModel";
import { sendWhatsappMessage } from "../../utils/sendWhatsappMessage";


dotenv.config();
const paymentRouter = express.Router();

const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_HEADERS = {
  "x-client-id": process.env.CASHFREE_CLIENT_ID!,
  "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
  "x-api-version": "2025-01-01",
  "Content-Type": "application/json",
  "accept": "application/json"
};

function convertDDMMYYYYtoISO(dateStr: string): string {
  const [dd, mm, yyyy] = dateStr.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}


paymentRouter.post("/generate-cashfree-token", async (req: any, res: any) => {
  try {
    const {
      puja_id,
      package_id,
      devotee_names,
      devotee_gothra,
      devotee_date_of_birth,
      special_instructions,
      amount,
      gst_amount,
      discount_amount,
      coupon_code,
      total_amount,
      shipping_address,
      billing_address,
      is_shipping_address_same_as_billing,
      payment_method,
      userid,
      puja_date,
      puja_name,
      package_name
    } = req.body;

    const parsedTotalAmount = Number(total_amount);
    if (!parsedTotalAmount || isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
      return res.status(400).json({
        error: "Invalid total_amount. Must be a number greater than 0.",
        received: total_amount
      });
    }

    const bookingId = `KSB${Date.now()}`;
    const customerPhone = billing_address?.phone || "9999999999";
    const customerEmail = billing_address?.email || "demo@kalki.com";

    await BookingHistoryModel.create({
      booking_id: bookingId,
      userid,
      puja_id,
      package_id,
      devotee_names,
      devotee_gothra,
      devotee_date_of_birth: devotee_date_of_birth.map((dob: string) => {
  const iso = convertDDMMYYYYtoISO(dob);
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid devotee DOB format: ${dob}`);
  }
  return parsed;
}),

      special_instructions,
      amount,
      gst_amount,
      discount_amount,
      coupon_code,
      total_amount: parsedTotalAmount,
      shipping_address,
      billing_address,
      is_shipping_address_same_as_billing,
      payment_method,
      payment_reference: "",
      puja_date,
      puja_name,
      package_name,
      payment_status: "pending",
      payment_type: "Cashfree",
      booking_status: "pending",
      puja_status: "pending",
      full_name: billing_address?.fullName,
      phone_number: customerPhone,
      booking_email: customerEmail,
      order_id: bookingId,
      payment_gateway: "cashfree"
    });

    const cashfreePayload = {
      order_id: bookingId,
      order_amount: parsedTotalAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: userid,
        customer_phone: customerPhone,
        customer_email: customerEmail
      },
      order_meta: {
        return_url: `https://kalkiseva.com/payment-status/${bookingId}`,
        notify_url: `https://api.kalkiseva.com/api/v1/payments/cashfree-webhook`
      },
      order_note: `Booking for ${puja_name}`
    };

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      cashfreePayload,
      { headers: CASHFREE_HEADERS }
    );

    let sessionId = response?.data?.payment_session_id;
    if (sessionId?.includes("spayment")) {
      sessionId = sessionId.replace("spayment", "");
    }

    if (!sessionId || !sessionId.startsWith("session_")) {
      throw new Error("Invalid payment_session_id received from Cashfree.");
    }

    await BookingHistoryModel.update(
      { payment_session_id: sessionId },
      { where: { booking_id: bookingId } }
    );

    return res.status(200).json({
      success: true,
      payment_session_id: sessionId,
      booking_id: bookingId
    });
  } catch (error: any) {
    console.error("❌ Error from Cashfree:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Cashfree session creation failed",
      details: error?.response?.data || error.message
    });
  }
});

paymentRouter.post("/cashfree-webhook", async (req: any, res: any) => {
  try {
    const rawBody = req.body.toString("utf8");
    const data = JSON.parse(rawBody);

    const orderId = data.data?.order?.order_id;
    const paymentStatusRaw = data.data?.payment?.payment_status; // e.g., "SUCCESS"
    const paymentStatus = paymentStatusRaw?.toLowerCase();
    const paymentReference = data.data?.payment?.bank_reference || "N/A";
    const paymentMethodType = Object.keys(data.data?.payment?.payment_method || {})[0] || "unknown";

    if (!orderId || !paymentStatus) {
      console.warn("❌ Missing order ID or payment status");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    console.log("✅ Webhook received for Order ID:", orderId, "with status:", paymentStatusRaw);

    const booking = await BookingHistoryModel.findOne({
      where: { booking_id: orderId },
    });

    if (!booking) {
      console.error("❌ Booking not found:", orderId);
      return res.status(404).json({ error: "Booking not found" });
    }

    await booking.update({
      payment_status: paymentStatusRaw,
      booking_status: paymentStatus === "success" ? "confirmed" : "pending",
      payment_reference: paymentReference,
      payment_type: paymentMethodType,
    });

    console.log("✅ Booking updated in DB");

    if (paymentStatus === "success" && !booking.whatsapp_sent) {
      console.log("📤 Sending WhatsApp confirmation...");

      await sendWhatsappMessage(orderId, {
        full_name: booking.full_name,
        puja_name: booking.puja_name,
        puja_date: booking.puja_date, // ✅ Send raw ISO string or Date
        total_amount: booking.total_amount,
        phone_number: booking.phone_number,
        booking_id: booking.booking_id,
        devotee_names: booking.devotee_names,
      });

      console.log("✅ WhatsApp message sent successfully");

      await booking.update({
        whatsapp_sent: true,
      });
    } else if (booking.whatsapp_sent) {
      console.log("🔁 WhatsApp already sent for this booking. Skipping resend.");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook Processing Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


paymentRouter.post("/retry-cashfree-payment", async (req: any, res: any) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const booking = await BookingHistoryModel.findOne({ where: { booking_id } });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.payment_status === "success") {
      return res.status(400).json({ error: "Payment already successful. Retry not allowed." });
    }

    // 🆕 Generate a new order_id for retry
    const retryOrderId = `${booking.booking_id}_retry_${Date.now()}`;

    const cashfreePayload = {
      order_id: retryOrderId,
      order_amount: booking.total_amount,
      order_currency: "INR",
      customer_details: {
        customer_id: booking.userid,
        customer_phone: booking.phone_number || "9999999999",
        customer_email: booking.booking_email || "demo@kalki.com",
      },
      order_meta: {
        return_url: `https://kalkiseva.com/booking-success/${booking.booking_id}`,
        notify_url: `https://api.kalkiseva.com/api/v1/payments/cashfree-webhook`,
      },
      order_note: `Retry payment for booking ${booking.booking_id}`,
    };

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      cashfreePayload,
      { headers: CASHFREE_HEADERS }
    );

    const sessionId = response?.data?.payment_session_id;

    if (!sessionId || !sessionId.startsWith("session_")) {
      throw new Error("Invalid payment_session_id received from Cashfree.");
    }

    // ✅ Update booking or save retry log (recommended)
    await booking.update({
      payment_session_id: sessionId,
      payment_status: "pending",
      booking_status: "pending",
    });

    return res.status(200).json({
      success: true,
      payment_session_id: sessionId,
      booking_id: booking.booking_id,
    });

  } catch (error: any) {
    console.error("❌ Error retrying Cashfree payment:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Retry payment session creation failed",
      details: error?.response?.data || error.message,
    });
  }
});


paymentRouter.get("/verify-booking-status/:orderId", async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const booking = await BookingHistoryModel.findOne({
      where: { booking_id: orderId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (err) {
    console.error("❌ Error verifying booking status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


paymentRouter.get("/check-status/:orderId", async (req: any, res: any) => {
  try {
    const orderId = req.params.orderId;

    const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}/payments`, {
      headers: CASHFREE_HEADERS,
    });

    return res.json(response.data);
  } catch (err: any) {
    console.error("❌ Error fetching order status:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch status", details: err.response?.data || err.message });
  }
});

export default paymentRouter;


