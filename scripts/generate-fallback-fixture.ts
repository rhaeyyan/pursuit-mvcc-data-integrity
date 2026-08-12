// Generates src/lib/fixtures/deaths-fallback.json — the committed fallback
// fixture behind the PRD §7 Socrata-outage risk mitigation (SPEC.md).
//
// Run manually:
//   node --experimental-strip-types scripts/generate-fallback-fixture.ts
// (Node 22.6+ built-in type stripping; zero new dependency, per Rule 9.)
//
// Deliberately does not construct, duplicate, or re-derive DEATHS_SOQL or
// any part of the query in this file. It calls the already-tested,
// already-shipped fetchDeathsPerYear() from src/lib/deaths.ts and writes out
// exactly the .soql and .rows it returns, verbatim — the fixture's numbers
// are the serialized return value of tested code, not a second
// implementation that could silently drift from the first (SPEC.md
// "Query"). A fixture built from anything other than a live "ok" result is
// never written: this is worse than a missing one (Edge Case 6).

import { writeFileSync } from "node:fs";
import { register } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

// src/lib's own modules (socrata.ts, boroughs.ts, deaths.ts) use extensionless
// relative specifiers (e.g. "./socrata") — correct for Next.js's "bundler"
// moduleResolution, but plain Node ESM requires an explicit extension and
// throws ERR_MODULE_NOT_FOUND otherwise (confirmed empirically per this
// SPEC's own Constraints). Editing those imports is out of scope — socrata.ts,
// boroughs.ts, and deaths.ts are frozen files this task may not touch. This
// inline resolve hook is the narrowest fix: it only ever retries a failed
// relative-specifier resolution by appending ".ts", and only within this
// script's own process. No new file, no new dependency (Rule 9) — it's a
// data: URL built from a template string, registered via Node's built-in
// node:module API.
const loaderSource = `
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith(".") && !/\\.[a-zA-Z0-9]+$/.test(specifier)) {
      return await nextResolve(specifier + ".ts", context);
    }
    throw err;
  }
}
`;
register(
  "data:text/javascript," + encodeURIComponent(loaderSource),
  import.meta.url,
);

const { fetchDeathsPerYear } = await import("../src/lib/deaths.ts");

async function main(): Promise<void> {
  const result = await fetchDeathsPerYear();

  if (result.status !== "ok") {
    const reason =
      result.status === "empty"
        ? "Socrata returned zero rows"
        : `${result.kind} error: ${result.reason}`;
    console.error(
      `generate-fallback-fixture: live call to fetchDeathsPerYear() did not ` +
        `return status "ok" (got "${result.status}"). Reason: ${reason}. ` +
        `Writing no file.`,
    );
    process.exit(1);
  }

  const fixture = {
    asOf: new Date().toISOString(),
    soql: result.soql,
    rows: result.rows,
  };

  const outPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../src/lib/fixtures/deaths-fallback.json",
  );
  writeFileSync(outPath, JSON.stringify(fixture, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
}

main().catch((err: unknown) => {
  console.error("generate-fallback-fixture: unexpected failure:", err);
  process.exit(1);
});
