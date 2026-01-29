import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";
import { serveStatic } from "hono/bun";

import { db } from "./lib/db";
import authRoutes from "./routes/auth";
import gameRoutes from "./routes/game";
import teacherRoutes from "./routes/teacher";
import warRoutes from "./routes/war";

export const setupServer = () => {
  const app = new Hono<{
    Variables: {
      db: typeof db;
    };
  }>();

  app.use("*", logger());
  app.use("*", cors());
  app.use("*", secureHeaders());
  app.use("*", compress());

  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.get("/health", (c) =>
    c.json({ status: "ok", ts: new Date().toISOString() }),
  );

  app.route("/api/auth", authRoutes);
  app.route("/api/game", gameRoutes);
  app.route("/api/teacher", teacherRoutes);
  app.route("/api/war", warRoutes);
  app.get("/", serveStatic({ root: "./public", path: "index.html" }));
  app.use("/public/*", serveStatic({ root: "./public" }));

  app.notFound((c) => c.json({ error: "Not Found" }, 404));

  return app;
};
