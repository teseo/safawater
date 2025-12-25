import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export function openDatabase(dbPath: string) {
  const absolutePath = path.resolve(process.cwd(), dbPath);
  const dir = path.dirname(absolutePath);

  fs.mkdirSync(dir, { recursive: true });

  const db = new Database(absolutePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
}
