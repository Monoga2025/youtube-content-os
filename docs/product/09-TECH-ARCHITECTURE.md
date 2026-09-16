---
artifact: tech-architecture
phase: 9
status: approved
reason: "CR-002 local-first profile architecture is active; legacy Apps Script is optional."
last_updated: "2026-09-15"
---
# 09 — Local-first technical architecture

Node 24 uses built-in SQLite, fetch, crypto, and node:test. `%LOCALAPPDATA%\Monoga\YouTubeContentOS\profiles\daniel` and `...\sebastian` are separate authoritative roots. A profile name is an allow-listed identifier, never a path; every stateful command receives it and checks the matching owner identity.

```text
profile owner CLI → owner-locked profile SQLite ↔ revision-bound XLSX
official RSS → validate every enabled source → one transaction → profile SQLite
```

RSS is the proven zero-key core path. Google Sheets, Apps Script, and Data API enrichment are dormant optional integrations; API mode fails closed because no adapter exists. Refresh performs all fetch/validation before its one local transaction. Human-only recovery stores Missions, signal notes, Evidence body, and Feedback, then restore increments revision so prior workbooks fail stale validation.
