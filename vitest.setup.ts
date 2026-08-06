// Registers @testing-library/jest-dom's custom matchers (toBeInTheDocument, etc.)
// on Vitest's `expect`. This is the `/vitest` subpath export, which self-registers
// via `expect.extend(...)` on import — see @testing-library/jest-dom@^7 docs/exports.
// (jest-dom@7's package.json "exports" map: "./vitest" -> dist/vitest.{js,mjs}.)
import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react's auto-cleanup relies on detecting a *global*
// `afterEach` (the Jest-globals convention). This project does not set
// `test.globals: true` in vitest.config.mts — kept off on purpose so tests
// import `vitest`'s API explicitly rather than relying on ambient globals —
// so cleanup is wired here instead, once, for every test file that renders.
// Without this, DOM nodes rendered by one test in a file accumulate into the
// next (observed directly: a second `render()` in the same file produced
// stacked duplicate <main> landmarks and a false-positive axe-core failure).
afterEach(cleanup);

// Task 2 (Walking skeleton: the deaths-per-year chart), Edge Case 2. jsdom
// implements no layout engine and no ResizeObserver: every element reports
// 0 for getBoundingClientRect()/offsetWidth/offsetHeight, and
// `ResizeObserver` is `undefined` on the global object. Recharts'
// <ResponsiveContainer> depends on both — it renders `null` until its
// container div reports a positive measured size (see
// node_modules/recharts/es6/component/ResponsiveContainer.js's
// SizeDetectorContainer: it calls `containerRef.current.getBoundingClientRect()`
// inside a useEffect, then `new ResizeObserver(callback).observe(...)`; a
// zero/undefined size from either path means every SVG assertion downstream
// would vacuously fail, testing "did jsdom implement ResizeObserver" rather
// than the chart's markup.
//
// This is a harness fix, not a component prop: SPEC.md's Task 2 Intellectual
// Control is explicit that a width/height prop added "for tests" is a
// production-visible escape hatch, so the fix lives here instead.
//
// Verified empirically against a real ResponsiveContainer > LineChart tree
// (recharts@3.10.1, temporarily installed, never committed) before landing
// this: without the stub, ResponsiveContainer renders nothing; with it, a
// real non-empty <path> and real tick text render on the very first
// synchronous render() — no waitFor needed, because both the
// getBoundingClientRect() read inside SizeDetectorContainer's effect and
// this stub's synchronous ResizeObserver callback resolve inside the same
// `act()` flush that @testing-library/react's render() already performs.
//
// Guarded behind a DOM-presence check: this file runs as `setupFiles` for
// EVERY test file regardless of that file's `@vitest-environment` — Task 1's
// route.test.ts opts into the `node` environment (Edge Case 10), where
// `Element`/`HTMLElement` don't exist at all. An earlier, unguarded version
// of this block crashed that suite outright (`ReferenceError: Element is not
// defined`), caught by running the full suite, not just the new files.
if (typeof Element !== "undefined" && typeof HTMLElement !== "undefined") {
  const PLOT_WIDTH = 800;
  const PLOT_HEIGHT = 320;

  const stubDomRect = (overrides: Partial<DOMRect> = {}): DOMRect => {
    const rect = {
      width: PLOT_WIDTH,
      height: PLOT_HEIGHT,
      top: 0,
      left: 0,
      right: PLOT_WIDTH,
      bottom: PLOT_HEIGHT,
      x: 0,
      y: 0,
      ...overrides,
    };
    return { ...rect, toJSON: () => rect } as DOMRect;
  };

  class ResizeObserverStub implements ResizeObserver {
    #callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback;
    }

    observe(target: Element): void {
      // Fire synchronously with a fixed, positive content-box size so
      // <ResponsiveContainer> measures a real plot immediately, the same
      // way a real browser would report a size the instant the element is
      // laid out — just without waiting on jsdom to ever implement layout.
      const contentRect = stubDomRect();
      const entry: ResizeObserverEntry = {
        target,
        contentRect,
        borderBoxSize: [{ blockSize: PLOT_HEIGHT, inlineSize: PLOT_WIDTH }],
        contentBoxSize: [{ blockSize: PLOT_HEIGHT, inlineSize: PLOT_WIDTH }],
        devicePixelContentBoxSize: [
          { blockSize: PLOT_HEIGHT, inlineSize: PLOT_WIDTH },
        ],
      };
      this.#callback([entry], this);
    }

    unobserve(): void {}
    disconnect(): void {}
  }

  globalThis.ResizeObserver ??=
    ResizeObserverStub as unknown as typeof ResizeObserver;

  // Recharts measures every axis tick label by writing it into a hidden,
  // off-screen <span id="recharts_measurement_span"> and reading THAT
  // element's getBoundingClientRect() (see
  // node_modules/recharts/es6/util/DOMUtils.js's measureTextWithDOM). A
  // first attempt that returned the same fixed plot-sized rect for every
  // element made every tick label appear exactly as wide as the whole
  // chart, and Recharts' tick-overlap-avoidance algorithm responded exactly
  // as it should to that (wrong) input: it dropped nearly all ticks,
  // keeping neither the pinned "2018"/"2025" nor the "0" baseline tick.
  // Confirmed by inspecting the rendered DOM directly. The fix is to give
  // that one measurement element a realistic, text-length-derived size
  // instead of the fixed plot size, so the library's real fitting logic
  // runs on real-shaped input.
  const measuredSizeFor = (
    target: Element,
  ): { width: number; height: number } => {
    if (target.tagName === "SPAN" && target.textContent) {
      // ~7px/character and a 14px line box approximates this project's UI
      // font at the small sizes axis ticks render at — close enough that
      // short numeric labels ("2018", "0", "297") are never mistaken for
      // wide ones, which is the only thing the fitting algorithm needs.
      return {
        width: Math.max(target.textContent.length * 7, 4),
        height: 14,
      };
    }
    return { width: PLOT_WIDTH, height: PLOT_HEIGHT };
  };

  Object.defineProperty(Element.prototype, "getBoundingClientRect", {
    configurable: true,
    writable: true,
    value: function (this: Element) {
      return stubDomRect(measuredSizeFor(this));
    },
  });

  for (const prop of ["offsetWidth", "clientWidth"] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get: () => PLOT_WIDTH,
    });
  }
  for (const prop of ["offsetHeight", "clientHeight"] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get: () => PLOT_HEIGHT,
    });
  }
}
