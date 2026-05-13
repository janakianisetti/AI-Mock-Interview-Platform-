import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const fallbackQuestions = {
  "Java Developer": [
    "Explain the difference between an interface and an abstract class in Java.",
    "How does garbage collection work in Java?",
    "Describe how you would design a REST API for a placement portal."
  ],
  "Data Analyst": [
    "How would you handle missing values in a business dataset?",
    "Explain the difference between correlation and causation.",
    "How would you present sales performance insights to a non-technical manager?"
  ],
  "ML Engineer": [
    "How do you detect overfitting in a machine learning model?",
    "Explain the difference between precision and recall.",
    "How would you deploy a trained model for real-time predictions?"
  ]
};

function extractJson(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(text.slice(first, last + 1));
  } catch {
    return null;
  }
}

async function callGemini(prompt) {
  if (!config.geminiApiKey) return null;
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateQuestions({ role, difficulty, resumeText = "", count = 5 }) {
  const prompt = `
Return only valid JSON.
Create ${count} mock interview questions for a ${role} candidate.
Difficulty: ${difficulty}.
Use this resume context if useful: ${resumeText.slice(0, 2500)}
JSON shape:
{
  "questions": [
    {"question": "string", "category": "Technical|Project|HR|Behavioral", "expectedPoints": ["string"]}
  ]
}
`;

  const text = await callGemini(prompt);
  const parsed = text ? extractJson(text) : null;
  if (parsed?.questions?.length) return parsed.questions.slice(0, count);

  return (fallbackQuestions[role] || fallbackQuestions["Java Developer"]).map((question) => ({
    question,
    category: "Technical",
    expectedPoints: ["Clear explanation", "Relevant example", "Correct terminology"]
  }));
}

export async function evaluateAnswer({ role, question, answer }) {
  const prompt = `
Return only valid JSON.
Evaluate this mock interview answer for a ${role} candidate.
Question: ${question}
Answer: ${answer}
Score out of 100 using correctness, completeness, clarity, confidence, and relevance.
JSON shape:
{
  "score": 0,
  "level": "Needs Improvement|Good|Strong|Excellent",
  "strengths": ["string"],
  "improvements": ["string"],
  "idealAnswer": "string",
  "hrFeedback": "string"
}
`;

  const text = await callGemini(prompt);
  const parsed = text ? extractJson(text) : null;
  if (parsed?.score !== undefined) return parsed;

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const score = Math.max(35, Math.min(82, wordCount * 3));

  return {
    score,
    level: score >= 75 ? "Good" : "Needs Improvement",
    strengths: ["You attempted the question directly.", "Your answer has useful starting points."],
    improvements: [
      "Add a specific example from a project or internship.",
      "Structure the answer with definition, explanation, and practical use case."
    ],
    idealAnswer:
      "A strong answer should explain the concept clearly, connect it to the role, and include a concise real-world example.",
    hrFeedback:
      "You sound prepared, but the answer should be more structured and evidence-backed for a placement interview."
  };
}
