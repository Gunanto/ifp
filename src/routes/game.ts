import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import jwt from "jsonwebtoken";
import { desc, eq } from "drizzle-orm";
import { gameRunAnswers, gameRuns } from "../lib/db/schema";
import { isAnswerCorrect } from "../lib/answer";

const app = new Hono();

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

type GeneratedQuestion = {
  id: string;
  topic: string;
  difficulty: number;
  question: string;
};

type QuestionPayload = {
  a: number;
  b: number;
  op: string;
  answer: number;
  topic: string;
  difficulty: number;
  issuedAt: number;
};

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateQuestion = (
  topic: string,
  difficulty: number,
): GeneratedQuestion => {
  const ranges = [10, 20, 50, 100, 200];
  const max = ranges[Math.max(0, Math.min(difficulty - 1, ranges.length - 1))];
  const opsByDifficulty = [
    ["+"],
    ["+", "-"],
    ["+", "-", "x"],
    ["+", "-", "x", "/"],
    ["+", "-", "x", "/"],
  ];
  const ops =
    opsByDifficulty[
      Math.max(0, Math.min(difficulty - 1, opsByDifficulty.length - 1))
    ];
  const op = ops[getRandomInt(0, ops.length - 1)];

  let a = getRandomInt(1, max);
  let b = getRandomInt(1, max);

  if (op === "/") {
    b = getRandomInt(1, Math.max(2, Math.floor(max / 2)));
    a = b * getRandomInt(1, Math.max(2, Math.floor(max / b)));
  }

  const answer =
    op === "+" ? a + b : op === "-" ? a - b : op === "x" ? a * b : a / b;

  const payload: QuestionPayload = {
    a,
    b,
    op,
    answer,
    topic,
    difficulty,
    issuedAt: Date.now(),
  };
  const id = jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });

  return {
    id,
    topic,
    difficulty,
    question: `${a} ${op} ${b} = ?`,
  };
};

const generateRunId = () =>
  `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const generateAnswerId = () =>
  `ans_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

app.get("/questions", (c) => {
  const topic = c.req.query("topic") || "mixed";
  const difficulty = Number(c.req.query("difficulty") || 3);
  const count = Number(c.req.query("count") || 5);

  const questions = Array.from({ length: count }).map(() =>
    generateQuestion(topic, difficulty),
  );

  return c.json({ questions });
});

app.post(
  "/start",
  zValidator(
    "json",
    z.object({
      topic: z.string().optional(),
      difficulty: z.number().min(1).max(5).optional(),
      timeLimit: z.number().min(10).max(600).optional(),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const payload = c.req.valid("json");
    const topic = payload.topic || "mixed";
    const difficulty = payload.difficulty ?? 3;
    const timeLimit = payload.timeLimit ?? 60;
    const sessionId = generateRunId();

    await db.insert(gameRuns).values({
      id: sessionId,
      mode: topic,
      difficulty,
      timeLimit,
      status: "active",
    });

    const question = generateQuestion(topic, difficulty);

    return c.json({
      sessionId,
      score: 0,
      difficulty,
      timeLimit,
      question,
    });
  },
);

app.post(
  "/finish",
  zValidator(
    "json",
    z.object({
      sessionId: z.string(),
    }),
  ),
  async (c) => {
    const { sessionId } = c.req.valid("json");
    const db = c.get("db");
    const [run] = await db
      .select()
      .from(gameRuns)
      .where(eq(gameRuns.id, sessionId))
      .limit(1);

    if (!run) {
      return c.json({ message: "Sesi tidak ditemukan" }, 404);
    }

    await db
      .update(gameRuns)
      .set({ status: "finished", updatedAt: new Date() })
      .where(eq(gameRuns.id, sessionId));

    const accuracy =
      run.totalAnswered && run.totalAnswered > 0
        ? Math.round(((run.correctAnswered ?? 0) / run.totalAnswered) * 100)
        : 0;

    return c.json({
      sessionId,
      status: "finished",
      score: run.score ?? 0,
      totalAnswered: run.totalAnswered ?? 0,
      correctAnswered: run.correctAnswered ?? 0,
      accuracy,
    });
  },
);

app.get("/history", async (c) => {
  const db = c.get("db");
  const limit = Math.min(50, Number(c.req.query("limit") || 10));
  const runs = await db
    .select()
    .from(gameRuns)
    .orderBy(desc(gameRuns.updatedAt))
    .limit(limit);

  return c.json({ runs });
});

app.post(
  "/answers",
  zValidator(
    "json",
    z.object({
      sessionId: z.string(),
      questionId: z.string(),
      answer: z.union([z.string(), z.number()]),
      timeSpent: z.number().min(0).max(600).optional(),
    }),
  ),
  async (c) => {
    const { sessionId, questionId, answer, timeSpent } = c.req.valid("json");
    const db = c.get("db");
    const [run] = await db
      .select()
      .from(gameRuns)
      .where(eq(gameRuns.id, sessionId))
      .limit(1);

    if (!run || run.status !== "active") {
      return c.json(
        { message: "Sesi tidak ditemukan atau sudah selesai" },
        404,
      );
    }

    try {
      const payload = jwt.verify(questionId, JWT_SECRET) as QuestionPayload;
      const correct = isAnswerCorrect(payload.answer, answer);

      const nextTotal = (run.totalAnswered ?? 0) + 1;
      const nextCorrect = (run.correctAnswered ?? 0) + (correct ? 1 : 0);
      let nextScore = (run.score ?? 0) + (correct ? 1 : 0);
      let nextStreak = correct ? (run.streak ?? 0) + 1 : 0;
      let nextDifficulty = run.difficulty ?? 3;

      if (correct && nextStreak >= 2) {
        nextDifficulty += 1;
        nextStreak = 0;
      } else if (!correct) {
        nextDifficulty -= 1;
      }

      nextDifficulty = Math.max(1, Math.min(5, nextDifficulty));

      await db
        .update(gameRuns)
        .set({
          score: nextScore,
          difficulty: nextDifficulty,
          streak: nextStreak,
          totalAnswered: nextTotal,
          correctAnswered: nextCorrect,
          updatedAt: new Date(),
        })
        .where(eq(gameRuns.id, sessionId));

      const questionText = `${payload.a} ${payload.op} ${payload.b} = ?`;
      await db.insert(gameRunAnswers).values({
        id: generateAnswerId(),
        runId: sessionId,
        questionText,
        questionToken: questionId,
        difficulty: payload.difficulty,
        answer: String(answer),
        correctAnswer: String(payload.answer),
        isCorrect: correct,
        timeSpent,
      });

      const nextQuestion = generateQuestion(
        run.mode ?? "mixed",
        nextDifficulty,
      );

      return c.json({
        correct,
        correctAnswer: payload.answer,
        topic: payload.topic,
        difficulty: nextDifficulty,
        score: nextScore,
        streak: nextStreak,
        totalAnswered: nextTotal,
        sessionId,
        nextQuestion,
      });
    } catch (err) {
      return c.json(
        {
          correct: false,
          message: "Token soal tidak valid atau sudah kedaluwarsa",
        },
        400,
      );
    }
  },
);

export default app;
