'use client';

import { useRouter } from "next/navigation";
import { BOROUGH_CODES, BOROUGHS } from "../lib/boroughs";
import styles from "./BoroughPicker.module.css";

interface BoroughPickerProps {
  currentBorough?: string;
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export function BoroughPicker({ currentBorough }: BoroughPickerProps) {
  const router = useSafeRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      router?.push(`/?borough=${val}`);
    } else {
      router?.push("/");
    }
  };

  return (
    <nav aria-label="Borough filter" className={styles.nav}>
      <label htmlFor="borough-select" className={styles.label}>
        Borough:
      </label>
      <select
        id="borough-select"
        aria-label="Select NYC Borough"
        value={currentBorough ?? ""}
        onChange={handleChange}
        className={styles.select}
      >
        <option value="">All NYC Boroughs (Citywide)</option>
        {BOROUGH_CODES.map((code) => (
          <option key={code} value={code}>
            {BOROUGHS[code].label}
          </option>
        ))}
      </select>
    </nav>
  );
}
