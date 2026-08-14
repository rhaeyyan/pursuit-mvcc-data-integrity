import type { ReactNode } from "react";

import { LeftNav } from "@/components/LeftNav";
import { RightInspector } from "@/components/RightInspector";
import { WorkspaceInspectorProvider } from "@/context/WorkspaceInspectorContext";

import styles from "./workspace.module.css";

// Hand-written props, not Next 16's generated LayoutProps<...>: typegen
// normalizes away route-group segments, so this route's key collides with
// root layout.tsx's "/" entry and the generated helper won't type-check here.
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceInspectorProvider>
      <div className={styles.workspaceRoot}>
        <LeftNav />
        <main className={styles.main}>{children}</main>
        <RightInspector />
      </div>
    </WorkspaceInspectorProvider>
  );
}
