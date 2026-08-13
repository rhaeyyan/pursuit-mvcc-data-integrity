import { IntegrityAudit } from "../../components/IntegrityAudit";
import type { JSX } from "react";

export const metadata = {
  title: "Integrity Audit - MVCC Data",
};

export default function IntegrityPage(): JSX.Element {
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
          Integrity Audit
        </h1>
      </header>
      <IntegrityAudit />
    </>
  );
}
