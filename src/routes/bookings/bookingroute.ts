import express, { Request, Response } from "express";
import sequelizeConnection from "../../db/config";
import BookingHistoryModel from "../../db/models/bookings/BookingHistoryModel";
import PujaModel from "../../db/models/pujas/PujaModel";
import UserModel from "../../db/models/users/usersModel";
import PujaPackagesModel from "../../db/models/pujas/PujaPackagesModel";
import ReviewsModel from "../../db/models/pujas/ReviewsModel";
import AssignedTasksModel from "../../db/models/agent/AssignedTasks";
import AgentModel from "../../db/models/agent/AgentModel";
import { parse } from "path";
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { BookingHistoryOutput } from "../../db/models/bookings/BookingHistoryModel";
import { Op } from "sequelize";

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.BUCKET_REGION ||
  !process.env.BUCKET_NAME
) {
  throw new Error('Missing AWS configuration in .env file');
}

const s3 = new S3Client({
  region: process.env.BUCKET_REGION.trim(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadCompletedMedia = multer({
  storage: multerS3({
    s3,
    bucket: process.env.BUCKET_NAME as string,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const folder = 'completed_uploads';
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.originalname}`;
      cb(null, `${folder}/${filename}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPG, PNG, JPEG, and MP4 are allowed.'
        )
      );
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});



// Function to generate a custom unique ID
function generateCustomPujaId(prefix: string): string {
  const randomNumber = Math.floor(Math.random() * 1000); // Generate a random number between 0 and 999
  return `${prefix}${randomNumber.toString().padStart(3, "0")}`; // Format the number with leading zeros
}

const bookingRouterdemo = express.Router();



bookingRouterdemo.post("/update-payment-status", async (req: any, res: any) => {
  const {
    booking_id,
    payment_status,
    payment_type,
    payment_reference,
    payment_session_id,
    payment_gateway
  } = req.body;

  // Validate required fields
  if (!booking_id || !payment_status || !payment_type || !payment_reference) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const updated = await BookingHistoryModel.update(
      {
        payment_status,
        payment_type,
        payment_reference,
        payment_session_id: payment_session_id || null,
        payment_gateway: payment_gateway || "Cashfree",
        booking_status: payment_status === "success" ? "confirmed" : "failed",
      },
      {
        where: { booking_id },
      }
    );

    if (updated[0] === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    res.status(200).json({ success: true, message: "Payment status updated successfully." });
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Error updating payment status", details: error.message });
  }
});


bookingRouterdemo.get("/get-bookings", async (req: any, res: any) => {
  try {
    // Fetch all bookings from the BookingHistoryModel
    const bookings = await BookingHistoryModel.findAll({
      attributes: [
        'booking_id',
        'userid',
        'puja_id',
        'full_name',
        'phone_number',
        'booking_email',
        'puja_date',
        'puja_name',
        'package_id',
        'package_name',
        'devotee_names',
        'devotee_gothra',
        'devotee_date_of_birth',
        'special_instructions',
        'amount',
        'discount_amount',
        'coupon_code',
        'total_amount',
        'shipping_address',
        'billing_address',
        'is_shipping_address_same_as_billing',
        'booking_status',
        'puja_status',
        'payment_method',
        'payment_reference',
        'completed_image_url_path',
        'completed_video_url_path',
        'payment_status',
        'payment_type',
        
      ]
    });

    // Check if there are any bookings found
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found." });
    }

    // Map through the bookings to format the result
    const result = bookings.map((booking: any) => {
      return {
        booking_id: booking.booking_id,
        userid: booking.userid,
        puja_id: booking.puja_id,
        full_name: booking.full_name,
        phone_number: booking.phone_number,
        booking_email: booking.booking_email,
        puja_date: booking.puja_date,
        puja_name: booking.puja_name,
        package_id: booking.package_id,
        package_name: booking.package_name,
        devotee_names: booking.devotee_names,
        devotee_gothra: booking.devotee_gothra,
        devotee_date_of_birth: booking.devotee_date_of_birth,
        special_instructions: booking.special_instructions,
        amount: booking.amount,
        discount_amount: booking.discount_amount,
        coupon_code: booking.coupon_code,
        total_amount: booking.total_amount,
        shipping_address: booking.shipping_address,
        billing_address: booking.billing_address,
        is_shipping_address_same_as_billing: booking.is_shipping_address_same_as_billing,
        booking_status: booking.booking_status,
        puja_status: booking.puja_status,
        payment_method: booking.payment_method,
        payment_reference: booking.payment_reference,
        completed_image_url_path: booking.completed_image_url_path,
        completed_video_url_path: booking.completed_video_url_path,
        payment_status: booking.payment_status,
        payment_type: booking.payment_type,
      };
    });

    // Return the result
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});

bookingRouterdemo.get("/get-all-bookings", async (req: any, res: any) => {
  try {
    const bookings = await BookingHistoryModel.findAll({
      attributes: [
        'booking_id',
        'full_name',
        'phone_number',
        'puja_name',
        'puja_date',
        'package_name',
        'amount',
        'booking_status',
        'puja_status'
      ],
      include: [
        {
          model: AssignedTasksModel,
          attributes: ['task_status'],
          as: 'assigned_task',
          required: false
        }
      ]
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found." });
    }

    const result = bookings.map((booking: any) => ({
      booking_id: booking.booking_id,
      customer: `${booking.full_name} (${booking.phone_number})`,
      puja_details: `${booking.puja_name} on ${booking.puja_date}`,
      package: booking.package_name,
      amount: booking.amount,
      date_time: booking.puja_date,
      booking_status: booking.booking_status,
      puja_status: booking.puja_status,
      assigned_status: booking.assigned_task?.task_status || 'Not Assigned'
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});


bookingRouterdemo.get('/by-puja/:puja_id', async (req: any, res: any) => {
  const { puja_id } = req.params;

  if (!puja_id) {
    return res.status(400).json({ error: 'puja_id is required' });
  }

  try {
    const bookings = await BookingHistoryModel.findAll({
      where: { puja_id },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['userid', 'username', 'email', 'phonenumber'],
        },
        {
          model: AgentModel,
          as: 'bookingAgent',
          attributes: ['agent_id', 'agent_name', 'phone_number'],
        },
        {
          model: PujaPackagesModel,
          as: 'bookedPackage',
          attributes: ['package_id', 'package_name', 'price'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      message: `Bookings found for puja_id: ${puja_id}`,
      data: bookings,
    });
  } catch (error: any) {
    console.error(`[ERROR] Get Bookings by Puja ID: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      details: error.message,
    });
  }
});


bookingRouterdemo.get("/get-assigned-tasks/:agentid", async (req: any, res: any) => {
  const { agentid } = req.params;

  try {
    const tasks = await AssignedTasksModel.findAll({
      where: { agent_id: agentid },
      attributes: ['agent_id', 'task_status', 'agent_commission'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory', // ✅ CORRECT ALIAS NAME
          attributes: [
            'booking_id',
            'userid',
            'puja_id',
            'full_name',
            'phone_number',
            'booking_email',
            'puja_date',
            'puja_name',
            'package_id',
            'package_name',
            'devotee_names',
            'devotee_gothra',
            'devotee_date_of_birth',
            'special_instructions',
            'amount',
            'discount_amount',
            'coupon_code',
            'total_amount',
            'shipping_address',
            'billing_address',
            'is_shipping_address_same_as_billing',
            'booking_status',
            'puja_status',
            'payment_method',
            'payment_reference',
            'completed_image_url_path',
            'completed_video_url_path',
            'payment_status',
            'payment_type',
          ],
          include: [
            {
              model: PujaModel,
              as: 'bookedPuja',
              required: false,
              attributes: ['puja_name', 'temple_name', 'temple_location', 'puja_thumbnail_url'],
            }
          ],
          required: true,
        }
      ],
      order: [['created', 'DESC']],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(200).json([]); // ✅ Return empty array with 200 OK
    }
    

    const result = tasks.map((task: any) => ({
      booking_id: task.bookingHistory?.booking_id || '',
      userid: task.bookingHistory?.userid || '',
      puja_id: task.bookingHistory?.puja_id || '',
      puja_name: task.bookingHistory?.puja_name || '',
      temple_name: task.bookingHistory?.bookedPuja?.temple_name || '',
      temple_location: task.bookingHistory?.bookedPuja?.temple_location || '',
      package_id: task.bookingHistory?.package_id || '',
      package_name: task.bookingHistory?.package_name || '',
      full_name: task.bookingHistory?.full_name || '',
      phone_number: task.bookingHistory?.phone_number || '',
      booking_email: task.bookingHistory?.booking_email || '',
      puja_date: task.bookingHistory?.puja_date || '',
      amount: task.bookingHistory?.amount || '',
      discount_amount: task.bookingHistory?.discount_amount || '',
      coupon_code: task.bookingHistory?.coupon_code || '',
      total_amount: task.bookingHistory?.total_amount || '',
      shipping_address: task.bookingHistory?.shipping_address || '',
      billing_address: task.bookingHistory?.billing_address || '',
      is_shipping_address_same_as_billing: task.bookingHistory?.is_shipping_address_same_as_billing || false,
      booking_status: task.bookingHistory?.booking_status || '',
      puja_status: task.bookingHistory?.puja_status || '',
      payment_method: task.bookingHistory?.payment_method || '',
      payment_reference: task.bookingHistory?.payment_reference || '',
      completed_image_url_path: task.bookingHistory?.completed_image_url_path || '',
      completed_video_url_path: task.bookingHistory?.completed_video_url_path || '',
      payment_status: task.bookingHistory?.payment_status || '',
      payment_type: task.bookingHistory?.payment_type || '',
      devotee_names: task.bookingHistory?.devotee_names || [],
      devotee_gothra: task.bookingHistory?.devotee_gothra || [],
      devotee_date_of_birth: task.bookingHistory?.devotee_date_of_birth || [],

      assigned_agent: {
        agent_id: task.agent_id,
        task_status: task.task_status,
        agent_commission: task.agent_commission || "0",
      },

      puja_details: task.bookingHistory?.bookedPuja ? {
        puja_name: task.bookingHistory.bookedPuja.puja_name,
        temple_name: task.bookingHistory.bookedPuja.temple_name,
        puja_thumbnail_url: task.bookingHistory.bookedPuja.puja_thumbnail_url,
      } : null,
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    return res.status(500).json({ message: "Error fetching assigned tasks", error });
  }
});



bookingRouterdemo.get('/get-assigned-booking/:agentid/:bookingid', async (req: any, res: any) => {
  const { agentid, bookingid } = req.params;

  try {
    const task = await AssignedTasksModel.findOne({
      where: { agent_id: agentid, booking_id: bookingid },
      attributes: ['agent_id', 'task_status', 'agent_commission'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          attributes: [
            'booking_id',
            'userid',
            'puja_id',
            'full_name',
            'phone_number',
            'booking_email',
            'puja_date',
            'puja_name',
            'package_id',
            'package_name',
            'devotee_names',
            'devotee_gothra',
            'devotee_date_of_birth',
            'special_instructions',
            'amount',
            'discount_amount',
            'coupon_code',
            'total_amount',
            'shipping_address',
            'billing_address',
            'is_shipping_address_same_as_billing',
            'booking_status',
            'puja_status',
            'payment_method',
            'payment_reference',
            'completed_image_url_path',
            'completed_video_url_path',
            'payment_status',
            'payment_type',
          ],
          include: [
            {
              model: PujaModel,
              as: 'bookedPuja',
              required: false,
              attributes: ['puja_name', 'temple_name', 'temple_location', 'puja_thumbnail_url'],
            }
          ],
          required: true,
        }
      ],
    });

    if (!task) {
      return res.status(404).json({ message: "Booking not assigned to this agent or not found" });
    }

    // ✅ FIX: Tell TypeScript to treat task as any
    const t = task as any;

    const result = {
      booking_id: t.bookingHistory?.booking_id || '',
      userid: t.bookingHistory?.userid || '',
      puja_id: t.bookingHistory?.puja_id || '',
      puja_name: t.bookingHistory?.puja_name || '',
      temple_name: t.bookingHistory?.bookedPuja?.temple_name || '',
      temple_location: t.bookingHistory?.bookedPuja?.temple_location || '',
      package_id: t.bookingHistory?.package_id || '',
      package_name: t.bookingHistory?.package_name || '',
      full_name: t.bookingHistory?.full_name || '',
      phone_number: t.bookingHistory?.phone_number || '',
      booking_email: t.bookingHistory?.booking_email || '',
      puja_date: t.bookingHistory?.puja_date || '',
      amount: t.bookingHistory?.amount || '',
      discount_amount: t.bookingHistory?.discount_amount || '',
      coupon_code: t.bookingHistory?.coupon_code || '',
      total_amount: t.bookingHistory?.total_amount || '',
      shipping_address: t.bookingHistory?.shipping_address || '',
      billing_address: t.bookingHistory?.billing_address || '',
      is_shipping_address_same_as_billing: t.bookingHistory?.is_shipping_address_same_as_billing || false,
      booking_status: t.bookingHistory?.booking_status || '',
      puja_status: t.bookingHistory?.puja_status || '',
      payment_method: t.bookingHistory?.payment_method || '',
      payment_reference: t.bookingHistory?.payment_reference || '',
      completed_image_url_path: t.bookingHistory?.completed_image_url_path || '',
      completed_video_url_path: t.bookingHistory?.completed_video_url_path || '',
      payment_status: t.bookingHistory?.payment_status || '',
      payment_type: t.bookingHistory?.payment_type || '',
      devotee_names: t.bookingHistory?.devotee_names || [],
      devotee_gothra: t.bookingHistory?.devotee_gothra || [],
      devotee_date_of_birth: t.bookingHistory?.devotee_date_of_birth || [],

      assigned_agent: {
        agent_id: t.agent_id,
        task_status: t.task_status,
        agent_commission: t.agent_commission || "0",
      },

      puja_details: t.bookingHistory?.bookedPuja ? {
        puja_name: t.bookingHistory.bookedPuja.puja_name,
        temple_name: t.bookingHistory.bookedPuja.temple_name,
        puja_thumbnail_url: t.bookingHistory.bookedPuja.puja_thumbnail_url,
      } : null,
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching assigned booking:', error);
    return res.status(500).json({ message: "Error fetching assigned booking", error });
  }
});


bookingRouterdemo.get("/agent-dashboard/:agentid", async (req: any, res: any) => {
  const { agentid } = req.params;

  try {
    const tasks = await AssignedTasksModel.findAll({
      where: { agent_id: agentid },
      attributes: ['booking_id', 'task_status', 'agent_commission', 'created'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          attributes: ['puja_date', 'puja_status', 'payment_status', 'total_amount'],
          required: true,
        },
      ],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No tasks assigned yet for this agent." });
    }

    const today = new Date();

    let totalAssigned = tasks.length;
    let totalCompleted = 0;
    let upcomingTasks = 0;
    let totalEarnings = 0;

    tasks.forEach((task: any) => {
      const booking = task.bookingHistory;
      if (!booking) return;

      if (booking.puja_status === 'completed') {
        totalCompleted++;
        totalEarnings += parseFloat(task.agent_commission || "0");
      }

      if (new Date(booking.puja_date) >= today && (booking.puja_status === 'pending' || booking.puja_status === 'started')) {
        upcomingTasks++;
      }
    });

    return res.status(200).json({
      assignedTasks: totalAssigned,
      completedTasks: totalCompleted,
      upcomingTasks: upcomingTasks,
      totalEarnings: totalEarnings.toFixed(2),
    });

  } catch (error) {
    console.error("Error fetching agent dashboard:", error);
    return res.status(500).json({ message: "Error fetching agent dashboard", error });
  }
});

bookingRouterdemo.get("/agent-completed-bookings/:agentid", async (req: any, res: any) => {
  const { agentid } = req.params;

  try {
    const tasks = await AssignedTasksModel.findAll({
      where: { agent_id: agentid },
      attributes: ['booking_id', 'task_status', 'agent_commission', 'created'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          where: { puja_status: 'completed' }, // ✅ Only completed pujas
          attributes: ['puja_name', 'puja_date', 'shipping_address', 'total_amount', 'payment_status'],
          include: [
            {
              model: PujaModel,
              as: 'bookedPuja',
              attributes: ['puja_name', 'temple_name', 'temple_location', 'puja_thumbnail_url'],
            }
          ],
          required: true,
        },
      ],
      order: [['created', 'DESC']],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No completed bookings found for this agent." });
    }

    const result = tasks.map((task: any) => ({
      booking_id: task.booking_id,
      puja_name: task.bookingHistory?.puja_name || '',
      temple_name: task.bookingHistory?.bookedPuja?.temple_name || '',
      temple_location: task.bookingHistory?.bookedPuja?.temple_location || '',
      puja_date: task.bookingHistory?.puja_date || '',
      address: task.bookingHistory?.shipping_address?.address || '',
      city: task.bookingHistory?.shipping_address?.city || '',
      total_amount: task.bookingHistory?.total_amount || '',
      payment_status: task.bookingHistory?.payment_status || '',
      agent_commission: task.agent_commission || "0",
      task_status: task.task_status,
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching completed bookings:", error);
    return res.status(500).json({ message: "Error fetching completed bookings", error });
  }
});


bookingRouterdemo.get("/agent-upcoming-tasks/:agentid", async (req: any, res: any) => {
  const { agentid } = req.params;

  try {
    const today = new Date();

    const tasks = await AssignedTasksModel.findAll({
      where: { agent_id: agentid },
      attributes: ['booking_id', 'task_status', 'agent_commission', 'created'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          where: {
            puja_status: ['pending', 'started'],
            puja_date: { [Op.gte]: today },
          },
          attributes: ['puja_name', 'puja_date', 'shipping_address', 'total_amount', 'payment_status'],
          include: [
            {
              model: PujaModel,
              as: 'bookedPuja',
              attributes: ['puja_name', 'temple_name', 'temple_location', 'puja_thumbnail_url'],
            }
          ],
          required: true,
        },
      ],
      order: [['created', 'ASC']],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No upcoming tasks found for this agent." });
    }

    const result = tasks.map((task: any) => ({
      booking_id: task.booking_id,
      puja_name: task.bookingHistory?.puja_name || '',
      temple_name: task.bookingHistory?.bookedPuja?.temple_name || '',
      temple_location: task.bookingHistory?.bookedPuja?.temple_location || '',
      puja_date: task.bookingHistory?.puja_date || '',
      address: task.bookingHistory?.shipping_address?.address || '',
      city: task.bookingHistory?.shipping_address?.city || '',
      total_amount: task.bookingHistory?.total_amount || '',
      payment_status: task.bookingHistory?.payment_status || '',
      agent_commission: task.agent_commission || "0",
      task_status: task.task_status,
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching upcoming tasks:", error);
    return res.status(500).json({ message: "Error fetching upcoming tasks", error });
  }
});


bookingRouterdemo.get("/agent-ongoing-bookings/:agentid", async (req: any, res: any) => {
  const { agentid } = req.params;

  try {
    const tasks = await AssignedTasksModel.findAll({
      where: { agent_id: agentid },
      attributes: ['booking_id', 'task_status', 'agent_commission', 'created'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          where: { puja_status: 'started' }, // ✅ Only started pujas
          attributes: ['puja_name', 'puja_date', 'shipping_address', 'total_amount', 'payment_status'],
          include: [
            {
              model: PujaModel,
              as: 'bookedPuja',
              attributes: ['puja_name', 'temple_name', 'temple_location', 'puja_thumbnail_url'],
            }
          ],
          required: true,
        },
      ],
      order: [['created', 'DESC']],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No ongoing bookings found for this agent." });
    }

    const result = tasks.map((task: any) => ({
      booking_id: task.booking_id,
      puja_name: task.bookingHistory?.puja_name || '',
      temple_name: task.bookingHistory?.bookedPuja?.temple_name || '',
      temple_location: task.bookingHistory?.bookedPuja?.temple_location || '',
      puja_date: task.bookingHistory?.puja_date || '',
      address: task.bookingHistory?.shipping_address?.address || '',
      city: task.bookingHistory?.shipping_address?.city || '',
      total_amount: task.bookingHistory?.total_amount || '',
      payment_status: task.bookingHistory?.payment_status || '',
      agent_commission: task.agent_commission || "0",
      task_status: task.task_status,
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching ongoing bookings:", error);
    return res.status(500).json({ message: "Error fetching ongoing bookings", error });
  }
});

bookingRouterdemo.get("/agent-cancelled-bookings/:agentid", async (req: any, res: any) => {
  const { agentid } = req.params;

  try {
    const tasks = await AssignedTasksModel.findAll({
      where: { agent_id: agentid },
      attributes: ['booking_id', 'task_status', 'agent_commission', 'created'],
      include: [
        {
          model: BookingHistoryModel,
          as: 'bookingHistory',
          where: { puja_status: 'cancelled' }, // ✅ Only cancelled pujas
          attributes: ['puja_name', 'puja_date', 'shipping_address', 'total_amount', 'payment_status'],
          include: [
            {
              model: PujaModel,
              as: 'bookedPuja',
              attributes: ['puja_name', 'temple_name', 'temple_location', 'puja_thumbnail_url'],
            }
          ],
          required: true,
        },
      ],
      order: [['created', 'DESC']],
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No cancelled bookings found for this agent." });
    }

    const result = tasks.map((task: any) => ({
      booking_id: task.booking_id,
      puja_name: task.bookingHistory?.puja_name || '',
      temple_name: task.bookingHistory?.bookedPuja?.temple_name || '',
      temple_location: task.bookingHistory?.bookedPuja?.temple_location || '',
      puja_date: task.bookingHistory?.puja_date || '',
      address: task.bookingHistory?.shipping_address?.address || '',
      city: task.bookingHistory?.shipping_address?.city || '',
      total_amount: task.bookingHistory?.total_amount || '',
      payment_status: task.bookingHistory?.payment_status || '',
      agent_commission: task.agent_commission || "0",
      task_status: task.task_status,
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching cancelled bookings:", error);
    return res.status(500).json({ message: "Error fetching cancelled bookings", error });
  }
});


bookingRouterdemo.get("/get-user-bookings/:userId", async (req: any, res: any) => {
  const { userId } = req.params; // Extract the userId from the URL parameter

  try {
    // Fetch all bookings for the specific user from the BookingHistoryModel
    const bookings = await BookingHistoryModel.findAll({
      where: { userid: userId }, // Filter bookings by user_id
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["username", "userid"],
        },
        {
          model: PujaModel,
          as: "bookedPuja",
          attributes: ["puja_name", "temple_name"],
        },
        // {
        //   model: PujaPackagesModel,
        //   as: "pujaPackage",  // Make sure alias is consistent (was 'packages' before)
        //   attributes: ["package_id","package_name"],
        // },
        {
          model: ReviewsModel,
          as: "bookingReviews",
          attributes: [
            "review_id",
            "rating",
            "review",
            "uploads_url",
            "verified_user",
          ],
        },
      ],
    });

    // Check if there are any bookings found for the user
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this user." });
    }

    // Map through the bookings to fetch associated user, puja, and package information
    const result = bookings.map((booking: any) => {
      return {
        booking_id: booking.booking_id,
        userId: booking.user?.userid || "Unknown", // Handle case where user is not found
        username: booking.user?.username || "Unknown", // Handle case where user is not found
        puja_name: booking.bookedPuja?.puja_name || "Unknown", // ✅ FIXED
        temple_name: booking.bookedPuja?.temple_name || "Unknown", // ✅ FIXED
        // package_id: booking.pujaPackage?.[0]?.package_id || "Unknown", // Handle case where package is not found
        // package_name: booking.pujaPackage?.[0]?.package_name || "Unknown", // Handle case where package is not found
        package_id: booking.package_id || "Unknown", // Handle case where package is not found
        package_name: booking.package_name, // Handle case where package is not found
        reviews:
          booking.reviews?.map((review: any) => ({
            review_id: review.review_id,
            rating: review.rating,
            comment: review.review,
            uploads_url: review.uploads_url,
            verified_user: review.verified_user,
          })) || [],
        amount: booking.amount,
        puja_status: booking.puja_status,
        discount_amount: booking.discount_amount,
        total_amount: booking.total_amount,
        payment_method: booking.payment_method,
        booking_status: booking.booking_status,
        special_instructions: booking.special_instructions,
        devotee_names: booking.devotee_names,
        devotee_gothra: booking.devotee_gothra,
        devotee_date_of_birth: booking.devotee_date_of_birth,
        shipping_address: booking.shipping_address,
        billing_address: booking.billing_address,
        is_shipping_address_same_as_billing:
          booking.is_shipping_address_same_as_billing,
        puja_date: booking.puja_date,
        coupon_code: booking.coupon_code,
        payment_status: booking.payment_status,
        payment_type: booking.payment_type,
        review_status: booking.review_status,
        completed_image_url_path: booking.completed_image_url_path,
        completed_video_url_path: booking.completed_video_url_path,
        tracking_id: booking.tracking_id,
        tracking_url: booking.tracking_url,

      };
    });

    // Return the result
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});


bookingRouterdemo.get("/get-booking/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const booking = await BookingHistoryModel.findOne({
      where: { booking_id: id },
      attributes: {
        exclude: [], // if you have an exclude list, keep created_at included
      },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["username", "userid"],
        },
        {
          model: PujaModel,
          as: "bookedPuja",
          attributes: ["puja_name", "temple_name", "puja_thumbnail_url"],
        },
        {
          model: PujaPackagesModel,
          as: "bookedPackage",
          attributes: ["package_name"],
        },
        {
          model: ReviewsModel,
          as: "bookingReviews",
          attributes: [
            "review_id",
            "rating",
            "review",
            "uploads_url",
            "verified_user",
          ],
        },
        {
          model: AssignedTasksModel,
          as: "assignedBookingTasks",
          attributes: ["agent_id", "task_status", "agent_commission"],
          include: [
            {
              model: AgentModel,
              as: "agentDetails",
              attributes: ["agent_id", "agent_name", "phone_number", "agent_email", "status"],
            },
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const assignedAgents = booking.assignedBookingTasks?.map((task: any) => ({
      agent_id: task.agent_id,
      task_status: task.task_status,
      agent_commission: task.agent_commission,
      agent_details: {
        agent_id: task.agentDetails?.agent_id || null,
        agent_name: task.agentDetails?.agent_name || null,
        phone_number: task.agentDetails?.phone_number || null,
        agent_email: task.agentDetails?.agent_email || null,
        status: task.agentDetails?.status || null,
      },
    })) || [];

    const result = {
      booking_id: booking.booking_id,
      userid: booking.userid,
      puja_id: booking.puja_id,
      full_name: booking.full_name,
      phone_number: booking.phone_number,
      booking_email: booking.booking_email,
      package_id: booking.package_id,
      username: booking.user?.username || "Unknown",
      puja_name: booking.bookedPuja?.puja_name || "Unknown",
      temple_name: booking.bookedPuja?.temple_name || "Unknown",
      puja_thumbnail_url: booking.bookedPuja?.puja_thumbnail_url || null,
      package_name: booking.bookedPackage?.package_name || "Unknown",
      reviews:
        booking.bookingReviews?.map((review: any) => ({
          review_id: review.review_id,
          rating: review.rating,
          review: review.review,
          uploads_url: review.uploads_url,
          verified_user: review.verified_user,
        })) || [],
      amount: booking.amount,
      discount_amount: booking.discount_amount,
      total_amount: booking.total_amount,
      payment_method: booking.payment_method,
      payment_reference: booking.payment_reference,
      completed_image_url_path: booking.completed_image_url_path,
      completed_video_url_path: booking.completed_video_url_path,
      payment_status: booking.payment_status,
      payment_type: booking.payment_type,
      booking_status: booking.booking_status,
      special_instructions: booking.special_instructions,
      devotee_names: booking.devotee_names,
      devotee_gothra: booking.devotee_gothra,
      devotee_date_of_birth: booking.devotee_date_of_birth,
      shipping_address: booking.shipping_address,
      billing_address: booking.billing_address,
      is_shipping_address_same_as_billing:
        booking.is_shipping_address_same_as_billing,
      puja_date: booking.puja_date,
      coupon_code: booking.coupon_code,
      puja_status: booking.puja_status,
      review_status: booking.review_status,
      tracking_id: booking.tracking_number,
      tracking_url: booking.tracking_link,
     createdAt: booking.createdAt,
 
      assigned_agents: assignedAgents,
    };

    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Error fetching booking", error });
  }
});



bookingRouterdemo.put('/update-tracking/:booking_id', async (req: any, res: any) => {
  const { booking_id } = req.params;
  const { tracking_number, tracking_link } = req.body;

  try {
    await BookingHistoryModel.update(
      { tracking_number, tracking_link },
      { where: { booking_id } }
    );
    res.status(200).json({ message: 'Tracking info updated successfully.' });
  } catch (err) {
    console.error('Error updating tracking:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

bookingRouterdemo.put('/update-status/:booking_id', async (req: any, res: any) => {
  const { booking_id } = req.params;
  const { booking_status, puja_status } = req.body;

  try {
    // Dynamically build update object based on provided fields
    const updateFields: any = {};
    if (booking_status !== undefined) updateFields.booking_status = booking_status;
    if (puja_status !== undefined) updateFields.puja_status = puja_status;

    // Prevent empty update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update.' });
    }

    await BookingHistoryModel.update(updateFields, {
      where: { booking_id },
    });

    res.status(200).json({ message: 'Booking data updated successfully.', updatedFields: updateFields });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});


bookingRouterdemo.post(
  '/upload-completion/:booking_id',
  uploadCompletedMedia.fields([
    { name: 'completed_image', maxCount: 1 },
    { name: 'completed_video', maxCount: 1 },
  ]),
  async (req: any, res) => {
    const { booking_id } = req.params;

    const completed_image_url_path =
      req.files?.['completed_image']?.[0]?.location || null;
    const completed_video_url_path =
      req.files?.['completed_video']?.[0]?.location || null;

    try {
      await BookingHistoryModel.update(
        {
          completed_image_url_path,
          completed_video_url_path,
        },
        { where: { booking_id } }
      );

      res
        .status(200)
        .json({ message: 'Completion media uploaded successfully.' });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Upload failed', error: err });
    }
  }
);


bookingRouterdemo.get("/get-booking/:booking_id", async (req: any, res: any) => {
  try {
    const { booking_id } = req.params;

    const booking = await BookingHistoryModel.findOne({
      where: { booking_id },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


bookingRouterdemo.get("/payment-session/:bookingId", async (req: any, res: any) => {
  const { bookingId } = req.params;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: "Missing booking ID" });
  }

  try {
    const booking = await BookingHistoryModel.findOne({
      where: { booking_id: bookingId },
      attributes: [
        "booking_id",
        "payment_session_id",
        "payment_gateway",
        "payment_reference",
        "payment_status",
        "payment_type",
        "order_id",
        "booking_status",
        "userid",
        "puja_name",
        "package_name",
        "total_amount",
        "created_at"
      ],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Payment session details fetched successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Error fetching payment session:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// ✅ Retry Payment - Check Valid Session and Return if Retry Allowed
bookingRouterdemo.get("/retry-payment/:bookingId", async (req: any, res: any) => {
  const { bookingId } = req.params;

  try {
    const booking = await BookingHistoryModel.findOne({
      where: { booking_id: bookingId },
      attributes: ["payment_status", "payment_session_id", "order_id", "total_amount"]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.payment_status === "success") {
      return res.status(400).json({ success: false, message: "Booking already has a successful payment." });
    }

    if (!booking.payment_session_id || !booking.order_id) {
      return res.status(400).json({ success: false, message: "No valid payment session found. Please reinitiate payment." });
    }

    return res.status(200).json({
      success: true,
      message: "Retry session available",
      payment_session_id: booking.payment_session_id,
      order_id: booking.order_id,
      total_amount: booking.total_amount
    });
  } catch (error: any) {
    console.error("Retry payment error:", error.message);
    return res.status(500).json({ success: false, message: "Internal error", error: error.message });
  }
});


export default bookingRouterdemo;
