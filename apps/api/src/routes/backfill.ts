import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { backfillWeeklyHistory } from "@api/services/dws/backfill-dashboard-pdf";

const bodySchema = z.object({
  preset: z.enum(["month", "year"]),
  force: z.boolean().optional()
});

let backfillRunning = false;

export function registerBackfillRoutes(app: FastifyInstance) {
  app.post("/backfill", async (request, reply) => {
    if (backfillRunning) {
      reply.status(409).send({
        error: {
          message: "Backfill already running",
          code: "BACKFILL_RUNNING",
          requestId: request.id
        }
      });
      return;
    }

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

    backfillRunning = true;
    try {
      const summary = await backfillWeeklyHistory(parsed.data.preset, parsed.data.force ?? false);

      return {
        ok: true,
        ...summary
      };
    } finally {
      backfillRunning = false;
    }
  });
}
