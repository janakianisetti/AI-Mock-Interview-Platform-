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

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
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

app.listen(config.port, () => {
  console.log(`InterviewAce API running on port ${config.port}`);
});
