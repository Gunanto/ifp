import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const dbPath = process.env.DB_PATH || "./data/app.db";
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
