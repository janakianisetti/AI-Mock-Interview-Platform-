import { Router } from "express";

const router = Router();

const roles = [
  {
    name: "Java Developer",
    skills: ["Java", "OOP", "Spring Boot", "REST APIs", "SQL"]
  },
  {
    name: "Data Analyst",
    skills: ["SQL", "Excel", "Python", "Power BI", "Statistics"]
  },
  {
    name: "ML Engineer",
    skills: ["Python", "Machine Learning", "Model Evaluation", "Deployment", "Data Preprocessing"]
  }
];

router.get("/", (req, res) => {
  res.json({ roles });
});

export default router;
