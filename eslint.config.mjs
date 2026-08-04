import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // NFR-3: accessibility is linted, not just reviewed. Only the rules are spread —
  // eslint-config-next already registers the jsx-a11y plugin, and re-registering it
  // is a hard ConfigError ("Cannot redefine plugin").
  {
    name: "jsx-a11y/recommended-rules",
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Must stay last: switches off the stylistic rules Prettier owns.
  prettier,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    // Third-party skill payload (270+ .mjs files) — not our code, not our style.
    ".claude/**",
    ".gemini/**",
    "skills/**",
  ]),
]);

export default eslintConfig;
