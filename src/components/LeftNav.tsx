"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./LeftNav.module.css";

const NAV_ITEMS = [
  { label: "The chart", href: "/" },
  { label: "Data quality", href: "/integrity" },
  { label: "Where numbers come from", href: "/registry" },
  { label: "Look up your ZIP", href: "/local" },
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
        <div className={styles.kicker}>Checking NYC crash data</div>
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
          <div className={styles.footerHeading}>Data from</div>
          <div>NYC Open Data · Motor Vehicle Collisions</div>
          <div>NYC Open Data · NYPD Arrests (historic)</div>
        </div>
        <div>
          <div className={styles.footerHeading}>Years covered</div>
          <div>2018–2025</div>
        </div>
        <div>
          <div className={styles.footerHeading}>Where numbers come from</div>
          <div>
            Every figure on this site is loaded live or worked out from figures
            that are &mdash; see{" "}
            <Link href="/registry" className={styles.footerLink}>
              where every number comes from
            </Link>
            .
          </div>
        </div>
      </div>
    </nav>
  );
}
