# Correction evidence — local-first final candidate

- Replayable RED: `evidence/correction-20260915/RED-fetch-timeout.txt` captures the pre-fix non-cooperative fetch timeout that did not settle within three seconds.
- GREEN: `npm test` and `npm run check` both complete with the current Node test summary (30 tests, 30 passed).
- Backup safety: profile-local filenames only, no overwrite, atomic temp-and-rename, canonical directory and symlink/reparse checks; v3 human backups include non-system human config and portable declassified Evidence references.
- Workbook: schema 3 binds profile/revision, preserves timestamps canonically at millisecond UTC precision, contains exactly eight sheets, and is sanitized after any Excel COM save with `tools/sanitize_xlsx.py`.
- Outputs: `outputs/final/daniel.xlsx` and `outputs/final/sebastian.xlsx` are the only current distributable workbooks. Phase 12 remains `in_progress` pending independent acceptance.
- Sources: Node `Promise.race` / timer semantics are documented at https://nodejs.org/api/timers.html and https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/race .
