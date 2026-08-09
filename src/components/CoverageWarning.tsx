import type { CoverageResult } from "../lib/arrestsCoverage";
import styles from "./CoverageWarning.module.css";

export interface CoverageWarningProps {
  coverageResult: CoverageResult;
}

export const NON_COMPARABILITY_SENTENCE =
  "These coverage rates describe dataset record-keeping completeness, not enforcement activity, and cannot be compared between datasets.";

export const SEE_CAVEATS_SENTENCE =
  "See Caveats below for additional reporting policy context.";

export function CoverageWarning({ coverageResult }: CoverageWarningProps) {
  if (coverageResult.status === "error") {
    return <p role="status">Coverage metadata is currently unavailable.</p>;
  }

  const collisions = coverageResult.collisions;
  const arrests = coverageResult.arrests;

  if (!collisions && !arrests) {
    return <p role="status">Coverage metadata is currently unavailable.</p>;
  }

  return (
    <aside aria-label="Dataset coverage warning" className={styles.container}>
      {collisions && (
        <p className={styles.collisionsNote}>
          Recorded collisions data does not identify a NYC borough for{" "}
          {collisions.windowUnpopulatedSharePercent.toFixed(1)}% of rows across
          2018–2025.
        </p>
      )}
      <p className={styles.nonComparabilityNote}>
        {NON_COMPARABILITY_SENTENCE}
      </p>
      {arrests && (
        <p className={styles.arrestsNote}>
          Traffic-enforcement arrest data does not identify a NYC borough for{" "}
          {arrests.windowUnpopulatedSharePercent.toFixed(1)}% of rows across
          2018–2025.
        </p>
      )}

      <details className={styles.disclosure}>
        <summary>Coverage details by year</summary>
        {collisions && (
          <table>
            <caption>
              Collisions borough field coverage per year, 2018–2025
            </caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Total rows</th>
                <th scope="col">Borough populated</th>
                <th scope="col">Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {collisions.yearly.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.total}</td>
                  <td>{row.populated}</td>
                  <td>{row.coverageRatePercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {arrests && (
          <table>
            <caption>
              Arrest borough field coverage per year, 2018–2025
            </caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Total rows</th>
                <th scope="col">Borough populated</th>
                <th scope="col">Coverage %</th>
              </tr>
            </thead>
            <tbody>
              {arrests.yearly.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.total}</td>
                  <td>{row.populated}</td>
                  <td>{row.coverageRatePercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>

      <p className={styles.pointerNote}>{SEE_CAVEATS_SENTENCE}</p>
    </aside>
  );
}
