// Standalone caveats section (FR-9) — a zero-prop Server Component, static
// prose only, same posture as MetricSection (no client directive, no hooks,
// no interactivity). Mounted unconditionally at the bottom of page.tsx,
// independent of all four metrics' fetch status: see that file's header for
// why (a reader is arguably most in need of these caveats exactly when
// something *has* gone wrong).
//
// Every INTRO/ITEM_1..5 string below is reproduced verbatim from SPEC.md's
// Inputs/Outputs section — never paraphrased, summarized, or reworded.
// Caveats.test.tsx asserts against these strings with toContain; do not "fix"
// a failure there by loosening this file's text to match a broken test.
//
// The two policy dates (2019-03-18, 2020-04-06) are hardcoded prose, not
// Socrata-derived figures — fixed historical facts named directly in FR-9's
// and FR-13's own PRD text, the same category as the "2018–2025" window text
// already hardcoded throughout the codebase's captionText strings. No
// PRD-pinned figure (deaths/injuries/collisions/repaired-collisions counts,
// or any percentage) appears anywhere in this file — see SPEC.md's
// Intellectual Control for why the borough-coverage number in particular is
// deliberately omitted (its authoritative home is FR-7's not-yet-built
// warning; restating it here would be a second, driftable copy, ADR 0001's
// exact failure mode).

import type { JSX } from "react";

const INTRO =
  "The figures above are accurate to what NYPD recorded, but the record itself has documented limits. Five are covered here.";

const ITEM_1 =
  "Every collision-count figure on this page after early 2020 is affected by a documented change in NYPD procedure, not a change in how many collisions actually happened. NYPD piloted a policy of no longer dispatching officers to property-damage-only collisions in Staten Island on 2019-03-18, and made it permanent citywide on 2020-04-06. Drivers in those crashes now exchange information themselves and file a report with the state DMV, and those filings never reach the dataset this page reads from. The deaths and injuries series above are largely unaffected — both still require an officer or a hospital record — which is why they hold roughly flat while the raw collision count falls.";

const ITEM_2 =
  "This dataset's borough field is left blank on a substantial share of rows, and how completely it's filled in has changed over the 2018–2025 window rather than staying constant. Any claim broken out by borough should be read alongside that fact, not as if the field were fully and evenly populated across every year.";

const ITEM_3 =
  "Deaths and injuries both rose in 2020–2021 even as recorded collisions fell. Nationwide, average vehicle speeds increased during pandemic-era lockdowns as roads emptied, which independently raises crash severity. This page does not attribute the 2020–2021 rise, or any later change, to enforcement activity or its absence — it shows the series moving together and names this as one of the reasons a causal reading isn't supported.";

const ITEM_4 =
  "Manhattan's Central Business District congestion pricing program began in January 2025 and reduced traffic entering that zone. Any claim about Manhattan specifically that runs through a 2025 endpoint should be read with that launch in mind as a possible contributor, separate from anything this page attributes to reporting or enforcement.";

const ITEM_5 =
  "NYC DOT's own reporting states that street-redesign investment since 2014 was concentrated deliberately in lower-income neighborhoods and communities of color, including several in the Bronx. A borough's deaths trend can therefore reflect a targeted infrastructure intervention rather than, or in addition to, anything this page measures about reporting or enforcement.";

export function Caveats(): JSX.Element {
  return (
    <section aria-labelledby="caveats-heading">
      <h2 id="caveats-heading">Caveats</h2>
      <p>{INTRO}</p>
      <h3>The 2019–2020 reporting-policy change</h3>
      <p>{ITEM_1}</p>
      <h3>Borough-field coverage isn&apos;t complete or constant</h3>
      <p>{ITEM_2}</p>
      <h3>The pandemic-era rise in deaths, 2020–2021</h3>
      <p>{ITEM_3}</p>
      <h3>Manhattan congestion pricing, January 2025</h3>
      <p>{ITEM_4}</p>
      <h3>Street Improvement Project placement</h3>
      <p>{ITEM_5}</p>
    </section>
  );
}
