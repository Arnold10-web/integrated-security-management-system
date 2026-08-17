FROM oven/bun:1.3.14-slim

WORKDIR /app

# Install deps — no --frozen-lockfile so stale bun.lock doesn't block Railway whole-repo deploy
# Copy only Bun files (ignore package-lock.json to avoid npm/bun conflict)
COPY package.json bun.lock* bun.lockb* ./
COPY prisma ./prisma
RUN bun install

# Generate Prisma Client (uses @prisma/adapter-pg)
RUN bunx prisma generate

# Copy rest of repo and build
COPY . .
RUN bun run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
# Railway injects PORT and DATABASE_URL at runtime; 0.0.0.0 is already in server.ts: app.listen(PORT, "0.0.0.0")
# Migrate at runtime (DATABASE_URL not known at build) then start
CMD ["sh", "-c", "bunx prisma migrate deploy && bun start"]
