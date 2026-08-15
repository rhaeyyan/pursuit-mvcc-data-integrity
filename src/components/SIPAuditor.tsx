import React from "react";
import { fetchDynamicSIPs } from "../lib/socrata-sips";
import styles from "./SIPAuditor.module.css";

export default async function SIPAuditor() {
  const sips = await fetchDynamicSIPs();

  return (
    <div className={styles.formWrapper}>
      <form method="GET" action="/auditor" aria-label="Select Project">
        <label htmlFor="sip-select" className={styles.label}>
          Select a Street Improvement Project (SIP)
        </label>
        <div className={styles.selectWrapper}>
          <select
            id="sip-select"
            name="sipId"
            className={styles.select}
            defaultValue=""
          >
            <option value="" disabled>
              Choose a project...
            </option>
            {sips.map((sip) => (
              <option key={sip.id} value={sip.id}>
                {sip.name}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.button}>
            Audit Project
          </button>
        </div>
      </form>
    </div>
  );
}
