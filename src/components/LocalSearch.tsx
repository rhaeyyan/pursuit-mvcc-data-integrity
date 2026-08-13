"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LocalSearch.module.css";

export default function LocalSearch() {
  const [zip, setZip] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (zip.trim()) {
      router.push(`?zip=${encodeURIComponent(zip.trim())}`);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search">
      <div className={styles.inputGroup}>
        <label htmlFor="zipSearch" className={styles.label}>
          ZIP Code
        </label>
        <input
          id="zipSearch"
          type="search"
          name="zip"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter NYC ZIP (e.g., 11201)"
          className={styles.input}
          aria-label="ZIP Code"
        />
        <button type="submit" className={styles.button} aria-label="Search">
          Search
        </button>
      </div>
    </form>
  );
}
