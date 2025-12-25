import fastify from "fastify";
import { buildLoggerOptions } from "./plugins/logger";

export function createServer() {
  return fastify({
    logger: buildLoggerOptions()
  });
}
