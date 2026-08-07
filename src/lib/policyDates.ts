// The single source of truth for the two documented NYPD reporting-policy
// dates FR-13 requires as labelled reference markers on every
// `YearlyLineChart` instance. Extracted per SPEC.md ("Mark the two documented
// policy dates ... FR-13") — FR-9's closing SPEC deferred this exact
// extraction, naming "FR-13 has no SPEC yet to define what shape it needs" as
// the reason; FR-13 now defines that shape.
//
// Both values are static, already-verified historical facts (the same pinned
// dates `Caveats.tsx` already renders as prose, and the mvcc-data skill
// carries under "The documented cause") — not a Socrata aggregate, so NFR-4's
// "no figure comes from a language model" applies only in the negative sense:
// these two literals are permitted as hardcoded constants because they are
// not derived from a query result.
//
// `year` is the category-axis tick a marker snaps to (Recharts' XAxis here is
// `type="category"` over discrete years — there is no continuous time scale a
// day-precision date could sit on). `isoDate` carries the actual day-level
// precision in text, since the axis position cannot express it. See
// YearlyLineChart.tsx and SPEC.md's Intellectual Control section for the full
// reasoning.

export type PolicyDateMarker = {
  year: number;
  isoDate: string;
  label: string;
};

export const POLICY_DATE_MARKERS: readonly PolicyDateMarker[] = [
  { year: 2019, isoDate: "2019-03-18", label: "Staten Island pilot begins" },
  { year: 2020, isoDate: "2020-04-06", label: "Citywide policy takes effect" },
];
