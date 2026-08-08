// Behavioral / black-box tests for src/lib/boroughs.ts — FR-6 Phase 1's pure
// borough vocabulary module.
//
// Written BEFORE src/lib/boroughs.ts exists, per CLAUDE.md Rule 4 and this
// SPEC's standard (non-SPIKE) ordering: Cypress writes failing tests first,
// Redwood implements against them. This file must fail red against the
// current tree because the module it imports is absent — not because of a
// mistake in its own assertions.
//
// Everything asserted here is a pinned contract, never re-derived:
//
//   * the five code -> (label / crashesValue / arrestsValue) rows are copied
//     verbatim from the SPEC's Inputs/Outputs table, which itself restates
//     the `mvcc-data` skill's trap 2 (`B` is the BRONX, `K` is BROOKLYN /
//     Kings) and was re-confirmed by the SPEC's live verification probe on
//     2026-08-07 (five uppercase literals: BRONX, BROOKLYN, MANHATTAN,
//     QUEENS, STATEN ISLAND);
//   * the parseBoroughParam() input/output table is the SPEC's, row for row;
//   * the two $where fragments are query-shape strings, not data figures.
//
// The module is pure and does zero I/O, so nothing here mocks anything. The
// only exceptions are the source-level greps at the bottom, which are the
// sole available net for Constraint 2 (no I/O, no process.env, no import of
// socrata.ts) and for the SPEC's "arrestsValue is stored explicitly, never
// derived from the key" requirement — properties no runtime call can observe
// while `arrestsValue === code` happens to hold for all five.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  BOROUGHS,
  BOROUGH_CODES,
  arrestsBoroughWhere,
  crashesBoroughWhere,
  parseBoroughParam,
  type BoroughCode,
} from "./boroughs";

// ---------------------------------------------------------------------------
// Pinned tables — the SPEC's Inputs/Outputs section, transcribed once here so
// every assertion below compares against a literal rather than against the
// module reading itself back.
// ---------------------------------------------------------------------------

const PINNED_CODES = ["B", "K", "M", "Q", "S"] as const;

const PINNED_TABLE = {
  B: { label: "Bronx", crashesValue: "BRONX", arrestsValue: "B" },
  K: { label: "Brooklyn", crashesValue: "BROOKLYN", arrestsValue: "K" },
  M: { label: "Manhattan", crashesValue: "MANHATTAN", arrestsValue: "M" },
  Q: { label: "Queens", crashesValue: "QUEENS", arrestsValue: "Q" },
  S: {
    label: "Staten Island",
    crashesValue: "STATEN ISLAND",
    arrestsValue: "S",
  },
} as const;

// The five $where fragments, written out rather than templated from
// PINNED_TABLE, so a transposition has to survive being wrong in two
// independently-typed places to escape this file.
const PINNED_CRASHES_WHERE = {
  B: "borough = 'BRONX'",
  K: "borough = 'BROOKLYN'",
  M: "borough = 'MANHATTAN'",
  Q: "borough = 'QUEENS'",
  S: "borough = 'STATEN ISLAND'",
} as const;

const PINNED_ARRESTS_WHERE = {
  B: "arrest_boro = 'B'",
  K: "arrest_boro = 'K'",
  M: "arrest_boro = 'M'",
  Q: "arrest_boro = 'Q'",
  S: "arrest_boro = 'S'",
} as const;

// ---------------------------------------------------------------------------
// BOROUGH_CODES
// ---------------------------------------------------------------------------

describe("BOROUGH_CODES — the closed, ordered code vocabulary", () => {
  it("is exactly the five NYC borough codes in the pinned order", () => {
    expect([...BOROUGH_CODES]).toEqual([...PINNED_CODES]);
  });

  it("contains no duplicates and nothing outside the five", () => {
    expect(new Set(BOROUGH_CODES).size).toBe(5);
  });

  it("keys BOROUGHS exactly — the array and the record cannot drift apart", () => {
    expect(Object.keys(BOROUGHS).sort()).toEqual([...BOROUGH_CODES].sort());
  });
});

// ---------------------------------------------------------------------------
// BOROUGHS — trap 2, asserted so that a transposition fails loudly.
//
// A test that reads BOROUGHS.B.crashesValue back into its own expectation
// proves nothing. These assertions pin the *external* fact (`B` is the
// Bronx), so swapping any two rows of the implementation fails here.
// ---------------------------------------------------------------------------

describe("BOROUGHS — the pinned mapping (trap 2: `B` is the BRONX, not Brooklyn)", () => {
  it("matches the pinned table exactly, row for row", () => {
    expect(BOROUGHS).toEqual(PINNED_TABLE);
  });

  it("maps `B` to the Bronx and never to Brooklyn — the single most expensive transposition in this dataset", () => {
    expect(BOROUGHS.B.label).toBe("Bronx");
    expect(BOROUGHS.B.crashesValue).toBe("BRONX");
    expect(BOROUGHS.B.crashesValue).not.toBe("BROOKLYN");
    expect(BOROUGHS.B.label).not.toBe("Brooklyn");
  });

  it("maps Brooklyn to `K` (Kings), not to `B`", () => {
    expect(BOROUGHS.K.label).toBe("Brooklyn");
    expect(BOROUGHS.K.crashesValue).toBe("BROOKLYN");

    const codeForBrooklyn = BOROUGH_CODES.filter(
      (code) => BOROUGHS[code].label === "Brooklyn",
    );
    expect(codeForBrooklyn).toEqual(["K"]);

    const codeForBronx = BOROUGH_CODES.filter(
      (code) => BOROUGHS[code].label === "Bronx",
    );
    expect(codeForBronx).toEqual(["B"]);
  });

  it("is a bijection from code to label — no label is reachable from two codes, and none is missing", () => {
    const labels = BOROUGH_CODES.map((code) => BOROUGHS[code].label);
    expect(labels).toEqual([
      "Bronx",
      "Brooklyn",
      "Manhattan",
      "Queens",
      "Staten Island",
    ]);
    expect(new Set(labels).size).toBe(5);
  });

  it("carries the asymmetry that is the whole reason this module exists: `K` is 'BROOKLYN' for crashes and 'K' for arrests", () => {
    expect(BOROUGHS.K.crashesValue).toBe("BROOKLYN");
    expect(BOROUGHS.K.arrestsValue).toBe("K");
    expect(BOROUGHS.K.crashesValue).not.toBe(BOROUGHS.K.arrestsValue);
  });

  it("uses the h9gi-nx95 uppercase spellings for crashesValue — confirmed by the SPEC's 2026-08-07 live probe", () => {
    const crashesValues = BOROUGH_CODES.map(
      (code) => BOROUGHS[code].crashesValue,
    );
    expect(crashesValues).toEqual([
      "BRONX",
      "BROOKLYN",
      "MANHATTAN",
      "QUEENS",
      "STATEN ISLAND",
    ]);
    for (const value of crashesValues) {
      expect(value).toBe(value.toUpperCase());
    }
  });

  it("uses the 8h9b-rp9u single-letter codes for arrestsValue", () => {
    const arrestsValues = BOROUGH_CODES.map(
      (code) => BOROUGHS[code].arrestsValue,
    );
    expect(arrestsValues).toEqual(["B", "K", "M", "Q", "S"]);
  });

  it("holds no value that could break out of a single-quoted SoQL literal (NFR-2, defence in depth)", () => {
    for (const code of BOROUGH_CODES) {
      for (const value of [
        BOROUGHS[code].crashesValue,
        BOROUGHS[code].arrestsValue,
      ]) {
        expect(value).not.toMatch(/['"\\;]/);
        expect(value).not.toMatch(/--/);
        expect(value.trim()).toBe(value);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// parseBoroughParam() — the trust boundary. The SPEC's table, exhaustively.
// ---------------------------------------------------------------------------

describe("parseBoroughParam() — absent and empty input yields `none`", () => {
  it("undefined -> { status: 'none' }", () => {
    expect(parseBoroughParam(undefined)).toEqual({ status: "none" });
  });

  it("the empty string -> { status: 'none' }, never `invalid`", () => {
    expect(parseBoroughParam("")).toEqual({ status: "none" });
  });

  it.each(["   ", "\t", "\n", " \t\n "])(
    "whitespace-only input %j -> { status: 'none' }",
    (raw) => {
      expect(parseBoroughParam(raw)).toEqual({ status: "none" });
    },
  );
});

describe("parseBoroughParam() — the five valid codes, case- and whitespace-insensitive", () => {
  it.each(PINNED_CODES)("accepts the uppercase code %s", (code) => {
    expect(parseBoroughParam(code)).toEqual({ status: "ok", code });
  });

  it.each(PINNED_CODES)(
    "accepts the lowercase code for %s and normalizes it back to uppercase",
    (code) => {
      expect(parseBoroughParam(code.toLowerCase())).toEqual({
        status: "ok",
        code,
      });
    },
  );

  it.each(PINNED_CODES)(
    "accepts the padded code ' %s ' after trimming",
    (code) => {
      expect(parseBoroughParam(` ${code.toLowerCase()} `)).toEqual({
        status: "ok",
        code,
      });
    },
  );

  it("the SPEC's worked example: 'K', 'k' and ' k ' all yield Brooklyn's code", () => {
    for (const raw of ["K", "k", " k "]) {
      expect(parseBoroughParam(raw)).toEqual({ status: "ok", code: "K" });
    }
  });
});

describe("parseBoroughParam() — anything else is `invalid`, and reports what it rejected", () => {
  it.each([
    ["BROOKLYN", "BROOKLYN"],
    ["Kings", "Kings"],
    ["zz", "zz"],
    ["1", "1"],
  ])("rejects %j and echoes it back as `received`", (raw, received) => {
    expect(parseBoroughParam(raw)).toEqual({ status: "invalid", received });
  });

  it("rejects the crashes dataset literals — a display/dataset value is not a code", () => {
    for (const value of ["BRONX", "MANHATTAN", "QUEENS", "STATEN ISLAND"]) {
      expect(parseBoroughParam(value).status).toBe("invalid");
    }
  });

  it("rejects a code that is merely a substring or superstring of a valid one", () => {
    for (const raw of ["KK", "K,M", "K M", "BK", "s1"]) {
      expect(parseBoroughParam(raw).status).toBe("invalid");
    }
  });

  it("trims `received` before reporting it", () => {
    expect(parseBoroughParam("   Kings   ")).toEqual({
      status: "invalid",
      received: "Kings",
    });
  });

  it("truncates `received` to 24 characters — it is a layout guard on a display string (Edge Case 5)", () => {
    const long = "Q".repeat(40);
    const result = parseBoroughParam(long);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.received).toHaveLength(24);
    expect(result.received).toBe("Q".repeat(24));
  });

  it("leaves a 24-character value intact and truncates a 25-character one", () => {
    const exactly24 = "A".repeat(24);
    const exactly25 = "A".repeat(25);

    expect(parseBoroughParam(exactly24)).toEqual({
      status: "invalid",
      received: exactly24,
    });
    expect(parseBoroughParam(exactly25)).toEqual({
      status: "invalid",
      received: exactly24,
    });
  });

  it("trims first, then truncates — surrounding whitespace does not consume the 24-character budget", () => {
    const result = parseBoroughParam(`   ${"Z".repeat(24)}   `);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.received).toBe("Z".repeat(24));
  });
});

describe("parseBoroughParam() — a repeated query parameter is ambiguous by construction (Edge Case 4)", () => {
  it("['K','M'] -> invalid with received 'K, M', never first-wins", () => {
    expect(parseBoroughParam(["K", "M"])).toEqual({
      status: "invalid",
      received: "K, M",
    });
  });

  it("['K'] -> invalid with received 'K' — a single-element array is still an array", () => {
    expect(parseBoroughParam(["K"])).toEqual({
      status: "invalid",
      received: "K",
    });
  });

  it("never returns `ok` for any array input, however valid its elements look", () => {
    for (const raw of [["K"], ["K", "M"], ["k", "k"], ["B", "B", "B"], []]) {
      expect(parseBoroughParam(raw).status).not.toBe("ok");
    }
  });

  it("keeps `received` inside the 24-character display budget for a long repeated parameter", () => {
    const result = parseBoroughParam(["K", "M", "B", "Q", "S", "K", "M", "B"]);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.received.length).toBeLessThanOrEqual(24);
  });
});

describe("parseBoroughParam() — hostile input never becomes a code (NFR-2)", () => {
  const HOSTILE = [
    "K' OR 1=1 --",
    "'; DROP TABLE crashes; --",
    "BROOKLYN' OR 'a'='a",
    "K UNION SELECT 1",
    "<script>alert(1)</script>",
    "K\u0000",
  ];

  it.each(HOSTILE)("rejects %j", (raw) => {
    expect(parseBoroughParam(raw).status).toBe("invalid");
  });

  it("keeps every hostile `received` inside the 24-character display budget", () => {
    for (const raw of HOSTILE) {
      const result = parseBoroughParam(raw);
      if (result.status !== "invalid") continue;
      expect(result.received.length).toBeLessThanOrEqual(24);
    }
  });
});

// ---------------------------------------------------------------------------
// The two $where fragment builders.
// ---------------------------------------------------------------------------

describe("crashesBoroughWhere() — the h9gi-nx95 fragment", () => {
  it.each(PINNED_CODES)(
    "builds exactly the pinned fragment for %s",
    (code: BoroughCode) => {
      expect(crashesBoroughWhere(code)).toBe(PINNED_CRASHES_WHERE[code]);
    },
  );

  it("quotes the value with single quotes, uses the verified `borough` field, and adds no parentheses or padding", () => {
    for (const code of BOROUGH_CODES) {
      const fragment = crashesBoroughWhere(code);
      expect(fragment).toMatch(/^borough = '[A-Z ]+'$/);
      expect(fragment).not.toContain("(");
      expect(fragment).not.toContain(")");
      expect(fragment.trim()).toBe(fragment);
      expect(fragment).not.toContain("arrest_boro");
    }
  });

  it("emits `borough = 'BROOKLYN'` for K and `borough = 'BRONX'` for B — trap 2 at the point of use", () => {
    expect(crashesBoroughWhere("K")).toBe("borough = 'BROOKLYN'");
    expect(crashesBoroughWhere("B")).toBe("borough = 'BRONX'");
    expect(crashesBoroughWhere("B")).not.toContain("BROOKLYN");
  });

  it("produces exactly five distinct fragments over the whole code vocabulary — no other string is reachable", () => {
    const produced = BOROUGH_CODES.map(crashesBoroughWhere);
    expect(new Set(produced).size).toBe(5);
    expect(produced).toEqual([
      PINNED_CRASHES_WHERE.B,
      PINNED_CRASHES_WHERE.K,
      PINNED_CRASHES_WHERE.M,
      PINNED_CRASHES_WHERE.Q,
      PINNED_CRASHES_WHERE.S,
    ]);
  });
});

describe("arrestsBoroughWhere() — the 8h9b-rp9u fragment", () => {
  it.each(PINNED_CODES)(
    "builds exactly the pinned fragment for %s",
    (code: BoroughCode) => {
      expect(arrestsBoroughWhere(code)).toBe(PINNED_ARRESTS_WHERE[code]);
    },
  );

  it("quotes the value with single quotes, uses the verified `arrest_boro` field, and adds no parentheses or padding", () => {
    for (const code of BOROUGH_CODES) {
      const fragment = arrestsBoroughWhere(code);
      expect(fragment).toMatch(/^arrest_boro = '[BKMQS]'$/);
      expect(fragment).not.toContain("(");
      expect(fragment).not.toContain(")");
      expect(fragment.trim()).toBe(fragment);
    }
  });

  it("never emits the crashes vocabulary — the two datasets do not share a spelling", () => {
    for (const code of BOROUGH_CODES) {
      const fragment = arrestsBoroughWhere(code);
      expect(fragment).not.toContain("BROOKLYN");
      expect(fragment).not.toContain("BRONX");
      expect(fragment).not.toContain("STATEN ISLAND");
      expect(fragment).not.toMatch(/\bborough\b/);
    }
  });

  it("produces exactly five distinct fragments over the whole code vocabulary — no other string is reachable", () => {
    const produced = BOROUGH_CODES.map(arrestsBoroughWhere);
    expect(new Set(produced).size).toBe(5);
    expect(produced).toEqual([
      PINNED_ARRESTS_WHERE.B,
      PINNED_ARRESTS_WHERE.K,
      PINNED_ARRESTS_WHERE.M,
      PINNED_ARRESTS_WHERE.Q,
      PINNED_ARRESTS_WHERE.S,
    ]);
  });
});

describe("the trust boundary end to end — no rejected value can reach a $where fragment", () => {
  const REJECTED = [
    "K' OR 1=1 --",
    "'; DROP TABLE crashes; --",
    "BROOKLYN",
    "Kings",
    "zz",
    "1",
  ];

  it("never yields a code for a rejected input, so no rejected value can be handed to either builder", () => {
    const codes = REJECTED.map(parseBoroughParam)
      .filter((parsed) => parsed.status === "ok")
      .map((parsed) => (parsed.status === "ok" ? parsed.code : null));

    expect(codes).toEqual([]);
  });

  // Deliberately excludes "BROOKLYN" and the other dataset literals: those
  // legitimately appear inside a fragment built from a *valid* code, so a
  // substring check on them would prove nothing. These are payloads no
  // correct implementation can ever emit.
  const INJECTION_PAYLOADS = [
    "K' OR 1=1 --",
    "'; DROP TABLE crashes; --",
    "BROOKLYN' OR 'a'='a",
    "K UNION SELECT 1",
  ];

  it("no rejected `received` value appears anywhere in the set of strings the two builders can produce", () => {
    const everyReachableFragment = [
      ...BOROUGH_CODES.map(crashesBoroughWhere),
      ...BOROUGH_CODES.map(arrestsBoroughWhere),
    ];

    for (const raw of INJECTION_PAYLOADS) {
      const parsed = parseBoroughParam(raw);
      expect(parsed.status).toBe("invalid");
      if (parsed.status !== "invalid") continue;
      for (const fragment of everyReachableFragment) {
        expect(fragment).not.toContain(parsed.received);
      }
    }
  });

  it("every fragment reachable from a parsed-ok input is one of the ten pinned strings", () => {
    const pinned = new Set<string>([
      ...Object.values(PINNED_CRASHES_WHERE),
      ...Object.values(PINNED_ARRESTS_WHERE),
    ]);

    for (const raw of ["b", " K ", "M", "q", "S"]) {
      const parsed = parseBoroughParam(raw);
      expect(parsed.status).toBe("ok");
      if (parsed.status !== "ok") continue;
      expect(pinned.has(crashesBoroughWhere(parsed.code))).toBe(true);
      expect(pinned.has(arrestsBoroughWhere(parsed.code))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Compile-time assertions. These are enforced by `tsc --noEmit` (the Stop
// quality gate), not by vitest — the project's vitest config does not run
// typechecking, so this block exists to be compiled, never to be called.
//
// If either builder's parameter is ever widened from BoroughCode to string,
// TypeScript stops reporting an error on these lines and instead fails with
// "Unused '@ts-expect-error' directive" — which is the point. FORCES 1:
// the unsafe state is unrepresentable, not merely validated.
// ---------------------------------------------------------------------------

export function __typeOnly_boroughCodeIsAClosedUnion(
  fromTheUrl: string,
  alsoFromTheUrl: string,
) {
  // @ts-expect-error — 'BROOKLYN' is the h9gi-nx95 literal, not a BoroughCode.
  crashesBoroughWhere("BROOKLYN");
  // @ts-expect-error — an arbitrary string literal can never reach a $where clause.
  crashesBoroughWhere("K' OR 1=1 --");
  // @ts-expect-error — the arrests builder is closed over the same union.
  arrestsBoroughWhere("Kings");
  // @ts-expect-error — an unparsed `string` is exactly the state FR-6 makes unrepresentable.
  crashesBoroughWhere(fromTheUrl);
  // @ts-expect-error — likewise for the arrests vocabulary.
  arrestsBoroughWhere(alsoFromTheUrl);
}

// ---------------------------------------------------------------------------
// Source-level greps — the only available net for Constraint 2 (purity) and
// for the "arrestsValue is stored explicitly, never derived from the key"
// requirement, which no runtime call can distinguish while arrestsValue
// happens to equal the code for all five boroughs.
// ---------------------------------------------------------------------------

const SRC_DIR = join(__dirname, "..");
const BOROUGHS_PATH = join(SRC_DIR, "lib", "boroughs.ts");

function readBoroughsSourceOrFail(): string {
  if (!existsSync(BOROUGHS_PATH)) {
    throw new Error(
      `${BOROUGHS_PATH} does not exist yet — this is expected red until Redwood implements it.`,
    );
  }
  return readFileSync(BOROUGHS_PATH, "utf8");
}

describe("src/lib/boroughs.ts — source-level greps (Constraint 2)", () => {
  it("does not read process.env or name the app token — the confinement rule in arrests.test.ts must stay true (NFR-2, Rule 3)", () => {
    const source = readBoroughsSourceOrFail();
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/SOCRATA_APP_TOKEN/);
  });

  it("does not import socrata.ts — the dependency runs one way, socrata.ts -> boroughs.ts", () => {
    const source = readBoroughsSourceOrFail();
    expect(source).not.toMatch(/from\s+['"]\.\/socrata['"]/);
    expect(source).not.toMatch(/from\s+['"].*lib\/socrata['"]/);
  });

  it("performs no I/O — no fetch, no request, no node builtin, no dynamic import", () => {
    const source = readBoroughsSourceOrFail();
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\bXMLHttpRequest\b/);
    expect(source).not.toMatch(/\brequire\s*\(/);
    expect(source).not.toMatch(/\bimport\s*\(/);
    expect(source).not.toMatch(/from\s+['"]node:/);
  });

  it("imports nothing but types, if it imports at all — a pure vocabulary module has no runtime dependency", () => {
    const source = readBoroughsSourceOrFail();
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line));

    for (const line of importLines) {
      expect(line.trim()).toMatch(/^import type\b/);
    }
  });

  it("stores each arrestsValue as an explicit literal rather than deriving it from the key (its equality with the key is this dataset's coincidence, not a rule)", () => {
    const source = readBoroughsSourceOrFail();
    const literalAssignments =
      source.match(/arrestsValue:\s*['"][BKMQS]['"]/g) ?? [];

    expect(literalAssignments).toHaveLength(5);
  });

  it("does not interpolate the code straight into the arrests fragment — `arrest_boro = '${code}'` is the exact anti-pattern the SPEC names, and it would break silently under any future re-coding", () => {
    const source = readBoroughsSourceOrFail();

    // Narrow by design: it must catch `${code}` (and `${ code }`) while
    // leaving the correct `${BOROUGHS[code].arrestsValue}` alone. A tripwire
    // for the named anti-pattern, not a proof of its absence.
    expect(source).not.toMatch(/arrest_boro\s*=\s*'?\$\{\s*code\s*\}/);
  });

  it("contains no pinned figure — no number on the page may originate here (Rule 1, NFR-4)", () => {
    const source = readBoroughsSourceOrFail();
    const pinnedFigures = [
      // Deaths, collisions, injuries, casualty-filtered, arrests.
      231, 244, 269, 297, 290, 280, 268, 229, 231564, 211486, 112918, 110558,
      103887, 96607, 91316, 85546, 61940, 61391, 44615, 51785, 51933, 54252,
      54030, 49634, 45774, 45439, 33362, 38809, 39336, 40472, 40229, 37420,
      29007, 8330, 21123,
    ];
    const pinnedFigurePattern = new RegExp(
      `(^|[^0-9.])(${pinnedFigures.join("|")})([^0-9]|$)`,
    );
    expect(source).not.toMatch(pinnedFigurePattern);
  });
});
