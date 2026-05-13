import fs from "fs/promises";
import pdf from "pdf-parse";

export async function parseResume(file) {
  if (!file) return "";

  if (file.mimetype === "application/pdf") {
    const buffer = await fs.readFile(file.path);
    const data = await pdf(buffer);
    return data.text.replace(/\s+/g, " ").trim();
  }

  if (file.mimetype.startsWith("text/")) {
    const text = await fs.readFile(file.path, "utf8");
    return text.replace(/\s+/g, " ").trim();
  }

  return "";
}
