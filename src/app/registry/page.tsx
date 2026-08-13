import { SeriesRegistry } from "../../components/SeriesRegistry";
import type { JSX } from "react";

export const metadata = {
  title: "Series Registry - MVCC Data",
};

export default function RegistryPage(): JSX.Element {
  return (
    <>
      <header>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            margin: "0 0 var(--space-6) 0",
            color: "var(--color-text-heading)",
          }}
        >
          Series Registry
        </h1>
      </header>
      <SeriesRegistry />
    </>
  );
}
