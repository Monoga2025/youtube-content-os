# Research and strategy
Reviewed 2026-09-15. Official Google/YouTube sources support platform claims.

## Thesis
Reference channels supply bounded signals, not content to reproduce. A useful mission joins a current signal with Daniel's sanitized artifact, decision, failure, or measured result. The system stages an original recording brief and never publishes.

## Source-backed facts and boundaries
1. API calls require an API key or OAuth; writes/private data require authorization. MVP reads public data and stores its key in Script Properties. Source: https://developers.google.com/youtube/v3/docs
2. `channels.list`, `playlistItems.list`, and `videos.list` support the low-cost uploads workflow. Every request consumes quota; pagination adds calls. Source: https://developers.google.com/youtube/v3/determine_quota_cost
3. The supplied 81-unit/day figure for 10 channels × 4 refreshes is a planning estimate, not measured use; log actual calls/errors.
4. Non-authorized API data must be deleted/refreshed within 30 days and historical displays need accurate timestamps. Source: https://developers.google.com/youtube/terms/developer-policies
5. Until derived-metrics approval evidence exists, show raw timestamped statistics and human labels only—no custom ratios/composite scores. Source: https://developers.google.com/youtube/terms/derived-metrics-policy
6. Apps Script quotas can change; current docs list consumer limits including 20,000 URL Fetch calls/day, 90 minutes/day trigger runtime, and 6 minutes/execution. Partial failures must stop action. Source: https://developers.google.com/apps-script/guides/services/quotas
7. Native title/thumbnail tests choose by watch time, not CTR alone; packaging tests remain a human post-publication workflow. Source: https://support.google.com/youtube/answer/16391400
8. Review native audience-retention moments against observed behavior, not invented benchmarks. Source: https://support.google.com/youtube/answer/9314415

## Allowlist
Gentleman Programming; AI Jason; Greg Isenberg; BettaTech; midudev; MoureDev; SaaStr; Eloísa Wolf. Names are labels only; IDs stay blank until Daniel verifies them.

## Loop
Daily check → act only on new/fresh raw signals → Daniel curates → attach sanitized evidence → select one weekly mission → draft → privacy/originality approval → record → log native results and production time. Stop on partial data, missing verified ID, missing evidence, stale backlog, or privacy doubt.
