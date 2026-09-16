const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const adapter = fs.readFileSync(path.join(root, 'apps-script', 'Code.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'apps-script', 'appsscript.json'), 'utf8'));

function loadAdapter(overrides = {}) {
  const sandbox = {
    ContentCore: require('../apps-script/Core.js'),
    console,
    Date,
    JSON,
    Array,
    Object,
    String,
    Math,
    ...overrides,
  };
  vm.createContext(sandbox);
  vm.runInContext(adapter, sandbox);
  return sandbox;
}

test('Apps Script adapter contains only approved YouTube read resources', () => {
  for (const forbidden of ['captions', 'commentThreads', 'comments', 'videos.insert', 'videos.update', 'youtube.upload']) {
    assert.equal(adapter.includes(forbidden), false, `forbidden API operation/resource: ${forbidden}`);
  }
  for (const allowed of ["fetchJson_('channels'", "fetchJson_('playlistItems'", "fetchJson_('videos'"]) {
    assert.equal(adapter.includes(allowed), true, `missing approved read resource: ${allowed}`);
  }
});

test('manifest has no Drive-wide or YouTube write scope', () => {
  const scopes = manifest.oauthScopes.join('\n');
  assert.match(scopes, /spreadsheets\.currentonly/);
  assert.match(scopes, /script\.external_request/);
  assert.doesNotMatch(scopes, /auth\/drive(?:\s|$)/);
  assert.doesNotMatch(scopes, /auth\/youtube(?:\.force-ssl|\.upload)?(?:\s|$)/);
});

test('seed reference names never include guessed channel IDs', () => {
  assert.match(adapter, /SEED_SOURCE_NAMES/);
  assert.match(adapter, /return \[name, '', false/);
});

test('batch assembly rejects incomplete playlist pages and missing requested videos before signal writes', () => {
  const incompletePlaylist = loadAdapter();
  incompletePlaylist.fetchJson_ = (resource) => {
    if (resource === 'channels') return { items: [{ id: 'channel-1', snippet: { title: 'Reference' }, contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }] };
    if (resource === 'playlistItems') return { items: [], pageInfo: { totalResults: 1 } };
    throw new Error('videos must not be requested after incomplete playlist data');
  };
  assert.throws(() => incompletePlaylist.fetchSignalBatch_([{ channelId: 'channel-1' }], 'test-key', { requestCount: 0 }), /playlist.*incomplete/i);

  const missingVideo = loadAdapter();
  missingVideo.fetchJson_ = (resource) => {
    if (resource === 'channels') return { items: [{ id: 'channel-1', snippet: { title: 'Reference' }, contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }] };
    if (resource === 'playlistItems') return { items: [{ contentDetails: { videoId: 'video-1' } }], pageInfo: { totalResults: 1 } };
    if (resource === 'videos') return { items: [] };
    throw new Error('unexpected resource');
  };
  assert.throws(() => missingVideo.fetchSignalBatch_([{ channelId: 'channel-1' }], 'test-key', { requestCount: 0 }), /video response was incomplete/i);
});

test('upload discovery stops after the documented 50 recent items without following historical pages', () => {
  const playlistRequests = [];
  const runtime = loadAdapter();
  runtime.fetchJson_ = (resource, params) => {
    if (resource === 'channels') return { items: [{ id: 'channel-1', snippet: { title: 'Reference' }, contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }] };
    if (resource === 'playlistItems') {
      playlistRequests.push(params);
      if (params.pageToken) throw new Error('historical playlist page must not be requested');
      return {
        items: Array.from({ length: 50 }, (_, index) => ({ contentDetails: { videoId: `video-${index}` } })),
        pageInfo: { totalResults: 75 },
        nextPageToken: 'older-page',
      };
    }
    if (resource === 'videos') {
      return { items: params.id.split(',').map((id) => ({ id, snippet: { channelId: 'channel-1', title: id, publishedAt: '2026-09-15T00:00:00Z' }, statistics: {} })) };
    }
    throw new Error('unexpected resource');
  };

  const batch = runtime.fetchSignalBatch_([{ channelId: 'channel-1' }], 'test-key', { requestCount: 0 });
  assert.equal(batch.signals.length, 50);
  assert.equal(playlistRequests.length, 1);
  assert.equal(playlistRequests[0].maxResults, 50);
  assert.equal(playlistRequests[0].pageToken, undefined);
});

test('upload discovery rejects an incomplete first bounded page without requesting history', () => {
  const runtime = loadAdapter();
  runtime.fetchJson_ = (resource, params) => {
    if (resource === 'channels') return { items: [{ id: 'channel-1', snippet: { title: 'Reference' }, contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }] };
    if (resource === 'playlistItems') {
      assert.equal(params.pageToken, undefined);
      return { items: Array.from({ length: 49 }, (_, index) => ({ contentDetails: { videoId: `video-${index}` } })), pageInfo: { totalResults: 50 } };
    }
    throw new Error('videos must not be requested after incomplete bounded playlist data');
  };

  assert.throws(() => runtime.fetchSignalBatch_([{ channelId: 'channel-1' }], 'test-key', { requestCount: 0 }), /playlist.*incomplete/i);
});

test('batch assembly requests bounded discovered video IDs in API-sized complete batches', () => {
  const requestedBatches = [];
  const runtime = loadAdapter();
  runtime.fetchJson_ = (resource, params) => {
    if (resource === 'channels') return { items: [{ id: 'channel-1', snippet: { title: 'Reference' }, contentDetails: { relatedPlaylists: { uploads: 'uploads-1' } } }] };
    if (resource === 'playlistItems') return { items: Array.from({ length: 50 }, (_, index) => ({ contentDetails: { videoId: `video-${index}` } })), pageInfo: { totalResults: 75 }, nextPageToken: 'older-page' };
    if (resource === 'videos') {
      const ids = params.id.split(',');
      requestedBatches.push(ids);
      return { items: ids.map((id) => ({ id, snippet: { channelId: 'channel-1', title: id, publishedAt: '2026-09-15T00:00:00Z' }, statistics: {} })) };
    }
    throw new Error('unexpected resource');
  };
  const batch = runtime.fetchSignalBatch_([{ channelId: 'channel-1' }], 'test-key', { requestCount: 0 });
  assert.equal(batch.signals.length, 50);
  assert.ok(requestedBatches.every((ids) => ids.length <= 50));
  assert.equal(requestedBatches.length, 1);
});

test('retention maintenance has manual and trigger-safe entry points for 90-day logs and removed sources', () => {
  assert.match(adapter, /function runRetentionMaintenance\(/);
  assert.match(adapter, /function scheduledRetentionMaintenance\(/);
  assert.match(adapter, /purgeExpiredRunLogs_/);
  assert.match(adapter, /90 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(adapter, /purgeRemovedSourcePayloads_/);
});

test('retention purges expired run logs and payloads for disabled configured sources deterministically', () => {
  const writes = [];
  const sheet = {
    getMaxRows: () => 10,
    getRange: () => ({ clearContent() {}, setValues: (values) => writes.push(values) }),
  };
  const runtime = loadAdapter({ SpreadsheetApp: { getActive: () => ({ getSheetByName: () => sheet }) } });
  runtime.readObjects_ = (name) => {
    if (name === 'Run Log') return [
      { runId: 'old', action: 'refresh', startedAt: '2000-01-01T00:00:00Z', endedAt: '2000-01-01T00:00:01Z', status: 'SUCCEEDED', requestCount: 1, safeMessage: 'Completed.' },
      { runId: 'new', action: 'refresh', startedAt: '2099-01-01T00:00:00Z', endedAt: '2099-01-01T00:00:01Z', status: 'SUCCEEDED', requestCount: 1, safeMessage: 'Completed.' },
    ];
    if (name === 'Config') return [{ channelId: 'removed-channel', enabled: false }];
    if (name === 'Signals') return [{ videoId: 'old-video', channelId: 'removed-channel' }, { videoId: 'kept-video', channelId: 'active-channel' }];
    return [];
  };
  assert.equal(runtime.purgeExpiredRunLogs_(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(writes.at(-1))), [['new', 'refresh', '2099-01-01T00:00:00Z', '2099-01-01T00:00:01Z', 'SUCCEEDED', 1, 'Completed.']]);
  assert.equal(runtime.purgeRemovedSourcePayloads_(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(writes.at(-1))), [['kept-video', 'active-channel', null, null, null, null, null, null, null, null, null, null]]);
});

test('runSafely records STARTED and lock-contention SKIPPED records with safe messages', () => {
  const rows = [];
  const sheet = { appendRow: (row) => rows.push(row), getRange: () => ({ setValues() { return this; }, setFontWeight() { return this; }, setBackground() { return this; } }), setFrozenRows() {} };
  const active = { getSheetByName: () => sheet, insertSheet: () => sheet, toast() {} };
  const started = loadAdapter({
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Utilities: { getUuid: () => 'run-1' },
    SpreadsheetApp: { getActive: () => active },
  });
  started.runSafely_('safeAction', () => 'ok');
  assert.deepEqual(rows.map((row) => row[4]), ['STARTED', 'SUCCEEDED']);

  const skipped = loadAdapter({
    LockService: { getScriptLock: () => ({ tryLock: () => false }) },
    Utilities: { getUuid: () => 'run-2' },
    SpreadsheetApp: { getActive: () => active },
  });
  assert.throws(() => skipped.runSafely_('safeAction', () => 'never'), /skipped/i);
  assert.equal(rows.at(-1)[4], 'SKIPPED');
  assert.doesNotMatch(rows.at(-1)[6], /AIza|test-key/i);
});
