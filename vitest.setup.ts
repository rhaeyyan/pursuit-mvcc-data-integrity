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
