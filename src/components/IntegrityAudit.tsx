import React from "react";
import styles from "./IntegrityAudit.module.css";

export function IntegrityAudit() {
  return (
    <div className={styles.container} aria-labelledby="integrity-heading">
      <div className={`glass-panel ${styles.section}`}>
        <h2 id="coverage-heading" className={styles.sectionTitle}>
          Data Coverage Warning
        </h2>
        <div className={styles.warningBanner} role="status" aria-live="polite">
          <p className={styles.text}>
            The recorded collisions data does not reliably identify a NYC
            borough for every incident. The completeness of this field has
            drifted from{" "}
            <span className={styles.highlight}>
              64.4% in 2018 to 80.1% in 2025
            </span>
            .
          </p>
        </div>
        <p className={styles.text}>
          Because of this drifting coverage, borough-specific trends in raw
          collisions may reflect improvements in record-keeping rather than an
          actual increase in crashes. Always interpret borough-level data with
          this limitation in mind.
        </p>
      </div>

      <div className={`glass-panel ${styles.section}`}>
        <h2 id="reliability-heading" className={styles.sectionTitle}>
          Data Reliability
        </h2>
        <p className={styles.text}>
          Not all metrics share the same level of reliability. Metrics are
          listed below from least to most reliable, based on how much discretion
          is involved in their recording.
        </p>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Reported Collisions</h3>
            <p className={styles.text}>
              <strong>Least Reliable:</strong> Highly dependent on whether an
              officer decides a report is necessary, or if drivers self-report.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Injuries</h3>
            <p className={styles.text}>
              <strong>More Reliable:</strong> Involves hospital records or
              ambulance dispatches, making it harder to underreport.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Deaths</h3>
            <p className={styles.text}>
              <strong>Most Reliable:</strong> Investigated by the medical
              examiner. This metric provides the most accurate reflection of
              road safety.
            </p>
          </div>
        </div>
      </div>

      <div className={`glass-panel ${styles.section}`}>
        <h2 id="policy-heading" className={styles.sectionTitle}>
          Why Did Total Collisions Drop?
        </h2>
        <p className={styles.text}>
          You may notice a sharp drop in total collisions around early 2020.
          This is largely due to a documented change in NYPD procedure, not a
          massive sudden improvement in road safety.
        </p>
        <ul
          className={styles.text}
          style={{
            paddingLeft: "1.5rem",
            marginTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <li>
            <strong>The Policy Change:</strong> NYPD stopped dispatching
            officers to <em>Minor Crashes</em> (property damage only).
          </li>
          <li>
            <strong>Timeline:</strong> Piloted in Staten Island on March 18,
            2019, and expanded citywide on April 6, 2020.
          </li>
          <li>
            <strong>The Impact:</strong> Drivers in Minor Crashes now exchange
            information themselves and file directly with the state DMV. These
            filings do not appear in the NYPD dataset that powers this
            dashboard.
          </li>
          <li>
            <strong>The Fix:</strong> For a more accurate picture of road
            safety, look at the <em>Injury/Fatal Crashes Only</em> series, which
            filters out the noise of Minor Crashes entirely.
          </li>
        </ul>
      </div>
    </div>
  );
}
