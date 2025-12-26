import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openDatabase } from "@api/db/connection";
import { loadConfig } from "@api/plugins/config";

const MIGRATIONS_TABLE = "_migrations";

type DatabaseInstance = ReturnType<typeof openDatabase>;

export function runMigrations(db: DatabaseInstance, migrationsPath: string) {
  const absolutePath = path.resolve(process.cwd(), migrationsPath);

  if (!fs.existsSync(absolutePath)) {
    return 0;
  }

  db.exec(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name TEXT PRIMARY KEY,
      run_at TEXT NOT NULL
    )`
  );

  const appliedRows = db.prepare(`SELECT name FROM ${MIGRATIONS_TABLE}`).all() as Array<{
    name: string;
  }>;
  const applied = new Set(appliedRows.map((row) => row.name));

  const files = fs
    .readdirSync(absolutePath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  let ran = 0;

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(absolutePath, file), "utf8");
    db.exec(sql);

    db.prepare(`INSERT INTO ${MIGRATIONS_TABLE} (name, run_at) VALUES (?, ?)`).run(
      file,
      new Date().toISOString()
    );

    ran += 1;
  }

  return ran;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = loadConfig();
  const db = openDatabase(config.dbPath);
  const count = runMigrations(db, config.migrationsPath);
  console.log(`Migrations applied: ${count}`);
}
