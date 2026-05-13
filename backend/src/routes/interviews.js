import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { evaluateAnswer, generateQuestions } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const startSchema = z.object({
  role: z.string().min(2),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Intermediate"),
  useResume: z.boolean().default(false)
});

const answerSchema = z.object({
  answer: z.string().min(5)
});

router.post(
  "/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = startSchema.parse(req.body);
    let resumeText = "";

    if (input.useResume) {
      const resumes = await query(
        "SELECT extracted_text FROM resumes WHERE user_id = :userId ORDER BY created_at DESC LIMIT 1",
        { userId: req.user.id }
      );
      resumeText = resumes[0]?.extracted_text || "";
    }

    const interviewResult = await query(
      "INSERT INTO interviews (user_id, role, difficulty, status) VALUES (:userId, :role, :difficulty, 'IN_PROGRESS')",
      {
        userId: req.user.id,
        role: input.role,
        difficulty: input.difficulty
      }
    );

    const questions = await generateQuestions({
      role: input.role,
      difficulty: input.difficulty,
      resumeText,
      count: 5
    });

    for (const item of questions) {
      await query(
        "INSERT INTO questions (interview_id, question_text, category, expected_points) VALUES (:interviewId, :text, :category, :points)",
        {
          interviewId: interviewResult.insertId,
          text: item.question,
          category: item.category || "Technical",
          points: JSON.stringify(item.expectedPoints || [])
        }
      );
    }

    const savedQuestions = await query(
      "SELECT id, question_text AS question, category FROM questions WHERE interview_id = :interviewId ORDER BY id",
      { interviewId: interviewResult.insertId }
    );

    res.status(201).json({
      interview: {
        id: interviewResult.insertId,
        role: input.role,
        difficulty: input.difficulty,
        questions: savedQuestions
      }
    });
  })
);

router.post(
  "/:interviewId/questions/:questionId/answer",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = answerSchema.parse(req.body);
    const rows = await query(
      `SELECT i.role, q.question_text
       FROM questions q
       JOIN interviews i ON i.id = q.interview_id
       WHERE i.id = :interviewId AND q.id = :questionId AND i.user_id = :userId`,
      {
        interviewId: req.params.interviewId,
        questionId: req.params.questionId,
        userId: req.user.id
      }
    );

    const target = rows[0];
    if (!target) {
      return res.status(404).json({ message: "Question not found" });
    }

    const feedback = await evaluateAnswer({
      role: target.role,
      question: target.question_text,
      answer: input.answer
    });

    await query(
      `INSERT INTO answers
       (question_id, user_id, answer_text, score, level, strengths, improvements, ideal_answer, hr_feedback)
       VALUES
       (:questionId, :userId, :answer, :score, :level, :strengths, :improvements, :idealAnswer, :hrFeedback)`,
      {
        questionId: req.params.questionId,
        userId: req.user.id,
        answer: input.answer,
        score: feedback.score,
        level: feedback.level,
        strengths: JSON.stringify(feedback.strengths || []),
        improvements: JSON.stringify(feedback.improvements || []),
        idealAnswer: feedback.idealAnswer || "",
        hrFeedback: feedback.hrFeedback || ""
      }
    );

    res.json({ feedback });
  })
);

router.post(
  "/:interviewId/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    await query(
      `UPDATE interviews
       SET status = 'COMPLETED',
           completed_at = CURRENT_TIMESTAMP,
           overall_score = (
             SELECT ROUND(AVG(a.score))
             FROM answers a
             JOIN questions q ON q.id = a.question_id
             WHERE q.interview_id = :interviewId
           )
       WHERE id = :interviewId AND user_id = :userId`,
      { interviewId: req.params.interviewId, userId: req.user.id }
    );

    res.json({ message: "Interview completed" });
  })
);

router.get(
  "/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT id, role, difficulty, status, overall_score, created_at, completed_at
       FROM interviews
       WHERE user_id = :userId
       ORDER BY created_at DESC`,
      { userId: req.user.id }
    );
    res.json({ interviews: rows });
  })
);

export default router;
