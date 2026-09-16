/* Google Apps Script adapter. Keep business rules in Core.js. */
var YT_API_BASE = 'https://www.googleapis.com/youtube/v3/';
var MAX_RECENT_UPLOADS_PER_CHANNEL = 50;
var SHEETS = {
  Dashboard: ['Metric', 'Value', 'Updated At'],
  Config: ['Display Name', 'Channel ID', 'Enabled', 'Verified By', 'Verified At', 'Last Checked At'],
  Signals: ['Video ID', 'Channel ID', 'Channel Name', 'Title', 'Published At', 'Fetched At', 'View Count', 'Like Count', 'Comment Count', 'Status', 'Pillar', 'Relevance Note'],
  Evidence: ['Evidence ID', 'Pillar', 'Sanitized Summary', 'Proof', 'Status', 'Privacy Status', 'Verified At'],
  Missions: ['Brief ID', 'Week', 'Signal Video ID', 'Evidence ID', 'Pillar', 'Mission', 'Source Observation', 'Internal Evidence', 'Outline', 'Production Budget Minutes', 'Status', 'Approved By', 'Approved At'],
  Feedback: ['Observation ID', 'Brief ID', 'Video ID', 'Observed At', 'Extra Production Minutes', 'Native YouTube Notes'],
  'Run Log': ['Run ID', 'Action', 'Started At', 'Ended At', 'Status', 'Request Count', 'Safe Message']
};
var SEED_SOURCE_NAMES = ['Gentleman Programming', 'AI Jason', 'Greg Isenberg', 'BettaTech', 'midudev', 'MoureDev', 'SaaStr', 'Eloísa Wolf'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('YouTube Content OS')
    .addItem('Initialize workbook', 'initializeWorkbook')
    .addItem('Refresh signals', 'refreshSignals')
    .addItem('Create weekly mission', 'createWeeklyMission')
    .addItem('Run retention maintenance', 'runRetentionMaintenance')
    .addToUi();
}

function initializeWorkbook() {
  var owner = bootstrapOwner_();
  ContentCore.assertOwner(Session.getEffectiveUser().getEmail(), owner);
  Object.keys(SHEETS).forEach(function (name) { ensureSheet_(name, SHEETS[name]); });
  var config = SpreadsheetApp.getActive().getSheetByName('Config');
  if (config.getLastRow() === 1) {
    config.getRange(2, 1, SEED_SOURCE_NAMES.length, 6).setValues(SEED_SOURCE_NAMES.map(function (name) {
      return [name, '', false, '', '', ''];
    }));
  }
  PropertiesService.getScriptProperties().setProperty('AUTOMATION_ENABLED', 'false');
  updateDashboard_('Status', 'Initialized; configure verified channel IDs and API_KEY. Automation is disabled.');
  SpreadsheetApp.getActive().toast('Workbook initialized. No channel IDs or API keys were guessed.');
}

function refreshSignals() {
  return runSafely_('refreshSignals', function (context) {
    assertConfiguredOwner_();
    if (PropertiesService.getScriptProperties().getProperty('AUTOMATION_ENABLED') !== 'true') {
      throw new Error('Automation is disabled. Set AUTOMATION_ENABLED=true after staging configuration review.');
    }
    var apiKey = requiredProperty_('API_KEY');
    var sources = readActiveSources_();
    if (!sources.length) throw new Error('No verified active channel IDs. Add one before refreshing.');
    var batch = fetchSignalBatch_(sources, apiKey, context);
    ContentCore.validateApiBatch(batch.results);
    var counts = writeSignals_(batch.signals);
    updateConfigChecks_(sources, batch.fetchedAt);
    updateDashboard_('Last successful refresh', batch.fetchedAt);
    updateDashboard_('Last refresh result', counts.created + ' new; ' + counts.updated + ' refreshed');
    SpreadsheetApp.getActive().toast('Refresh complete: ' + counts.created + ' new, ' + counts.updated + ' refreshed.');
    return counts;
  });
}

function createWeeklyMission() {
  return runSafely_('createWeeklyMission', function () {
    var owner = assertConfiguredOwner_();
    var signal = readObjects_('Signals').filter(function (row) { return row.status === 'CURATED' && row.pillar; })[0];
    var evidence = readObjects_('Evidence').filter(function (row) {
      return row.status === 'VERIFIED' && row.privacyStatus === 'SAFE' && signal && row.pillar === signal.pillar;
    })[0];
    if (!signal || !evidence) throw new Error('A CURATED signal and matching SAFE VERIFIED evidence are required.');
    var week = Utilities.formatDate(new Date(), 'America/Bogota', "YYYY-'W'ww");
    var mission = ContentCore.createMissionBrief({
      operatorEmail: Session.getEffectiveUser().getEmail(), ownerEmail: owner, week: week,
      signal: signal, evidence: evidence
    });
    var sheet = SpreadsheetApp.getActive().getSheetByName('Missions');
    var existing = readObjects_('Missions').some(function (row) { return row.briefId === mission.briefId; });
    if (existing) throw new Error('A mission already exists for ' + week + '; update it instead of duplicating it.');
    sheet.appendRow(objectToMissionRow_(mission));
    updateDashboard_('Current mission', mission.briefId + ' — DRAFT');
    SpreadsheetApp.getActive().toast('Mission created as DRAFT. Publication remains blocked pending Daniel approval.');
    return mission;
  });
}

function purgeStaleApiData() {
  return runRetentionMaintenance();
}

function runRetentionMaintenance() {
  return runSafely_('runRetentionMaintenance', function () {
    assertConfiguredOwner_();
    var stale = purgeStaleSignalPayloads_();
    var removedSources = purgeRemovedSourcePayloads_();
    var expiredRuns = purgeExpiredRunLogs_();
    updateDashboard_('Retention purge', new Date().toISOString() + ': removed ' + (stale + removedSources) + ' signals and ' + expiredRuns + ' run logs');
    return { staleSignals: stale, removedSourceSignals: removedSources, expiredRunLogs: expiredRuns };
  });
}

function scheduledRetentionMaintenance() {
  return runRetentionMaintenance();
}

function fetchSignalBatch_(sources, apiKey, context) {
  var fetchedAt = new Date().toISOString();
  var channels = fetchJson_('channels', { part: 'snippet,contentDetails', id: sources.map(function (s) { return s.channelId; }).join(','), maxResults: 50 }, apiKey, context);
  var channelById = {};
  (channels.items || []).forEach(function (channel) {
    if (channel && channel.id && channel.snippet && channel.contentDetails && channel.contentDetails.relatedPlaylists && channel.contentDetails.relatedPlaylists.uploads) {
      channelById[channel.id] = { name: channel.snippet.title, uploads: channel.contentDetails.relatedPlaylists.uploads };
    }
  });
  if (sources.some(function (source) { return !channelById[source.channelId]; })) throw new Error('Channel response was incomplete; no partial batch was written.');
  var videoIds = [];
  sources.forEach(function (source) {
    videoIds = videoIds.concat(fetchPlaylistVideoIds_(channelById[source.channelId].uploads, apiKey, context));
  });
  videoIds = Array.from(new Set(videoIds));
  var videoItems = [];
  for (var start = 0; start < videoIds.length; start += 50) {
    var requestedIds = videoIds.slice(start, start + 50);
    var videos = fetchJson_('videos', { part: 'snippet,statistics', id: requestedIds.join(','), maxResults: 50 }, apiKey, context);
    if (!videos || !Array.isArray(videos.items)) throw new Error('Video response was incomplete; no partial batch was written.');
    videoItems = videoItems.concat(videos.items);
  }
  var videoById = {};
  videoItems.forEach(function (video) { if (video && video.id) videoById[video.id] = video; });
  if (videoIds.some(function (videoId) { return !videoById[videoId]; })) throw new Error('Video response was incomplete; no partial batch was written.');
  var signals = videoIds.map(function (videoId) {
    var video = videoById[videoId];
    if (!video.snippet || !video.snippet.channelId || !channelById[video.snippet.channelId]) throw new Error('Video response was incomplete; no partial batch was written.');
    var stats = video.statistics || {};
    return {
      videoId: video.id, channelId: video.snippet.channelId,
      channelName: channelById[video.snippet.channelId].name, title: video.snippet.title,
      publishedAt: video.snippet.publishedAt, fetchedAt: fetchedAt,
      viewCount: stats.viewCount || '0', likeCount: stats.likeCount || '0', commentCount: stats.commentCount || '0'
    };
  });
  return { fetchedAt: fetchedAt, signals: signals, results: [{ complete: true }] };
}

function fetchPlaylistVideoIds_(playlistId, apiKey, context) {
  var page = fetchJson_('playlistItems', { part: 'contentDetails', playlistId: playlistId, maxResults: MAX_RECENT_UPLOADS_PER_CHANNEL }, apiKey, context);
  if (!page || !Array.isArray(page.items) || !page.pageInfo || typeof page.pageInfo.totalResults !== 'number') {
    throw new Error('Playlist response was incomplete; no partial batch was written.');
  }
  var expectedItems = Math.min(page.pageInfo.totalResults, MAX_RECENT_UPLOADS_PER_CHANNEL);
  if (page.items.length !== expectedItems) throw new Error('Playlist response was incomplete; no partial batch was written.');
  return page.items.map(function (item) {
    if (!item || !item.contentDetails || !item.contentDetails.videoId) throw new Error('Playlist response was incomplete; no partial batch was written.');
    return item.contentDetails.videoId;
  });
}

function fetchJson_(resource, params, apiKey, context) {
  var query = Object.keys(params).map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]); }).join('&');
  var response = UrlFetchApp.fetch(YT_API_BASE + resource + '?' + query + '&key=' + encodeURIComponent(apiKey), { muteHttpExceptions: true });
  context.requestCount += 1;
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('YouTube API request failed for ' + resource + '.');
  try { return JSON.parse(response.getContentText()); } catch (error) { throw new Error('YouTube API returned invalid JSON for ' + resource + '.'); }
}

function writeSignals_(incoming) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Signals');
  var plan = ContentCore.planSignalUpsert(readObjects_('Signals'), incoming);
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), SHEETS.Signals.length).clearContent();
  if (plan.rows.length) sheet.getRange(2, 1, plan.rows.length, SHEETS.Signals.length).setValues(plan.rows.map(signalToRow_));
  return plan.counts;
}

function runSafely_(action, operation) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    appendRun_({ runId: Utilities.getUuid(), requestCount: 0, startedAt: new Date().toISOString() }, action, 'SKIPPED', 'Another run is active; skipped.');
    throw new Error('Another run is active; this run was skipped.');
  }
  var context = { runId: Utilities.getUuid(), requestCount: 0, startedAt: new Date().toISOString() };
  try {
    appendRun_(context, action, 'STARTED', 'Started.');
    var result = operation(context);
    appendRun_(context, action, 'SUCCEEDED', 'Completed.');
    return result;
  } catch (error) {
    appendRun_(context, action, 'FAILED', 'Operation failed. Review the execution details without storing credentials or payloads.');
    SpreadsheetApp.getActive().toast('Operation stopped. Review Run Log: ' + context.runId);
    throw error;
  } finally { lock.releaseLock(); }
}

function purgeStaleSignalPayloads_() {
  var cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return rewriteSignals_(function (row) { return Date.parse(row.fetchedAt) >= cutoff; });
}

function purgeRemovedSourcePayloads_() {
  var removed = {};
  readObjects_('Config').forEach(function (row) {
    var channelId = String(row.channelId || '').trim();
    var enabled = row.enabled === true || String(row.enabled).toLowerCase() === 'true';
    if (channelId && !enabled) removed[channelId] = true;
  });
  return rewriteSignals_(function (row) { return !removed[row.channelId]; });
}

function rewriteSignals_(keep) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Signals');
  var rows = readObjects_('Signals');
  var kept = rows.filter(keep);
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), SHEETS.Signals.length).clearContent();
  if (kept.length) sheet.getRange(2, 1, kept.length, SHEETS.Signals.length).setValues(kept.map(signalToRow_));
  return rows.length - kept.length;
}

function purgeExpiredRunLogs_() {
  var cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  var sheet = SpreadsheetApp.getActive().getSheetByName('Run Log');
  var rows = readObjects_('Run Log');
  var kept = rows.filter(function (row) { return Date.parse(row.startedAt) >= cutoff; });
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), SHEETS['Run Log'].length).clearContent();
  if (kept.length) sheet.getRange(2, 1, kept.length, SHEETS['Run Log'].length).setValues(kept.map(runLogToRow_));
  return rows.length - kept.length;
}

function bootstrapOwner_() {
  var props = PropertiesService.getScriptProperties();
  var owner = props.getProperty('OWNER_EMAIL');
  var effective = Session.getEffectiveUser().getEmail();
  if (!owner) {
    if (!effective) throw new Error('Cannot determine the effective user; configure OWNER_EMAIL manually.');
    props.setProperty('OWNER_EMAIL', effective);
    owner = effective;
  }
  return owner;
}
function assertConfiguredOwner_() { var owner = requiredProperty_('OWNER_EMAIL'); ContentCore.assertOwner(Session.getEffectiveUser().getEmail(), owner); return owner; }
function requiredProperty_(name) { var value = PropertiesService.getScriptProperties().getProperty(name); if (!value) throw new Error('Missing Script Property: ' + name); return value; }

function ensureSheet_(name, headers) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#d9eaf7');
  sheet.setFrozenRows(1);
  return sheet;
}

function readActiveSources_() {
  return readObjects_('Config').map(function (row) {
    return ContentCore.normalizeChannelSource({ displayName: row.displayName, channelId: row.channelId, enabled: row.enabled, verifiedBy: row.verifiedBy, verifiedAt: row.verifiedAt });
  }).filter(function (source) { return source.enabled; });
}

function readObjects_(sheetName) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(headerKey_);
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(function (values) {
    var row = {}; headers.forEach(function (key, index) { row[key] = values[index]; }); return row;
  }).filter(function (row) { return Object.keys(row).some(function (key) { return row[key] !== ''; }); });
}

function headerKey_(header) { return String(header).toLowerCase().replace(/[^a-z0-9]+(.)/g, function (_, chr) { return chr.toUpperCase(); }); }
function signalToRow_(s) { return [s.videoId, s.channelId, s.channelName, s.title, s.publishedAt, s.fetchedAt, s.viewCount, s.likeCount, s.commentCount, s.status, s.pillar, s.relevanceNote]; }
function runLogToRow_(row) { return [row.runId, row.action, row.startedAt, row.endedAt, row.status, row.requestCount, row.safeMessage]; }
function objectToMissionRow_(m) { return [m.briefId, m.week, m.signalVideoId, m.evidenceId, m.pillar, m.mission, m.sourceObservation, m.internalEvidence, m.outline, m.productionBudgetMinutes, m.status, m.approvedBy, m.approvedAt]; }

function updateConfigChecks_(sources, timestamp) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Config');
  var active = {}; sources.forEach(function (s) { active[s.channelId] = true; });
  if (sheet.getLastRow() < 2) return;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  values.forEach(function (row) { if (active[row[1]]) row[5] = timestamp; });
  sheet.getRange(2, 1, values.length, 6).setValues(values);
}

function updateDashboard_(metric, value) {
  var sheet = ensureSheet_('Dashboard', SHEETS.Dashboard);
  var rows = readObjects_('Dashboard');
  var index = rows.findIndex(function (row) { return row.metric === metric; });
  var record = [metric, ContentCore.safeCell(value), new Date().toISOString()];
  if (index >= 0) sheet.getRange(index + 2, 1, 1, 3).setValues([record]); else sheet.appendRow(record);
}

function appendRun_(context, action, status, message) {
  var sheet = ensureSheet_('Run Log', SHEETS['Run Log']);
  sheet.appendRow([context.runId, action, context.startedAt, new Date().toISOString(), status, context.requestCount, ContentCore.safeCell(message)]);
}
