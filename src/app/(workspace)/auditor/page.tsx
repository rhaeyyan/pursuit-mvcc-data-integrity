import React from "react";
import SIPAuditor from "../../../components/SIPAuditor";
import { fetchSIPAwardStats, SIPStats } from "../../../lib/auditor";
import styles from "./page.module.css";

export default async function AuditorPage({
  searchParams,
}: {
  searchParams: Promise<{ sipId?: string }>;
}) {
  const params = await searchParams;
  const sipId = params.sipId;

  let stats: SIPStats | null = null;
  if (sipId) {
    stats = await fetchSIPAwardStats(sipId);
  }

  return (
    <div className={styles.pageRoot}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vision Zero SIP Auditor</h1>
      </header>

      <SIPAuditor />

      {!sipId ? (
        <div className={styles.emptyState}>
          <p>Please select a project to view the safety audit scorecard.</p>
        </div>
      ) : stats ? (
        <Scorecard stats={stats} />
      ) : null}
    </div>
  );
}

function Scorecard({ stats }: { stats: SIPStats }) {
  const { sip, before, after, change } = stats;

  const colPct = change.collisionsPct;
  const casPct = change.casualtiesPct;

  // A discrepancy: collisions fall (good) but casualties rise or stay flat (bad/neutral)
  const isDiscrepancy = colPct < 0 && casPct >= 0;

  const formatPct = (val: number) => {
    if (val === 0) return "0%";
    const sign = val > 0 ? "+" : "";
    // If it's effectively an integer, show no decimals.
    const rounded = Number.isInteger(val) ? val : Number(val.toFixed(1));
    return `${sign}${rounded}%`;
  };

  const getChangeClass = (val: number) => {
    if (val < 0) return styles.changePositive; // Drop in collisions/casualties is good (Emerald Teal)
    if (val > 0) return styles.changeNegative; // Rise is bad (Coral Pink)
    return "";
  };

  return (
    <section className={styles.scorecard} aria-label="Project Scorecard">
      <h2 className={styles.projectName}>{sip.name}</h2>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Raw Collisions</div>
          <div className={styles.metricValue}>{after.collisions}</div>
          <div className={styles.details}>
            <span>Before: {before.collisions}</span>
            <span className={`${styles.change} ${getChangeClass(colPct)}`}>
              {formatPct(colPct)}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>
            Casualties (Injured + Killed)
          </div>
          <div className={styles.metricValue}>{after.casualties}</div>
          <div className={styles.details}>
            <span>Before: {before.casualties}</span>
            <span className={`${styles.change} ${getChangeClass(casPct)}`}>
              {formatPct(casPct)}
            </span>
          </div>
        </div>
      </div>

      {isDiscrepancy && (
        <div className={styles.discrepancyAlert} role="alert">
          <div className={styles.discrepancyTitle}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Data Discrepancy Flagged
          </div>
          <p className={styles.discrepancyText}>
            While overall reported collisions have decreased (
            {formatPct(colPct)}), human casualties have actually increased or
            remained flat ({formatPct(casPct)}). This suggests potential
            underreporting of non-injury collisions, artificially inflating the
            perceived safety improvement.
          </p>
        </div>
      )}
    </section>
  );
}
