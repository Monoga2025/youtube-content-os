---
artifact: ui-direction
phase: 7
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 07 — UI direction

## Context
One technical operator, daily/weekly use, desktop Google Sheets, dense operational information, speed/trust over decoration. Mobile is read-only native Sheets; no custom mobile interface in V1.

## Three distinct directions
### A — Operational ledger
Dense tables, frozen identifiers, one color-coded-but-textual state column, filters, compact rows, menu actions, high contrast, no imagery. Fastest and most maintainable; risk: visually austere.

### B — Editorial calendar
Calendar-first weekly columns, larger mission blocks, thumbnails/visual pillar bands, fewer raw fields visible. Strong cadence comprehension; risk: hides diagnostics and source freshness.

### C — Guided wizard
One-step-at-a-time dialogs for refresh, curation, evidence, and approval. Lowest cognitive load per action; risk: Apps Script UI complexity and slower expert operation.

## Decision matrix (1–5)
| Criterion | Weight | A | B | C |
|---|---:|---:|---:|---:|
| Speed/frequency | 5 | 5 | 3 | 2 |
| Trust/auditability | 5 | 5 | 3 | 4 |
| Information density | 4 | 5 | 3 | 2 |
| Maintainability/free-first | 5 | 5 | 4 | 2 |
| Editorial orientation | 3 | 3 | 5 | 4 |
| Accessibility | 4 | 4 | 4 | 4 |

## Chosen direction
**A — Operational ledger**, with a small Dashboard summary and an editorial Missions tab. It exposes raw/freshness fields and minimizes additional tooling.

## Non-negotiable rules
- Status text always accompanies color; no color-only meaning.
- Raw API fields are separated from human notes and never replaced by custom ratios.
- One primary action per tab; safe menu commands use explicit verbs.
- Compact default typography/row height; frozen header; wrapped long text; filters.
- Errors point to Run Log and preserve prior complete data.
- No decorative competitor thumbnails in the MVP; avoid accidental copying cues.
- Mobile: native Sheets edge-to-edge/read-only convenience. A custom mobile layout is explicitly out of scope, so 360–430 px custom geometry is not applicable.

## Gate
- [x] Three directions are materially different.
- [x] Selection is based on context, not taste.
- [x] Hierarchy and density are defined.
- [x] Desktop and mobile scope are explicit.
- [x] Mobile density/proportions/content rules are marked not applicable because no custom mobile UI exists.
- [x] Native Sheets fills the available viewport; no rigid aspect ratio or scaling workaround.
- [x] Accessibility and content rules exist.
