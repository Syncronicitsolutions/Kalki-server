import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export default function authenticateAgentToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    res.status(403).json({ success: false, message: "No token provided." });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      res
        .status(401)
        .json({ success: false, message: "Failed to authenticate token." });
      return;
    }

    console.log("Decoded token:", decoded);

    req.user = decoded as { id: number; email: string; role: string };

    next();
  });
}
