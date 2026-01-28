# Mathemagic Touch (IFP)

Interactive math game stack using **Bun + Hono + Drizzle + SQLite**, packaged for **Docker Compose**.

## Quick Start (Docker)

```bash
docker compose up --build
```

Then open:
- App: http://localhost:3000
- Health: http://localhost:3000/health
- Sample API: http://localhost:3000/api/game/questions

## Database (Drizzle)

### Docker

Run migrations inside the container:

```bash
docker compose exec app bunx drizzle-kit generate
docker compose exec app bunx drizzle-kit migrate
```

### Local

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

## Project Structure

```
/ (root)
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
├─ src/
│  ├─ index.ts
│  ├─ server.ts
│  ├─ lib/
│  │  └─ db/
│  │     ├─ index.ts
│  │     └─ schema.ts
│  └─ routes/
│     ├─ auth.ts
│     └─ game.ts
├─ public/
│  └─ index.html
└─ data/          # SQLite file (volume)
```

## Environment

`.env` (local) / `docker-compose.yml` (container):

```
PORT=3000
HOST=0.0.0.0
JWT_SECRET=change-me
DB_PATH=./data/app.db
```

Note: In Docker, environment variables are injected via `docker-compose.yml` (no `dotenv` import).  
Local dev can use `.env` if you install and wire `dotenv`.

## Local Development (non-docker)

```bash
bun install
bun run dev
```

## Notes

- SQLite database lives in `./data/app.db` (mounted into container).
- `/api/game/questions` is a placeholder endpoint to verify server is running.
- `/api/game/answers` is not implemented yet.

## Next Steps

- Implement question generation + persistence
- Implement `/answers` validation
- Add auth flows + WebSocket realtime
