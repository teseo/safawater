import * as cheerio from "cheerio";
import type { ParsedObservation } from "@shared";
import { extractRowCells, findTableByHeaders, normalizeText, parsePercent } from "./parse-utils";

export function parseGautengWeekly(html: string): ParsedObservation[] {
  const $ = cheerio.load(html);
  const headerMatchers = {
    damName: (value: string) => value.includes("dam"),
    thisWeek: (value: string) => value.includes("this") || value.includes("current"),
    lastWeek: (value: string) => value.includes("last week") || value.includes("prev"),
    lastYear: (value: string) => value.includes("last year") || value.includes("year")
  };

  const match = findTableByHeaders($, headerMatchers);
  if (!match) {
    return [];
  }

  const observedAt = new Date().toISOString().slice(0, 10);
  const rows = $(match.table).find("tr").slice(1).toArray();

  return rows
    .map((row) => {
      const cells = extractRowCells($, row);
      const damName = normalizeText(cells[match.mapping.damName] ?? "");

      if (!damName || /total/i.test(damName) || damName.toLowerCase() === "dam") {
        return null;
      }

      const currentRaw = cells[match.mapping.thisWeek] ?? "";
      const current = parsePercent(currentRaw);
      const lastWeek = parsePercent(cells[match.mapping.lastWeek] ?? "");
      const lastYear = parsePercent(cells[match.mapping.lastYear] ?? "");

      if (current === null && lastWeek === null && lastYear === null) {
        return null;
      }

      return {
        sourceId: "gauteng_weekly",
        damName,
        region: "Gauteng",
        observedAt,
        levelPercent: current,
        lastWeekPercent: lastWeek,
        lastYearPercent: lastYear,
        levelRaw: currentRaw || null
      };
    })
    .filter((row): row is ParsedObservation => row !== null);
}
