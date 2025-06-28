import { Dialect, Sequelize } from "sequelize";
import dotenv from "dotenv";

// ✅ Load environment variables from .env file
dotenv.config();

// ✅ Validate required environment variables
const requiredEnv = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_DIALECT"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
});

// ✅ Define Sequelize connection
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    dialect: process.env.DB_DIALECT as Dialect,

    // Connection pool settings to handle concurrency
    pool: {
      max: 20,
      min: 5,
      acquire: 60000, // Max time in ms to try getting connection before throwing error
      idle: 10000,    // Time before releasing idle connection
    },

    // Retry failed queries to avoid sudden ECONNRESET issues
    retry: {
      max: 5, // Retry failed DB calls 5 times
    },

    // Optional: For cloud-hosted databases (RDS, Supabase, etc.)
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required if using self-signed certificates
      },
      keepAlive: true, // Keeps connection alive to prevent timeouts
      family: 4,       // Force IPv4
    },

    logging: false,     // Disable raw SQL logs in production
    benchmark: true,    // Show query timing in logs if needed
  }
);

// ✅ Log database connection status
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected successfully.");
  })
  .catch((error) => {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1); // Exit the app if DB fails to connect
  });

// ✅ Sync models
sequelize.sync({ force: false }) // Keep `force` false to avoid data loss
  .then(() => {
    console.log("✅ Database sync complete!");
  })
  .catch((error) => {
    console.error("❌ Error syncing database:", error);
  });

// ✅ Optional: Handle unexpected connection errors at runtime
process.on('unhandledRejection', (err) => {
  console.error("🔌 Unhandled promise rejection:", err);
});

export default sequelize;
