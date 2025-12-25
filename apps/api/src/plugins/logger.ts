import type { FastifyLoggerOptions } from "fastify";

export function buildLoggerOptions(): FastifyLoggerOptions {
  return {
    level: process.env.NODE_ENV === "production" ? "info" : "debug"
  };
}
