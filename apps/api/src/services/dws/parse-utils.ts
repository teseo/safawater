import * as cheerio from "cheerio";

export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function parsePercent(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[%\s]/g, "").replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

export function findTableByHeaders(
  $: cheerio.CheerioAPI,
  headerMatchers: Record<string, (header: string) => boolean>
) {
  const tables = $("table").toArray();

  for (const table of tables) {
    const headers = $(table)
      .find("tr")
      .first()
      .find("th, td")
      .toArray()
      .map((cell) => normalizeText($(cell).text()).toLowerCase());

    const mapping: Record<string, number> = {};
    headers.forEach((header, index) => {
      for (const [key, matcher] of Object.entries(headerMatchers)) {
        if (mapping[key] !== undefined) {
          continue;
        }
        if (matcher(header)) {
          mapping[key] = index;
        }
      }
    });

    const hasAll = Object.keys(headerMatchers).every((key) =>
      Object.prototype.hasOwnProperty.call(mapping, key)
    );

    if (hasAll) {
      return { table, mapping };
    }
  }

  return null;
}

export function extractRowCells($: cheerio.CheerioAPI, row: cheerio.Element) {
  return $(row)
    .find("td, th")
    .toArray()
    .map((cell) => normalizeText($(cell).text()));
}
