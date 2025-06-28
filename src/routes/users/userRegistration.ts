import express, { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import * as jwt from "jsonwebtoken";
import UserModel from "../../db/models/users/usersModel";
import axios from "axios";

const userRegistration = express.Router();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY!; // store your API key in env
const FAST2SMS_MESSAGE_TEMPLATE_ID = "182731"; // your DLT template ID
const FAST2SMS_SENDER_ID = "KALKIS";
const JWT_SECRET = process.env.JWT_SECRET!;

// In-memory OTP storage (for simplicity; use a database for production)
const otpStore: { [key: string]: { otp: number; expiresAt: number } } = {};
// Send OTP via Fast2SMS
const sendOtpViaFast2SMS = async (phoneNumber: string, otp: number) => {
    const url = "https://www.fast2sms.com/dev/bulkV2";
  
    const params = {
      authorization: FAST2SMS_API_KEY,
      route: "dlt",
      sender_id: FAST2SMS_SENDER_ID,
      message: FAST2SMS_MESSAGE_TEMPLATE_ID,
      variables_values: `${otp}`,
      numbers: `${phoneNumber}`, // ✅ just 10-digit mobile number, no +91 or 91
      flash: "0",
    };
  
    const queryParams = new URLSearchParams(params as any).toString();
    const fullUrl = `${url}?${queryParams}`;
  
    console.log("Fast2SMS URL:", fullUrl); // Optional
    await axios.get(fullUrl);
  };
  
  

// Generate unique user ID (KSB1001, KSB1002, ...)
const generateUserId = async (): Promise<string> => {
  const prefix = "KSB"; // Prefix for user ID
  const latestUser = await UserModel.findOne({
    order: [["userid", "DESC"]], // Order by descending userid
    attributes: ["userid"], // Only fetch userid
  });

  if (latestUser) {
    const lastId = parseInt(latestUser.userid.replace(prefix, "")); // Extract numeric part
    const nextId = lastId + 1; // Increment ID by 1
    return `${prefix}${nextId.toString().padStart(4, "0")}`; // Return formatted ID like KSB1001, KSB1002
  }

  // If no users exist, return the first user ID
  return `${prefix}1001`;
};


// Create Account - Send OTP
userRegistration.post("/createAccount", async (req: any, res: any) => {
    const { phonenumber } = req.body;
  
    if (!phonenumber || phonenumber.length !== 10) {
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }
  
    try {
      const existingUser = await UserModel.findOne({ where: { phonenumber } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "This phone number is already registered" });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000);
      otpStore[phonenumber] = { otp, expiresAt: Date.now() + 3600000 };
  
      await sendOtpViaFast2SMS(phonenumber, otp);
  
      res.status(200).json({ success: true, message: "OTP sent successfully. Please check your phone." });
    } catch (err: any) {
      console.error("Error sending OTP:", err.message);
      res.status(500).json({ success: false, message: "Failed to send OTP", error: err.message });
    }
  });
  
  
userRegistration.post("/verify-otp", async (req: any, res: any) => {
    const { phonenumber, otp } = req.body;
  
    if (!phonenumber || !otp) {
      return res.status(400).json({ success: false, error: "Phone number and OTP are required" });
    }
  
    try {
      const storedOtpData = otpStore[phonenumber];
  
      if (
        !storedOtpData ||
        storedOtpData.expiresAt < Date.now() ||
        storedOtpData.otp !== parseInt(otp)
      ) {
        delete otpStore[phonenumber];
        return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
      }
  
      let user = await UserModel.findOne({ where: { phonenumber } });
  
      if (!user) {
        const userId = await generateUserId();
  
        try {
          user = await UserModel.create({
            userid: userId,
            phonenumber,
            otp_verified: false,
            username: "Kalki Seva Bhakth",
            email: null,             // ✅ set null instead of empty string
            gender: null,
            address: null,
            profile_pic_url: null,
            password: "",            // ✅ still required, will set later
            status: "active",
          });
        } catch (err: any) {
          console.error("User creation error:", err);
          return res.status(500).json({
            success: false,
            error: "User creation failed",
            details: err.message,
          });
        }
      }
  
      // ✅ Mark as verified
      await user.update({ otp_verified: true });
  
      // ✅ Remove OTP from memory
      delete otpStore[phonenumber];
  
      // ✅ Generate token
      const token = jwt.sign(
        { phonenumber, user_id: user.userid },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
  
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        token,
      });
  
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to verify OTP",
        details: error.message,
      });
    }
  });
  
  userRegistration.post("/create-password", async (req: any, res: any) => {
    const { phonenumber, password } = req.body;
  
    if (!phonenumber || !password) {
      return res.status(400).json({ error: "Phone number and password are required" });
    }
  
    try {
      const user = await UserModel.findOne({ where: { phonenumber } });
      if (!user || !user.otp_verified) {
        return res.status(400).json({ error: "User not found or OTP not verified" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({ password: hashedPassword });
  
      res.status(200).json({ success: true, message: "Password set successfully" });
    } catch (error: any) {
      console.error("Error setting password:", error.message);
      res.status(500).json({ error: `Failed to set password: ${error.message}` });
    }
  });
  

// Reset password and send OTP
userRegistration.post("/reset-password-send-otp", async (req: any, res: any) => {
  const { phonenumber } = req.body;

  if (!phonenumber || phonenumber.length !== 10) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number",
    });
  }

  try {
    const user = await UserModel.findOne({ where: { phonenumber } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This phone number is not registered",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    otpStore[phonenumber] = {
      otp,
      expiresAt: Date.now() + 3600000, // 1 hour
    };

    const fast2smsURL = "https://www.fast2sms.com/dev/bulkV2";
    
    const response = await axios.get(fast2smsURL, {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: "dlt",
        sender_id: FAST2SMS_SENDER_ID,
        message: "183060", // This should be your approved DLT template ID
        variables_values: `${user.username || 'User'}|${otp}`,
        numbers: `${phonenumber}`,
        flash: "0",
      },
    });

    if (response.data.return === true) {
      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } else {
      res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

  } catch (err: any) {
    console.error("Error sending OTP:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: err.message,
    });
  }
});

// // Verify OTP for password reset
userRegistration.post("/verify-reset-otp", async (req: any, res: any) => {
  const { phonenumber, otp } = req.body;

  if (!phonenumber || !otp) {
    return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
  }

  try {
    const storedOtpData = otpStore[phonenumber];

    if (!storedOtpData || storedOtpData.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    if (storedOtpData.otp !== parseInt(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid, mark user as verified
    await UserModel.update({ otp_verified: true }, { where: { phonenumber: phonenumber } });

    delete otpStore[phonenumber]; // Remove OTP after successful verification

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error: any) {
    console.error("Error verifying OTP:", error.message);
    res.status(500).json({ success: false, message: `Failed to verify OTP: ${error.message}` });
  }
});




userRegistration.put("/reset-password", async (req: any, res: any) => {
  const { phonenumber, newPassword, confirmPassword } = req.body;

  // 1. Validate presence
  if (!phonenumber || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Phone number, new password, and confirmation are required",
    });
  }

  // 2. Check password match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirm password do not match",
    });
  }

  // 3. Basic password strength (optional but recommended)
  const isStrong = newPassword.length >= 6 && /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword);
  if (!isStrong) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long and contain letters and numbers",
    });
  }

  try {
    const user = await UserModel.findOne({ where: { phonenumber } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.otp_verified) {
      return res.status(403).json({ success: false, message: "OTP not verified. Please verify first." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.update(
      { password: hashedPassword, otp_verified: true },
      { where: { phonenumber } }
    );

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ success: false, message: `Failed to reset password: ${error.message}` });
  }
});


export default userRegistration;
