import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createToken } from "../utils/tokens.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await query("SELECT id FROM users WHERE email = :email", { email: input.email });

    if (existing.length) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const result = await query(
      "INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :passwordHash)",
      { name: input.name, email: input.email, passwordHash }
    );

    const user = { id: result.insertId, name: input.name, email: input.email };
    res.status(201).json({ user, token: createToken(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const users = await query("SELECT * FROM users WHERE email = :email", { email: input.email });
    const user = users[0];

    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const publicUser = { id: user.id, name: user.name, email: user.email };
    res.json({ user: publicUser, token: createToken(publicUser) });
  })
);

export default router;
