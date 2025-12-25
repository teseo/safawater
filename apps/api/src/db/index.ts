import type Database from "better-sqlite3";
import { openDatabase } from "./connection";
import type { AppConfig } from "../plugins/config";

let dbInstance: Database | null = null;

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
