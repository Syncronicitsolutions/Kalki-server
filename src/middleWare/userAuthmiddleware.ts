// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// export default function authenticateUserToken(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];

//   if (!token) {
//     console.log("No token provided");
//     res.status(403).json({ success: false, message: "No token provided." });
//     return;
//   }

//   jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
//     if (err) {
//       console.error("Token verification error:", err);
//       return res
//         .status(401)
//         .json({ success: false, message: "Failed to authenticate token." });
//     }

//     console.log("Decoded token:", decoded);

//     // Attach the decoded token to the request
//     req.body.temple = decoded; // Ensure the token includes temple_id
//     next(); // Proceed to the next middleware or route handler
//   });
// }

// middleWare/userAuthmiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function authenticateUserToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(403).json({ success: false, message: "No token provided." });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded: any) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }

    // ✅ Set decoded token to req.user (role, id, etc.)
    (req as any).user = decoded;
    next();
  });
}
