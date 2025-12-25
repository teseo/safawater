import { getDb } from "../index";

type FetchRunInput = {
  sourceId: string;
  fetchedAt: string;
  status: "success" | "error";
  httpStatus?: number | null;
  errorMessage?: string | null;
  rawHash?: string | null;
};

export function insertFetchRun(run: FetchRunInput) {
  const db = getDb();

  db.prepare(
    `INSERT INTO fetch_runs (
      source_id,
      fetched_at,
      status,
      http_status,
      error_message,
      raw_hash
    ) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    run.sourceId,
    run.fetchedAt,
    run.status,
    run.httpStatus ?? null,
    run.errorMessage ?? null,
    run.rawHash ?? null
  );
}

export function getLatestSuccess(sourceId: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT fetched_at FROM fetch_runs
       WHERE source_id = ? AND status = 'success'
       ORDER BY fetched_at DESC
       LIMIT 1`
    )
    .get(sourceId) as { fetched_at: string } | undefined;

  return row?.fetched_at ?? null;
}
