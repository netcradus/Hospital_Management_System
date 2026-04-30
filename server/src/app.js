import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const shouldLogRequests = process.env.HTTP_LOGGING === "true";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
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
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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
