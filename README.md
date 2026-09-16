# Local-first YouTube Content OS

## Two independent local profiles
Daniel and Sebastián have isolated SQLite, workbook, backups, logs, sources, missions, feedback, evidence, revisions, and owner identity below `%LOCALAPPDATA%\Monoga\YouTubeContentOS\profiles\<profile>`. `--profile` accepts only `daniel` or `sebastian`; it never accepts paths. RSS editorial strategy can be shared, but all channel data and operating records are profile-owned.

### First run — Daniel
```powershell
$env:YOUTUBE_CONTENT_OS_OWNER='daniel'
npm run local -- init --profile daniel --mode rss
# After Daniel creates a public YouTube channel, he must manually copy its verified UC… channel ID:
npm run local -- sources add --profile daniel --channel-id UCxxxxxxxxxxxxxxxxxxxxxx
npm run local -- refresh --profile daniel --mode rss
npm run local -- workbook export --profile daniel
```

### First run — Sebastián
```powershell
$env:YOUTUBE_CONTENT_OS_OWNER='sebastian'
npm run local -- init --profile sebastian --mode rss
# After Sebastián creates a public YouTube channel, he must manually copy its verified UC… channel ID:
npm run local -- sources add --profile sebastian --channel-id UCxxxxxxxxxxxxxxxxxxxxxx
npm run local -- refresh --profile sebastian --mode rss
npm run local -- workbook export --profile sebastian
```

Both initial profiles are safe and unresolved: neither contains a guessed channel ID nor an enabled source. Each owner must provide only their own manually verified public channel ID after creating their channel; no channel is created by this program.

## Commands
All stateful operations require `--profile daniel|sebastian`: `init`, `sources add/remove`, `refresh --mode rss`, `workbook export/import`, `mission create`, `maintenance`, `run --scheduled`, `backup --human-data-only`, and `restore`. `status --json` and `doctor` may report aggregate profile health without exposing local paths. Set `YOUTUBE_CONTENT_OS_OWNER` to the profile owner; an explicitly wrong owner fails closed for all stateful operations.

`backup --human-data-only` and `restore` preserve Missions, signal notes, Evidence body, and Feedback fields but exclude source-derived RSS payload. A backup/workbook embeds its profile identity and cannot be restored/imported through the other profile. Restore is transactional, increments the local revision, records sanitized evidence, and invalidates prior workbook revisions.

## Safety and integration state
SQLite is authoritative; XLSX is a revision-protected editable surface. The workbook has exactly Dashboard, Missions, Signals, Evidence, Feedback, Config, Run Log, and hidden `_Meta`, with typed date values and validation for editable status/integrity fields. RSS accepts only the official YouTube Atom feed, fails closed on unsafe XML, redirects, and timeouts, and refreshes every enabled source atomically.

API mode is intentionally unavailable: no local API adapter exists, so `refresh --mode api` fails closed even if `YOUTUBE_API_KEY` exists. Apps Script and Google Sheets are dormant optional legacy material, never blockers for the proven local RSS workflow. Publication is deliberately absent; all missions remain DRAFT until human approval.

## Sources
- https://nodejs.org/api/sqlite.html
- https://nodejs.org/api/globals.html#fetch
- https://developers.google.com/youtube/v3/guides/implementation/feeds
