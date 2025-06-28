import express, { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import * as jwt from "jsonwebtoken";
import UserModel from "../../db/models/users/usersModel";
import multer from 'multer';
import multerS3 from 'multer-s3';       
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from "dotenv";

dotenv.config();





// const upload = multer({ storage: multer.memoryStorage() });


const JWT_SECRET = process.env.JWT_SECRET!;

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.BUCKET_REGION || !process.env.BUCKET_NAME) {
  throw new Error('Missing necessary AWS configuration in .env file');
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
          cb(null, `profile_pic_url/${Date.now()}_${file.originalname}`);
      },
  }),
});


const userDetailsUpdate = express.Router();
// Middleware to parse JSON
userDetailsUpdate.use(express.json());

// userDetailsUpdate.put("/update-profile/:id", async (req: any, res: any) => {
//   console.log("Request body:", req.body);

//   const { username, email, gender, address, profile_pic_url } = req.body;
//   const { phonenumber } = req.body.temple;

//   if (!username || !email) {
//     console.log("Missing username or email.");
//     return res.status(400).json({ error: "Name and email are required." });
//   }

//   console.log("Fetching user with phonenumber:", phonenumber);

//   try {
//     const user = await UserModel.findOne({ where: { phonenumber } });

//     if (!user) {
//       console.log("User not found for phonenumber:", phonenumber);
//       return res.status(404).json({ error: "User not found." });
//     }

//     console.log("User found:", user);

//     user.username = username;
//     user.email = email;
//     user.gender = gender;
//     user.address = address;
//     user.profile_pic_url = profile_pic_url;

//     console.log("Saving updated user:", user);

//     await user.save();

//     res
//       .status(200)
//       .json({ success: true, message: "Profile updated successfully", user });
//   } catch (err: any) {
//     console.error("Error during profile update:", err);
//     res
//       .status(500)
//       .json({
//         error: "An error occurred while updating the profile.",
//         details: err.message,
//       });
//   }
// });

// userDetailsUpdate.put("/update-profile/:id", async (req: any, res: any) => {
//   console.log("Request body:", req.body);

//   const { username, email, gender, address, profile_pic_url, phonenumber } = req.body;

//   if (!username || !email) {
//     console.log("Missing username or email.");
//     return res.status(400).json({ error: "Name and email are required." });
//   }

//   try {
//     const user = await UserModel.findOne({ where: { phonenumber } });

//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     user.username = username;
//     user.email = email;
//     user.gender = gender;
//     user.address = address;
//     user.profile_pic_url = profile_pic_url;

//     await user.save();

//     res.status(200).json({ success: true, message: "Profile updated successfully", user });
//   } catch (err: any) {
//     console.error("Error during profile update:", err);
//     res.status(500).json({
//       error: "An error occurred while updating the profile.",
//       details: err.message,
//     });
//   }
// });

// userDetailsUpdate.put('/update-profile/:id', upload.single('profile_pic'), async (req: any, res: any) => {
//   try {
//     const user = await UserModel.findByPk(req.params.id);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Upload image to S3
//     if (req.file) {
//       const params = {
//         Bucket: process.env.S3_BUCKET_NAME!,
//         Key: `profile-${Date.now()}.${req.file.originalname.split('.').pop()}`,
//         Body: req.file.buffer,
//         ContentType: req.file.mimetype
//       };

//       const s3Response = await s3.upload(params).promise();
//       user.profile_pic_url = s3Response.Location;
//     }

//     // Update fields
//     user.username = req.body.username;
//     user.email = req.body.email;
//     user.phonenumber = req.body.phonenumber;
//     user.address = `${req.body.address}, ${req.body.city}, ${req.body.state}, ${req.body.pincode}`;
//     user.gender = req.body.gender;

//     await user.save();

//     res.json({ success: true, user });
//   } catch (error: unknown) {
//     const err = error as Error;
//     res.status(500).json({ error: err.message });
//   }
// });

// userDetailsUpdate.put(
//   "/update-profile/:id",
//   upload.single("profile_pic"),
//   async (req: any, res: any) => {
//     try {
//       const user = await UserModel.findByPk(req.params.id);

//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       // Upload to S3 if file provided
//       if (req.file) {
//         const params = {
//           Bucket: process.env.S3_BUCKET_NAME!,
//           Key: `userimages/profile-${Date.now()}.${req.file.originalname.split(".").pop()}`,
//           Body: req.file.buffer,
//           ContentType: req.file.mimetype
//         };

//         const s3Response = await s3.upload(params).promise();
//         user.profile_pic_url = s3Response.Location;
//       }

//       // Update user fields
//       user.username = req.body.username;
//       user.email = req.body.email;
//       user.phonenumber = req.body.phonenumber;
//       user.address = `${req.body.address}, ${req.body.city}, ${req.body.state}, ${req.body.pincode}`;
//       user.gender = req.body.gender;

//       await user.save();

//       res.json({ success: true, message: "Profile updated", user });
//     } catch (error: unknown) {
//       const err = error as Error;
//       res.status(500).json({ error: err.message });
//     }
//   }
// );

// userDetailsUpdate.put(
//   "/update-profile/:id",
//   upload.single("profile_pic"),
//   async (req: any, res: any) => {
//     try {
//       const user = await UserModel.findByPk(req.params.id);

//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       // Upload profile image to S3
//       if (req.file) {
//         const fileExtension = req.file.originalname.split(".").pop();
//         const s3Params = {
//           Bucket: process.env.S3_BUCKET_NAME!,
//           Key: `userimages/profile-${Date.now()}.${fileExtension}`,
//           Body: req.file.buffer,
//           ContentType: req.file.mimetype,
//         };

//         const s3Response = await s3.upload(s3Params).promise();
//         user.profile_pic_url = s3Response.Location;
//       }

//       // Update user fields
//       user.username = req.body.username;
//       user.email = req.body.email;
//       user.phonenumber = req.body.phonenumber;
//       user.address = `${req.body.address}, ${req.body.city}, ${req.body.state}, ${req.body.pincode}`;
//       user.gender = req.body.gender;

//       await user.save();

//       res.status(200).json({
//         success: true,
//         message: "Profile updated successfully",
//         user,
//       });
//     } catch (error: unknown) {
//       const err = error as Error;
//       res.status(500).json({ error: err.message });
//     }
//   }
// );


// userDetailsUpdate.put(
//   "/update-profile/:id",
//   upload.single("profile_pic"),
//   async (req: any, res: any) => {
//     try {
//       const user = await UserModel.findByPk(req.params.id);

//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       // Only prepare S3 upload if a file is provided
//       if (req.file) {
//         const uploadParams = {
//           Bucket: process.env.S3_BUCKET_NAME!,
//           Key: `userimages/profile-${Date.now()}.${req.file.originalname.split(".").pop()}`,
//           Body: req.file.buffer,
//           ContentType: req.file.mimetype,
//         };

//         const s3Response = await s3.upload(uploadParams).promise(); // ✅ Now works
//         user.profile_pic_url = s3Response.Location;
//       }

//       // Update user fields
//       user.username = req.body.username;
//       user.email = req.body.email;
//       user.phonenumber = req.body.phonenumber;
//       user.address = `${req.body.address}, ${req.body.city}, ${req.body.state}, ${req.body.pincode}`;
//       user.gender = req.body.gender;

//       await user.save();

//       res.status(200).json({
//         success: true,
//         message: "Profile updated successfully",
//         user,
//       });
//     } catch (error: unknown) {
//       const err = error as Error;
//       res.status(500).json({ error: err.message });
//     }
//   }
// );


// userDetailsUpdate.put('/update-profile', upload.single('profile_pic_url'), async (req: any, res: any) => {
//   console.log('Request body:', req.body);

//   const { username, email, gender, address } = req.body;
//   const profile_pic_url = (req.file as CustomFile)?.location || null;

//   // Extract the phonenumber from the decoded JWT token
//   const token = req.headers.authorization?.split(' ')[1]; // Assuming the token is passed as 'Bearer <token>'
//   if (!token) {
//       return res.status(401).json({ error: 'Unauthorized: Token is required.' });
//   }

//   try {
//       const decodedToken: any = jwt.verify(token, JWT_SECRET);
//       const { phonenumber } = decodedToken;

//       if (!phonenumber) {
//           console.log('Phone number is missing.');
//           return res.status(400).json({ error: 'Phone number is required.' });
//       }

//       if (!username || !email) {
//           console.log('Missing username or email.');
//           return res.status(400).json({ error: 'Name and email are required.' });
//       }

//       console.log('Fetching user with phonenumber:', phonenumber);

//       const user = await UserModel.findOne({ where: { phonenumber } });

//       if (!user) {
//           console.log('User not found for phonenumber:', phonenumber);
//           return res.status(404).json({ error: 'User not found.' });
//       }

//       console.log('User found:', user);

//       user.username = username;
//       user.email = email;
//       user.gender = gender;
//       user.address = address;

//       if (profile_pic_url) {
//           user.profile_pic_url = profile_pic_url;
//       }

//       console.log('Saving updated user:', user);

//       await user.save();

//       res.status(200).json({ success: true, message: 'Profile updated successfully', user });
//   } catch (err: any) {
//       console.error('Error during profile update:', err);
//       res.status(500).json({ error: 'An error occurred while updating the profile.', details: err.message });
//   }
// });


userDetailsUpdate.put(
  '/update-profile/:userid',
  upload.single('profile_pic_url'),
  async (req: any, res: any) => {
    const { userid } = req.params;
    const { username, email, gender, phonenumber } = req.body;
    const profile_pic_url = (req.file as CustomFile)?.location || null;

    // Parse address (as stringified JSON)
    let parsedAddress;
    try {
      parsedAddress =
        typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid address format. Must be JSON.' });
    }

    try {
      if (!userid) {
        return res.status(400).json({ error: 'User ID is required.' });
      }

      if (!username || !email || !phonenumber) {
        return res.status(400).json({ error: 'Name, email and phone number are required.' });
      }

      const user = await UserModel.findOne({ where: { userid } });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Optional: Check if new phone number is already taken by someone else
      if (user.phonenumber !== phonenumber) {
        const existingUser = await UserModel.findOne({
          where: { phonenumber },
        });

        if (existingUser && existingUser.userid !== userid) {
          return res.status(409).json({ error: 'Phone number already in use.' });
        }

        user.phonenumber = phonenumber;
      }

      user.username = username;
      user.email = email;
      user.gender = gender;
      user.address = parsedAddress;

      if (profile_pic_url) {
        user.profile_pic_url = profile_pic_url;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user,
      });
    } catch (err: any) {
      console.error('Error during profile update:', err);
      res.status(500).json({
        error: 'An error occurred while updating the profile.',
        details: err.message,
      });
    }
  }
);


userDetailsUpdate.put("/update-user/:id", async (req: any, res: any) => {
  console.log("Request body:", req.body);

  const { username, email, gender, address, status } = req.body;
  const userId = req.params.id; // Get userId from URL parameter

  // Check if username and email are provided
  if (!username || !email) {
    console.log("Missing username or email.");
    return res.status(400).json({ error: "Username and email are required." });
  }

  console.log("Fetching user with userId:", userId);

  try {
    // Find the user by userId
    const user = await UserModel.findOne({ where: { userid: userId } });

    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found." });
    }

    console.log("User found:", user);

    // Update the user's profile information
    user.username = username;
    user.email = email;
    user.gender = gender;
    user.address = address;
    user.status = status;

    console.log("Saving updated user:", user);

    // Save the updated user data
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        username: user.username,
        email: user.email,
        gender: user.gender,
        address: user.address,
        status: user.status,
        updated: user.updatedAt, // You might want to include the updated time
      },
    });
  } catch (err: any) {
    console.error("Error during profile update:", err);
    res
      .status(500)
      .json({
        error: "An error occurred while updating the profile.",
        details: err.message,
      });
  }
});

userDetailsUpdate.post("/change-password", async (req: any, res: any) => {
  const { password, new_password } = req.body;
  const { phonenumber } = req.body.temple; // Retrieve phone_number from the decoded token

  if (!password || !new_password) {
    return res
      .status(400)
      .json({ error: "Current password and new password are required." });
  }

  try {
    // Find the user using the phone_number from the token
    const user = await UserModel.findOne({ where: { phonenumber } });

    if (!user || !user.otp_verified) {
      return res
        .status(400)
        .json({ error: "User not found or OTP not verified." });
    }

    // Check if the current password is correct
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid current password." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password
    await user.update({ password: hashedNewPassword });

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error.message);
    res
      .status(500)
      .json({ error: `Failed to change password: ${error.message}` });
  }
});

userDetailsUpdate.get("/getuserDetails", async (req: any, res: any) => {
  const { phonenumber } = req.body.temple; // Extract phone_number from the decoded token

  try {
    const user = await UserModel.findOne({ where: { phonenumber } });

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

userDetailsUpdate.post("/logout", (req: any, res: any) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token not found." });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { phone_number: string };

    // The token is verified and the user can be logged out
    // You can add logic here if you need to record the logout event in the database
    res.status(200).json({ success: true, message: "Logout successful." });
  } catch (error: any) {
    console.error("Error logging out:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to log out.",
        error: error.message,
      });
  }
});

userDetailsUpdate.get('/getUserDetailsById', async (req: any, res: any) => {
  const { userid } = req.query;

  if (!userid || typeof userid !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'userid is required and must be a string.',
    });
  }

  try {
    const user = await UserModel.findOne({
      where: { userid },
      attributes: { exclude: ['password'] }
    });
    

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User details fetched successfully.',
      user,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user details.',
    });
  }
});


export default userDetailsUpdate;
