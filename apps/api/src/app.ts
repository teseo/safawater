import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerConfig } from "@api/plugins/config";
import { registerErrorHandlers } from "@api/plugins/error-handler";
import { registerDamRoutes } from "@api/routes/dams";
import { registerDevRoutes } from "@api/routes/dev";
import { registerHealthRoutes } from "@api/routes/health";
import { registerMetaRoutes } from "@api/routes/meta";
import { registerBackfillRoutes } from "@api/routes/backfill";
import { registerRefreshRoutes } from "@api/routes/refresh";
import { registerSourcesRoutes } from "@api/routes/sources";
import { registerStenieRoutes } from "@api/routes/stenie";

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
  registerBackfillRoutes(app);
  registerRefreshRoutes(app);
  registerStenieRoutes(app);

  if (app.config.env !== "production") {
    registerDevRoutes(app);
  }

  return app;
}
