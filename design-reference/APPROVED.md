---
artifact: approved-design-references
phase: 8
status: approved
reason: ""
last_updated: "2026-09-15"
---
# Approved functional design references

## System
- **Direction:** Operational ledger
- **Version:** v1-functional
- **Approved by:** Project product contract (functional Type 2 decision); aesthetic review remains Daniel's UAT responsibility
- **Date:** 2026-09-15

| ID | Reference | Surface | Version | State | Notes |
|---|---|---|---|---|---|
| UI-001 | `docs/product/08-UI-SPEC.md#structured-implementation-prompt-ui-001` | Entire private workbook | v1 | Accepted | Text specification; no image claimed/generated |

## Extracted rules
- Seven tabs; compact rows; frozen headers; filters; stable IDs.
- Raw timestamped API fields separated from human notes.
- Text statuses with restrained color; safe menu feedback and Run Log.
- No derived scores, competitor thumbnails, or publication control.

## Mobile geometry
Not applicable: V1 does not implement a custom mobile interface. Native Google Sheets is read-only convenience and uses its own edge-to-edge app viewport. No fixed aspect ratio, `devicePixelRatio`, or global scaling technique is introduced.

## Do not copy
Competitor visual identity, thumbnails, wording, video structure, vanity dashboards, hidden status meaning, or dense decorative cards.

## Gate
- [x] At least one accepted prompt/reference exists.
- [x] It names the surface and version.
- [x] Implementable rules are written.
- [x] Mobile geometry is explicitly not applicable and justified.
- [x] Visual/content patterns not to copy are identified.
