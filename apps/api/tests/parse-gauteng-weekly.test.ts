import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGautengWeekly } from "@api/services/dws/parse-gauteng-weekly";

test("parses Gauteng weekly table", () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fixture = fs.readFileSync(path.join(__dirname, "fixtures", "gauteng-weekly.html"), "utf8");

  const results = parseGautengWeekly(fixture);
  expect(results.length).toBeGreaterThan(0);
  const names = results.map((row) => row.damName);
  expect(names).toContain("Bon Accord Dam");
});
