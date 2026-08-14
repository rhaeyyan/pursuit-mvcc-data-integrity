"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./LeftNav.module.css";

const NAV_ITEMS = [
  { label: "Timeline", href: "/" },
  { label: "Integrity audit", href: "/integrity" },
  { label: "Series registry", href: "/registry" },
];

export function LeftNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className={styles.nav}>
      <div>
        <div className={styles.brand}>
          MVCC
          <br />
          Integrity
        </div>
        <div className={styles.kicker}>Reporting audit desk</div>
      </div>

      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <div>
          <div className={styles.footerHeading}>Sources</div>
          <div>h9gi-nx95 · Motor Vehicle Collisions – Crashes</div>
          <div>8h9b-rp9u · NYPD Arrests Data (historic)</div>
        </div>
        <div>
          <div className={styles.footerHeading}>Window</div>
          <div>2018–2025, fixed</div>
        </div>
        <div>
          <div className={styles.footerHeading}>Provenance</div>
          <div>
            Every figure is a live SoQL result or a documented derivation
            &mdash; see the{" "}
            <Link href="/registry" className={styles.footerLink}>
              series registry
            </Link>
            .
          </div>
        </div>
      </div>
    </nav>
  );
}
