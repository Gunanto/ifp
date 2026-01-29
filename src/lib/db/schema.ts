import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "teacher", "admin"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  classId: text("class_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  teacherId: text("teacher_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  gameType: text("game_type", {
    enum: ["algebra", "geometry", "fractions", "logic", "mixed"],
  }).notNull(),
  difficulty: integer("difficulty").default(1),
  teacherId: text("teacher_id"),
  classId: text("class_id"),
  settings: text("settings", { mode: "json" }).$type<{
    timeLimit?: number;
    questionCount?: number;
    allowHints?: boolean;
    teamMode?: boolean;
  }>(),
  status: text("status", {
    enum: ["waiting", "active", "finished", "cancelled"],
  }).default("waiting"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  subTopic: text("sub_topic").notNull(),
  difficulty: integer("difficulty").notNull(),
  questionText: text("question_text").notNull(),
  questionData: text("question_data", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  correctAnswer: text("correct_answer", { mode: "json" }).notNull(),
  solutionSteps: text("solution_steps", { mode: "json" }).$type<string[]>(),
  hint: text("hint"),
  metadata: text("metadata", { mode: "json" }).$type<{
    timeEstimate?: number;
  }>(),
  createdBy: text("created_by"),
  isApproved: integer("is_approved", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const studentProgress = sqliteTable("student_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  sessionId: text("session_id"),
  questionId: text("question_id").notNull(),
  answer: text("answer", { mode: "json" }),
  isCorrect: integer("is_correct", { mode: "boolean" }),
  timeSpent: real("time_spent"),
  usedHints: integer("used_hints").default(0),
  confidence: integer("confidence"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const gameRuns = sqliteTable("game_runs", {
  id: text("id").primaryKey(),
  mode: text("mode", {
    enum: ["algebra", "geometry", "fractions", "logic", "mixed"],
  }).default("mixed"),
  score: integer("score").default(0),
  difficulty: integer("difficulty").default(3),
  streak: integer("streak").default(0),
  totalAnswered: integer("total_answered").default(0),
  correctAnswered: integer("correct_answered").default(0),
  status: text("status", { enum: ["active", "finished"] }).default("active"),
  timeLimit: integer("time_limit").default(60),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const warRooms = sqliteTable("war_rooms", {
  id: text("id").primaryKey(),
  code: text("code").unique().notNull(),
  status: text("status", { enum: ["waiting", "active", "finished"] }).default(
    "waiting",
  ),
  settings: text("settings", { mode: "json" }).$type<{
    baseHp: number;
    timePerQuestion: number;
    damagePerDifficulty: number;
  }>(),
  state: text("state", { mode: "json" }).$type<{
    players: Array<{
      id: string;
      name: string;
      team: "alpha" | "bravo";
      hp: number;
      score: number;
      difficulty: number;
      cooldownUntil?: number;
      lastAnswerAt?: number;
    }>;
    questions: Record<
      string,
      {
        id: string;
        text: string;
        answer: string | number;
        difficulty: number;
        expiresAt: number;
      }
    >;
    winner?: "alpha" | "bravo" | null;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const warLeaderboard = sqliteTable("war_leaderboard", {
  id: text("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  playerId: text("player_id").notNull(),
  playerName: text("player_name").notNull(),
  team: text("team", { enum: ["alpha", "bravo"] }).notNull(),
  score: integer("score").default(0),
  hpLeft: integer("hp_left").default(0),
  isWinner: integer("is_winner", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const gameRunAnswers = sqliteTable("game_run_answers", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  questionText: text("question_text").notNull(),
  questionToken: text("question_token").notNull(),
  difficulty: integer("difficulty").notNull(),
  answer: text("answer"),
  correctAnswer: text("correct_answer"),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  timeSpent: real("time_spent"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  class: one(classes, {
    fields: [users.classId],
    references: [classes.id],
  }),
  createdSessions: many(gameSessions, { relationName: "teacher" }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  students: many(users),
  sessions: many(gameSessions),
}));

export const gameSessionsRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    teacher: one(users, {
      fields: [gameSessions.teacherId],
      references: [users.id],
      relationName: "teacher",
    }),
    class: one(classes, {
      fields: [gameSessions.classId],
      references: [classes.id],
    }),
    progressRecords: many(studentProgress),
  }),
);

export const studentProgressRelations = relations(
  studentProgress,
  ({ one }) => ({
    student: one(users, {
      fields: [studentProgress.studentId],
      references: [users.id],
    }),
    question: one(questions, {
      fields: [studentProgress.questionId],
      references: [questions.id],
    }),
    session: one(gameSessions, {
      fields: [studentProgress.sessionId],
      references: [gameSessions.id],
    }),
  }),
);
