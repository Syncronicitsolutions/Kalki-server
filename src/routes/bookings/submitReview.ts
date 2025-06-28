import { Request, Response, Router } from "express";
import ReviewsModel from "../../db/models/pujas/ReviewsModel";
import PujaModel from "../../db/models/pujas/PujaModel";
import UserModel from "../../db/models/users/usersModel";
import BookingHistoryModel from "../../db/models/bookings/BookingHistoryModel"; // Assuming BookingHistoryModel exists
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.BUCKET_REGION ||
  !process.env.BUCKET_NAME
) {
  throw new Error("Missing necessary AWS configuration in .env file");
}

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.BUCKET_REGION.trim(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Define custom file type to include the location URL from AWS S3
interface CustomFile extends Express.Multer.File {
  location: string; // Location URL of the uploaded file
}

// Set up multer storage configuration with AWS S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME as string,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `review_images/${Date.now()}_${file.originalname}`);
    },
  }),
});


const createReview = Router();


// POST route for submitting a review
// POST route for submitting a review
createReview.post(
  "/submitReview",
  upload.fields([{ name: "uploads_url", maxCount: 5 }]),
  async (req: any, res: any) => {
    const {
      puja_id,
      booking_id,
      userid,
      rating,
      review,
      verified_user,
    } = req.body;

    // ✅ Extract uploaded files properly
    const files = req.files as { [fieldname: string]: CustomFile[] };
    const uploads = files?.uploads_url || [];
    const uploads_url = uploads.map(file => file.location);

    // Step 1: Validate required fields
    if (!puja_id || !userid || !rating || !review) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "puja_id, userid, rating, and review are required",
      });
    }

    const parsedRating = parseInt(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        error: "Invalid rating",
        message: "Rating must be between 1 and 5",
      });
    }

    try {
      // Step 2: Validate puja_id
      const puja = await PujaModel.findByPk(puja_id);
      if (!puja) {
        return res.status(404).json({
          error: "Puja not found",
          message: `No Puja found with id ${puja_id}`,
        });
      }

      // Step 3: If booking_id is provided, validate booking
      if (booking_id) {
        const booking = await BookingHistoryModel.findOne({
          where: { booking_id },
        });

        if (!booking) {
          return res.status(404).json({
            error: "Booking not found",
            message: `No booking found with id ${booking_id}`,
          });
        }

        if (booking.review_status === true) {
          return res.status(400).json({
            error: "Review already submitted",
            message: "You have already submitted a review for this booking.",
          });
        }
      }

      // Step 4: Create the review
      const newReview = await ReviewsModel.create({
        puja_id,
        userid,
        booking_id: booking_id || null,
        rating: parsedRating,
        review,
        uploads_url,
        verified_user: verified_user === "true",
        review_verified:false,
      });

      // Step 5: Update booking review_status
      if (booking_id) {
        await BookingHistoryModel.update(
          { review_status: true },
          { where: { booking_id } }
        );
      }

      return res.status(201).json({
        message: "Review submitted successfully",
        data: newReview,
      });
    } catch (error: any) {
      console.error("Error submitting review:", error);
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }
  }
);



createReview.get("/getReviewsByPuja/:puja_id", async (req: any, res: any) => {
  const { puja_id } = req.params;

  try {
    // Fetch reviews by puja_id and include associated booking data and user data
    const reviews = await ReviewsModel.findAll({
      where: { puja_id },
      include: [
        {
          model: BookingHistoryModel,
          as: "reviewedBooking", // Alias for the relationship
          attributes: ["booking_id", "userid", "puja_id"], // Specify the fields you want to include from the booking
        },
        {
          model: UserModel,
          as: "reviewUser",
          attributes: ["userid", "username", "profile_pic_url"],
        },        
      ],
    });

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        error: "No reviews found",
        message: `No reviews found for puja_id: ${puja_id}`,
      });
    }

    return res.status(200).json({
      message: "Reviews fetched successfully",
      data: reviews.map((review: any) => {
        return {
          review_id: review.review_id,
          rating: review.rating,
          review: review.review,
          profile_pic_url: review.reviewUser ? review.reviewUser.profile_pic_url : null,
          uploads_url: review.uploads_url,
          review_verified:review.review_verified,
          verified_user: review.verified_user,
          username: review.reviewUser ? review.reviewUser.username : null, // ⬅️ alias
          puja_id: review.puja_id,
          booking_id: review.reviewedBooking?.booking_id || null,          // ⬅️ alias
          userid: review.reviewedBooking?.userid || null,
          created: review.created || null,               // ⬅️ alias
        };
      }),
      
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
});

createReview.get("/getAllReviews", async (req: any, res: any) => {
  try {
    // Fetch all reviews including associated booking and user data
    const reviews = await ReviewsModel.findAll({
      include: [
        {
          model: BookingHistoryModel,
          as: "reviewedBooking",
          attributes: ["booking_id", "userid", "puja_id"],
        },
        {
          model: UserModel,
          as: "reviewUser",
          attributes: ["userid", "username", "profile_pic_url"],
        },
      ],
    });

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        error: "No reviews found",
        message: "No reviews available in the system",
      });
    }

    return res.status(200).json({
      message: "All reviews fetched successfully",
      data: reviews.map((review: any) => ({
        review_id: review.review_id,
        rating: review.rating,
        review: review.review,
        profile_pic_url: review.reviewUser ? review.reviewUser.profile_pic_url : null,
        uploads_url: review.uploads_url,
        verified_user: review.verified_user,
        username: review.reviewUser ? review.reviewUser.username : null,
        puja_id: review.puja_id,
        booking_id: review.reviewedBooking?.booking_id || null,
        userid: review.reviewedBooking?.userid || null,
        created: review.created || null,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching all reviews:", error);
    return res.status(500).json({
      error: "Database error",
      details: error.message,
    });
  }
});

createReview.get('/all', async (req: any, res: any) => {
  try {
    const reviews = await ReviewsModel.findAll({
      order: [['created', 'DESC']],
      include: [
        {
          model: UserModel,
          as: 'reviewUser',
          attributes: ['username', 'profile_pic_url'], // only username
        },
        {
          model: PujaModel,
          as: 'reviewedPuja',
          attributes: ['puja_name'], // only puja_name
        },
      ],
    });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

createReview.get('/verified-reviews', async (req: any, res: any) => {
  try {
    const reviews = await ReviewsModel.findAll({
      attributes: [
        'review_id',
        'userid',
        'puja_id',
        'booking_id',
        'rating',
        'review',
        'uploads_url',
        'verified_user',
        'review_verified',
        'created',
        'updated',
      ], // ✅ Fetch only required fields (skip unnecessary fields like password etc.)
      where: {
        review_verified: true, // ✅ Only Approved Reviews
      },
      order: [['created', 'DESC']], // ✅ Newest reviews first
      include: [
        {
          model: UserModel,
          as: 'reviewUser',
          attributes: ['username','otp_verified', 'profile_pic_url'], // ✅ Only these two user fields
        },
        {
          model: PujaModel,
          as: 'reviewedPuja',
          attributes: ['puja_name'], // ✅ Only puja name
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Verified reviews fetched successfully!',
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Error fetching verified reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch verified reviews',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});



// ✅ Approve a review
createReview.put('/approve/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const review = await ReviewsModel.findByPk(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await review.update({ review_verified: true });
    res.status(200).json({ message: 'Review approved successfully' });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ message: 'Error approving review' });
  }
});

// ✅ Reject a review
createReview.put('/reject/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const review = await ReviewsModel.findByPk(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await review.update({ review_verified: false });
    res.status(200).json({ message: 'Review rejected successfully' });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ message: 'Error rejecting review' });
  }
});



export default createReview;
