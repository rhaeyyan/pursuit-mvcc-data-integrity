// The pinned NYC borough vocabulary — FR-6 Phase 1 (SPEC.md).
//
// Pure, zero I/O, zero runtime imports. This is the one place in the repo
// that knows trap 2 (`B` is the Bronx, not Brooklyn) and the asymmetry
// between the two datasets' spellings: h9gi-nx95's `borough` field spells
// out the name in uppercase ("BROOKLYN"); 8h9b-rp9u's `arrest_boro` field
// uses the single-letter code ("K"). Every caller gets both literals from
// this one table so the mapping is asserted once, not re-derived at each
// call site (SPEC's Intellectual Control 2-3).
//
// socrata.ts imports this module; this module must never import socrata.ts
// (Constraint 2 — the dependency runs one way).

export const BOROUGH_CODES = ["B", "K", "M", "Q", "S"] as const;

export type BoroughCode = (typeof BOROUGH_CODES)[number];

export type BoroughEntry = {
  label: string; // display name, e.g. "Brooklyn"
  crashesValue: string; // the h9gi-nx95 `borough` literal, e.g. "BROOKLYN"
  arrestsValue: string; // the 8h9b-rp9u `arrest_boro` literal, e.g. "K"
};

// Pinned exactly as SPEC.md's Inputs/Outputs table. `arrestsValue` is
// written out as an explicit literal per borough rather than derived from
// the key — that it equals the key here is a coincidence of this dataset's
// encoding, not a rule, and deriving it would silently break under any
// future re-coding.
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

const RECEIVED_MAX_LENGTH = 24;

function truncateReceived(value: string): string {
  return value.slice(0, RECEIVED_MAX_LENGTH);
}

function isBoroughCode(value: string): value is BoroughCode {
  return (BOROUGH_CODES as readonly string[]).includes(value);
}

// The trust boundary (FORCES 1): a URL search param cannot reach a $where
// clause without passing through here first. Array input (a repeated query
// parameter) is ambiguous by construction and is always rejected, never
// resolved by first-wins (Edge Case 4).
export function parseBoroughParam(
  raw: string | string[] | undefined,
): BoroughParam {
  if (raw === undefined) {
    return { status: "none" };
  }

  if (Array.isArray(raw)) {
    return { status: "invalid", received: truncateReceived(raw.join(", ")) };
  }

  const trimmed = raw.trim();
  if (trimmed === "") {
    return { status: "none" };
  }

  const upper = trimmed.toUpperCase();
  if (isBoroughCode(upper)) {
    return { status: "ok", code: upper };
  }

  return { status: "invalid", received: truncateReceived(trimmed) };
}

export function crashesBoroughWhere(code: BoroughCode): string {
  return `borough = '${BOROUGHS[code].crashesValue}'`;
}

export function arrestsBoroughWhere(code: BoroughCode): string {
  return `arrest_boro = '${BOROUGHS[code].arrestsValue}'`;
}
