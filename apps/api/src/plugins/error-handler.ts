import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export function registerErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        message: "Route not found",
        code: "NOT_FOUND",
        requestId: request.id
      }
    });
  });

  app.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;
    const code = error.code ?? "INTERNAL_SERVER_ERROR";

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Unhandled error");
    }

    reply.status(statusCode).send({
      error: {
        message: error.message,
        code,
        requestId: request.id
      }
    });
  });
}
