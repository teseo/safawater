import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseVaalRealtime } from "@api/services/dws/parse-vaal-realtime";

test("parses Vaal realtime snapshot", () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fixture = fs.readFileSync(path.join(__dirname, "fixtures", "vaal-realtime.html"), "utf8");

  const results = parseVaalRealtime(fixture);
  expect(results.length).toBe(1);
  expect(results[0].damName).toBe("Vaal Dam");
  expect(results[0].observedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  expect(results[0].levelPercent).not.toBeNull();
});
