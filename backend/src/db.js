import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

const memory = {
  users: [],
  resumes: [],
  interviews: [],
  questions: [],
  answers: [],
  ids: {
    users: 1,
    resumes: 1,
    interviews: 1,
    questions: 1,
    answers: 1
  },
  warned: false
};

function now() {
  return new Date().toISOString();
}

function isConnectionError(error) {
  return ["ECONNREFUSED", "ENOTFOUND", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR"].includes(error?.code);
}

function warnMemoryMode() {
  if (!memory.warned) {
    console.warn("MySQL is unavailable. Using in-memory demo storage for this server session.");
    memory.warned = true;
  }
}

function insert(table, row) {
  const id = memory.ids[table]++;
  memory[table].push({ id, ...row, created_at: now() });
  return { insertId: id, affectedRows: 1 };
}

function runMemoryQuery(sql, params) {
  const compact = sql.replace(/\s+/g, " ").trim();

  if (compact.startsWith("SELECT id FROM users WHERE email")) {
    return memory.users.filter((user) => user.email === params.email).map(({ id }) => ({ id }));
  }

  if (compact.startsWith("INSERT INTO users")) {
    return insert("users", {
      name: params.name,
      email: params.email,
      password_hash: params.passwordHash
    });
  }

  if (compact.startsWith("SELECT * FROM users WHERE email")) {
    return memory.users.filter((user) => user.email === params.email);
  }

  if (compact.startsWith("INSERT INTO resumes")) {
    return insert("resumes", {
      user_id: Number(params.userId),
      filename: params.filename,
      extracted_text: params.text
    });
  }

  if (compact.startsWith("SELECT id, filename, extracted_text, created_at FROM resumes")) {
    return memory.resumes
      .filter((resume) => resume.user_id === Number(params.userId))
      .sort((a, b) => b.id - a.id)
      .slice(0, 1);
  }

  if (compact.startsWith("SELECT extracted_text FROM resumes")) {
    return memory.resumes
      .filter((resume) => resume.user_id === Number(params.userId))
      .sort((a, b) => b.id - a.id)
      .slice(0, 1)
      .map(({ extracted_text }) => ({ extracted_text }));
  }

  if (compact.startsWith("INSERT INTO interviews")) {
    return insert("interviews", {
      user_id: Number(params.userId),
      role: params.role,
      difficulty: params.difficulty,
      status: "IN_PROGRESS",
      overall_score: null,
      completed_at: null
    });
  }

  if (compact.startsWith("INSERT INTO questions")) {
    return insert("questions", {
      interview_id: Number(params.interviewId),
      question_text: params.text,
      category: params.category,
      expected_points: params.points
    });
  }

  if (compact.startsWith("SELECT id, question_text AS question, category FROM questions")) {
    return memory.questions
      .filter((question) => question.interview_id === Number(params.interviewId))
      .sort((a, b) => a.id - b.id)
      .map(({ id, question_text, category }) => ({ id, question: question_text, category }));
  }

  if (compact.startsWith("SELECT i.role, q.question_text FROM questions q JOIN interviews i")) {
    const interview = memory.interviews.find(
      (item) => item.id === Number(params.interviewId) && item.user_id === Number(params.userId)
    );
    const question = memory.questions.find(
      (item) => item.id === Number(params.questionId) && item.interview_id === Number(params.interviewId)
    );
    return interview && question ? [{ role: interview.role, question_text: question.question_text }] : [];
  }

  if (compact.startsWith("INSERT INTO answers")) {
    return insert("answers", {
      question_id: Number(params.questionId),
      user_id: Number(params.userId),
      answer_text: params.answer,
      score: Number(params.score),
      level: params.level,
      strengths: params.strengths,
      improvements: params.improvements,
      ideal_answer: params.idealAnswer,
      hr_feedback: params.hrFeedback
    });
  }

  if (compact.startsWith("UPDATE interviews SET status = 'COMPLETED'")) {
    const interview = memory.interviews.find(
      (item) => item.id === Number(params.interviewId) && item.user_id === Number(params.userId)
    );
    if (interview) {
      const questionIds = memory.questions
        .filter((question) => question.interview_id === interview.id)
        .map((question) => question.id);
      const scores = memory.answers
        .filter((answer) => questionIds.includes(answer.question_id))
        .map((answer) => answer.score);
      interview.status = "COMPLETED";
      interview.completed_at = now();
      interview.overall_score = scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : null;
    }
    return { affectedRows: interview ? 1 : 0 };
  }

  if (compact.startsWith("SELECT id, role, difficulty, status, overall_score, created_at, completed_at FROM interviews")) {
    return memory.interviews
      .filter((interview) => interview.user_id === Number(params.userId))
      .sort((a, b) => b.id - a.id)
      .map(({ id, role, difficulty, status, overall_score, created_at, completed_at }) => ({
        id,
        role,
        difficulty,
        status,
        overall_score,
        created_at,
        completed_at
      }));
  }

  throw Object.assign(new Error(`Memory database does not support query: ${compact}`), { status: 500 });
}

export async function query(sql, params = {}) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }

    warnMemoryMode();
    return runMemoryQuery(sql, params);
  }
}
