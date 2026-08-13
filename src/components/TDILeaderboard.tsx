import type { JSX } from "react";
import type { TDIResult } from "../lib/tdi";
import styles from "./TDILeaderboard.module.css";

export type TDILeaderboardProps = {
  data: TDIResult[];
};

export default function TDILeaderboard({
  data,
}: TDILeaderboardProps): JSX.Element {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption>True Danger Index (TDI) Leaderboard by Borough</caption>
        <thead>
          <tr>
            <th scope="col">Region</th>
            <th scope="col">TDI (Risk Score)</th>
            <th scope="col">Deaths</th>
            <th scope="col">Injuries</th>
            <th scope="col">Population</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            let rowStyle = styles.rowNeutral;
            let highlight = "none";

            if (index === 0 && data.length > 1) {
              rowStyle = styles.rowDanger;
              highlight = "highest";
            } else if (index === data.length - 1 && data.length > 1) {
              rowStyle = styles.rowSafe;
              highlight = "lowest";
            }

            return (
              <tr
                key={row.region}
                className={rowStyle}
                data-highlight={highlight}
              >
                <td>{row.region}</td>
                <td>{row.tdi.toFixed(2)}</td>
                <td>{row.deaths.toLocaleString()}</td>
                <td>{row.injuries.toLocaleString()}</td>
                <td>{row.population.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
