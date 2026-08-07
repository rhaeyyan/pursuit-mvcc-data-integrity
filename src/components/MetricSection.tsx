// Generic status/table/note/disclosure block shared by the deaths, injuries,
// and collisions sections of src/app/page.tsx. Extracted per SPEC.md (the
// page.tsx decomposition SPEC, 2026-08-06) as a mechanical,
// behavior-preserving refactor: the rendered DOM is identical to the three
// blocks it replaces, verified by src/app/page.test.tsx passing unmodified.
// See src/components/MetricSection.test.tsx for characterization coverage
// against a synthetic fieldAlias.
//
// Server Component — no 'use client'. Renders plain semantic HTML only (no
// chart, no interactivity): it receives an already-fetched,
// already-validated YearlyMetricResult<K> as a prop and performs no fetch
// and no re-validation of its own (SPEC.md's Query section: "none — this
// task touches no query, no fetch, no dataset ID").
//
// The deaths chart is deliberately NOT threaded through this component via
// a children slot or a render prop (SPEC.md Constraint 7 / Design Pattern):
// only one of the three callers has anything to place before its table, and
// giving every caller a slot for that would be unearned generality. It stays
// a plain sibling directly in page.tsx.

import type { JSX } from "react";

import { computeChange, formatChangeSummary } from "../lib/percentChange";
import type { YearlyMetricResult } from "../lib/socrata";

export type MetricSectionProps<K extends string> = {
  // Also the table's row-value key and the disclosure's
  // "SoQL query — {fieldAlias}" accessible name.
  fieldAlias: K;
  // The second <th>; a literal, never derived from fieldAlias by
  // capitalization (SPEC.md's Intellectual Control: display labels must
  // stay explicit, grep-able literals at each call site).
  columnLabel: string;
  captionText: string;
  result: YearlyMetricResult<K>;
  // DEATHS_SOQL / INJURIES_SOQL / COLLISIONS_SOQL — rendered in the
  // disclosure unconditionally, independent of `result.status`.
  soql: string;
  // Collisions-only inline sentence; rendered only in the ok branch, after
  // the table, before the disclosure. Omitted entirely (not an empty <p>)
  // when absent.
  note?: string;
};

export function MetricSection<K extends string>({
  fieldAlias,
  columnLabel,
  captionText,
  result,
  soql,
  note,
}: MetricSectionProps<K>): JSX.Element {
  const change =
    result.status === "ok" ? computeChange(result.rows, fieldAlias) : null;

  return (
    <>
      {result.status === "ok" && (
        <>
          <table>
            <caption>{captionText}</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">{columnLabel}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row[fieldAlias]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {change !== null && <p>{formatChangeSummary(change)}</p>}
          {note !== undefined && <p>{note}</p>}
        </>
      )}

      {result.status === "empty" && (
        <p role="status">
          Socrata returned no rows for 2018–2025, so no figures could be
          produced.
        </p>
      )}

      {result.status === "error" && (
        <p role="alert">No figures could be produced: {result.reason}</p>
      )}

      <details>
        <summary>SoQL query — {fieldAlias}</summary>
        <pre>
          <code>{soql}</code>
        </pre>
      </details>
    </>
  );
}
