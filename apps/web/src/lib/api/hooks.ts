import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@web/lib/api/client";
import type { DamName, HistoryResponse, LatestResponse, Source } from "@web/lib/api/types";

const retry = 2;

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: () => apiFetch<Source[]>("/api/sources"),
    staleTime: 5 * 60 * 1000,
    retry
  });
}

export function useDamNames() {
  return useQuery({
    queryKey: ["dams"],
    queryFn: () => apiFetch<DamName[]>("/api/dams"),
    staleTime: 5 * 60 * 1000,
    retry
  });
}

export function useLatest(damName?: string, resolution?: "realtime" | "weekly" | "auto") {
  return useQuery({
    queryKey: ["latest", damName, resolution],
    queryFn: () => {
      const query = resolution ? `?resolution=${resolution}` : "";
      return apiFetch<LatestResponse>(
        `/api/dams/${encodeURIComponent(damName ?? "")}/latest${query}`
      );
    },
    enabled: Boolean(damName),
    retry
  });
}

export function useHistory(
  damName?: string,
  params?: {
    from?: string;
    to?: string;
    limit?: number;
    resolution?: "realtime" | "weekly" | "all";
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["history", damName, params],
    queryFn: () => {
      const search = new URLSearchParams();
      if (params?.from) {
        search.set("from", params.from);
      }
      if (params?.to) {
        search.set("to", params.to);
      }
      if (params?.limit) {
        search.set("limit", String(params.limit));
      }
      if (params?.resolution) {
        search.set("resolution", params.resolution);
      }
      const suffix = search.toString();
      const url = `/api/dams/${encodeURIComponent(damName ?? "")}/history${suffix ? `?${suffix}` : ""}`;
      return apiFetch<HistoryResponse>(url);
    },
    enabled: options?.enabled ?? Boolean(damName),
    retry
  });
}

export function useRefresh() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: { sources?: string[]; force?: boolean }) =>
      apiFetch<{ ok: boolean; results: Record<string, unknown> }>("/api/refresh", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["latest"] });
      client.invalidateQueries({ queryKey: ["history"] });
      client.invalidateQueries({ queryKey: ["dams"] });
    }
  });
}

type BackfillResponse = {
  ok: boolean;
  downloaded: number;
  parsed: number;
  inserted: number;
  errors?: Array<{ url: string; message: string }>;
};

export function useBackfill() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (payload: { preset: "month" | "year"; force?: boolean }) =>
      apiFetch<BackfillResponse>("/api/backfill", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["history"] });
      client.invalidateQueries({ queryKey: ["latest"] });
      client.invalidateQueries({ queryKey: ["dams"] });
    }
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<{ ok: boolean }>("/api/health"),
    retry: 1,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false
  });
}
