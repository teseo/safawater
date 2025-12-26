import * as React from "react";
import { Droplet, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { DamControls } from "@web/components/DamControls";
import { KpiCards } from "@web/components/KpiCards";
import { LevelChart } from "@web/components/LevelChart";
import { ObservationsTable } from "@web/components/ObservationsTable";
import { Badge } from "@web/components/ui/badge";
import { Button } from "@web/components/ui/button";
import { Card } from "@web/components/ui/card";
import { Separator } from "@web/components/ui/separator";
import {
  useBackfill,
  useDamNames,
  useHealth,
  useHistory,
  useLatest,
  useRefresh,
  useSources
} from "@web/lib/api/hooks";
import { daysAgo, toDateInput } from "@web/lib/date";

const SOURCE_IDS = ["gauteng_weekly", "vaal_weekly", "vaal_realtime"];

function useTheme() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
  };

  return { theme, toggle };
}

export function Dashboard() {
  const { data: dams = [], isLoading: damsLoading } = useDamNames();
  const { data: sources } = useSources();
  const { data: health, isError: healthError } = useHealth();

  const [selectedDam, setSelectedDam] = React.useState<string | undefined>();
  const [from, setFrom] = React.useState(() => toDateInput(daysAgo(90)));
  const [to, setTo] = React.useState(() => toDateInput(new Date()));
  const [limit, setLimit] = React.useState(200);
  const [forceRefresh, setForceRefresh] = React.useState(false);
  const [resolution, setResolution] = React.useState<"realtime" | "weekly">("realtime");
  const [weeklyPreset, setWeeklyPreset] = React.useState<"month" | "year">("month");
  const [compareIvrs, setCompareIvrs] = React.useState(false);
  const refreshMutation = useRefresh();
  const backfillMutation = useBackfill();
  const latestRealtimeQuery = useLatest(selectedDam, "realtime");
  const latestWeeklyQuery = useLatest(selectedDam, "weekly");
  const ivrsLatestQuery = useLatest("IVRS System Storage", "weekly");
  const latestQuery = resolution === "realtime" ? latestRealtimeQuery : latestWeeklyQuery;
  const historyQuery = useHistory(selectedDam, {
    from,
    to,
    limit,
    resolution
  });
  const ivrsHistoryQuery = useHistory(
    "IVRS System Storage",
    {
      from: toDateInput(daysAgo(365)),
      to: toDateInput(new Date()),
      limit: 500,
      resolution: "weekly"
    },
    {
      enabled: compareIvrs && resolution === "realtime"
    }
  );
  const { theme, toggle } = useTheme();
  const autoSelectedWeekly = React.useRef(false);

  const damOptions = React.useMemo(() => {
    const list = new Set(dams);
    if (sources?.some((source) => source.id === "gauteng_dashboard_pdf")) {
      list.add("IVRS System Storage");
    }
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [dams, sources]);

  React.useEffect(() => {
    if (!selectedDam && damOptions.length > 0) {
      const preferred = damOptions.find((dam) => dam.toLowerCase().includes("vaal"));
      setSelectedDam(preferred ?? damOptions[0]);
    }
  }, [damOptions, selectedDam]);

  const handlePreset = (preset: "realtime" | "month" | "year") => {
    if (preset === "realtime") {
      setResolution("realtime");
      setFrom(toDateInput(daysAgo(7)));
      setTo(toDateInput(new Date()));
      autoSelectedWeekly.current = false;
      return;
    }

    setResolution("weekly");
    setWeeklyPreset(preset);
    setFrom(toDateInput(daysAgo(preset === "month" ? 30 : 365)));
    setTo(toDateInput(new Date()));
    if (preset === "year") {
      setLimit(500);
    }
    setCompareIvrs(false);
  };

  const refresh = async () => {
    try {
      const result = await refreshMutation.mutateAsync({
        force: forceRefresh,
        sources: SOURCE_IDS
      });

      toast.success("Refresh complete", {
        description: Object.entries(result.results)
          .map(([key, value]) => {
            const obs = (value as { observations?: number }).observations ?? 0;
            return `${key}: ${obs} obs`;
          })
          .join(" · ")
      });
    } catch (error) {
      toast.error("Refresh failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const backfill = async () => {
    try {
      const preset = weeklyPreset === "year" ? "year" : "month";
      const startedAt = performance.now();
      const result = await backfillMutation.mutateAsync({
        preset,
        force: false
      });
      const durationMs = Math.round(performance.now() - startedAt);
      const errorList = result.errors?.slice(0, 2) ?? [];
      const errorText = errorList
        .map((entry) => entry.message)
        .filter(Boolean)
        .join(" · ");
      toast.success("Backfill complete", {
        description: [
          `${result.downloaded ?? 0} downloaded`,
          `${result.parsed ?? 0} parsed`,
          `${result.inserted ?? 0} inserted`,
          `${durationMs}ms`,
          errorText ? `Errors: ${errorText}` : ""
        ]
          .filter(Boolean)
          .join(" · ")
      });
    } catch (error) {
      toast.error("Backfill failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const apiOnline = Boolean(health?.ok) && !healthError;
  const fallbackLatest =
    resolution === "realtime" && !latestRealtimeQuery.data && latestWeeklyQuery.data;
  const latestData = latestQuery.data ?? latestWeeklyQuery.data;
  const validHistory = (historyQuery.data ?? []).filter((item) => {
    if (item.levelPercent === null || item.levelPercent === undefined) {
      return false;
    }
    if (item.levelPercent < 0) {
      return false;
    }
    if (resolution === "realtime") {
      return true;
    }
    return item.levelPercent <= 100;
  });
  const showBackfillBanner =
    resolution === "weekly" && validHistory.length < 10 && !historyQuery.isLoading;
  const ivrsHistory = (ivrsHistoryQuery.data ?? []).filter((item) => {
    if (item.levelPercent === null || item.levelPercent === undefined) {
      return false;
    }
    return item.levelPercent >= 0 && item.levelPercent <= 100;
  });
  const compareEnabled = resolution === "realtime" && selectedDam === "Vaal Dam";
  const invalidCount = (historyQuery.data?.length ?? 0) - validHistory.length;
  const hasWeeklyData = resolution === "weekly" && validHistory.length > 0;

  React.useEffect(() => {
    if (
      resolution === "weekly" &&
      !autoSelectedWeekly.current &&
      selectedDam &&
      validHistory.length === 0 &&
      damOptions.includes("IVRS System Storage")
    ) {
      setSelectedDam("IVRS System Storage");
      autoSelectedWeekly.current = true;
    }
  }, [resolution, selectedDam, validHistory.length, damOptions]);

  React.useEffect(() => {
    if (!compareEnabled && compareIvrs) {
      setCompareIvrs(false);
    }
  }, [compareEnabled, compareIvrs]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Droplet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">SA Water Dashboard</p>
              <p className="text-sm text-mutedForeground">Real-time DWS monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={apiOnline ? "default" : "outline"}>
              {apiOnline ? "API Online" : "API Offline"}
            </Badge>
            <Button variant="secondary" size="icon" onClick={toggle}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <DamControls
            dams={damOptions}
            selectedDam={selectedDam}
            onSelectDam={setSelectedDam}
            resolution={resolution}
            weeklyPreset={weeklyPreset}
            onSelectPreset={handlePreset}
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            forceRefresh={forceRefresh}
            onForceRefreshChange={setForceRefresh}
            limit={limit}
            onLimitChange={setLimit}
            onRefresh={refresh}
            refreshing={refreshMutation.isPending}
            onBackfill={backfill}
            backfilling={backfillMutation.isPending}
            compareEnabled={compareEnabled}
            compareChecked={compareIvrs}
            onCompareChange={setCompareIvrs}
          />

          <Card className="p-6">
            <p className="text-sm text-mutedForeground">Sources tracked</p>
            <div className="mt-3 space-y-2">
              {sources?.map((source) => (
                <div key={source.id} className="flex items-center justify-between text-sm">
                  <span>{source.name}</span>
                  <Badge variant="outline">{source.id}</Badge>
                </div>
              ))}
              {(!sources || sources.length === 0) && (
                <div className="text-sm text-mutedForeground">No sources loaded.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {!apiOnline ? (
            <Card className="border-rose-200 bg-rose-50 p-6 text-rose-900">
              Backend not reachable — ensure the API is running on port 3000.
            </Card>
          ) : null}

          <KpiCards
            latest={latestData}
            loading={latestQuery.isLoading}
            fallback={Boolean(fallbackLatest)}
            resolution={resolution}
          />

          {showBackfillBanner ? (
            <Card className="border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Not enough weekly history for this range. Click Backfill to fetch historical PDFs.
                </span>
                <Button
                  variant="secondary"
                  onClick={backfill}
                  disabled={backfillMutation.isPending}
                >
                  Backfill history
                </Button>
              </div>
            </Card>
          ) : null}

          {invalidCount > 0 ? (
            <div className="text-xs text-mutedForeground">
              <Badge variant="outline">Some points excluded</Badge>
            </div>
          ) : null}

          <LevelChart
            history={validHistory}
            loading={historyQuery.isLoading}
            resolution={resolution}
          />

          {compareIvrs && resolution === "realtime" ? (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">IVRS weekly system storage (1Y)</p>
                  <p className="text-xs text-mutedForeground">
                    IVRS is the broader system storage; Vaal Dam is one component. Weekly data is
                    lower frequency.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-2 text-right">
                  <div className="text-lg font-semibold">
                    {ivrsLatestQuery.data?.levelPercent?.toFixed(1) ?? "—"}%
                  </div>
                  <div className="text-xs text-mutedForeground">
                    {ivrsLatestQuery.data?.observedAt ?? "—"}
                  </div>
                </div>
              </div>
              <LevelChart
                history={ivrsHistory}
                loading={ivrsHistoryQuery.isLoading}
                resolution="weekly"
              />
            </Card>
          ) : null}

          <Separator />

          <ObservationsTable
            history={validHistory}
            loading={historyQuery.isLoading}
            emptyLabel={
              resolution === "weekly" && !hasWeeklyData
                ? "No weekly observations yet — run Backfill."
                : "No observations available."
            }
            resolution={resolution}
          />

          {damsLoading ? null : damOptions.length === 0 ? (
            <div className="text-sm text-mutedForeground">
              No dams available yet — run Refresh to populate data.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
