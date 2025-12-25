import * as cheerio from "cheerio";
import type { ParsedObservation } from "@shared";
import { normalizeText, parsePercent } from "./parse-utils";

function parseObservedAt(text: string) {
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?/);
  if (isoMatch) {
    const value = isoMatch[0].replace(" ", "T");
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  const slashMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2})?/);
  if (slashMatch) {
    const [datePart, timePart] = slashMatch[0].split(" ");
    const [day, month, year] = datePart.split("/").map((val) => Number.parseInt(val, 10));
    const [hour = "0", minute = "0"] = (timePart ?? "0:0").split(":");
    const date = new Date(Date.UTC(year, month - 1, day, Number(hour), Number(minute)));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

export function parseVaalRealtime(html: string): ParsedObservation[] {
  const $ = cheerio.load(html);
  const pageText = normalizeText($.text());

  const percentMatch = pageText.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const levelPercent = percentMatch ? parsePercent(percentMatch[0]) : null;

  const extra: Record<string, unknown> = {};
  $("table tr").each((_, row) => {
    const cells = $(row).find("td, th");
    if (cells.length < 2) {
      return;
    }

    const key = normalizeText($(cells[0]).text());
    const value = normalizeText($(cells[1]).text());

    if (key && value) {
      extra[key.replace(/:$/, "")] = value;
    }
  });

  const observedAt = parseObservedAt(pageText);

  return [
    {
      sourceId: "vaal_realtime",
      damName: "Vaal Dam",
      region: "IVRS",
      observedAt,
      levelPercent,
      levelRaw: percentMatch ? percentMatch[0] : null,
      extra
    }
  ];
}
