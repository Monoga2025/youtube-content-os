---
artifact: screen-inventory
phase: 6
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 06 — Surface inventory

## Navigation
```text
Private spreadsheet → Dashboard | Config | Signals | Evidence | Missions | Feedback | Run Log
Apps Script menu → Initialize | Refresh signals | Create mission | Validate approval | Purge stale data
```

| ID | Surface | Objective | Primary action | Flow |
|---|---|---|---|---|
| SC-001 | Dashboard | See current week, health, and next human action | Open eligible mission | UF-001–004 |
| SC-002 | Config | Maintain verified allowlist and settings | Enable verified channel ID | UF-001 |
| SC-003 | Signals | Review fresh raw timestamped observations | Curate/ignore | UF-001/002 |
| SC-004 | Evidence | Record sanitized real-work proof | Verify evidence | UF-002 |
| SC-005 | Missions | Build and approve one weekly mission | Approve/reject | UF-003 |
| SC-006 | Feedback | Log production minutes and native outcomes | Record weekly review | UF-004 |
| SC-007 | Run Log | Diagnose refresh/generation health | Inspect recovery detail | UF-001/003 |

## Surface states
- **Dashboard:** loading via toast; empty directs to Config; error links Run Log; success shows last run, new count, current mission, approval state, and production budget.
- **Config:** data validation for boolean, channel ID syntax, refresh cadence; blank IDs display `Not active—verify ID`.
- **Signals:** frozen header/filter; raw columns visually separated from human columns; `NEW/CURATED/IGNORED/ARCHIVED` validation.
- **Evidence:** sanitized text only; `DRAFT/VERIFIED/REJECTED`; visible privacy warning.
- **Missions:** one row per week; status and approval columns protected by validation; link to full template.
- **Feedback/Run Log:** timestamped append-only operational records; errors contain safe messages, never key/payload.

## Primary device and responsive behavior
Desktop browser is the primary planning surface. Google Sheets native responsive behavior is accepted for mobile read-only checks; no custom mobile UI or geometry is implemented in V1. Dense tables prioritize frozen identifiers, wrapped text, filters, and explicit columns over decorative cards.

## Accessibility and copy
- Do not encode state by color alone; use status text.
- High-contrast header/background, readable default font, descriptive sheet/tab names.
- Key messages: `Checked; nothing new`, `Refresh stopped; no partial write`, `Verification required`, `Publication blocked until Daniel approves`.
- No external emails/messages in Vertical Slice 0; Sheet toast/menu feedback only.

## Gate
- [x] Every flow has sufficient surfaces.
- [x] No surface lacks an objective.
- [x] Each surface has a primary action.
- [x] Loading, empty, error, and success are defined.
- [x] Navigation fits the primary device.
- [x] Administrative configuration and logs are included.
