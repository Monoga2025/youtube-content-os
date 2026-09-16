---
artifact: data-permissions
phase: 10
status: approved
reason: "CR-002 local profile boundaries supersede the legacy Google-Sheet control plane."
last_updated: "2026-09-15"
---
# 10 — Data, identity, and permissions

Daniel and Sebastián are independent local owners. Each profile has its own SQLite database, source list, workbook, backup, logs, Evidence, Feedback, Missions, revision, and owner identity. The accepted names are fixed (`daniel`, `sebastian`); unknown/traversal names fail before storage access.

Every stateful local operation—source, refresh, mission, workbook export/import, backup/restore, maintenance, and schedule—requires the selected profile owner and fails closed on mismatch. Status/doctor show only profile health/counts and no local filesystem paths. Workbooks/backups embed profile identity and are rejected across profiles. Restore is transactional, logs a sanitized record, and advances revision to block stale replay.

Signals and source payload are derived data and follow retention/deletion. Human-owned signal notes, Evidence body, Feedback, and Missions round-trip through human-only backup. No publishing API or API adapter exists; Apps Script/Google Sheets are optional dormant legacy artifacts.
