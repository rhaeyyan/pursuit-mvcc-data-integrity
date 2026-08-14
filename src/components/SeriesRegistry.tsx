"use client";

// The Series registry view of the MVCC Workspace (implements "MVCC
// Workspace.dc.html"'s registry screen). Purely presentational: every field
// on every entry — dataset, aggregate, exact SoQL, 2018→2025 span, coverage
// badge — is computed server-side in
// src/app/(workspace)/registry/page.tsx from the same *_SOQL constants and
// fetchers the rest of the app uses (CLAUDE.md Rule 4: never a retyped copy
// of a frozen query), and handed down as plain props. This component itself
// touches no lib/fetch code, so it never risks pulling server-only fetch
// logic into the client bundle.

import { useMemo } from "react";

import {
  useInspectorSync,
  type InspectorItem,
  type InspectorBadgeTone,
} from "@/context/WorkspaceInspectorContext";

import workspace from "@/app/(workspace)/workspace.module.css";
import styles from "./SeriesRegistry.module.css";

export type RegistryEntry = {
  id: string;
  label: string;
  ink: string;
  dash: "solid" | "dashed" | "dotted";
  badgeText: string;
  badgeTone: InspectorBadgeTone;
  note: string;
  dataset: string;
  aggregate: string;
  span: string;
  coverage: string;
  soql: string;
};

type Props = {
  registry: RegistryEntry[];
  inspectorItems: InspectorItem[];
  defensible: string;
};

const BADGE_CLASS: Record<InspectorBadgeTone, string> = {
  accent: workspace.tagAccent,
  accent2: workspace.tagAccent2,
  neutral: workspace.tagNeutral,
  outline: workspace.tagOutline,
};

export function SeriesRegistry({
  registry,
  inspectorItems,
  defensible,
}: Props) {
  // Memoized: useInspectorSync's useContext call makes this component a
  // context consumer, so an unmemoized object would re-fire the sync effect
  // every render it causes — an infinite loop (see UnifiedTimeline.tsx).
  // This component has no state of its own, so [inspectorItems, defensible]
  // (both stable prop references from a single server render) is enough.
  const panelData = useMemo(
    () => ({
      kicker: "Window",
      title: "2018–25",
      sub: "Every series that appears on the Timeline, with the exact query or derivation behind it.",
      items: inspectorItems,
      defensible,
    }),
    [inspectorItems, defensible],
  );

  useInspectorSync(panelData);

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Every series on the timeline, with the aggregate that produces it and
        the grade that governs how it may be read. Queries are a frozen
        contract: a Socrata rejection is a halt and a revised spec, never a
        local repair.
      </p>

      {registry.map((entry) => (
        <article key={entry.id} className={styles.entry}>
          <div>
            <div className={styles.entryHead}>
              <span
                className={styles.swatch}
                style={{
                  borderTopColor: entry.ink,
                  borderTopStyle:
                    entry.dash === "dotted" ? "dotted" : entry.dash,
                }}
                aria-hidden="true"
              />
              <h3 className={styles.entryLabel}>{entry.label}</h3>
              <span
                className={`${workspace.tag} ${BADGE_CLASS[entry.badgeTone]}`}
              >
                {entry.badgeText}
              </span>
            </div>
            <p className={styles.entryNote}>{entry.note}</p>
            <details className={styles.details}>
              <summary className={styles.summary}>
                SoQL query — {entry.id}
              </summary>
              <pre className={styles.soql}>{entry.soql}</pre>
            </details>
          </div>
          <dl className={styles.meta}>
            <dt className={styles.metaLabel}>Dataset</dt>
            <dd className={styles.metaValue}>{entry.dataset}</dd>
            <dt className={styles.metaLabel}>Aggregate</dt>
            <dd className={styles.metaValue}>{entry.aggregate}</dd>
            <dt className={styles.metaLabel}>2018 → 2025</dt>
            <dd className={styles.metaValue}>{entry.span}</dd>
            <dt className={styles.metaLabel}>Coverage</dt>
            <dd className={styles.metaValue}>{entry.coverage}</dd>
          </dl>
        </article>
      ))}

      <p className={styles.footnote}>
        Permanently excluded from ingestion: perp_race, perp_sex, age_group.
        Arrest density reflects patrol patterns, not offending; charting it
        against a safety metric would present policing bias as neutral fact.
      </p>
    </div>
  );
}
