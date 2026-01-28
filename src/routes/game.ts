import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

app.get("/questions", (c) => {
  const topic = c.req.query("topic") || "mixed";
  const difficulty = Number(c.req.query("difficulty") || 3);
  const count = Number(c.req.query("count") || 5);

  const questions = Array.from({ length: count }).map((_, i) => ({
    id: `q_${Date.now()}_${i}`,
    topic,
    difficulty,
    question: `Soal contoh ${i + 1} (${topic})`
  }));

  return c.json({ questions });
});

app.post("/answers", zValidator("json", z.object({
  questionId: z.string(),
  answer: z.any()
})), (c) => {
  return c.json({
    success: false,
    message: "Answer checking belum diimplementasikan"
  }, 501);
});

export default app;
