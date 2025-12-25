import type { FastifyInstance } from "fastify";
import type { HealthStatus } from "@shared";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const response: HealthStatus = { ok: true };
    return response;
  });
}
