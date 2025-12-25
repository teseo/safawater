import { getDb } from "../index";

type SourceRow = {
  id: string;
  name: string;
  url: string;
  active: number;
  created_at: string;
};

export function listSources() {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, name, url, active, created_at FROM sources ORDER BY name"
    )
    .all() as SourceRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    active: Boolean(row.active),
    createdAt: row.created_at
  }));
}
