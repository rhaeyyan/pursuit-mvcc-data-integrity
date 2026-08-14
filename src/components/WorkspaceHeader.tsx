// Shared masthead for the three MVCC Workspace routes (Timeline, Integrity
// audit, Series registry) — same rule/dateline/headline/standfirst chrome
// on every screen per "MVCC Workspace.dc.html", with per-page copy passed
// in as props. All prop values are either static disclosure copy (not a
// figure) or built by the caller from real fetched data (CLAUDE.md Rule 1).

import type { ReactNode } from "react";

import styles from "./WorkspaceHeader.module.css";

type Props = {
  dateline: string;
  caveat: string;
  headline: string;
  standfirst: string;
  children?: ReactNode;
};

export function WorkspaceHeader({
  dateline,
  caveat,
  headline,
  standfirst,
  children,
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.ruleThick} />
      <div className={styles.metaRow}>
        <div className={styles.dateline}>{dateline}</div>
        <div className={styles.caveat}>{caveat}</div>
      </div>
      <div className={styles.ruleThin} />
      <h1 className={styles.headline}>{headline}</h1>
      <p className={styles.standfirst}>{standfirst}</p>
      {children}
    </header>
  );
}
