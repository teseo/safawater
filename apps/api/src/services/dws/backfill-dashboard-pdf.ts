import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pdfParse from "pdf-parse";
import { insertFetchRun } from "@api/db/dao/fetch-runs";
import { hasObservation, upsertObservation } from "@api/db/dao/observations";

const PDF_SOURCE_ID = "gauteng_dashboard_pdf";
const DAM_NAME = "IVRS System Storage";
const PDF_CACHE_DIR = process.env.PDF_CACHE_DIR ?? "data/pdfs/cache";
const CACHE_FILE = process.env.BACKFILL_CACHE_FILE ?? "data/pdfs/backfill-cache.json";

export type BackfillSummary = {
  preset: "month" | "year";
  attemptedDays: number;
  urlsTried: number;
  head200: number;
  downloaded: number;
  parsed: number;
  inserted: number;
  skippedExisting: number;
  errors: Array<{ url: string; message: string }>;
};

type CacheEntry = {
  checkedAt: string;
  status: "not_found" | "not_pdf" | "error" | "ok";
};

type CacheStore = Record<string, CacheEntry>;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function buildCandidateUrls(dateIso: string) {
  const encodedDate = encodeURIComponent(dateIso);
  return [
    `https://www.dws.gov.za/documents/${encodedDate}%20Gauteng%20Weekly%20Dashboard.pdf`,
    `https://www.dws.gov.za/documents/${encodedDate}%20Gauteng%20Bi-Weekly%20Dashboard.pdf`,
    `https://www.dws.gov.za/documents/${encodedDate}%20Gauteng%20Water%20Security%20Dashboard.pdf`
  ];
}

function ensureCacheDir() {
  const dir = path.resolve(process.cwd(), PDF_CACHE_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadCache(): CacheStore {
  const filePath = path.resolve(process.cwd(), CACHE_FILE);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

function saveCache(cache: CacheStore) {
  const filePath = path.resolve(process.cwd(), CACHE_FILE);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
}

function shouldSkipCached(cache: CacheStore, url: string, force: boolean) {
  if (force) {
    return false;
  }
  const entry = cache[url];
  if (!entry) {
    return false;
  }
  const ageMs = Date.now() - Date.parse(entry.checkedAt);
  if (Number.isNaN(ageMs)) {
    return false;
  }
  return ageMs < 24 * 60 * 60 * 1000 && entry.status !== "ok";
}

function parseObservedDate(text: string) {
  const patterns = [
    /DASHBOARD\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /on\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /as\s+at\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /as\s+at\s+(\d{1,2}\/\d{1,2}\/\d{4})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const parsed = Date.parse(match[1]);
    if (!Number.isNaN(parsed)) {
      return isoDate(new Date(parsed));
    }

    if (match[1].includes("/")) {
      const [day, month, year] = match[1].split("/").map((value) => Number.parseInt(value, 10));
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return isoDate(new Date(Date.UTC(year, month - 1, day)));
      }
    }
  }

  return null;
}

function parsePercent(text: string) {
  const match = text.match(
    /IVRS\s+(?:latest\s+)?surface\s+water\s+storage\s+([0-9]+(?:\.[0-9]+)?)%/i
  );
  if (!match) {
    return null;
  }
  const percent = Number.parseFloat(match[1]);
  if (Number.isNaN(percent)) {
    return null;
  }
  return { percent, raw: `${match[1]}%` };
}

async function headUrl(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    const contentType = response.headers.get("content-type") ?? "";
    return { status: response.status, ok: response.ok, contentType };
  } catch {
    return { status: 0, ok: false, contentType: "" };
  }
}

async function fetchPdfHeader(url: string) {
  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-1023" },
      redirect: "follow"
    });
    const contentType = response.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await response.arrayBuffer());
    const header = buffer.subarray(0, 4).toString();
    const isPdf = contentType.includes("pdf") || header === "%PDF";
    return { status: response.status, isPdf };
  } catch {
    return { status: 0, isPdf: false };
  }
}

async function downloadPdf(url: string) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    return { status: response.status, buffer: null };
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return { status: response.status, buffer };
}

async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = [];
  let index = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await worker(current));
    }
  });
  await Promise.all(runners);
  return results;
}

export async function backfillWeeklyHistory(
  preset: "month" | "year",
  force = false
): Promise<BackfillSummary> {
  const rangeDays = preset === "month" ? 45 : 400;
  const summary: BackfillSummary = {
    preset,
    attemptedDays: rangeDays + 1,
    urlsTried: 0,
    head200: 0,
    downloaded: 0,
    parsed: 0,
    inserted: 0,
    skippedExisting: 0,
    errors: []
  };

  const cache = loadCache();
  const cacheDir = ensureCacheDir();

  const dates: string[] = [];
  for (let offset = 0; offset <= rangeDays; offset += 1) {
    dates.push(isoDate(addDays(new Date(), -offset)));
  }

  const urls: Array<{ url: string; dateIso: string }> = [];
  for (const dateIso of dates) {
    for (const url of buildCandidateUrls(dateIso)) {
      urls.push({ url, dateIso });
    }
  }

  summary.urlsTried = urls.length;

  await runPool(urls, 5, async ({ url, dateIso }) => {
    if (shouldSkipCached(cache, url, force)) {
      return;
    }

    const head = await headUrl(url);
    let isPdf = head.ok && head.contentType.includes("pdf");
    if (head.ok) {
      summary.head200 += 1;
    }

    if (!isPdf) {
      const headerCheck = await fetchPdfHeader(url);
      if (headerCheck.isPdf) {
        isPdf = true;
      }
    }

    if (!isPdf) {
      if (head.status === 404) {
        cache[url] = { checkedAt: new Date().toISOString(), status: "not_found" };
        return;
      }
      cache[url] = { checkedAt: new Date().toISOString(), status: "not_pdf" };
      return;
    }

    const filename = path.basename(new URL(url).pathname).replace(/\s+/g, "_");
    const localPath = path.join(cacheDir, filename);

    if (!force && hasObservation(PDF_SOURCE_ID, DAM_NAME, dateIso)) {
      summary.skippedExisting += 1;
      cache[url] = { checkedAt: new Date().toISOString(), status: "ok" };
      return;
    }

    const fetchedAt = new Date().toISOString();
    const download = await downloadPdf(url);
    if (!download.buffer) {
      insertFetchRun({
        sourceId: PDF_SOURCE_ID,
        fetchedAt,
        status: "error",
        httpStatus: download.status,
        errorMessage: `HTTP ${download.status}`
      });
      summary.errors.push({ url, message: `HTTP ${download.status}` });
      cache[url] = { checkedAt: new Date().toISOString(), status: "error" };
      return;
    }

    fs.writeFileSync(localPath, download.buffer);
    summary.downloaded += 1;

    const rawHash = crypto.createHash("sha256").update(download.buffer).digest("hex");
    const originalWarn = console.warn;
    const originalLog = console.log;
    console.warn = () => {};
    console.log = () => {};
    const parsed = await pdfParse(download.buffer);
    console.warn = originalWarn;
    console.log = originalLog;

    const text = parsed.text.replace(/\s+/g, " ").trim();
    const percentMatch = parsePercent(text);
    const observedAt = parseObservedDate(text) ?? dateIso;

    if (!percentMatch || !observedAt) {
      insertFetchRun({
        sourceId: PDF_SOURCE_ID,
        fetchedAt,
        status: "error",
        httpStatus: download.status,
        rawHash,
        errorMessage: "Parse failed"
      });
      summary.errors.push({ url, message: "Parse failed" });
      cache[url] = { checkedAt: new Date().toISOString(), status: "error" };
      return;
    }

    summary.parsed += 1;

    if (!force && hasObservation(PDF_SOURCE_ID, DAM_NAME, observedAt)) {
      summary.skippedExisting += 1;
      cache[url] = { checkedAt: new Date().toISOString(), status: "ok" };
      return;
    }

    summary.inserted += upsertObservation({
      sourceId: PDF_SOURCE_ID,
      damName: DAM_NAME,
      region: "IVRS",
      observedAt,
      levelPercent: percentMatch.percent,
      levelRaw: percentMatch.raw,
      extraJson: JSON.stringify({
        pdfUrl: url,
        fileName: filename
      })
    });

    insertFetchRun({
      sourceId: PDF_SOURCE_ID,
      fetchedAt,
      status: "success",
      httpStatus: download.status,
      rawHash
    });

    cache[url] = { checkedAt: new Date().toISOString(), status: "ok" };
  });

  saveCache(cache);
  summary.errors = summary.errors.slice(0, 10);

  return summary;
}
