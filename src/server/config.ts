import { z } from "zod/v4";
import dotenv from "dotenv";
dotenv.config();

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be 16+ chars"),
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.string().optional(),
  DB_ENCRYPTION_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("FATAL: Invalid environment:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = parseEnv();
