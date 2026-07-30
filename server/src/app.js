import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const shouldLogRequests = process.env.HTTP_LOGGING === "true";
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hms.netcradus.tech",
  "https://hospital-management-system-1-7zki.onrender.com",
];
const allowedOrigins = (process.env.CORS_ORIGIN || defaultAllowedOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin)) {
      callback(null, true);
      return;
    }

    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204,
};
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many login attempts. Please wait a few minutes and try again.",
    statusCode: 429,
  },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
if (shouldLogRequests) {
  app.use(
    morgan("dev", {
      skip: (req, res) => req.path === "/api/health" || res.statusCode < 400,
    })
  );
}
app.use("/auth", authLimiter);
app.use("/", apiLimiter);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Hospital Management API is running",
    data: { uptime: process.uptime() },
    statusCode: 200,
  });
});

app.use("/", routes);
app.use(errorHandler);

export default app;
