FROM oven/bun:1.1.0

WORKDIR /app

COPY package.json tsconfig.json bunfig.toml drizzle.config.ts ./
RUN bun install

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/index.ts"]
