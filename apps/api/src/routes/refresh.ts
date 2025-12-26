import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  scrapeGautengWeekly,
  scrapeVaalRealtime,
  scrapeVaalWeekly,
  SOURCE_IDS
} from "@api/services/dws/scrape";

const bodySchema = z.object({
  sources: z.array(z.enum(SOURCE_IDS)).optional(),
  force: z.boolean().optional()
});

type RefreshResult = {
  fetched: boolean;
  skippedByTtl: boolean;
  observations: number;
  error?: string;
};

export function registerRefreshRoutes(app: FastifyInstance) {
  app.post("/refresh", async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      reply.status(400).send({
        error: {
          message: "Invalid request body",
          code: "BAD_REQUEST",
          requestId: request.id
        }
      });
      return;
    }

    const sources = parsed.data.sources ?? SOURCE_IDS;
    const force = parsed.data.force ?? false;
    const results: Record<string, RefreshResult> = {};

    for (const sourceId of sources) {
      let result: RefreshResult;

      switch (sourceId) {
        case "gauteng_weekly":
          result = await scrapeGautengWeekly(app.config.cacheTtlSeconds, force);
          break;
        case "vaal_weekly":
          result = await scrapeVaalWeekly(app.config.cacheTtlSeconds, force);
          break;
        case "vaal_realtime":
          result = await scrapeVaalRealtime(app.config.cacheTtlSeconds, force);
          break;
        default:
          result = {
            fetched: false,
            skippedByTtl: false,
            observations: 0,
            error: "Unknown source"
          };
          break;
      }

      results[sourceId] = result;
      app.log.info({ sourceId, result }, "Scrape result");
    }

    return {
      ok: true,
      results
    };
  });
}
