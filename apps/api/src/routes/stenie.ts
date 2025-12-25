import type { FastifyInstance } from "fastify";
import type { HealthStatus } from "@shared";

export function registerStenieRoutes(app: FastifyInstance) {
    app.get("/stenie", async () => {
        const response: HealthStatus = { "stenie": "Good people" };
        return response;
    });
}
