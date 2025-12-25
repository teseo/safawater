import { z } from "zod";
import type { FastifyInstance } from "fastify";

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DB_PATH: z.string().default("data/app.db"),
  DB_MIGRATIONS_PATH: z.string().default("migrations"),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(21600)
});

export type AppConfig = {
  port: number;
  env: "development" | "test" | "production";
  corsOrigin: string;
  dbPath: string;
  migrationsPath: string;
  cacheTtlSeconds: number;
};

export function loadConfig(): AppConfig {
  const parsed = configSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return {
    port: parsed.data.PORT,
    env: parsed.data.NODE_ENV,
    corsOrigin: parsed.data.CORS_ORIGIN,
    dbPath: parsed.data.DB_PATH,
    migrationsPath: parsed.data.DB_MIGRATIONS_PATH,
    cacheTtlSeconds: parsed.data.CACHE_TTL_SECONDS
  };
}

export async function registerConfig(app: FastifyInstance) {
  app.decorate("config", loadConfig());
}

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
  }
}
