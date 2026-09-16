# Local-first setup and smoke test

## Daniel and Sebastián: independent first run

The active system is local Node/SQLite/RSS. Google Sheets, Apps Script and the YouTube API are **dormant optional legacy integrations**; do not use them for first run.

For each owner, choose a channel ID and positioning only after that channel exists. Those values remain unresolved until the owner verifies them; never guess a channel ID.

```powershell
npm test
npm run check
node bin/youtube-content-os.js init --profile daniel --mode rss
node bin/youtube-content-os.js init --profile sebastian --mode rss
node bin/youtube-content-os.js sources add --profile daniel --channel-id <verified-channel-id>
node bin/youtube-content-os.js refresh --profile daniel --mode rss
node bin/youtube-content-os.js workbook export --profile daniel
node bin/youtube-content-os.js workbook export --profile sebastian
```

A provenance-bound mission requires a curated local signal and verified sanitized evidence. Use `evidence add --signal-id <id> --body <text>`, then `mission create --signal-id <id> --evidence-id <id> --title <title>`. Use `mission draft --title <title>` only for an editorial draft with no source claim. Every public state remains DRAFT pending human approval.

Backups accept only a safe JSON filename under the selected profile's canonical `backups` directory, refuse overwrite, and restore only from that directory. Restore is transactional, portable to a clean same-profile store, increments revision and invalidates old workbooks.

## Legacy note

Apps Script instructions are dormant legacy reference only. They are not a setup requirement, are not a smoke-test path, and do not authorize Google API credentials or publishing.
