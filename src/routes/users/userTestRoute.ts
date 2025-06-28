// import express from "express";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import UserModel from "../../db/models/users/usersModel";

// const UserTestRouter = express.Router();

// // ✅ UserID Auto-generation Function
// const generateUserId = async (): Promise<string> => {
//   const prefix = "KSB";
//   const latestUser = await UserModel.findOne({
//     order: [["userid", "DESC"]],
//     attributes: ["userid"],
//   });

//   if (latestUser && latestUser.userid) {
//     const lastId = parseInt(latestUser.userid.replace(prefix, ""));
//     const nextId = lastId + 1;
//     return `${prefix}${nextId.toString().padStart(4, "0")}`; // KSB1001, KSB1002...
//   }

//   return `${prefix}1001`;
// };


// // ✅ Register User
// UserTestRouter.post("/register", async (req: any, res: any) => {
//   try {
//     const { phonenumber, password, username } = req.body;

//     if (!phonenumber || !password) {
//       return res.status(400).json({ message: "Phone number and password are required" });
//     }

//     const existingUser = await UserModel.findOne({ where: { phonenumber } });
//     if (existingUser) {
//       return res.status(409).json({ message: "User already exists with this phone number" });
//     }

//     const userid = await generateUserId();
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await UserModel.create({
//       userid,
//       phonenumber,
//       password: hashedPassword,
//       username: username || "Kalki Seva Bhakth",
//       email: ""
//     });

//     return res.status(201).json({
//       message: "User registered successfully",
//       user: {
//         userid: newUser.userid,
//         phonenumber: newUser.phonenumber,
//         username: newUser.username,
//       },
//     });
//   } catch (error) {
//     console.error("Registration Error:", error);
//     const errorMessage = error instanceof Error ? error.message : "Unknown error";
//     res.status(500).json({ message: "Error registering user", error: errorMessage });
//   }
// });



// // ✅ Login User
// UserTestRouter.post("/login", async (req: any, res: any) => {
//   const { phonenumber, password } = req.body;

//   try {
//     const user = await UserModel.findOne({ where: { phonenumber } });

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//     // Generate JWT Token
//     const token = jwt.sign(
//       { userid: user.userid, phonenumber: user.phonenumber },
//       "0a8ece97666b358f24075a15b9aceef9d444d571d1dcef138487e43d74bfdca4", // Replace with your secret key (should be stored in .env)
//       { expiresIn: "1d" } // Token valid for 1 day
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token, // Send token
//       user: {
//         userid: user.userid,
//         email: user.email,
//         username: user.username,
//         phonenumber: user.phonenumber,
//         profile_pic_url: user.profile_pic_url,
//         gender: user.gender,
//         address: user.address,
//         status: user.status,
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Login failed", error });
//   }
// });



// // ✅ Get All Users
// UserTestRouter.get("/users", async (req: any, res: any) => {
//   try {
//     const users = await UserModel.findAll();
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching users", error });
//   }
// });


// // ✅ Get User by ID
// UserTestRouter.get("/user/:id", async (req: any, res: any) => {
//   try {
//     const user = await UserModel.findOne({ where: { userid: req.params.id } });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching user", error });
//   }
// });


// // ✅ Update User (PUT)
// UserTestRouter.put("/user/:id", async (req: any, res: any) => {
//   try {
//     const user = await UserModel.findOne({ where: { userid: req.params.id } });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     await user.update(req.body);
//     res.status(200).json({ message: "User updated successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user", error });
//   }
// });


// UserTestRouter.delete("/user/:id", async (req: any, res: any) => {
//   try {
//     const deleted = await UserModel.destroy({ where: { userid: req.params.id } });
//     if (!deleted) return res.status(404).json({ message: "User not found" });

//     res.status(200).json({ message: "User deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting user", error });
//   }
// });


// export default UserTestRouter;

import express from "express";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import UserModel from "../../db/models/users/usersModel"; // Update with your model path
import multer from 'multer';
import path from 'path';
// Initialize multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where uploaded files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`); // Prevent filename conflicts
  },
});

const upload = multer({ storage });


const UserTestRouter = express.Router();

// ✅ UserID Auto-generation Function
const generateUserId = async (): Promise<string> => {
  const prefix = "KSB";
  const latestUser = await UserModel.findOne({
    order: [["userid", "DESC"]],
    attributes: ["userid"],
  });

  if (latestUser && latestUser.userid) {
    const lastId = parseInt(latestUser.userid.replace(prefix, ""));
    const nextId = lastId + 1;
    return `${prefix}${nextId.toString().padStart(4, "0")}`; // KSB1001, KSB1002...
  }

  return `${prefix}1001`;
};


// ✅ Register User
UserTestRouter.post("/register", async (req: any, res: any) => {
  try {
    const { phonenumber, password, username } = req.body;

    if (!phonenumber || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const existingUser = await UserModel.findOne({ where: { phonenumber } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this phone number" });
    }

    const userid = await generateUserId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      userid,
      phonenumber,
      password: hashedPassword,
      username: username || "Kalki Seva Bhakth",
      email: "user@kalkiseva.com" // Provide a default value for email
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        userid: newUser.userid,
        phonenumber: newUser.phonenumber,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Error registering user", error: errorMessage });
  }
});



// ✅ Login User
UserTestRouter.post("/login", async (req: any, res: any) => {
  const { phonenumber, password } = req.body;

  try {
    const user = await UserModel.findOne({ where: { phonenumber } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT Token
    const token = jwt.sign(
      { userid: user.userid, phonenumber: user.phonenumber },
      "0a8ece97666b358f24075a15b9aceef9d444d571d1dcef138487e43d74bfdca4", // Replace with your secret key (should be stored in .env)
      { expiresIn: "1d" } // Token valid for 1 day
    );

    res.status(200).json({
      message: "Login successful",
      token, // Send token
      user: {
        userid: user.userid,
        email: user.email,
        username: user.username,
        phonenumber: user.phonenumber,
        profile_pic_url: user.profile_pic_url,
        gender: user.gender,
        address: user.address,
        status: user.status,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});



// ✅ Get All Users
UserTestRouter.get("/users", async (req: any, res: any) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});


// ✅ Get User by ID
UserTestRouter.get("/user/:id", async (req: any, res: any) => {
  try {
    const user = await UserModel.findOne({ where: { userid: req.params.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});


// ✅ Update User (PUT)
// UserTestRouter.put("/user/:id", async (req: any, res: any) => {
//   try {
//     const user = await UserModel.findOne({ where: { userid: req.params.id } });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     await user.update(req.body);
//     res.status(200).json({ message: "User updated successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user", error });
//   }
// });

// Update user profile with validation and file handling
// UserTestRouter.put("/update-user/:id", upload.single('profile_pic_url'), async (req: any, res: any) => {
//   try {
//     // Extract the user ID from URL parameter (req.params.id)
//     const userId = req.params.id;

//     // Fetch user by userId from the database
//     const user = await UserModel.findOne({ where: { userid: userId } });
    
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Prepare updated data from request body
//     const updatedData = req.body;

//     // Handle address - If it's an array, you can join it into a string or handle as needed
//     if (updatedData.address && Array.isArray(updatedData.address)) {
//       updatedData.address = {
//         address: updatedData.address[0] || "",
//         city: updatedData.address[1] || "",
//         state: updatedData.address[2] || "",
//         pincode: updatedData.address[3] || "",
//       };
//     }

//     // Check if there's a new profile picture
//     if (req.file) {
//       updatedData.profile_pic_url = path.join('uploads', req.file.filename);
//     }

//     // Update the user record in the database with the new data
//     await user.update(updatedData);

//     // Respond with the updated user information
//     res.status(200).json({
//       message: "User updated successfully",
//       user: {
//         userid: user.userid,
//         username: user.username,
//         email: user.email,
//         phonenumber: user.phonenumber,
//         address: user.address,
//         profile_pic_url: user.profile_pic_url,
//       },
//     });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ message: "Error updating user", error });
//   }
// });

UserTestRouter.put("/update-user/:id", upload.single('profile_pic_url'), async (req: any, res: any) => {
  try {
    // Log the request body to debug
    console.log('Request Body:', req.body);

    // Extract the user ID from URL parameter (req.params.id)
    const userId = req.params.id;

    // Fetch user by userId from the database
    const user = await UserModel.findOne({ where: { userid: userId } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare updated data from request body
    const updatedData = req.body;

    // Handle address - If it's an array, map it to the correct object structure
    if (updatedData.address && Array.isArray(updatedData.address)) {
      updatedData.address = {
        street: updatedData.address[0] || "",  // First element = street
        city: updatedData.address[1] || "",    // Second element = city
        state: updatedData.address[2] || "",   // Third element = state
        pincode: updatedData.address[3] || ""  // Fourth element = pincode
      };
    }

    // Log updatedData to verify the structure
    console.log('Updated Data:', updatedData);

    // Handle profile picture upload if available
    if (req.file) {
      updatedData.profile_pic_url = path.join('uploads', req.file.filename); // Save file path
    }

    // Update the user record in the database with the new data
    await user.update(updatedData);

    // Respond with the updated user information
    res.status(200).json({
      message: "User updated successfully",
      user: {
        userid: user.userid,
        username: user.username,
        email: user.email,
        phonenumber: user.phonenumber,
        address: user.address,
        profile_pic_url: user.profile_pic_url,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: "Error updating user", error });
  }
});





UserTestRouter.delete("/user/:id", async (req: any, res: any) => {
  try {
    const deleted = await UserModel.destroy({ where: { userid: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});


export default UserTestRouter;

