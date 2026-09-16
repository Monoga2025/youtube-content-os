---
artifact: ui-spec
phase: 8
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 08 — UI specification

## Base system
- **Direction:** Operational ledger with compact Dashboard and editorial Missions tab.
- **Viewport:** desktop Google Sheets, designed at ≥1280 px; native Sheets responsive behavior.
- **Typography/spacing:** Google Sheets default sans; 10–11 pt body, 11–12 pt headers; compact 24–32 px rows; wrapped long-text cells.
- **Color:** neutral cells; blue actions; green/amber/red state accents always paired with text.
- **Accessibility:** text states, visible instructions, frozen header, filters, descriptive tabs/menu labels, no merged operational cells.
- **Mobile contract:** no custom mobile UI. Native Sheets read-only convenience occupies the available app viewport; 360/375/390/412/430 custom geometry, hero, carousel, and DOM scaling are not applicable.

## Navigation and components
Tabs: `Dashboard`, `Config`, `Signals`, `Evidence`, `Missions`, `Feedback`, `Run Log`. Menu: `Initialize workbook`, `Refresh signals`, `Create weekly mission`, `Validate approval`, `Purge stale API data`.

- **Status cell:** validated enum plus text; never color-only.
- **Timestamp:** ISO 8601 UTC; human schedule notes `America/Bogota`.
- **Action:** Apps Script menu item with toast feedback; destructive purge requires confirmation.
- **Table:** frozen first row, filter, stable ID first, raw fields before human fields.
- **Error:** safe message + run ID; no API key/payload.

## Key surfaces
### Dashboard
First view shows last successful refresh, source health, new-signal count, current-week mission/status, next human action, and 180-minute budget. Empty directs to Config; failure directs to Run Log.

### Config
Columns: display name, channel ID, enabled, verified by, verified at, last checked. Channel ID remains blank by default; only syntactically valid enabled IDs run.

### Signals
Columns: video ID, source ID/name, title, publishedAt, fetchedAt, raw view/like/comment counts, status, pillar, relevance note. No ratio/composite column.

### Evidence and Missions
Evidence captures ID, pillar, sanitized summary, proof, privacy status. Missions links one curated signal and verified evidence item; displays original angle, outline, derivatives, time budget, status, approver, timestamps.

### Run Log / error state
Run ID, action, start/end, status, safe counts/message. Partial fetch: `Refresh stopped; no partial batch was written.`

## Structured implementation prompt (UI-001)
Create a private Google Sheets operational ledger for one technical creator. Use seven clearly named tabs, compact data-dense rows, frozen headers, filters, text status plus restrained color, and an Apps Script menu. Dashboard must expose freshness, health, current mission, next action, and production budget. Signals must separate raw timestamped API fields from human notes and contain no derived score. Avoid decorative thumbnails, card-heavy SaaS styling, hidden states, merged cells, or auto-publish controls.

## Gate
- [x] Key surfaces have implementable specifications.
- [x] A structured prompt/reference is registered.
- [x] Reference UI-001 is in `design-reference/APPROVED.md`.
- [x] States and responsive scope are defined.
- [x] Mobile density rules are explicitly not applicable to the native-Sheets-only V1.
- [x] Native Sheets covers 360–430 px without custom letterboxing/global scaling; mobile remains read-only convenience.
- [x] Screenshots were not supplied, so geometric reproduction is not applicable.
- [x] Components have rules.
- [x] Implementation requires no invented product behavior.
