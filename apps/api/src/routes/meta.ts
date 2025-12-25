import type { FastifyInstance } from "fastify";

type MetaResponse = {
  version: string;
  uptimeSeconds: number;
  env: string;
};

export function registerMetaRoutes(app: FastifyInstance) {
  app.get("/meta", async () => {
    const response: MetaResponse = {
      version: process.env.npm_package_version ?? "0.0.0",
      uptimeSeconds: Math.floor(process.uptime()),
      env: app.config.env
    };

    return response;
  });
}
