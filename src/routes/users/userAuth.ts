import express, { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import * as jwt from "jsonwebtoken";
import UserModel from "../../db/models/users/usersModel";



const userAuth = express.Router();

userAuth.post("/login", async (req: any, res: any) => {
  const { phonenumber, password } = req.body;

  if (!phonenumber || !password) {
    return res
      .status(400)
      .json({ error: "Phone number and password are required." });
  }

  try {
    // Find user by phone number
    const user = await UserModel.findOne({ where: { phonenumber } });

    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }

    // Check if the user's OTP is verified
    if (!user.otp_verified) {
      return res.status(400).json({ error: "OTP not verified." });
    }

    // Check if the user status is 'active'
    if (user.status !== "active") {
      return res.status(400).json({ error: "User is not active." });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userid: user.userid, phonenumber: user.phonenumber }, // Include user_id in the payload
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    // Send response with token, username, and user_id
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token, // JWT token
      username: user.username, // Include username in response
      userid: user.userid, // Include user_id in response
    });
  } catch (error: any) {
    console.error("Error logging in:", error.message);
    return res.status(500).json({ error: `Failed to login: ${error.message}` });
  }
});

//   const { phonenumber } = req.body;

//   if (!phonenumber || phonenumber.length !== 10) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Invalid phone number" });
//   }

//   try {
//     const user = await UserModel.findOne({ where: { phonenumber } });

//     if (!user) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "This phone number is not registered",
//         });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
//     otpStore[phonenumber] = { otp, expiresAt: Date.now() + 3600000 }; // OTP expires in 1 hour

//     // Send OTP via Twilio
//     await twilioClient.messages.create({
//       body: `Your OTP for password reset is: ${otp}`,
//       from: TWILIO_PHONE_NUMBER,
//       to: `+91${phonenumber}`,
//     });

//     res.status(200).json({ success: true, message: "OTP sent successfully" });
//   } catch (err: any) {
//     console.error("Error sending OTP:", err.message);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Failed to send OTP",
//         error: err.message,
//       });
//   }
// });

// userAuth.post("/verify-reset-otp", async (req: any, res: any) => {
//   const { phone_number, otp } = req.body;

//   if (!phone_number || !otp) {
//     return res.status(400).json({ error: "Phone number and OTP are required" });
//   }

//   try {
//     // Verify OTP
//     const storedOtpData = otpStore[phone_number];

//     if (!storedOtpData) {
//       return res.status(400).json({ error: "OTP not found or expired" });
//     }

//     if (
//       storedOtpData.otp !== parseInt(otp) ||
//       storedOtpData.expiresAt < Date.now()
//     ) {
//       delete otpStore[phone_number]; // Clear the OTP from the store after it's expired or used
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     // Remove OTP from in-memory store
//     delete otpStore[phone_number];

//     res
//       .status(200)
//       .json({ success: true, message: "OTP verified successfully" });
//   } catch (error: any) {
//     console.error("Error verifying OTP:", error.message);
//     res.status(500).json({ error: `Failed to verify OTP: ${error.message}` });
//   }
// });

// userAuth.post("/logout", (req: any, res: any) => {
//   const token = req.headers["authorization"]?.split(" ")[1];

//   if (!token) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Token not found." });
//   }

//   try {
//     // Verify the JWT token
//     const decoded = jwt.verify(token, JWT_SECRET) as { phone_number: string };

//     // The token is verified and the user can be logged out
//     // You can add logic here if you need to record the logout event in the database
//     res.status(200).json({ success: true, message: "Logout successful." });
//   } catch (error: any) {
//     console.error("Error logging out:", error.message);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Failed to log out.",
//         error: error.message,
//       });
//   }
// });

userAuth.post("/logout", (req: Request, res: Response) => {
  // If you're using JWT stored in a cookie, you can clear the cookie to invalidate it
  res.clearCookie("token"); // Clear the token cookie (if you're storing it in a cookie)

  // If you're using localStorage or sessionStorage on the client, the client should handle that
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default userAuth;
