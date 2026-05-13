import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  aiProvider: process.env.AI_PROVIDER || "fallback",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  db: {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "interviewace"
  }
};
