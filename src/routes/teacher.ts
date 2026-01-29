import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { classes, gameSessions, questions } from "../lib/db/schema";

const app = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

app.use("*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string };
    if (payload.role !== "teacher" && payload.role !== "admin") {
      return c.json({ message: "Forbidden" }, 403);
    }
  } catch {
    return c.json({ message: "Token invalid" }, 401);
  }
  await next();
});

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// --- Classes CRUD ---
app.get("/classes", async (c) => {
  const db = c.get("db");
  const list = await db.select().from(classes).orderBy(desc(classes.createdAt));
  return c.json({ classes: list });
});

app.post(
  "/classes",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2),
      grade: z.number().min(1).max(12),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const payload = c.req.valid("json");
    const id = generateId("class");
    await db.insert(classes).values({
      id,
      name: payload.name,
      grade: payload.grade,
    });
    return c.json({ id });
  },
);

app.put(
  "/classes/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2).optional(),
      grade: z.number().min(1).max(12).optional(),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    await db.update(classes).set(payload).where(eq(classes.id, id));
    return c.json({ id });
  },
);

app.delete("/classes/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  await db.delete(classes).where(eq(classes.id, id));
  return c.json({ id });
});

// --- Questions CRUD ---
app.get("/questions", async (c) => {
  const db = c.get("db");
  const list = await db
    .select()
    .from(questions)
    .orderBy(desc(questions.createdAt));
  return c.json({ questions: list });
});

app.post(
  "/questions",
  zValidator(
    "json",
    z.object({
      topic: z.string().min(1),
      subTopic: z.string().min(1),
      difficulty: z.number().min(1).max(5),
      questionText: z.string().min(1),
      correctAnswer: z.string().min(1),
      answerFormat: z.enum(["text", "latex"]).optional(),
      questionFormat: z.enum(["text", "latex"]).optional(),
      hint: z.string().optional(),
      solutionSteps: z.array(z.string()).optional(),
      timeEstimate: z.number().min(1).max(600).optional(),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const payload = c.req.valid("json");
    const id = generateId("question");
    await db.insert(questions).values({
      id,
      topic: payload.topic,
      subTopic: payload.subTopic,
      difficulty: payload.difficulty,
      questionText: payload.questionText,
      questionData: {
        format: payload.questionFormat ?? "text",
      },
      correctAnswer: {
        value: payload.correctAnswer,
        format: payload.answerFormat ?? "text",
      },
      hint: payload.hint,
      solutionSteps: payload.solutionSteps,
      metadata: payload.timeEstimate
        ? { timeEstimate: payload.timeEstimate }
        : undefined,
      isApproved: true,
    });
    return c.json({ id });
  },
);

app.put(
  "/questions/:id",
  zValidator(
    "json",
    z.object({
      topic: z.string().optional(),
      subTopic: z.string().optional(),
      difficulty: z.number().min(1).max(5).optional(),
      questionText: z.string().optional(),
      correctAnswer: z.string().optional(),
      answerFormat: z.enum(["text", "latex"]).optional(),
      questionFormat: z.enum(["text", "latex"]).optional(),
      hint: z.string().optional(),
      solutionSteps: z.array(z.string()).optional(),
      timeEstimate: z.number().min(1).max(600).optional(),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    const updateData: Record<string, unknown> = {
      topic: payload.topic,
      subTopic: payload.subTopic,
      difficulty: payload.difficulty,
      questionText: payload.questionText,
      hint: payload.hint,
      solutionSteps: payload.solutionSteps,
    };

    if (payload.questionFormat) {
      updateData.questionData = { format: payload.questionFormat };
    }

    if (payload.correctAnswer) {
      updateData.correctAnswer = {
        value: payload.correctAnswer,
        format: payload.answerFormat ?? "text",
      };
    }

    if (payload.timeEstimate !== undefined) {
      updateData.metadata = { timeEstimate: payload.timeEstimate };
    }

    await db.update(questions).set(updateData).where(eq(questions.id, id));
    return c.json({ id });
  },
);

app.delete("/questions/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  await db.delete(questions).where(eq(questions.id, id));
  return c.json({ id });
});

// --- Sessions CRUD ---
app.get("/sessions", async (c) => {
  const db = c.get("db");
  const list = await db
    .select()
    .from(gameSessions)
    .orderBy(desc(gameSessions.createdAt));
  return c.json({ sessions: list });
});

app.post(
  "/sessions",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2),
      gameType: z.enum(["algebra", "geometry", "fractions", "logic", "mixed"]),
      difficulty: z.number().min(1).max(5).optional(),
      timeLimit: z.number().min(10).max(600).optional(),
      questionCount: z.number().min(1).max(50).optional(),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const payload = c.req.valid("json");
    const id = generateId("session");
    const code = `CODE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await db.insert(gameSessions).values({
      id,
      code,
      name: payload.name,
      gameType: payload.gameType,
      difficulty: payload.difficulty ?? 1,
      settings: {
        timeLimit: payload.timeLimit,
        questionCount: payload.questionCount,
      },
      status: "waiting",
    });
    return c.json({ id, code });
  },
);

app.put(
  "/sessions/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2).optional(),
      gameType: z
        .enum(["algebra", "geometry", "fractions", "logic", "mixed"])
        .optional(),
      difficulty: z.number().min(1).max(5).optional(),
      status: z.enum(["waiting", "active", "finished", "cancelled"]).optional(),
      timeLimit: z.number().min(10).max(600).optional(),
      questionCount: z.number().min(1).max(50).optional(),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    const updateData: Record<string, unknown> = {
      name: payload.name,
      gameType: payload.gameType,
      difficulty: payload.difficulty,
      status: payload.status,
    };
    if (
      payload.timeLimit !== undefined ||
      payload.questionCount !== undefined
    ) {
      updateData.settings = {
        timeLimit: payload.timeLimit,
        questionCount: payload.questionCount,
      };
    }
    await db
      .update(gameSessions)
      .set(updateData)
      .where(eq(gameSessions.id, id));
    return c.json({ id });
  },
);

app.delete("/sessions/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  await db.delete(gameSessions).where(eq(gameSessions.id, id));
  return c.json({ id });
});

export default app;
