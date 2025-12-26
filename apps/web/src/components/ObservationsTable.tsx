import type { Observation } from "@web/lib/api/types";
import { formatDateTime } from "@web/lib/date";
import { Badge } from "@web/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Skeleton } from "@web/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@web/components/ui/table";

function safeParseExtra(extraJson: string | null) {
  if (!extraJson) {
    return null;
  }

  try {
    return JSON.parse(extraJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

export function ObservationsTable({
  history,
  loading,
  emptyLabel,
  resolution
}: {
  history: Observation[];
  loading: boolean;
  emptyLabel?: string;
  resolution?: "realtime" | "weekly";
}) {
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const sorted = [...history].sort((a, b) => b.observedAt.localeCompare(a.observedAt));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Observations</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="text-sm text-mutedForeground">
            {emptyLabel ?? "No observations available."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Observed</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Last Week</TableHead>
                <TableHead>Last Year</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Extra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => {
                const extra = safeParseExtra(row.extraJson);
                const extraKeys = extra ? Object.keys(extra).slice(0, 2) : [];

                return (
                  <TableRow key={`${row.id}-${row.observedAt}`}>
                    <TableCell>{formatDateTime(row.observedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{formatPercent(row.levelPercent)}</span>
                        {resolution === "realtime" && (row.levelPercent ?? 0) > 100 ? (
                          <Badge className="bg-amber-500 text-white">Above FSL</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatPercent(row.lastWeekPercent)}</TableCell>
                    <TableCell>{formatPercent(row.lastYearPercent)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.sourceId}</Badge>
                    </TableCell>
                    <TableCell>{row.region ?? "—"}</TableCell>
                    <TableCell className="text-xs text-mutedForeground">
                      {extraKeys.length > 0 ? extraKeys.join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
