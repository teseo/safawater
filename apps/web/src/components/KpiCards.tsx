import { ArrowDownRight, ArrowUpRight, Droplet } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import type { Observation } from "../lib/api/types";
import { formatDateTime } from "../lib/date";

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
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

export function KpiCards({ latest, loading }: { latest?: Observation; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-32 w-full" />
        ))}
      </div>
    );
  }

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
          <div className="text-3xl font-semibold">
            {formatPercent(latest?.levelPercent)}
          </div>
          <div className="mt-2 text-sm text-mutedForeground">
            {latest?.region ?? "Unknown region"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Observed At</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-semibold">
            {formatDateTime(latest?.observedAt)}
          </div>
          <div className="mt-2 text-sm text-mutedForeground">
            Source: {latest?.sourceId ?? "—"}
          </div>
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
