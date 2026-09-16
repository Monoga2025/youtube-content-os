---
artifact: user-flows
phase: 5
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 05 — User flows

| ID | Flow | Actor | Priority |
|---|---|---|---|
| UF-001 | Refresh allowlisted signals | System/Daniel | MUST |
| UF-002 | Curate signal and attach evidence | Daniel | MUST |
| UF-003 | Create and approve weekly mission | Daniel | MUST |
| UF-004 | Record feedback | Daniel | SHOULD |

## UF-001 — Refresh signals
**Trigger:** scheduled trigger or manual menu. **Preconditions:** private Sheet, API key in Script Properties, at least one active verified channel ID.

1. Acquire script lock and create `STARTED` run.
2. Validate configuration; skip blank/invalid/disabled rows.
3. Query uploads metadata and bounded recent items; fetch current raw video fields.
4. Validate complete responses; upsert by video ID with `fetchedAt`; do not calculate ratios.
5. Mark run `SUCCEEDED` with counts, release lock, show summary.

Failures: missing key/zero valid sources/API partial response → log `FAILED`, write no partial signal batch, show recovery. Duplicate trigger → `SKIPPED`. Timeout → fail closed and retry only at next scheduled/manual run. Authorization: Apps Script executes as Daniel; no public endpoint.

## UF-002 — Curate and ground
**Trigger:** Daniel reviews `Signals`. **Precondition:** fresh successful run.

1. Filter `NEW`; inspect timestamped title/channel/published time/raw statistics.
2. Mark `CURATED` or `IGNORED`, select pillar, add original relevance note.
3. Add sanitized internal evidence in `Evidence`; mark `VERIFIED` only after privacy review.
4. Link one curated signal to one verified evidence item.

Invalid pillar/status/link → validation message and no mission eligibility. Cancellation leaves prior state. No external notification.

## UF-003 — Create and approve mission
**Trigger:** Tuesday planning block. **Preconditions:** one curated signal, one verified evidence item, current backlog not stale.

1. Select exactly one candidate.
2. Generate a structured mission row/document using only the linked signal metadata and sanitized evidence.
3. Daniel edits the original angle, evidence, limits, recording plan, and derivatives.
4. Run privacy/originality/time-budget checklist.
5. Daniel explicitly transitions `DRAFT → IN_REVIEW → APPROVED_FOR_RECORDING`; publication remains manual and separately approved.

Missing evidence/privacy doubt/copying concern/over-budget plan → status remains `IN_REVIEW` or `REJECTED` with recovery note. Duplicate generation reuses brief ID and does not create a second weekly mission.

## UF-004 — Learn
Friday Daniel records extra minutes and native YouTube observations. Monthly review compares pillar mix, cadence, recurring-viewer trend, and retention moments without claiming causation or generating unapproved metrics.

## Feedback copy
- Success: `Refresh complete: {newCount} new, {updatedCount} refreshed.`
- No action: `Checked successfully; no new signals.`
- Config error: `No verified active channel IDs. Add one before refreshing.`
- Partial failure: `Refresh stopped; no partial batch was written. Review Run Log.`
- Approval block: `Publication is blocked until Daniel approves privacy and originality.`

## Gate
- [x] All MUST flows have happy paths.
- [x] All MUST flows have errors and recovery.
- [x] Sensitive actions have actors and permissions.
- [x] Data changes are explicit.
- [x] Cancellation and duplicates are handled.
- [x] Feedback messages are defined.
