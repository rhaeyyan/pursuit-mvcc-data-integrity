# Pursuit Orchestrator References

## Core Design Principles (Head First)
1. **Encapsulate what varies.**
2. **Program to an interface, not an implementation.**
3. **Favor composition over inheritance.**
4. **Strive for loosely coupled designs.**
5. **Patterns are earned, not mandatory** — no variation, no pattern.

## Industry Standards
- **Accessibility:** WCAG 2.2 Level AA + WAI-ARIA APG patterns. Semantic HTML first; verify with axe-core.
- **Security:** Zero-Trust. Treat LLM output as untrusted. Sanitize before render/execute. No secrets in context.
- **AI-Native:** Prioritize context efficiency. Use small, modular prompts.

## Pattern Shorthand
- **"Facade it":** Simplify a complex subsystem.
- **"Strategy it":** Make algorithms interchangeable.
- **"Observer it":** Decouple event-driven features.

## [SPEC] / [SPIKE] / [FORCES] templates
Not duplicated here on purpose — CLAUDE.md's and GEMINI.md's `## Handoff Schemas` section is the
only copy. A local copy here previously fell out of sync with the canonical one (a stale 3-file
cap after Rule 5 was raised to 5, and missing fields after `UI Scope`/`Intellectual
Control`/`Tipping Point` were added) with nothing to catch it. Read the schemas there.
