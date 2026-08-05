// Type-only companion to vitest.setup.ts's runtime registration.
//
// vitest.setup.ts (root, deliberately outside tsconfig's `include` — the same
// convention vitest.config.mts follows per Amendment 3(e)) registers
// @testing-library/jest-dom's matchers on Vitest's `expect` at *runtime* via
// setupFiles. But `@testing-library/jest-dom/vitest`'s `declare module
// "vitest"` matcher-type augmentation only reaches `tsc --noEmit` if some
// file *inside* tsconfig's `include` graph imports it — otherwise
// `toBeInTheDocument()` etc. type-check as unknown members on `Assertion<T>`
// even though they work fine at test-run time.
//
// This file is the minimal fix: a side-effect import, in a `.d.ts` so it
// carries no runtime behavior of its own, placed under `src/` so tsconfig's
// existing `src/**/*.ts` glob picks it up without any tsconfig.json edit
// (tsconfig.json is out of scope for this task per SPEC.md Constraint 8).
import "@testing-library/jest-dom/vitest";
