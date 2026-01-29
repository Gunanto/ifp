import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gt } from "drizzle-orm";
import { warLeaderboard, warRooms } from "../lib/db/schema";
import { isAnswerCorrect } from "../lib/answer";

const app = new Hono();

type Player = {
  id: string;
  name: string;
  team: "alpha" | "bravo";
  hp: number;
  score: number;
  difficulty: number;
  cooldownUntil?: number;
  lastAnswerAt?: number;
};

type Question = {
  id: string;
  text: string;
  answer: string | number;
  difficulty: number;
  expiresAt: number;
};

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const generateRoomCode = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase();

const now = () => Date.now();

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const generateQuestion = (difficulty: number): Question => {
  const id = generateId("warq");
  const maxByDifficulty = [10, 20, 50, 100, 200];
  const max = maxByDifficulty[Math.max(0, Math.min(difficulty - 1, 4))];
  const operationsByDifficulty = [
    ["+", "-"],
    ["+", "-", "x"],
    ["+", "-", "x", "/"],
    ["+", "-", "x", "/", "^", "sqrt"],
    ["+", "-", "x", "/", "^", "sqrt", "algebra"],
  ];
  const op = pick(
    operationsByDifficulty[Math.max(0, Math.min(difficulty - 1, 4))],
  );

  let text = "";
  let answer: number | string = 0;

  if (op === "algebra") {
    const a = pick([1, 2, 3, 4, 5]);
    const x = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) - 5;
    const c = a * x + b;
    text = `${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${c}`;
    answer = x;
  } else if (op === "sqrt") {
    const n = Math.floor(Math.random() * 12) + 2;
    const square = n * n;
    text = `√${square} = ?`;
    answer = n;
  } else if (op === "^") {
    const base = Math.floor(Math.random() * 8) + 2;
    const exp = pick([2, 3]);
    text = `${base}^${exp} = ?`;
    answer = Math.pow(base, exp);
  } else if (op === "/") {
    const b = Math.floor(Math.random() * 9) + 2;
    const a = b * (Math.floor(Math.random() * 10) + 2);
    text = `${a} ÷ ${b} = ?`;
    answer = a / b;
  } else if (op === "x") {
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    text = `${a} × ${b} = ?`;
    answer = a * b;
  } else if (op === "-") {
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    text = `${a} - ${b} = ?`;
    answer = a - b;
  } else {
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    text = `${a} + ${b} = ?`;
    answer = a + b;
  }

  return {
    id,
    text,
    answer,
    difficulty,
    expiresAt: now() + 15000,
  };
};

const saveLeaderboard = async (
  db: any,
  code: string,
  state: warRooms.$inferSelect["state"],
) => {
  if (!state?.players || !state.winner) return;
  const winnerTeam = state.winner;
  await Promise.all(
    state.players.map((player) =>
      db.insert(warLeaderboard).values({
        id: generateId("leader"),
        roomCode: code,
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        score: player.score,
        hpLeft: player.hp,
        isWinner: player.team === winnerTeam,
      }),
    ),
  );
};

const sanitizeRoomState = (state: warRooms.$inferSelect["state"]) => ({
  players: state?.players ?? [],
  questions: Object.fromEntries(
    Object.entries(state?.questions ?? {}).map(([playerId, question]) => [
      playerId,
      {
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
        expiresAt: question.expiresAt,
      },
    ]),
  ),
  winner: state?.winner ?? null,
});

app.post(
  "/rooms",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const payload = c.req.valid("json");
    const roomId = generateId("room");
    const code = generateRoomCode();
    const playerId = generateId("player");
    const player: Player = {
      id: playerId,
      name: payload.name,
      team: "alpha",
      hp: 100,
      score: 0,
      difficulty: 2,
    };
    const question = generateQuestion(player.difficulty);
    const state = {
      players: [player],
      questions: {
        [playerId]: question,
      },
      winner: null,
    };

    await db.insert(warRooms).values({
      id: roomId,
      code,
      status: "waiting",
      settings: {
        baseHp: 100,
        timePerQuestion: 15,
        damagePerDifficulty: 8,
      },
      state,
    });

    return c.json({
      code,
      playerId,
      team: player.team,
      settings: { baseHp: 100, timePerQuestion: 15, damagePerDifficulty: 8 },
    });
  },
);

app.post(
  "/rooms/:code/join",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const code = c.req.param("code");
    const payload = c.req.valid("json");
    const [room] = await db
      .select()
      .from(warRooms)
      .where(eq(warRooms.code, code))
      .limit(1);

    if (!room) {
      return c.json({ message: "Room tidak ditemukan" }, 404);
    }

    const state = room.state ?? { players: [], questions: {}, winner: null };
    if (state.players.length >= 2) {
      return c.json({ message: "Room penuh" }, 400);
    }

    const playerId = generateId("player");
    const player: Player = {
      id: playerId,
      name: payload.name,
      team: "bravo",
      hp: room.settings?.baseHp ?? 100,
      score: 0,
      difficulty: 2,
    };

    state.players.push(player);
    state.questions[playerId] = generateQuestion(player.difficulty);

    await db
      .update(warRooms)
      .set({ state, status: "active", updatedAt: new Date() })
      .where(eq(warRooms.id, room.id));

    return c.json({
      code,
      playerId,
      team: player.team,
      settings: room.settings,
    });
  },
);

app.get("/rooms/:code", async (c) => {
  const db = c.get("db");
  const code = c.req.param("code");
  const [room] = await db
    .select()
    .from(warRooms)
    .where(eq(warRooms.code, code))
    .limit(1);

  if (!room) {
    return c.json({ message: "Room tidak ditemukan" }, 404);
  }

  return c.json({
    code,
    status: room.status,
    settings: room.settings,
    state: sanitizeRoomState(room.state),
    serverTime: now(),
  });
});

app.get("/leaderboard", async (c) => {
  const db = c.get("db");
  const limit = Math.min(50, Number(c.req.query("limit") || 10));
  const roomCode = (c.req.query("room") || "").toUpperCase();
  const scope = c.req.query("scope") || (roomCode ? "room" : "global");
  const period = c.req.query("period") || "all";
  const nowTs = Date.now();
  let since = 0;
  if (period === "daily") {
    since = nowTs - 24 * 60 * 60 * 1000;
  } else if (period === "weekly") {
    since = nowTs - 7 * 24 * 60 * 60 * 1000;
  }
  const baseQuery = db
    .select()
    .from(warLeaderboard)
    .orderBy(desc(warLeaderboard.score))
    .limit(limit);
  const filters = [];
  if (since) {
    filters.push(gt(warLeaderboard.createdAt, new Date(since)));
  }
  if (scope === "room" && roomCode) {
    filters.push(eq(warLeaderboard.roomCode, roomCode));
  }
  const rows =
    filters.length > 0
      ? await baseQuery.where(and(...filters))
      : await baseQuery;
  return c.json({ leaderboard: rows });
});

app.post(
  "/answer",
  zValidator(
    "json",
    z.object({
      code: z.string(),
      playerId: z.string(),
      answer: z.union([z.string(), z.number()]),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const payload = c.req.valid("json");
    const [room] = await db
      .select()
      .from(warRooms)
      .where(eq(warRooms.code, payload.code))
      .limit(1);

    if (!room) {
      return c.json({ message: "Room tidak ditemukan" }, 404);
    }

    const state = room.state ?? { players: [], questions: {}, winner: null };
    const player = state.players.find((p) => p.id === payload.playerId);
    if (!player) {
      return c.json({ message: "Player tidak ditemukan" }, 404);
    }

    if (room.status === "finished") {
      return c.json({ message: "Game selesai" }, 400);
    }

    const currentQuestion = state.questions[payload.playerId];
    if (!currentQuestion) {
      return c.json({ message: "Soal tidak ditemukan" }, 400);
    }

    const nowTs = now();
    if (player.cooldownUntil && nowTs < player.cooldownUntil) {
      return c.json({ message: "Cooldown aktif" }, 429);
    }

    if (nowTs > currentQuestion.expiresAt) {
      player.cooldownUntil = nowTs + 3000;
      player.difficulty = Math.max(1, player.difficulty - 1);
      state.questions[payload.playerId] = generateQuestion(player.difficulty);
      await db
        .update(warRooms)
        .set({ state, updatedAt: new Date() })
        .where(eq(warRooms.id, room.id));
      return c.json({ correct: false, reason: "timeout" });
    }

    const correct = isAnswerCorrect(currentQuestion.answer, payload.answer);
    player.lastAnswerAt = nowTs;
    if (correct) {
      const opponent = state.players.find((p) => p.id !== player.id);
      const baseDamage = room.settings?.damagePerDifficulty ?? 8;
      const damage = baseDamage * currentQuestion.difficulty;
      player.score += damage;
      player.difficulty = Math.min(5, player.difficulty + 1);
      if (opponent) {
        opponent.hp = Math.max(0, opponent.hp - damage);
        if (opponent.hp === 0) {
          room.status = "finished";
          state.winner = player.team;
          await saveLeaderboard(db, room.code, state);
        }
      }
    } else {
      player.cooldownUntil = nowTs + 3000;
      player.difficulty = Math.max(1, player.difficulty - 1);
    }

    state.questions[payload.playerId] = generateQuestion(player.difficulty);

    await db
      .update(warRooms)
      .set({ state, status: room.status, updatedAt: new Date() })
      .where(eq(warRooms.id, room.id));

    return c.json({
      correct,
      damage:
        correct && room.settings
          ? room.settings.damagePerDifficulty * currentQuestion.difficulty
          : 0,
      state: sanitizeRoomState(state),
      serverTime: nowTs,
    });
  },
);

export default app;
