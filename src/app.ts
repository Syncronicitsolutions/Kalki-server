import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbInit from "./db/init"; // DB init
import routes from "./routes";
import testEmailRouter from './utils/test-email'; // Test email route

dotenv.config();

const app = express();

// Define allowed origins based on your environment
const allowedOrigins = [
  "http://localhost:5173",        // local development
        // production frontend URL (update as needed)
];

app.use(cors({
  origin: allowedOrigins,                      // Allow only specified origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,                           // Enable credentials if needed
}));

// ✅ Apply express.raw() only for webhook route
app.use(
  "/api/v1/payments/cashfree-webhook",
  express.raw({ type: "application/json" })
);

// ✅ Use JSON parser for all other routes
app.use(express.json());

// DB Initialization
dbInit();

// Routes (must come after middleware)
app.use("/api/v1", routes);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});
app.use('/utils', testEmailRouter);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
