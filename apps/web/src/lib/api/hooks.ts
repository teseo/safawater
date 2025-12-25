import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { DamName, HistoryResponse, LatestResponse, Source } from "./types";

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

export function useLatest(damName?: string) {
  return useQuery({
    queryKey: ["latest", damName],
    queryFn: () => apiFetch<LatestResponse>(`/api/dams/${encodeURIComponent(damName ?? "")}/latest`),
    enabled: Boolean(damName),
    retry
  });
}

export function useHistory(
  damName?: string,
  params?: { from?: string; to?: string; limit?: number }
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
      const suffix = search.toString();
      const url = `/api/dams/${encodeURIComponent(damName ?? "")}/history${suffix ? `?${suffix}` : ""}`;
      return apiFetch<HistoryResponse>(url);
    },
    enabled: Boolean(damName),
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

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<{ ok: boolean }>("/api/health"),
    retry: 1,
    refetchInterval: 10000
  });
}
