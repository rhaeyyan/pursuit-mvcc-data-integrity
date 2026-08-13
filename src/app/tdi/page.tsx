import TDILeaderboard from "../../components/TDILeaderboard";
import { fetchTDILeaderboard } from "../../lib/tdi";
import styles from "./page.module.css";

// Prevent static generation since this hits the Socrata API dynamically
export const dynamic = "force-dynamic";

export default async function TDIPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ [key: string]: string | string[] | undefined }>
    | { [key: string]: string | string[] | undefined };
}) {
  // Await searchParams if it's a promise, to satisfy Next.js page requirements
  await searchParams;

  const data = await fetchTDILeaderboard();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vision Zero Shadow Ledger</h1>
        <p className={styles.subtitle}>True Danger Index (TDI) Leaderboard</p>
      </header>

      <section className={styles.content}>
        <TDILeaderboard data={data} />
      </section>
    </main>
  );
}
