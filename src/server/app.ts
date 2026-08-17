import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySecurityMiddleware } from "./middleware/security.ts";
import cookieParser from "cookie-parser";

export function createApp(prisma: PrismaClient) {
  const app = express();
  app.use(cookieParser());
  applySecurityMiddleware(app);
  // Healthz is public
  app.get("/healthz", (_req, res) => res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }));
  return app;
}

export function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}
