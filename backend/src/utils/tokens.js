import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}
