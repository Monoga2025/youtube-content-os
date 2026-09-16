# Decisions
## ADR-001 — Local-first, profile-owned operating system
- **Status:** Accepted
- **Date/phase:** 2026-09-15 / Phase 9
- **Decision:** Node 24 + SQLite is authoritative. Daniel and Sebastián each own an isolated local profile; Apps Script/Google Sheets remain dormant optional legacy integrations.
- **Why:** local profile boundaries prevent data mixing while RSS provides a zero-key validated input.
- **Consequences:** no guessed channel IDs, no automatic publication, and a profile/owner lock applies to every local stateful operation.

## ADR-002 — Optimize learning, not vanity volume
- **Status:** Accepted
- **Date/phase:** 2026-09-15 / Phase 2
- **Decision:** evaluate recurring viewers per additional production hour using native/raw observations and a time log. No baseline or target is invented before observation.
