import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import express from "express";
import type { Express } from "express";

export function applySecurityMiddleware(app: Express) {
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV !== "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
                imgSrc: ["'self'", "data:", "blob:"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
              },
            }
          : {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
              },
            },
    })
  );
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
        : ["http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "test" ? 5000 : 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "test" ? 1000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  const esignGetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many signing link requests, please try again later" },
  });
  const esignSignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many signing attempts, please try again later" },
  });

  return { esignGetLimiter, esignSignLimiter };
}
