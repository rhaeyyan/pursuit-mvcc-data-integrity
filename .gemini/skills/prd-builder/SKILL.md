---
name: prd-builder
description: Draft structured markdown PRDs (covering scope, user stories, success metrics, risks) before L2/L3 builds or when asked to scope requirements.
license: MIT
metadata:
  author: pursuit-ai-native
  version: "1.0.0"
---

# PRD Builder

Write a complete, decision-grade PRD before any L2/L3 build starts. A PRD is the single source of truth that Cedar (Tech Lead) converts into [SPEC] tasks — get it right here or pay for it in rework.

## When to Use

- Starting any L2 paired capstone (industry-specific product)
- Starting any L3 team sprint with a client brief
- Any feature that touches 2+ people or requires stakeholder sign-off
- When the scope is ambiguous and you need to force clarity before building

## PRD Structure

Produce all seven sections. No section is optional — write "N/A — not applicable because \<reason\>" if it genuinely doesn't apply.

---

### 1. Problem Statement

One paragraph. Answer:

- What painful situation exists today?
- Who experiences it and how often?
- What does it cost them (time, money, errors, missed opportunity)?
- Why hasn't it been solved already?

**Avoid**: describing the solution. This section describes the world before the product exists.

---

### 2. Target Users

A table with one row per distinct user type:

| User     | Role             | Technical level  | Key pain point   |
| -------- | ---------------- | ---------------- | ---------------- |
| \<name\> | \<what they do\> | Low / Mid / High | \<one sentence\> |

If you have qualitative research (interviews, observations), cite it. If not, flag assumptions explicitly: "**Assumed** — validate before L2 Demo Day."

---

### 3. User Stories

Format: `As a <user>, I want to <action>, so that <outcome>.`

Group by user type. Mark each story with a priority:

- **P0** — MVP blocker; product doesn't work without it
- **P1** — high value; ship in v1 if time allows
- **P2** — nice-to-have; defer to v2

Keep stories outcome-focused, not implementation-focused. "Upload a CSV" is an action; "see my data imported without reformatting it by hand" is the outcome — write the latter.

---

### 4. Success Metrics

How will you know the product worked? Two categories:

**Quantitative** (measurable at Demo Day or after deployment):

- e.g., "Work-order draft time reduced from 45 min → < 5 min"
- e.g., "Error rate on mail matching < 2%"

**Qualitative** (observed in user testing or feedback):

- e.g., "Non-technical staff can complete core workflow without assistance"

Tie each metric back to a specific pain point in Section 1. If you can't connect a metric to a pain point, cut it.

---

### 5. Technical Requirements

#### Stack (inherit from fellowship defaults unless brief specifies otherwise)

| Layer      | Technology                   | Notes |
| ---------- | ---------------------------- | ----- |
| Frontend   | React + TypeScript (Next.js) |       |
| Backend    | Python 3.12 + FastAPI        |       |
| Database   | Supabase (Postgres)          |       |
| Deployment | Vercel                       |       |
| Auth       | Supabase Auth                |       |

#### Functional requirements

Numbered list. Each requirement must be testable — if you can't write a test for it, rewrite it until you can.

1. The system shall \<verb\> \<noun\> when \<condition\>.
2. ...

#### Non-functional requirements

- **Performance**: \<response time targets, concurrency\>
- **Security**: \<auth model, data sensitivity, Zero-Trust constraints\>
- **Accessibility**: WCAG 2.2 AA — all interactive elements keyboard-navigable, AA contrast ratios
- **Browser support**: Last 2 versions of Chrome, Firefox, Safari

#### Integrations / APIs

List every external API, database, or service the product must connect to, with the data it reads/writes and the auth method.

---

### 6. Out of Scope (v1)

Explicit list of things you are **not** building in v1. This is as important as what you are building — it prevents scope creep and aligns stakeholders.

- \<feature or capability\> — deferred to v2 because \<reason\>

---

### 7. Risks and Assumptions

| Risk / Assumption | Likelihood       | Impact           | Mitigation                       |
| ----------------- | ---------------- | ---------------- | -------------------------------- |
| \<statement\>     | Low / Med / High | Low / Med / High | \<what you'll do if it's wrong\> |

Always include at minimum:

- Any assumption about user behavior that hasn't been validated
- Any third-party API dependency (what if it's down or rate-limited?)
- Any data availability assumption (what if the data doesn't exist or is messy?)

---

## Quality Gates

Before handing the PRD to Cedar (Tech Lead) for [SPEC] conversion, verify:

- [ ] Every user story has a priority label (P0/P1/P2)
- [ ] Every success metric connects to a Section 1 pain point
- [ ] Every functional requirement is testable
- [ ] Out-of-scope list contains at least 3 items (if it's empty, your scope is too narrow or you haven't thought hard enough)
- [ ] Risks table has at least 2 rows
- [ ] No solution-speak in Section 1 (the word "AI" should not appear in the Problem Statement)

## Handoff

Once the PRD passes quality gates, pass it to Cedar (Tech Lead) with:

> "Convert this PRD into [SPEC] + [FORCES] tasks. P0 stories are MVP blockers — those tasks come first. P1 stories are v1 stretch goals. P2 stories are out of scope for the initial build."
