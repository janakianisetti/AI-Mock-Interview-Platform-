import { Router } from "express";
import multer from "multer";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { parseResume } from "../services/resumeService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ["application/pdf", "text/plain"];
    cb(null, allowed.includes(file.mimetype));
  }
});

const router = Router();

router.post(
  "/",
  requireAuth,
  upload.single("resume"),
  asyncHandler(async (req, res) => {
    const text = await parseResume(req.file);
    const result = await query(
      "INSERT INTO resumes (user_id, filename, extracted_text) VALUES (:userId, :filename, :text)",
      {
        userId: req.user.id,
        filename: req.file?.originalname || "resume",
        text
      }
    );

    res.status(201).json({
      id: result.insertId,
      filename: req.file?.originalname,
      preview: text.slice(0, 500)
    });
  })
);

router.get(
  "/latest",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query(
      "SELECT id, filename, extracted_text, created_at FROM resumes WHERE user_id = :userId ORDER BY created_at DESC LIMIT 1",
      { userId: req.user.id }
    );
    res.json({ resume: rows[0] || null });
  })
);

export default router;
