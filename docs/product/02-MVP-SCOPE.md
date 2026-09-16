---
artifact: mvp-scope
phase: 2
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 02 — MVP scope

## Objective and primary flow
Produce one privacy-safe, original weekly mission brief from fresh allowlisted public signals plus Daniel's sanitized evidence, while keeping publication human-controlled.

```text
Scheduled read-only refresh → deduplicated raw signal queue → human curation →
sanitized evidence note → original mission brief → explicit approval for recording/publication
```

## Included user
Daniel Monoga only. No teams, clients, guests, or public dashboard in V1.

## MUST
| Capability | Problem solved | Acceptance evidence |
|---|---|---|
| Configurable verified allowlist | Prevents guessed/wrong sources | Blank IDs are skipped; only enabled valid IDs run |
| Bounded read-only refresh | Replaces ad hoc monitoring | New uploads recorded once with timestamped raw fields |
| Private curation queue | Connects signals to real work | Daniel can label relevance/pillar and add sanitized evidence |
| Original weekly brief template | Reduces synthesis effort | One bounded brief cites source signal and internal evidence |
| Human approval state | Prevents unsafe publication | No item reaches publish-ready without Daniel's approval |
| Run/error log and freshness | Makes operation auditable | Partial failures are visible and generation stops |

## SHOULD / COULD / NOT NOW
- **SHOULD:** weekly pillar-mix view; time log; native analytics review checklist.
- **COULD:** optional approved LLM adapter; email reminder; native YouTube title/thumbnail experiment checklist.
- **NOT NOW:** auto-publishing; transcript/video scraping; comments or commenter identities; multi-user access; paid dashboard/database; unapproved derived scores; automatic competitor imitation; autonomous title/thumbnail changes.

## Success definition
| Metric | Baseline | V1 target | Measurement |
|---|---|---|---|
| Weekly mission readiness | Unknown | One approved or explicitly rejected mission/week | Brief status history |
| Extra production time | Unknown | ≤180 minutes/long-form | Human time log |
| Cadence execution | Current process not repeatable | 3 edited long-form + 1 live per four weeks; 2 Shorts/week; 1 community post/week | Calendar/publish log |
| Recurring viewers per extra production hour | Unknown | Positive trend after baseline | Native YouTube recurring-viewer observation ÷ logged extra hours; human-reviewed, not an API-derived public score |
| Privacy/originality incidents | 0 known | 0 | Blocking approval checklist |

No numeric growth target is invented before one full observed cycle.

## Constraints and invalidation risks
- Free-first: YouTube Data API v3, Apps Script, private Sheet.
- Planning estimate: 81 quota units/day at 10 channels × 4 refreshes; verify actual execution.
- Raw timestamped statistics only until derived-metrics approval evidence exists.
- Stop on partial API data, stale/unverified IDs, missing sanitized evidence, or privacy doubt.
- The MVP fails if it requires more than three extra production hours/video or produces ignored drafts.

## General acceptance
- [x] All automated actions are read-only and idempotent.
- [x] Human publication approval is explicit.
- [x] Data sources and retention boundaries are documented.
- [x] Every brief joins an external signal to original sanitized evidence.

## Gate
- [x] One primary flow exists.
- [x] Every MUST is indispensable.
- [x] Exclusions are explicit.
- [x] Success is measurable without invented baselines.
- [x] The MVP does not mix multiple products.
- [x] Critical risks have a response.
