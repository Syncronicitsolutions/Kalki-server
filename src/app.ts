// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import dbInit from "./db/init"; // Import your DB initialization function
// import routes from "./routes";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Initialize database
// dbInit(); // Initialize database and sync models

// app.use("/api/v1", routes); // Assuming your routes are organized in a 'routes' directory

// app.get("/", (req, res) => {
//   res.send("Backend is running!");
// });

// const PORT = process.env.PORT || 5000;
// const HOST = '0.0.0.0';
// app.listen(PORT, () => {
//   console.log(`Server is running on http://${HOST}:${PORT}`);
// });

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbInit from "./db/init"; // DB init
import routes from "./routes";
import testEmailRouter from './utils/test-email'; // Test email route

dotenv.config();

const app = express();
app.use(cors());

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
// const HOST = "0.0.0.0";

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});

