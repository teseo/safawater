export type HealthStatus = {
  ok: boolean;
};

export const sharedMessage = "Shared package is wired up";

export type ParsedObservation = {
  sourceId: "gauteng_weekly" | "vaal_weekly" | "vaal_realtime";
  damName: string;
  region?: string;
  observedAt: string;
  levelPercent?: number | null;
  lastWeekPercent?: number | null;
  lastYearPercent?: number | null;
  levelRaw?: string | null;
  extra?: Record<string, unknown>;
};
