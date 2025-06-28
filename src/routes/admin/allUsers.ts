import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import UserModel from "../../db/models/users/usersModel";
import ReviewsModel from "../../db/models/pujas/ReviewsModel";
import BookingHistoryModel from "../../db/models/bookings/BookingHistoryModel";

const JWT_SECRET = process.env.JWT_SECRET!;

const userslist = express.Router();

userslist.get("/getallusers", async (req: any, res: any) => {
  try {
    const users = await UserModel.findAll();
    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Users fetched successfully", users });
  } catch (err: any) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

userslist.get("/getuserById/:id", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findOne({ where: { userid: id } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "User details fetched successfully",
        user,
      });
  } catch (err: any) {
    console.error("Error fetching user details:", err.message);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user details." });
  }
});

userslist.get("/getuser-byuserid/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // Find user with associations
    const user = await UserModel.findOne({
      where: { userid: id },
      include: [
        {
          model: ReviewsModel,
          as: 'reviews',
        },
        {
          model: BookingHistoryModel,
          as: 'booking',
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Calculate additional data
    const bookings = await BookingHistoryModel.findAll({
      where: { userid: id },
    });

    const totalBookingCount = bookings.length;
    const totalAmountSpent = bookings.reduce((acc, booking) => acc + Number(booking.total_amount || 0), 0);

    // Optionally get preferred temple name (example logic: most recent booking's temple name)
    let preferredTempleName = '';
    if (bookings.length > 0) {
      const recentBooking = bookings[bookings.length - 1];
      if (recentBooking && recentBooking.puja_name) {
        preferredTempleName = recentBooking.puja_name;
      }
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
      totalBookingCount,
      totalAmountSpent,
      preferredTempleName,
      recentBookings: bookings.slice(-3), // Send last 3 recent bookings
    });

  } catch (err: any) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching user details.",
      details: err.message,
    });
  }
});

userslist.put("/updateuserById/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const { name, email, phone, location, status } = req.body;
  try {
    const user = await UserModel.findOne({ where: { userid: id } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    user.username = name || user.username;
    user.email = email || user.email;
    user.phonenumber = phone || user.phonenumber;
    user.address = location || user.address;
    user.status = status || user.status;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User updated successfully", user });
  } catch (err: any) {
    console.error("Error updating user details:", err.message);
    res
      .status(500)
      .json({
        success: false,
        error: "An error occurred while updating user details.",
      });
  }
});

export default userslist;
