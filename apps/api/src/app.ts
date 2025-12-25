import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerConfig } from "./plugins/config";
import { registerErrorHandlers } from "./plugins/error-handler";
import { registerDamRoutes } from "./routes/dams";
import { registerDevRoutes } from "./routes/dev";
import { registerHealthRoutes } from "./routes/health";
import { registerMetaRoutes } from "./routes/meta";
import { registerSourcesRoutes } from "./routes/sources";
import { registerStenieRoutes } from "./routes/stenie";

export async function buildApp(app: FastifyInstance) {
  await registerConfig(app);

  await app.register(cors, {
    origin: app.config.corsOrigin
  });

  registerErrorHandlers(app);
  registerHealthRoutes(app);
  registerMetaRoutes(app);
  registerSourcesRoutes(app);
  registerDamRoutes(app);
  registerStenieRoutes(app);

  if (app.config.env !== "production") {
    registerDevRoutes(app);
  }

  return app;
}
