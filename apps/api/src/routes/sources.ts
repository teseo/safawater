import type { FastifyInstance } from "fastify";
import { listSources } from "../db/dao/sources";

export function registerSourcesRoutes(app: FastifyInstance) {
  app.get("/sources", async () => listSources());
}
