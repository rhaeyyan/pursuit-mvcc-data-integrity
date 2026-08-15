import LocalSearch from "../../components/LocalSearch";
import { MetricSection } from "../../components/MetricSection";
import { YearlyLineChart } from "../../components/YearlyLineChart";
import {
  fetchLocalRawSeries,
  fetchLocalRepairedSeries,
} from "../../lib/localLedger";
import styles from "./page.module.css";

// Dynamic route due to searchParams
export const dynamic = "force-dynamic";

export default async function LocalPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }> | { zip?: string };
}) {
  const resolvedParams = await searchParams;
  const zip = resolvedParams.zip;

  if (!zip) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Local Shadow Ledger</h1>
        <p className={styles.prompt}>
          Lookup your ZIP code to see local collision data.
        </p>
        <LocalSearch />
      </main>
    );
  }

  const [rawResult, repairedResult] = await Promise.all([
    fetchLocalRawSeries(zip),
    fetchLocalRepairedSeries(zip),
  ]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Local Shadow Ledger: {zip}</h1>
        <LocalSearch />
      </header>

      <div className={styles.dashboard}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Raw Collisions</h2>
          {rawResult.status === "ok" && (
            <YearlyLineChart
              rows={rawResult.rows}
              fieldAlias="collisions"
              seriesLabel="Raw Collisions"
              strokeStyle="dashed"
              colorSlot={2}
              ariaLabel={`Line chart of raw collisions for zip ${zip}`}
              captionText={`Raw local collisions for zip ${zip}`}
            />
          )}
          <MetricSection
            fieldAlias="collisions"
            columnLabel="Raw Collisions"
            captionText={`Raw local collisions for zip ${zip}`}
            result={rawResult}
            soql={rawResult.soql}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Repaired Collisions</h2>
          {repairedResult.status === "ok" && (
            <YearlyLineChart
              rows={repairedResult.rows}
              fieldAlias="collisions"
              seriesLabel="Repaired Collisions"
              strokeStyle="solid"
              colorSlot={1}
              ariaLabel={`Line chart of repaired collisions for zip ${zip}`}
              captionText={`Repaired local collisions for zip ${zip}`}
            />
          )}
          <MetricSection
            fieldAlias="collisions"
            columnLabel="Repaired Collisions"
            captionText={`Repaired local collisions for zip ${zip}`}
            result={repairedResult}
            soql={repairedResult.soql}
          />
        </section>
      </div>
    </main>
  );
}
