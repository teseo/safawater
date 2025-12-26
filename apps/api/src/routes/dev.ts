import type { FastifyInstance } from "fastify";
import { upsertObservation } from "@api/db/dao/observations";

export function registerDevRoutes(app: FastifyInstance) {
  app.post("/__dev/seed", async () => {
    const today = new Date().toISOString().slice(0, 10);

    upsertObservation({
      sourceId: "vaal_realtime",
      damName: "Vaal Dam",
      region: "Vaal",
      observedAt: today,
      levelPercent: 42.5,
      levelRaw: "42.5%"
    });

    return { ok: true };
  });
}
