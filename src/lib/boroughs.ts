// The pinned NYC borough vocabulary (FR-6) — pure, zero I/O, and the only
// place in the tree that knows how each borough is spelled in each dataset.
//
// Trap 2 of the `mvcc-data` skill lives here and nowhere else: `B` is the
// BRONX, and Brooklyn is `K` (Kings). That transposition only has to be wrong
// once to be wrong everywhere, so it gets exactly one file — one with no I/O,
// which is why it can be tested exhaustively in milliseconds with no mocking.
//
// The dependency runs one way, socrata.ts -> boroughs.ts, so nothing here
// imports, fetches, or reads the environment. The five crashes spellings were
// confirmed by live query on 2026-08-07 (SPEC.md, "Verification probe"); they
// are dataset facts, never typed from recollection. A spelling mismatch is a
// halt and a request for a revised SPEC, not a local repair.

export const BOROUGH_CODES = ["B", "K", "M", "Q", "S"] as const;

export type BoroughCode = (typeof BOROUGH_CODES)[number];

export type BoroughEntry = {
  label: string; // display name, e.g. "Brooklyn"
  crashesValue: string; // the h9gi-nx95 `borough` literal, e.g. "BROOKLYN"
  arrestsValue: string; // the 8h9b-rp9u `arrest_boro` literal, e.g. "K"
};

// Each arrestsValue is stored explicitly rather than derived from its key.
// That the two coincide is this dataset's encoding, not a rule: interpolating
// the code straight into the arrests fragment would keep working right up
// until a re-coding, then be wrong silently. Storing it also puts one
// borough's two spellings on adjacent lines, which is the documentation trap
// 2 needs.
export const BOROUGHS: Record<BoroughCode, BoroughEntry> = {
  B: { label: "Bronx", crashesValue: "BRONX", arrestsValue: "B" },
  K: { label: "Brooklyn", crashesValue: "BROOKLYN", arrestsValue: "K" },
  M: { label: "Manhattan", crashesValue: "MANHATTAN", arrestsValue: "M" },
  Q: { label: "Queens", crashesValue: "QUEENS", arrestsValue: "Q" },
  S: {
    label: "Staten Island",
    crashesValue: "STATEN ISLAND",
    arrestsValue: "S",
  },
};

export type BoroughParam =
  | { status: "none" }
  | { status: "ok"; code: BoroughCode }
  | { status: "invalid"; received: string };

// A rejected value is named back to the reader rather than silently dropped,
// so the URL and the page can never disagree in silence. It is a display
// string only — trimmed and capped so a long one cannot break the layout.
const RECEIVED_MAX_LENGTH = 24;

function invalid(received: string): BoroughParam {
  return {
    status: "invalid",
    received: received.trim().slice(0, RECEIVED_MAX_LENGTH),
  };
}

// NFR-2: the single door from a URL search param into this vocabulary.
// Anything unrecognised leaves as a display string that no caller can hand to
// either $where builder, because both are closed over BoroughCode.
export function parseBoroughParam(
  raw: string | string[] | undefined,
): BoroughParam {
  if (raw === undefined) return { status: "none" };

  // A repeated ?borough= is ambiguous by construction: first-wins would pick
  // one silently and render a page the URL does not describe.
  if (Array.isArray(raw)) return invalid(raw.join(", "));

  const trimmed = raw.trim();
  if (trimmed === "") return { status: "none" };

  const candidate = trimmed.toUpperCase();
  const code = BOROUGH_CODES.find((known) => known === candidate);

  return code ? { status: "ok", code } : invalid(trimmed);
}

// Two datasets, two literal vocabularies, one code vocabulary — hence one
// builder each. Both take a BoroughCode rather than a string, which is what
// makes an injected value unrepresentable here instead of merely rejected.
export function crashesBoroughWhere(code: BoroughCode): string {
  return `borough = '${BOROUGHS[code].crashesValue}'`;
}

export function arrestsBoroughWhere(code: BoroughCode): string {
  return `arrest_boro = '${BOROUGHS[code].arrestsValue}'`;
}
