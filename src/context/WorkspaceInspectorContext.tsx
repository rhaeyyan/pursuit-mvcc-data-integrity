"use client";

// Bridges the Right Inspector (mounted once in (workspace)/layout.tsx, a
// sibling render tree to the routed page content -- not a descendant of it)
// with whichever page is currently active. Plain props can't cross that
// boundary; a small Context is the standard React answer, and is the
// mechanism the Timeline page's hover-linked "active year" needs (Next.js
// parallel routes were considered instead and rejected -- a parallel slot
// re-renders per navigation, not per client hover, so it can't drive a live
// crosshair). Design Pattern: Observer -- the chart's hover/selection events
// are decoupled from the inspector's render, the one place in this redesign
// with genuine variance to encapsulate (CLAUDE.md Rule 8).

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type InspectorBadgeTone = "accent" | "accent2" | "neutral" | "outline";

export type InspectorItem = {
  id: string;
  label: string;
  ink: string;
  value: string;
  badgeText: string;
  badgeTone: InspectorBadgeTone;
  delta: string;
  note: string;
};

export type InspectorPanelData = {
  kicker: string;
  title: string;
  sub: string;
  items: InspectorItem[];
  defensible: string;
};

type ContextValue = {
  data: InspectorPanelData | null;
  setData: (data: InspectorPanelData | null) => void;
};

const WorkspaceInspectorContext = createContext<ContextValue | null>(null);

export function WorkspaceInspectorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<InspectorPanelData | null>(null);
  const value = useMemo(() => ({ data, setData }), [data]);

  return (
    <WorkspaceInspectorContext.Provider value={value}>
      {children}
    </WorkspaceInspectorContext.Provider>
  );
}

export function useWorkspaceInspector(): ContextValue {
  const ctx = useContext(WorkspaceInspectorContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceInspector must be used within a WorkspaceInspectorProvider",
    );
  }
  return ctx;
}

// Pushes `data` into the shared inspector panel whenever it changes.
// Callers must pass a referentially-stable `data` (e.g. via useMemo) so this
// doesn't re-fire -- and re-render the inspector -- on every parent render.
export function useInspectorSync(data: InspectorPanelData | null): void {
  const { setData } = useWorkspaceInspector();
  useEffect(() => {
    setData(data);
  }, [data, setData]);
}
