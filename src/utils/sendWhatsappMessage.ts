import axios from "axios";
import { format, parseISO, isValid } from "date-fns";

interface BookingDetails {
  full_name: string;
  puja_name: string;
  puja_date: string | Date; // ✅ Accept both
  total_amount: number;
  phone_number: string;
  booking_id: string;
  devotee_names: string[];
}

export const sendWhatsappMessage = async (
  bookingId: string,
  bookingDetails: BookingDetails
) => {
  try {
    const phoneNumber = bookingDetails.phone_number;
    const apiKey = process.env.AISENSY_API_KEY!;
    const aisensyApiUrl = "https://backend.aisensy.com/campaign/t1/api/v2";

    // ✅ Safe date formatting
    let formattedDate = "Date not available";
    let parsedDate: Date;

    if (bookingDetails.puja_date) {
      if (typeof bookingDetails.puja_date === "string") {
        parsedDate = parseISO(bookingDetails.puja_date);
      } else {
        parsedDate = bookingDetails.puja_date;
      }

      if (isValid(parsedDate)) {
        formattedDate = format(parsedDate, "dd/MM/yyyy");
      } else {
        console.warn("⚠️ Invalid puja_date:", bookingDetails.puja_date);
      }
    }

    const data = {
      apiKey,
      campaignName: "Booking Confirmation Message",
      destination: phoneNumber,
      userName: "Kalki Seva",
      templateParams: [
        bookingDetails.full_name,
        bookingDetails.puja_name,
        formattedDate,
        String(bookingDetails.devotee_names?.length || 0),
        String(bookingDetails.total_amount || 0),
        bookingId,
      ],
      source: "booking-system",
    };

    const response = await axios.post(aisensyApiUrl, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.data.success) {
      console.log("✅ WhatsApp message sent!");
    } else {
      console.error("❌ WhatsApp send failed:", response.data);
    }
  } catch (error) {
    console.error("🔥 WhatsApp Error:", error);
  }
};
