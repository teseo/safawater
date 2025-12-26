import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Skeleton } from "@web/components/ui/skeleton";
import type { Observation } from "@web/lib/api/types";
import { formatDate, formatDateTime } from "@web/lib/date";

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

export function LevelChart({
  history,
  loading,
  resolution
}: {
  history: Observation[];
  loading: boolean;
  resolution: "realtime" | "weekly";
}) {
  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }

  const data = history.map((item) => ({
    observedAt: item.observedAt,
    levelPercent: item.levelPercent,
    extra: parseExtra(item.extraJson)
  }));

  const values = data
    .map((item) => item.levelPercent)
    .filter((value): value is number => value !== null && value !== undefined);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const yMin = Math.max(0, minValue - 2);
  const yMax = maxValue + 2;

  const labelFormatter = (label: string) =>
    resolution === "realtime" ? formatDateTime(label) : formatDate(label);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Levels over time</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-mutedForeground">
            No observations yet — hit Refresh.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 22% 86%)" />
              <XAxis
                dataKey="observedAt"
                tickFormatter={(value) =>
                  resolution === "realtime" ? formatDateTime(value) : formatDate(value)
                }
                minTickGap={24}
              />
              <YAxis tickFormatter={(value) => `${value}%`} domain={[yMin, yMax]} />
              {resolution === "realtime" ? (
                <ReferenceLine
                  y={100}
                  stroke="hsl(40 90% 45%)"
                  strokeDasharray="4 4"
                  label={{
                    value: "FSL (100%)",
                    fill: "hsl(40 90% 45%)",
                    position: "insideTopRight"
                  }}
                />
              ) : null}
              <Tooltip
                labelFormatter={labelFormatter}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }
                  const point = payload[0].payload as {
                    levelPercent?: number;
                    extra?: Record<string, unknown>;
                  };
                  const inflow = extractNumber(
                    point.extra?.Inflow ?? point.extra?.inflow ?? point.extra?.inflowCumec
                  );
                  const outflow = extractNumber(
                    point.extra?.Outflow ?? point.extra?.outflow ?? point.extra?.outflowCumec
                  );
                  const gates = formatValue(
                    point.extra?.["Gates Open"] ?? point.extra?.gatesOpen ?? point.extra?.gates
                  );

                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow">
                      <div className="font-medium">{labelFormatter(String(label))}</div>
                      <div className="mt-1">
                        {formatPercent(point.levelPercent ?? null)}
                        {resolution === "realtime" && (point.levelPercent ?? 0) > 100
                          ? " (Above FSL)"
                          : ""}
                      </div>
                      {resolution === "realtime" ? (
                        <div className="mt-1 text-mutedForeground">
                          <div>Gates: {gates}</div>
                          <div>Inflow: {inflow ?? "—"} cumec</div>
                          <div>Outflow: {outflow ?? "—"} cumec</div>
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="levelPercent"
                stroke="hsl(200 84% 42%)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
