import * as React from "react";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";

export type DamControlsProps = {
  dams: string[];
  selectedDam?: string;
  onSelectDam: (value: string) => void;
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
};

export function DamControls({
  dams,
  selectedDam,
  onSelectDam,
  from,
  to,
  onFromChange,
  onToChange,
  forceRefresh,
  onForceRefreshChange,
  limit,
  onLimitChange,
  onRefresh,
  refreshing
}: DamControlsProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Dam</label>
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
                        {selectedDam === dam ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <Input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <Input type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Max rows</label>
          <select
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

        <Button onClick={onRefresh} disabled={refreshing} className={cn("w-full", refreshing && "opacity-80")}> 
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh from DWS
        </Button>
      </CardContent>
    </Card>
  );
}
