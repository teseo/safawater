import { openDatabase } from "@api/db/connection";
import type { AppConfig } from "@api/plugins/config";

type DatabaseInstance = ReturnType<typeof openDatabase>;

let dbInstance: DatabaseInstance | null = null;

export function initDatabase(config: AppConfig) {
  if (!dbInstance) {
    dbInstance = openDatabase(config.dbPath);
  }

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database has not been initialized");
  }

  return dbInstance;
}
