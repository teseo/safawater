import crypto from "node:crypto";
import { fetchHtml, HttpError } from "@api/services/http";
import { parseGautengWeekly } from "@api/services/dws/parse-gauteng-weekly";
import { parseVaalWeekly } from "@api/services/dws/parse-vaal-weekly";
import { parseVaalRealtime } from "@api/services/dws/parse-vaal-realtime";
import { insertFetchRun, getLatestSuccess } from "@api/db/dao/fetch-runs";
import { upsertObservation } from "@api/db/dao/observations";
import type { ParsedObservation } from "@shared";

export const SOURCE_IDS = ["gauteng_weekly", "vaal_weekly", "vaal_realtime"] as const;

type SourceId = (typeof SOURCE_IDS)[number];

const SOURCES: Record<SourceId, { url: string; parse: (html: string) => ParsedObservation[] }> = {
  gauteng_weekly: {
    url: "https://www.dws.gov.za/hydrology/Weekly/ProvinceWeek.aspx?region=G",
    parse: parseGautengWeekly
  },
  vaal_weekly: {
    url: "https://www.dws.gov.za/hydrology/Weekly/RiverSystems.aspx?river=IV",
    parse: parseVaalWeekly
  },
  vaal_realtime: {
    url: "https://www.dws.gov.za/hydrology/Unverified/Home/DamOpt?stanum=C1R001FW",
    parse: parseVaalRealtime
  }
};

export type ScrapeResult = {
  fetched: boolean;
  skippedByTtl: boolean;
  observations: number;
  error?: string;
};

function shouldSkip(latestSuccess: string | null, ttlSeconds: number, force?: boolean) {
  if (force || ttlSeconds === 0 || !latestSuccess) {
    return false;
  }

  const last = Date.parse(latestSuccess);
  if (Number.isNaN(last)) {
    return false;
  }

  const ageMs = Date.now() - last;
  return ageMs < ttlSeconds * 1000;
}

function hashHtml(html: string) {
  return crypto.createHash("sha256").update(html).digest("hex");
}

async function scrapeSource(
  sourceId: SourceId,
  ttlSeconds: number,
  force?: boolean
): Promise<ScrapeResult> {
  const latestSuccess = getLatestSuccess(sourceId);
  if (shouldSkip(latestSuccess, ttlSeconds, force)) {
    return { fetched: false, skippedByTtl: true, observations: 0 };
  }

  const fetchedAt = new Date().toISOString();
  const { url, parse } = SOURCES[sourceId];

  try {
    const html = await fetchHtml(url, { timeoutMs: 15000 });
    const observations = parse(html);

    let _inserted = 0;
    observations.forEach((observation: ParsedObservation) => {
      _inserted += upsertObservation({
        sourceId: observation.sourceId,
        damName: observation.damName,
        region: observation.region ?? null,
        observedAt: observation.observedAt,
        levelPercent: observation.levelPercent ?? null,
        lastWeekPercent: observation.lastWeekPercent ?? null,
        lastYearPercent: observation.lastYearPercent ?? null,
        levelRaw: observation.levelRaw ?? null,
        extraJson: observation.extra ? JSON.stringify(observation.extra) : null
      });
    });

    insertFetchRun({
      sourceId,
      fetchedAt,
      status: "success",
      httpStatus: 200,
      rawHash: hashHtml(html)
    });

    return {
      fetched: true,
      skippedByTtl: false,
      observations: observations.length
    };
  } catch (error) {
    let message = "Unknown error";
    let httpStatus: number | undefined;

    if (error instanceof HttpError) {
      message = error.message;
      httpStatus = error.status;
    } else if (error instanceof Error) {
      message = error.message;
    }

    insertFetchRun({
      sourceId,
      fetchedAt,
      status: "error",
      httpStatus: httpStatus ?? null,
      errorMessage: message
    });

    return {
      fetched: false,
      skippedByTtl: false,
      observations: 0,
      error: message
    };
  }
}

export function scrapeGautengWeekly(ttlSeconds: number, force?: boolean) {
  return scrapeSource("gauteng_weekly", ttlSeconds, force);
}

export function scrapeVaalWeekly(ttlSeconds: number, force?: boolean) {
  return scrapeSource("vaal_weekly", ttlSeconds, force);
}

export function scrapeVaalRealtime(ttlSeconds: number, force?: boolean) {
  return scrapeSource("vaal_realtime", ttlSeconds, force);
}
