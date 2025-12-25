import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getHistoryByDam, getLatestByDam, listDamNames } from "../db/dao/observations";

const historyQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

const datePattern = /^\d{4}-\d{2}-\d{2}/;

function isValidDate(value?: string) {
  if (!value) {
    return true;
  }

  return datePattern.test(value);
}

export function registerDamRoutes(app: FastifyInstance) {
  app.get("/dams", async () => listDamNames());

  app.get("/dams/:damName/latest", async (request, reply) => {
    const { damName } = request.params as { damName: string };
    const result = getLatestByDam(damName);

    if (!result) {
      reply.status(404).send({
        error: {
          message: "No observations found",
          code: "NOT_FOUND",
          requestId: request.id
        }
      });
      return;
    }

    return result;
  });

  app.get("/dams/:damName/history", async (request, reply) => {
    const { damName } = request.params as { damName: string };
    const parsed = historyQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      reply.status(400).send({
        error: {
          message: "Invalid query parameters",
          code: "BAD_REQUEST",
          requestId: request.id
        }
      });
      return;
    }

    const { from, to, limit } = parsed.data;

    if (!isValidDate(from) || !isValidDate(to)) {
      reply.status(400).send({
        error: {
          message: "from/to must be YYYY-MM-DD",
          code: "BAD_REQUEST",
          requestId: request.id
        }
      });
      return;
    }

    const results = getHistoryByDam(damName, from, to, limit ?? 500);
    return results;
  });
}
