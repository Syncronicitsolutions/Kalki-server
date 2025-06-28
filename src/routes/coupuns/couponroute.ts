import express from 'express';
import { Request, Response } from 'express';
import CouponModel from '../../db/models/coupons/CouponModel';  // Coupon model import
import CouponUsageModel from '../../db/models/coupons/CouponUsageModel'; // Coupon usage model import

const couponRouter = express.Router();

// 1. Create Coupon Route
couponRouter.post("/coupon-create", async (req: any, res: any) => {
  try {
    const {
      coupon_code,
      discount_amount,
      discount_type,
      discount_percentage,
      maximum_discount_amount,
      description,
      expiration_date,
      usage_limit,
      is_active,
    } = req.body;

    // Validate required fields
    if (!coupon_code || !discount_amount || !discount_type || !usage_limit) {
      return res.status(400).json({
        success: false,
        message: "Coupon code, discount amount, discount type, and usage limit are required.",
      });
    }

    // Validate the discount type
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be either 'percentage' or 'fixed'.",
      });
    }

    // Validate if percentage is provided when discount type is "percentage"
    if (discount_type === 'percentage' && !discount_percentage) {
      return res.status(400).json({
        success: false,
        message: "Discount percentage is required for percentage discount type.",
      });
    }

    // Check if the coupon code already exists
    const existingCoupon = await CouponModel.findOne({
      where: { coupon_code },
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists.",
      });
    }

    // Create the new coupon
    const newCoupon = await CouponModel.create({
      coupon_code,
      discount_amount,
      discount_type,
      discount_percentage,
      maximum_discount_amount,
      description,
      expiration_date,
      usage_limit,
      is_active: is_active ?? true,  // Default to active if not provided
      usage_count: 0,  // Default usage count to 0
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Coupon created successfully.",
      coupon: newCoupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 2. Get Coupon by ID Route
couponRouter.get("/coupon/:id", async (req: any, res: any) => {
  try {
    const couponId = parseInt(req.params.id);

    const coupon = await CouponModel.findOne({
      where: { coupon_id: couponId },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 3. Update Coupon Route
couponRouter.put("/coupon-update/:id", async (req: any, res: any) => {
  try {
    const couponId = parseInt(req.params.id);
    const {
      coupon_code,
      discount_amount,
      discount_type,
      discount_percentage,
      maximum_discount_amount,
      description,
      expiration_date,
      usage_limit,
      is_active,
    } = req.body;

    // Validate coupon existence
    const coupon = await CouponModel.findOne({
      where: { coupon_id: couponId },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Update the coupon
    await coupon.update({
      coupon_code,
      discount_amount,
      discount_type,
      discount_percentage,
      maximum_discount_amount,
      description,
      expiration_date,
      usage_limit,
      is_active,
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 4. Delete Coupon Route
couponRouter.delete("/coupon-delete/:id", async (req: any, res: any) => {
  try {
    const couponId = parseInt(req.params.id);

    const coupon = await CouponModel.findOne({
      where: { coupon_id: couponId },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 5. Track Coupon Usage by User
couponRouter.get("/coupon-use", async (req: any, res: any) => {
  try {
    const { coupon_id, userid, order_amount } = req.body;

    // Validate coupon existence
    const coupon = await CouponModel.findOne({
      where: { coupon_id },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Check if the coupon is still valid and has usage limit
    if (!coupon.is_active || coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({
        success: false,
        message: "Coupon has reached its usage limit or is inactive",
      });
    }

    // Apply the discount based on coupon type
    let discountApplied = 0;

    if (coupon.discount_type === "percentage") {
      // Calculate percentage discount
      discountApplied = (order_amount * (coupon.discount_percentage ?? 0)) / 100;

      // If there's a maximum discount limit, apply it
      if (coupon.maximum_discount_amount && discountApplied > coupon.maximum_discount_amount) {
        discountApplied = coupon.maximum_discount_amount;
      }
    } else if (coupon.discount_type === "fixed") {
      // For fixed discounts, use the discount amount directly
      discountApplied = coupon.discount_amount;
    }

    // Track the coupon usage
    const usage = await CouponUsageModel.create({
      coupon_id,
      userid,
      used_at: new Date(),
    });

    // Increment the coupon usage count
    await coupon.increment("usage_count");

    return res.status(200).json({
      success: true,
      message: "Coupon used successfully",
      discountApplied,
      usage,
    });
  } catch (error) {
    console.error("Error using coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to use coupon",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 6. Get All Coupons Route
couponRouter.get("/coupons", async (req: any, res: any) => {
  try {
    // Fetch all coupons
    const coupons = await CouponModel.findAll({
      where: {
        is_active: true,  // Optional: Filter for active coupons only
      },
    });

    // If no coupons are found
    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No coupons found",
      });
    }

    // Return the coupons
    return res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default couponRouter;
