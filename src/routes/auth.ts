import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "../lib/db/schema";
import { db } from "../lib/db";

const app = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

app.get("/ping", (c) => c.json({ ok: true }));

app.post(
  "/register-teacher",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      name: z.string().min(2),
      password: z.string().min(6),
    }),
  ),
  async (c) => {
    const payload = c.req.valid("json");
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1);
    if (existing) {
      return c.json({ message: "Email sudah terdaftar" }, 400);
    }
    const id = generateId("user");
    const passwordHash = await bcrypt.hash(payload.password, 10);
    await db.insert(users).values({
      id,
      email: payload.email,
      name: payload.name,
      role: "teacher",
      passwordHash,
    });
    return c.json({ id });
  },
);

app.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),
  ),
  async (c) => {
    const payload = c.req.valid("json");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1);

    if (!user) {
      return c.json({ message: "User tidak ditemukan" }, 404);
    }

    const ok = await bcrypt.compare(payload.password, user.passwordHash);
    if (!ok) {
      return c.json({ message: "Password salah" }, 401);
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  },
);

app.get("/me", async (c) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return c.json({ message: "Unauthorized" }, 401);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!user) return c.json({ message: "User tidak ditemukan" }, 404);
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return c.json({ message: "Token invalid" }, 401);
  }
});

export default app;
