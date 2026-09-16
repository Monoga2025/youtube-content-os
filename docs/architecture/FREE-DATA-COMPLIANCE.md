# Free-data architecture and compliance
## Flow
Verified channel IDs → YouTube `channels.list`/`playlistItems.list`/`videos.list` → raw timestamped public fields → private Sheet → human relevance + sanitized evidence → original brief → human approval.

## Allowed
- Minimum public metadata/statistics via YouTube Data API v3.
- Timestamped snapshots refreshed/deleted within 30 days.
- API key in Apps Script Script Properties; verified channel IDs in private configuration.
- Original summaries/briefs from metadata plus Daniel's sanitized evidence.

## Prohibited in MVP
- Downloading/scraping third-party video/transcripts; third-party `captions.download`.
- Commenter identities, guessed channel IDs, unapproved ratios/composite scores.
- Auto-publication or unsanitized project data in generation.

## Retention and failure
Refresh/delete non-authorized API payloads within 30 days. Keep payload-free run logs 90 days. Disable removed sources and purge their payloads. Any partial response, quota/credential failure, or policy uncertainty logs failure and produces no brief.

Sources: https://developers.google.com/youtube/v3/docs · https://developers.google.com/youtube/v3/determine_quota_cost · https://developers.google.com/youtube/terms/developer-policies · https://developers.google.com/youtube/terms/derived-metrics-policy · https://developers.google.com/apps-script/guides/services/quotas
