import { ArrowDownRight, ArrowUpRight, Droplet } from "lucide-react";
import { Badge } from "@web/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Skeleton } from "@web/components/ui/skeleton";
import type { Observation } from "@web/lib/api/types";
import { formatDateTime } from "@web/lib/date";

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

function parseExtra(extraJson?: string | null) {
  if (!extraJson) {
    return null;
  }
  try {
    return JSON.parse(extraJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "—";
}

function DeltaBadge({ label, value }: { label: string; value?: number | null }) {
  if (value === null || value === undefined) {
    return <Badge variant="outline">{label}: —</Badge>;
  }

  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const color = positive ? "text-emerald-600" : "text-rose-500";

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${color}`} />
      {label}: {value.toFixed(1)}%
    </Badge>
  );
}

export function KpiCards({
  latest,
  loading,
  fallback,
  resolution
}: {
  latest?: Observation;
  loading: boolean;
  fallback?: boolean;
  resolution: "realtime" | "weekly";
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const aboveFsl = resolution === "realtime" && (latest?.levelPercent ?? 0) > 100;
  const extra = parseExtra(latest?.extraJson ?? null);
  const inflow = extractNumber(extra?.Inflow ?? extra?.inflow ?? extra?.inflowCumec);
  const outflow = extractNumber(extra?.Outflow ?? extra?.outflow ?? extra?.outflowCumec);
  const gates = formatValue(extra?.["Gates Open"] ?? extra?.gatesOpen ?? extra?.gates);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            Latest Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{formatPercent(latest?.levelPercent)}</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-mutedForeground">
            <span>{latest?.region ?? "Unknown region"}</span>
            {fallback ? <Badge variant="outline">fallback</Badge> : null}
            {aboveFsl ? <Badge className="bg-amber-500 text-white">Above FSL</Badge> : null}
          </div>
          {aboveFsl ? (
            <div className="mt-2 text-xs text-amber-700">
              Above Full Supply Level — spill/flood conditions
            </div>
          ) : null}
          {resolution === "realtime" ? (
            <div className="mt-3 grid gap-1 text-xs text-mutedForeground">
              <div>Gates open: {gates}</div>
              <div>Inflow: {inflow ?? "—"} cumec</div>
              <div>Outflow: {outflow ?? "—"} cumec</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Observed At</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-semibold">{formatDateTime(latest?.observedAt)}</div>
          <div className="mt-2 text-sm text-mutedForeground">Source: {latest?.sourceId ?? "—"}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Week over week</CardTitle>
        </CardHeader>
        <CardContent>
          <DeltaBadge
            label="Delta"
            value={
              latest?.levelPercent !== null &&
              latest?.levelPercent !== undefined &&
              latest?.lastWeekPercent !== null &&
              latest?.lastWeekPercent !== undefined
                ? latest.levelPercent - latest.lastWeekPercent
                : null
            }
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Year over year</CardTitle>
        </CardHeader>
        <CardContent>
          <DeltaBadge
            label="Delta"
            value={
              latest?.levelPercent !== null &&
              latest?.levelPercent !== undefined &&
              latest?.lastYearPercent !== null &&
              latest?.lastYearPercent !== undefined
                ? latest.levelPercent - latest.lastYearPercent
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
