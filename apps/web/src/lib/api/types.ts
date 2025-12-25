export type Source = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  createdAt: string;
};

export type Observation = {
  id: number;
  sourceId: string;
  damName: string;
  region: string | null;
  observedAt: string;
  levelPercent: number | null;
  levelRaw: string | null;
  lastWeekPercent: number | null;
  lastYearPercent: number | null;
  extraJson: string | null;
};

export type LatestResponse = Observation;
export type HistoryResponse = Observation[];
export type DamName = string;
