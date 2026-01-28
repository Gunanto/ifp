import { Hono } from "hono";

const app = new Hono();

app.get("/ping", (c) => c.json({ ok: true }));

export default app;
