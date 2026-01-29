import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  driver: "better-sqlite",
  dbCredentials: {
    url: process.env.DB_PATH || "./data/app.db",
  },
} satisfies Config;
