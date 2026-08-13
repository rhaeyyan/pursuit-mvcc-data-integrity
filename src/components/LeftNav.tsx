"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./LeftNav.module.css";

export default function LeftNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Timeline", path: "/" },
    { name: "Integrity audit", path: "/integrity" },
    { name: "Series registry", path: "/registry" },
  ];

  return (
    <nav className={styles.navContainer} aria-label="Main Navigation">
      <div className={styles.logo}>
        <span className={styles.logoMark} aria-hidden="true">
          ◆
        </span>
        <span>MVCC Data</span>
      </div>
      <ul className={styles.navList}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
