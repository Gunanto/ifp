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

## Progress (as of Jan 29, 2026)

- Local Bun runtime installed and project dependencies installed.
- Drizzle config fixed for SQLite (`dialect` + `driver`) and migrations generated.
- SQLite driver (`better-sqlite3`) added for migrations.
- Database migration applied to local `./data/app.db`.
- Static root `/` now serves `public/index.html` via Hono Bun `serveStatic`.
- Teacher auth + CRUD UI built (questions, classes, sessions).
- Game mode "War" (Perang) multiplayer implemented with leaderboard, audio, and effects.

## Important Notes

- `.bashrc` on this machine returns early for non-interactive shells, so Bun PATH in `.bashrc` is not loaded in non-interactive runs. Use:
  - `export BUN_INSTALL="$HOME/.bun"; export PATH="$BUN_INSTALL/bin:$PATH"`
- Root route `/` is now implemented; API routes still live under `/api/*`.
- `data/app.db` was recreated to fix readonly permissions (previous file owned by root).
- Teacher auth now uses JWT; `/api/teacher/*` requires a Bearer token.

## Notes

- SQLite database lives in `./data/app.db` (mounted into container).
- `/api/game/questions` is a placeholder endpoint to verify server is running.
- `/api/game/answers` is not implemented yet.

## UI Routes

- Home: http://localhost:6200/
- Teacher Login: http://localhost:6200/teacher/login
- Teacher CRUD:
  - Questions: /teacher/questions
  - Classes: /teacher/classes
  - Sessions: /teacher/sessions
- War Mode: http://localhost:6200/war

## API (selected)

- Auth:
  - POST /api/auth/register-teacher
  - POST /api/auth/login
  - GET /api/auth/me
- Teacher CRUD (requires Bearer token):
  - /api/teacher/questions
  - /api/teacher/classes
  - /api/teacher/sessions
- War Mode:
  - POST /api/war/rooms
  - POST /api/war/rooms/:code/join
  - GET /api/war/rooms/:code
  - POST /api/war/answer
  - GET /api/war/leaderboard?period=all|daily|weekly&scope=global|room&room=CODE

## Next Steps

- Implement question generation + persistence
- Implement `/answers` validation
- Add auth flows + WebSocket realtime
