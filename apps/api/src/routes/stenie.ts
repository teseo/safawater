import type { FastifyInstance } from "fastify";

type StenieResponse = {
  type: string;
  message: string;
};
export function registerStenieRoutes(app: FastifyInstance) {
  app.get("/stenie", async () => {
    const response: StenieResponse = { type: "stenie", message: "Good people" };
    return response;
  });
}
