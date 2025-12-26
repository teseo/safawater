import { buildCandidateUrls } from "@api/services/dws/backfill-dashboard-pdf";

test("buildCandidateUrls returns expected weekly dashboard URLs", () => {
  const urls = buildCandidateUrls("2025-01-24");
  expect(urls).toContain(
    "https://www.dws.gov.za/documents/2025-01-24%20Gauteng%20Weekly%20Dashboard.pdf"
  );
  expect(urls).toContain(
    "https://www.dws.gov.za/documents/2025-01-24%20Gauteng%20Bi-Weekly%20Dashboard.pdf"
  );
  expect(urls).toContain(
    "https://www.dws.gov.za/documents/2025-01-24%20Gauteng%20Water%20Security%20Dashboard.pdf"
  );
});
