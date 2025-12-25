import * as React from "react";
import { Droplet, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { DamControls } from "../components/DamControls";
import { KpiCards } from "../components/KpiCards";
import { LevelChart } from "../components/LevelChart";
import { ObservationsTable } from "../components/ObservationsTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useDamNames, useHealth, useHistory, useLatest, useRefresh, useSources } from "../lib/api/hooks";
import { daysAgo, toDateInput } from "../lib/date";

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
  const refreshMutation = useRefresh();
  const latestQuery = useLatest(selectedDam);
  const historyQuery = useHistory(selectedDam, { from, to, limit });
  const { theme, toggle } = useTheme();

  React.useEffect(() => {
    if (!selectedDam && dams.length > 0) {
      const preferred = dams.find((dam) => dam.toLowerCase().includes("vaal"));
      setSelectedDam(preferred ?? dams[0]);
    }
  }, [dams, selectedDam]);

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

  const apiOnline = Boolean(health?.ok) && !healthError;

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
            dams={dams}
            selectedDam={selectedDam}
            onSelectDam={setSelectedDam}
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

          <KpiCards latest={latestQuery.data} loading={latestQuery.isLoading} />

          <LevelChart history={historyQuery.data ?? []} loading={historyQuery.isLoading} />

          <Separator />

          <ObservationsTable history={historyQuery.data ?? []} loading={historyQuery.isLoading} />

          {damsLoading ? null : dams.length === 0 ? (
            <div className="text-sm text-mutedForeground">
              No dams available yet — run Refresh to populate data.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
