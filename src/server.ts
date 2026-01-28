import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";

import { db } from "./lib/db";
import authRoutes from "./routes/auth";
import gameRoutes from "./routes/game";

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

  app.get("/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

  app.route("/api/auth", authRoutes);
  app.route("/api/game", gameRoutes);

  app.notFound((c) => c.json({ error: "Not Found" }, 404));

  return app;
};
