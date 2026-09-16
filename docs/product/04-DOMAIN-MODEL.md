---
artifact: domain-model
phase: 4
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 04 — Domain model

## Concept map
```text
OPERATOR
 ├─ configures CHANNEL_SOURCE ── produces SIGNAL
 ├─ records EVIDENCE_ITEM ──────┐
 ├─ curates SIGNAL ─────────────┼─ forms MISSION_BRIEF ── has APPROVAL
 └─ reviews RUN_RECORD          └─ yields PERFORMANCE_OBSERVATION
```

## Entities and lifecycles
| Entity | Meaning / identity | Lifecycle | Owner/history |
|---|---|---|---|
| ChannelSource | Manually verified allowlisted channel configuration | `DISABLED → ACTIVE → DISABLED/REMOVED` | Daniel; activation and last check retained |
| Signal | Raw timestamped public observation keyed by YouTube video ID | `NEW → CURATED/IGNORED → ARCHIVED/REFRESHED` | Daniel; raw fields and fetch time retained ≤30 days unless refreshed |
| EvidenceItem | Sanitized fact/artifact from Daniel's real work | `DRAFT → VERIFIED → ATTACHED/REJECTED` | Daniel; no secrets/private identifiers |
| MissionBrief | Original bounded recording mission | `DRAFT → IN_REVIEW → APPROVED_FOR_RECORDING → RECORDED → PUBLISHED` or `REJECTED` | Daniel; every transition timestamped |
| RunRecord | One refresh/generation attempt | `STARTED → SUCCEEDED/FAILED/SKIPPED` | System; payload-free operational history |
| PerformanceObservation | Human-recorded native YouTube outcome and production minutes | `RECORDED → REVIEWED` | Daniel; contextual, not causal proof |

## Critical rules
| ID | Rule | Example | Exception |
|---|---|---|---|
| BR-001 | Only active, manually verified channel IDs may be queried | Blank ID is skipped | None |
| BR-002 | Video ID is the signal dedupe key | Repeat refresh updates row/fetchedAt | None |
| BR-003 | Partial refresh cannot trigger briefing | One source fails: run FAILED, no generation | Manual review of already-complete prior data |
| BR-004 | A brief requires one curated signal and one verified sanitized evidence item | API title alone is insufficient | None |
| BR-005 | Publication requires Daniel's explicit approval | DRAFT cannot publish | None |
| BR-006 | Raw timestamped statistics only until derived-metrics approval evidence exists | Store viewCount, not view/hour | Native YouTube UI metrics may be manually observed |
| BR-007 | Third-party videos/transcripts and commenter identities are out of scope | No captions/comments calls | None |

## Invariants and edge cases
- Channel ID uniqueness; Signal video ID uniqueness; brief/evidence IDs immutable.
- No secret/API key in rows, logs, briefs, or source control.
- Pillar must be one of Jarvis, MARAL OS, Universidad OS, Mechatronics.
- A source removal disables future reads and queues payload purge.
- Deleted/private video: mark unavailable and remove/refresh stored API data.
- Clock/timezone: API UTC timestamps; human schedule `America/Bogota`.
- Duplicate trigger invocation acquires a lock and exits safely.

## Gate
- [x] The main persistent entities are identified.
- [x] Every entity has a lifecycle.
- [x] Important relationships are clear.
- [x] States and transitions do not contradict.
- [x] Critical rules have examples.
- [x] Required history is defined.
- [x] Domain concepts are not yet mistaken for physical tables.
