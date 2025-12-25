import type { Observation } from "../lib/api/types";
import { formatDateTime } from "../lib/date";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

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
  loading
}: {
  history: Observation[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const sorted = [...history].sort((a, b) =>
    b.observedAt.localeCompare(a.observedAt)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Observations</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="text-sm text-mutedForeground">
            No observations available.
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
                    <TableCell>{formatPercent(row.levelPercent)}</TableCell>
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
