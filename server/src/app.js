import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const shouldLogRequests = process.env.HTTP_LOGGING === "true";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
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
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Hospital Management API is running",
    data: { uptime: process.uptime() },
    statusCode: 200,
  });
});

app.use("/api", routes);
app.use(errorHandler);

export default app;
