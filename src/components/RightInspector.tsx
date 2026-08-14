"use client";

import Link from "next/link";

import { useWorkspaceInspector } from "../context/WorkspaceInspectorContext";
import styles from "./RightInspector.module.css";
import workspace from "../app/(workspace)/workspace.module.css";

const BADGE_CLASS: Record<string, string> = {
  accent: workspace.tagAccent,
  accent2: workspace.tagAccent2,
  neutral: workspace.tagNeutral,
  outline: workspace.tagOutline,
};

export function RightInspector() {
  const { data } = useWorkspaceInspector();

  return (
    <aside aria-label="Inspector" className={styles.inspector}>
      <div>
        <div className={styles.kicker}>{data?.kicker ?? "Workspace"}</div>
        <div className={styles.title}>{data?.title ?? "—"}</div>
        <div className={styles.sub}>
          {data?.sub ?? "Select a section to inspect its series."}
        </div>
      </div>

      {data && data.items.length > 0 && (
        <div className={styles.items}>
          {data.items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemHead}>
                <div className={styles.itemLabel} style={{ color: item.ink }}>
                  {item.label}
                </div>
                <div className={styles.itemValue}>{item.value}</div>
              </div>
              <div className={styles.itemMeta}>
                <span
                  className={`${workspace.tag} ${BADGE_CLASS[item.badgeTone]}`}
                >
                  {item.badgeText}
                </span>
                <span className={styles.itemDelta}>{item.delta}</span>
              </div>
              <div className={styles.itemNote}>{item.note}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.footerHeading}>Defensible line</div>
        <p className={styles.footerText}>
          {data?.defensible ??
            "Casualty-filtered collisions are the figure to defend — see the Integrity audit for why."}
        </p>
        <div className={styles.footerActions}>
          <Link
            href="/registry"
            className={`${workspace.btn} ${workspace.btnPrimary}`}
          >
            Series registry
          </Link>
        </div>
      </div>
    </aside>
  );
}
