import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import type { Observation } from "../lib/api/types";
import { formatDate } from "../lib/date";

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

export function LevelChart({ history, loading }: { history: Observation[]; loading: boolean }) {
  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }

  const data = history.map((item) => ({
    observedAt: item.observedAt,
    levelPercent: item.levelPercent
  }));

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
                tickFormatter={formatDate}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value) => formatPercent(value as number)}
                labelFormatter={(label) => formatDate(label)}
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
