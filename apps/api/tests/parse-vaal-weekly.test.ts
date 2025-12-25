import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseVaalWeekly } from "../src/services/dws/parse-vaal-weekly";

test("parses Vaal weekly table", () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fixture = fs.readFileSync(
    path.join(__dirname, "fixtures", "vaal-weekly.html"),
    "utf8"
  );

  const results = parseVaalWeekly(fixture);
  const names = results.map((row) => row.damName);
  expect(names).toContain("Vaal Dam");
});
