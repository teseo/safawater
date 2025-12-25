import { getDb } from "../index";

export type ObservationInput = {
  sourceId: string;
  damName: string;
  region?: string | null;
  observedAt: string;
  levelPercent?: number | null;
  levelRaw?: string | null;
  lastWeekPercent?: number | null;
  lastYearPercent?: number | null;
  extraJson?: string | null;
};

export function upsertObservation(observation: ObservationInput) {
  const db = getDb();

  const statement = db.prepare(
    `INSERT INTO dam_level_observations (
      source_id,
      dam_name,
      region,
      observed_at,
      level_percent,
      level_raw,
      last_week_percent,
      last_year_percent,
      extra_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id, dam_name, observed_at) DO UPDATE SET
      region = excluded.region,
      level_percent = excluded.level_percent,
      level_raw = excluded.level_raw,
      last_week_percent = excluded.last_week_percent,
      last_year_percent = excluded.last_year_percent,
      extra_json = excluded.extra_json`
  );

  const result = statement.run(
    observation.sourceId,
    observation.damName,
    observation.region ?? null,
    observation.observedAt,
    observation.levelPercent ?? null,
    observation.levelRaw ?? null,
    observation.lastWeekPercent ?? null,
    observation.lastYearPercent ?? null,
    observation.extraJson ?? null
  );

  return result.changes;
}

type ObservationRow = {
  id: number;
  source_id: string;
  dam_name: string;
  region: string | null;
  observed_at: string;
  level_percent: number | null;
  level_raw: string | null;
  last_week_percent: number | null;
  last_year_percent: number | null;
  extra_json: string | null;
};

function mapObservation(row: ObservationRow) {
  return {
    id: row.id,
    sourceId: row.source_id,
    damName: row.dam_name,
    region: row.region,
    observedAt: row.observed_at,
    levelPercent: row.level_percent,
    levelRaw: row.level_raw,
    lastWeekPercent: row.last_week_percent,
    lastYearPercent: row.last_year_percent,
    extraJson: row.extra_json
  };
}

export function getLatestByDam(damName: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM dam_level_observations
       WHERE dam_name = ?
       ORDER BY observed_at DESC
       LIMIT 1`
    )
    .get(damName) as ObservationRow | undefined;

  return row ? mapObservation(row) : null;
}

export function getHistoryByDam(
  damName: string,
  from?: string,
  to?: string,
  limit = 500
) {
  const db = getDb();

  const clauses: string[] = ["dam_name = ?"];
  const params: Array<string | number> = [damName];

  if (from) {
    clauses.push("observed_at >= ?");
    params.push(from);
  }

  if (to) {
    clauses.push("observed_at <= ?");
    params.push(to);
  }

  params.push(limit);

  const sql = `SELECT * FROM dam_level_observations
    WHERE ${clauses.join(" AND ")}
    ORDER BY observed_at ASC
    LIMIT ?`;

  const rows = db.prepare(sql).all(...params) as ObservationRow[];
  return rows.map(mapObservation);
}

export function listDamNames() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT dam_name AS damName
       FROM dam_level_observations
       ORDER BY dam_name ASC`
    )
    .all() as Array<{ damName: string }>;

  return rows.map((row) => row.damName);
}
