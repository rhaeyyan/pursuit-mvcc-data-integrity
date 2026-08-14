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
      kicker: "Years covered",
      title: "2018–25",
      sub: "Every line on the timeline, with the exact query or calculation behind it.",
      items: inspectorItems,
      defensible,
    }),
    [inspectorItems, defensible],
  );

  useInspectorSync(panelData);

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        These queries are fixed. If one ever stops working, we stop and rewrite
        it deliberately rather than quietly patching the numbers at our end.
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
                See the exact query for {entry.label.toLowerCase()}
              </summary>
              <pre className={styles.soql}>{entry.soql}</pre>
            </details>
          </div>
          <dl className={styles.meta}>
            <dt className={styles.metaLabel}>Source</dt>
            <dd className={styles.metaValue}>{entry.dataset}</dd>
            <dt className={styles.metaLabel}>What it counts</dt>
            <dd className={styles.metaValue}>{entry.aggregate}</dd>
            <dt className={styles.metaLabel}>2018 → 2025</dt>
            <dd className={styles.metaValue}>{entry.span}</dd>
            <dt className={styles.metaLabel}>Data available</dt>
            <dd className={styles.metaValue}>{entry.coverage}</dd>
          </dl>
        </article>
      ))}

      <p className={styles.footnote}>
        We never load the race, sex, or age fields attached to arrest records.
        Where arrests happen reflects where police patrol, not where offences
        happen — charting that against a safety number would dress up a policing
        pattern as a neutral fact.
      </p>
    </div>
  );
}
