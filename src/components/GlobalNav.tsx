"use client";

import React from "react";
import Link from "next/link";
import styles from "./GlobalNav.module.css";

export default function GlobalNav() {
  return (
    <nav className={styles.globalNav} aria-label="Main Navigation">
      <div className={styles.navContainer}>
        <div className={styles.brand}>Vision Zero Ledger</div>
        <ul className={styles.navList}>
          <li>
            <Link href="/" className={styles.navLink}>
              Citywide (Home)
            </Link>
          </li>
          <li>
            <Link href="/local" className={styles.navLink}>
              Local
            </Link>
          </li>
          <li>
            <Link href="/tdi" className={styles.navLink}>
              TDI
            </Link>
          </li>
          <li>
            <Link href="/auditor" className={styles.navLink}>
              Auditor
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
