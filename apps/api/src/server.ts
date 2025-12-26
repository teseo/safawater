import fastify from "fastify";
import { buildLoggerOptions } from "@api/plugins/logger";

export function createServer() {
  return fastify({
    logger: buildLoggerOptions()
  });
}
