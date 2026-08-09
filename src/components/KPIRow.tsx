import React from "react";
import styles from "./KPIRow.module.css";

interface KPIRowProps {
  deaths: number;
  collisions: number;
  arrests: number;
}

function KPIValue({ value }: { value: number }) {
  const formatted = value.toLocaleString();
  const needsSr = formatted !== value.toString();

  if (!needsSr) {
    return <span>{value}</span>;
  }

  return (
    <>
      <span aria-hidden="true">{formatted}</span>
      <span className={styles.srOnly}>{value}</span>
    </>
  );
}

export function KPIRow({ deaths, collisions, arrests }: KPIRowProps) {
  return (
    <div
      role="region"
      aria-label="Key Performance Indicators"
      className={styles.kpiContainer}
    >
      <div className={styles.kpiCard}>
        <h2 className={styles.kpiLabel}>Total Deaths (2025)</h2>
        <p className={styles.kpiValue}>
          <KPIValue value={deaths} />
        </p>
      </div>
      <div className={styles.kpiCard}>
        <h2 className={styles.kpiLabel}>Total Collisions (2025)</h2>
        <p className={styles.kpiValue}>
          <KPIValue value={collisions} />
        </p>
      </div>
      <div className={styles.kpiCard}>
        <h2 className={styles.kpiLabel}>Total Arrests (2025)</h2>
        <p className={styles.kpiValue}>
          <KPIValue value={arrests} />
        </p>
      </div>
    </div>
  );
}
