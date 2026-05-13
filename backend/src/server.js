import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import interviewRoutes from "./routes/interviews.js";
import resumeRoutes from "./routes/resumes.js";
import roleRoutes from "./routes/roles.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const app = express();

const allowedOrigins = new Set([
  config.clientUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || /^http:\/\/(10|172\.(1[6-9]|2\d|3[0-1])|192\.168)\.\d{1,3}\.\d{1,3}:5173$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "interviewace-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`InterviewAce API running on port ${config.port}`);
});
