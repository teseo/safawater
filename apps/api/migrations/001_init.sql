CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fetch_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  status TEXT NOT NULL,
  http_status INTEGER,
  error_message TEXT,
  raw_hash TEXT,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS dam_level_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  dam_name TEXT NOT NULL,
  region TEXT,
  observed_at TEXT NOT NULL,
  level_percent REAL,
  level_raw TEXT,
  last_week_percent REAL,
  last_year_percent REAL,
  extra_json TEXT,
  UNIQUE (source_id, dam_name, observed_at),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

INSERT OR IGNORE INTO sources (id, name, url, active, created_at) VALUES
  ('gauteng_weekly', 'Gauteng Weekly Report', 'https://example.com/gauteng-weekly', 1, datetime('now')),
  ('vaal_weekly', 'Vaal Weekly Report', 'https://example.com/vaal-weekly', 1, datetime('now')),
  ('vaal_realtime', 'Vaal Realtime Feed', 'https://example.com/vaal-realtime', 1, datetime('now'));
