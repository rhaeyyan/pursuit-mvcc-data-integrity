"use client";

import React from "react";
import styles from "./PrintButton.module.css";

export default function PrintButton() {
  return (
    <button
      className={`print-button ${styles.fab}`}
      onClick={() => window.print()}
      aria-label="Print Briefing Sheet"
    >
      <span aria-hidden="true" className={styles.icon}>
        🖨️
      </span>
      <span className={styles.label}>Print</span>
    </button>
  );
}
