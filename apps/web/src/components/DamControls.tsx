import * as React from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Checkbox } from "@web/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@web/components/ui/command";
import { Input } from "@web/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@web/components/ui/popover";
import { Separator } from "@web/components/ui/separator";
import { cn } from "@web/lib/utils";

export type DamControlsProps = {
  dams: string[];
  selectedDam?: string;
  onSelectDam: (value: string) => void;
  resolution: "realtime" | "weekly";
  weeklyPreset: "month" | "year";
  onSelectPreset: (preset: "realtime" | "month" | "year") => void;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  forceRefresh: boolean;
  onForceRefreshChange: (value: boolean) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onBackfill: () => void;
  backfilling: boolean;
  compareEnabled: boolean;
  compareChecked: boolean;
  onCompareChange: (value: boolean) => void;
};

export function DamControls({
  dams,
  selectedDam,
  onSelectDam,
  resolution,
  weeklyPreset,
  onSelectPreset,
  from,
  to,
  onFromChange,
  onToChange,
  forceRefresh,
  onForceRefreshChange,
  limit,
  onLimitChange,
  onRefresh,
  refreshing,
  onBackfill,
  backfilling,
  compareEnabled,
  compareChecked,
  onCompareChange
}: DamControlsProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Dam</p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" className="w-full justify-between">
                {selectedDam ?? "Select a dam"}
                <ChevronDown className="h-4 w-4 text-mutedForeground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Search dams..." />
                <CommandList>
                  <CommandEmpty>No dams found.</CommandEmpty>
                  <CommandGroup>
                    {dams.map((dam) => (
                      <CommandItem
                        key={dam}
                        value={dam}
                        onSelect={() => {
                          onSelectDam(dam);
                          setOpen(false);
                        }}
                      >
                        <span>{dam}</span>
                        {selectedDam === dam ? <Check className="h-4 w-4 text-primary" /> : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Resolution</p>
          <div className="grid gap-2">
            <Button
              variant={resolution === "realtime" ? "default" : "secondary"}
              className="w-full justify-between"
              onClick={() => onSelectPreset("realtime")}
            >
              Realtime
              <span className="text-xs text-mutedForeground">7D</span>
            </Button>
            <Button
              variant={
                resolution === "weekly" && weeklyPreset === "month" ? "default" : "secondary"
              }
              className="w-full justify-between"
              onClick={() => onSelectPreset("month")}
            >
              Weekly
              <span className="text-xs text-mutedForeground">30D</span>
            </Button>
            <Button
              variant={resolution === "weekly" && weeklyPreset === "year" ? "default" : "secondary"}
              className="w-full justify-between"
              onClick={() => onSelectPreset("year")}
            >
              Weekly
              <span className="text-xs text-mutedForeground">1Y</span>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="date-from" className="text-sm font-medium">
              From
            </label>
            <Input
              id="date-from"
              type="date"
              value={from}
              onChange={(event) => onFromChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date-to" className="text-sm font-medium">
              To
            </label>
            <Input
              id="date-to"
              type="date"
              value={to}
              onChange={(event) => onToChange(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="max-rows" className="text-sm font-medium">
            Max rows
          </label>
          <select
            id="max-rows"
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {[100, 200, 500].map((value) => (
              <option key={value} value={value}>
                {value} rows
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={forceRefresh}
            onCheckedChange={(checked) => onForceRefreshChange(Boolean(checked))}
            id="force-refresh"
          />
          <label htmlFor="force-refresh" className="text-sm text-mutedForeground">
            Force refresh (ignore cache)
          </label>
        </div>

        <Button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn("w-full", refreshing && "opacity-80")}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh from DWS
        </Button>

        {resolution === "weekly" ? (
          <Button
            variant="secondary"
            onClick={onBackfill}
            disabled={backfilling}
            className={cn("w-full", backfilling && "opacity-80")}
          >
            <RefreshCw className={cn("h-4 w-4", backfilling && "animate-spin")} />
            Backfill history
          </Button>
        ) : null}

        <div className="flex items-center gap-3">
          <Checkbox
            checked={compareChecked}
            onCheckedChange={(checked) => onCompareChange(Boolean(checked))}
            id="compare-ivrs"
            disabled={!compareEnabled}
          />
          <label
            htmlFor="compare-ivrs"
            className={cn(
              "text-sm",
              compareEnabled ? "text-mutedForeground" : "text-mutedForeground/60"
            )}
          >
            Compare with IVRS weekly
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
