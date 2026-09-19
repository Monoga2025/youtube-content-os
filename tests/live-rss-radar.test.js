'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Setup isolated test environment in temp directory
const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ytos-live-rss-test-'));
const prevHome = process.env.YOUTUBE_CONTENT_OS_HOME;
process.env.YOUTUBE_CONTENT_OS_HOME = tempHome;

const dashboardDb = require('../lib/dashboard-db.js');
const { server, runPeriodicRssSync, rssInterval } = require('../server.js');

let httpServer;
let baseUrl;
const nativeFetch = globalThis.fetch;

test.after(() => {
  if (httpServer) {
    try { httpServer.close(); } catch {}
  }
  if (rssInterval) {
    clearInterval(rssInterval);
  }
  dashboardDb.closeDb();
  if (prevHome === undefined) {
    delete process.env.YOUTUBE_CONTENT_OS_HOME;
  } else {
    process.env.YOUTUBE_CONTENT_OS_HOME = prevHome;
  }
  try {
    fs.rmSync(tempHome, { recursive: true, force: true });
  } catch {}
});

test('configured_sources: insertion, query, deactivation and reactivation per profile', () => {
  // Add source for Daniel
  const source = dashboardDb.addConfiguredSource('daniel', 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'Google Developers');
  assert.equal(source.profile, 'daniel');
  assert.equal(source.channel_id, 'UC_x5XG1OV2P6uZZ5FSM9Ttw');
  assert.equal(source.channel_name, 'Google Developers');
  assert.equal(source.enabled, 1);

  // Query active sources
  let sources = dashboardDb.getConfiguredSources('daniel');
  assert.equal(sources.length, 1);
  assert.equal(sources[0].channel_id, 'UC_x5XG1OV2P6uZZ5FSM9Ttw');

  // Deactivate source
  const removeResult = dashboardDb.removeConfiguredSource('daniel', 'UC_x5XG1OV2P6uZZ5FSM9Ttw');
  assert.equal(removeResult.removed, true);
  assert.equal(removeResult.channelId, 'UC_x5XG1OV2P6uZZ5FSM9Ttw');

  // Active query should now be empty
  sources = dashboardDb.getConfiguredSources('daniel');
  assert.equal(sources.length, 0);

  // Reactivate with updated name
  const reactivated = dashboardDb.addConfiguredSource('daniel', 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'Google Developers Official');
  assert.equal(reactivated.channel_name, 'Google Developers Official');
  assert.equal(reactivated.enabled, 1);

  sources = dashboardDb.getConfiguredSources('daniel');
  assert.equal(sources.length, 1);
  assert.equal(sources[0].channel_name, 'Google Developers Official');
});

test('rss_radar_signals: deduplication, upsert and preservation of human curation', () => {
  const source = {
    id: 'src-test-01',
    channel_id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    channel_name: 'Google Developers'
  };

  const initialEntries = [
    {
      videoId: 'v-001',
      title: 'First Architecture Video',
      publishedAt: '2026-09-18T12:00:00Z',
      views: 1200
    },
    {
      videoId: 'v-002',
      title: 'Second Agents Video',
      publishedAt: '2026-09-17T12:00:00Z',
      views: 850
    }
  ];

  // Initial insert
  const res1 = dashboardDb.saveRssSignals('daniel', source, initialEntries);
  assert.equal(res1.created, 2);
  assert.equal(res1.updated, 0);

  // Query signals - sorted by published_at DESC
  let signals = dashboardDb.getRssSignals('daniel');
  assert.equal(signals.length, 2);
  assert.equal(signals[0].video_id, 'v-001');
  assert.equal(signals[0].title, 'First Architecture Video');
  assert.equal(signals[0].status, 'new');
  assert.equal(signals[1].video_id, 'v-002');

  // Human curation: user adds hook breakdown and marks status as saved
  const db = dashboardDb.getDb('daniel');
  db.prepare(`
    UPDATE rss_radar_signals 
    SET hook_text = 'Hook de retención de 3 pasos', status = 'saved' 
    WHERE video_id = 'v-001' AND profile = 'daniel'
  `).run();

  // Next RSS sync: v-001 has updated title and views; v-002 unchanged; v-003 is new
  const refreshedEntries = [
    {
      videoId: 'v-001',
      title: 'First Architecture Video (Updated Title)',
      publishedAt: '2026-09-18T12:00:00Z',
      views: 3500
    },
    {
      videoId: 'v-002',
      title: 'Second Agents Video',
      publishedAt: '2026-09-17T12:00:00Z',
      views: 900
    },
    {
      videoId: 'v-003',
      title: 'Third Brand New Video',
      publishedAt: '2026-09-19T08:00:00Z',
      views: 50
    }
  ];

  const res2 = dashboardDb.saveRssSignals('daniel', source, refreshedEntries);
  assert.equal(res2.created, 1);
  assert.equal(res2.updated, 2);

  // Verify preservation of human curation on v-001
  signals = dashboardDb.getRssSignals('daniel');
  assert.equal(signals.length, 3);

  // Top published is v-003 (2026-09-19)
  assert.equal(signals[0].video_id, 'v-003');
  assert.equal(signals[0].status, 'new');

  // Second is v-001 (2026-09-18)
  const v1 = signals.find(s => s.video_id === 'v-001');
  assert.ok(v1);
  assert.equal(v1.title, 'First Architecture Video (Updated Title)');
  assert.equal(v1.views, 3500);
  assert.equal(v1.hook_text, 'Hook de retención de 3 pasos'); // PRESERVED
  assert.equal(v1.status, 'saved'); // PRESERVED
});

test('profile isolation: sources and signals do not cross between daniel and sebastian', () => {
  // Add source and signal to daniel
  dashboardDb.addConfiguredSource('daniel', 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'Google Developers');
  dashboardDb.saveRssSignals('daniel', { channel_id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' }, [
    { videoId: 'daniel-vid-1', title: 'Daniel Video', publishedAt: '2026-09-19T00:00:00Z' }
  ]);

  // Check sebastian has none of daniel's sources or signals
  const sebSourcesInitial = dashboardDb.getConfiguredSources('sebastian');
  const sebSignalsInitial = dashboardDb.getRssSignals('sebastian');
  assert.ok(!sebSourcesInitial.some(s => s.channel_id === 'UC_x5XG1OV2P6uZZ5FSM9Ttw'));
  assert.ok(!sebSignalsInitial.some(s => s.video_id === 'daniel-vid-1'));

  // Add source and signal to sebastian
  dashboardDb.addConfiguredSource('sebastian', 'UCB4KBpuuJ2QKGdVn_e0E_kg', 'The Build Show');
  dashboardDb.saveRssSignals('sebastian', { channel_id: 'UCB4KBpuuJ2QKGdVn_e0E_kg' }, [
    { videoId: 'seb-vid-1', title: 'Sebastián Construction Video', publishedAt: '2026-09-19T00:00:00Z' }
  ]);

  // Verify daniel does not contain sebastian's source or signal
  const danielSources = dashboardDb.getConfiguredSources('daniel');
  const danielSignals = dashboardDb.getRssSignals('daniel');
  assert.ok(!danielSources.some(s => s.channel_id === 'UCB4KBpuuJ2QKGdVn_e0E_kg'));
  assert.ok(!danielSignals.some(s => s.video_id === 'seb-vid-1'));

  // Verify sebastian contains only sebastian's data
  const sebSources = dashboardDb.getConfiguredSources('sebastian');
  const sebSignals = dashboardDb.getRssSignals('sebastian');
  assert.ok(sebSources.some(s => s.channel_id === 'UCB4KBpuuJ2QKGdVn_e0E_kg'));
  assert.ok(sebSignals.some(s => s.video_id === 'seb-vid-1'));
  assert.ok(!sebSources.some(s => s.channel_id === 'UC_x5XG1OV2P6uZZ5FSM9Ttw'));
  assert.ok(!sebSignals.some(s => s.video_id === 'daniel-vid-1'));
});

test('seedDefaultsIfEmpty: populates verified reference channels for both profiles', () => {
  // Use isolated profile directory to verify clean seeding
  const cleanHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ytos-seed-test-'));
  const currentHome = process.env.YOUTUBE_CONTENT_OS_HOME;
  dashboardDb.closeDb();
  process.env.YOUTUBE_CONTENT_OS_HOME = cleanHome;

  try {
    // Seed Daniel
    dashboardDb.seedDefaultsIfEmpty('daniel');
    const danielSources = dashboardDb.getConfiguredSources('daniel');
    assert.equal(danielSources.length, 3);
    const danielChannels = danielSources.map(s => s.channel_id).sort();
    assert.deepEqual(danielChannels, [
      'UCUyDOdBWhC1MCxEjC46d-zw', // Acquisition.com by Alex Hormozi
      'UC_x5XG1OV2P6uZZ5FSM9Ttw', // Google Developers
      'UCcefcZRL2oaA_TsBiDDJ-tw'  // Y Combinator
    ].sort());

    const hormozi = danielSources.find(s => s.channel_id === 'UCUyDOdBWhC1MCxEjC46d-zw');
    assert.equal(hormozi.channel_name, 'Acquisition.com by Alex Hormozi');

    // Seed Sebastián
    dashboardDb.seedDefaultsIfEmpty('sebastian');
    const sebSources = dashboardDb.getConfiguredSources('sebastian');
    assert.equal(sebSources.length, 3);
    const sebChannels = sebSources.map(s => s.channel_id).sort();
    assert.deepEqual(sebChannels, [
      'UCB4KBpuuJ2QKGdVn_e0E_kg', // The Build Show by Matt Risinger
      'UC_lD6BfW5F7N_VjP0-4fHqw', // The Contractor Fight
      'UCnorhjQR4z4553VPyb0nBPQ'  // Home RenoVision DIY
    ].sort());

    const buildShow = sebSources.find(s => s.channel_id === 'UCB4KBpuuJ2QKGdVn_e0E_kg');
    assert.equal(buildShow.channel_name, 'The Build Show by Matt Risinger');

    // Idempotency: second run shouldn't duplicate
    dashboardDb.seedDefaultsIfEmpty('daniel');
    assert.equal(dashboardDb.getConfiguredSources('daniel').length, 3);
    dashboardDb.seedDefaultsIfEmpty('sebastian');
    assert.equal(dashboardDb.getConfiguredSources('sebastian').length, 3);
  } finally {
    dashboardDb.closeDb();
    process.env.YOUTUBE_CONTENT_OS_HOME = currentHome;
    try {
      fs.rmSync(cleanHome, { recursive: true, force: true });
    } catch {}
  }
});

// --- REST API & RSS Radar Integration Tests ---

test.before(async () => {
  await new Promise((resolve) => {
    httpServer = server.listen(0, '127.0.0.1', () => {
      const port = httpServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const res = await nativeFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

test('REST: GET /api/channels queries configured sources per profile', async () => {
  // Query daniel
  const resDaniel = await apiRequest('/api/channels?profile=daniel');
  assert.equal(resDaniel.status, 200);
  assert.equal(resDaniel.data.status, 'ok');
  assert.equal(resDaniel.data.profile, 'daniel');
  assert.ok(Array.isArray(resDaniel.data.data));
  assert.equal(resDaniel.data.count, resDaniel.data.data.length);
  assert.ok(resDaniel.data.count >= 1);

  // Query sebastian
  const resSeb = await apiRequest('/api/channels?profile=sebastian');
  assert.equal(resSeb.status, 200);
  assert.equal(resSeb.data.status, 'ok');
  assert.equal(resSeb.data.profile, 'sebastian');
  assert.ok(Array.isArray(resSeb.data.data));

  // Invalid profile fails with 400
  const resInvalid = await apiRequest('/api/channels?profile=invalid-profile');
  assert.equal(resInvalid.status, 400);
  assert.equal(resInvalid.data.status, 'error');
});

test('REST: POST /api/channels/add validates channelId and persists source', async () => {
  // Valid channel addition
  const newChannelId = 'UCtestchannel0011223344';
  const newChannelName = 'Canal de Automatización B2B';
  const resAdd = await apiRequest('/api/channels/add', {
    method: 'POST',
    body: JSON.stringify({
      profile: 'daniel',
      channelId: newChannelId,
      channelName: newChannelName
    })
  });

  assert.equal(resAdd.status, 200);
  assert.equal(resAdd.data.status, 'ok');
  assert.equal(resAdd.data.source.channel_id, newChannelId);
  assert.equal(resAdd.data.source.channel_name, newChannelName);
  assert.equal(resAdd.data.source.enabled, 1);

  // Verify in GET /api/channels
  const resList = await apiRequest('/api/channels?profile=daniel');
  assert.ok(resList.data.data.some(c => c.channel_id === newChannelId));

  // Invalid channelId format fails with 400
  const resBadId = await apiRequest('/api/channels/add', {
    method: 'POST',
    body: JSON.stringify({
      profile: 'daniel',
      channelId: 'short-id',
      channelName: 'Bad ID Channel'
    })
  });
  assert.equal(resBadId.status, 400);
  assert.equal(resBadId.data.status, 'error');
  assert.match(resBadId.data.error, /format/i);

  // Invalid profile fails with 400
  const resBadProfile = await apiRequest('/api/channels/add', {
    method: 'POST',
    body: JSON.stringify({
      profile: 'unknown-user',
      channelId: newChannelId,
      channelName: newChannelName
    })
  });
  assert.equal(resBadProfile.status, 400);
  assert.equal(resBadProfile.data.status, 'error');
});

test('REST: POST /api/channels/remove deactivates configured source', async () => {
  const channelToRemove = 'UCtestchannel0011223344';

  const resRemove = await apiRequest('/api/channels/remove', {
    method: 'POST',
    body: JSON.stringify({
      profile: 'daniel',
      channelId: channelToRemove
    })
  });

  assert.equal(resRemove.status, 200);
  assert.equal(resRemove.data.status, 'ok');
  assert.equal(resRemove.data.removed, true);
  assert.equal(resRemove.data.channelId, channelToRemove);

  // Verify it is no longer listed in active channels
  const resList = await apiRequest('/api/channels?profile=daniel');
  assert.ok(!resList.data.data.some(c => c.channel_id === channelToRemove));

  // Missing channelId fails with 400
  const resMissing = await apiRequest('/api/channels/remove', {
    method: 'POST',
    body: JSON.stringify({
      profile: 'daniel'
    })
  });
  assert.equal(resMissing.status, 400);
  assert.equal(resMissing.data.status, 'error');
});

test('REST: POST /api/radar/refresh fetches feeds, parses XML and saves RSS signals', async () => {
  const origFetch = globalThis.fetch;
  const mockXml = (channelId) => `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <yt:channelId>${channelId}</yt:channelId>
  <entry>
    <yt:videoId>vid-live-mock-1</yt:videoId>
    <title>Sistemas Autónomos de IA con Node.js</title>
    <published>2026-09-19T06:00:00Z</published>
  </entry>
  <entry>
    <yt:videoId>vid-live-mock-2</yt:videoId>
    <title>Pipeline de Contenido de Alta Conversión</title>
    <published>2026-09-19T07:00:00Z</published>
  </entry>
</feed>`;

  globalThis.fetch = async (url, opts) => {
    const strUrl = String(url);
    if (strUrl.includes('youtube.com/feeds/videos.xml')) {
      const urlObj = new URL(strUrl);
      const channelId = urlObj.searchParams.get('channel_id') || 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
      const response = new Response(mockXml(channelId), {
        status: 200,
        headers: { 'Content-Type': 'application/atom+xml' }
      });
      Object.defineProperty(response, 'url', { value: strUrl });
      return response;
    }
    return nativeFetch(url, opts);
  };

  try {
    const res = await apiRequest('/api/radar/refresh', {
      method: 'POST',
      body: JSON.stringify({ profile: 'daniel' })
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
    assert.ok(res.data.refreshedSources > 0);
    assert.ok(res.data.newSignalsCount >= 2);
    assert.ok(Array.isArray(res.data.signals));
    assert.ok(res.data.signals.some(s => s.video_id === 'vid-live-mock-1'));
    assert.ok(res.data.signals.some(s => s.video_id === 'vid-live-mock-2'));

    // Check GET /api/radar/signals reflects these newly saved signals
    const resSignals = await apiRequest('/api/radar/signals?profile=daniel');
    assert.equal(resSignals.status, 200);
    assert.equal(resSignals.data.status, 'ok');
    assert.equal(resSignals.data.profile, 'daniel');
    assert.ok(resSignals.data.count >= 2);
    const mockSig = resSignals.data.data.find(s => s.video_id === 'vid-live-mock-1');
    assert.ok(mockSig);
    assert.equal(mockSig.title, 'Sistemas Autónomos de IA con Node.js');
    assert.equal(mockSig.status, 'new');

    // Limit parameter test
    const resLimit = await apiRequest('/api/radar/signals?profile=daniel&limit=1');
    assert.equal(resLimit.status, 200);
    assert.equal(resLimit.data.data.length, 1);

    // Invalid profile test
    const resBadProfile = await apiRequest('/api/radar/signals?profile=invalid-profile');
    assert.equal(resBadProfile.status, 400);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('REST: POST /api/radar/refresh resilience against individual feed network failures', async () => {
  const origFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async (url, opts) => {
    const strUrl = String(url);
    if (strUrl.includes('youtube.com/feeds/videos.xml')) {
      calls++;
      // Fail the first feed, let others succeed
      if (calls === 1) {
        throw new Error('Connection reset by peer');
      }
      const urlObj = new URL(strUrl);
      const channelId = urlObj.searchParams.get('channel_id') || 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
      const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <yt:channelId>${channelId}</yt:channelId>
  <entry>
    <yt:videoId>vid-resilient-${calls}</yt:videoId>
    <title>Resilient Feed Test</title>
    <published>2026-09-19T08:30:00Z</published>
  </entry>
</feed>`;
      const response = new Response(xml, { status: 200, headers: { 'Content-Type': 'application/atom+xml' } });
      Object.defineProperty(response, 'url', { value: strUrl });
      return response;
    }
    return nativeFetch(url, opts);
  };

  try {
    const res = await apiRequest('/api/radar/refresh', {
      method: 'POST',
      body: JSON.stringify({ profile: 'daniel' })
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
    assert.ok(res.data.refreshedSources > 0);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('Background Periodic Refresh: runPeriodicRssSync executes safely without crashing', async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const strUrl = String(url);
    if (strUrl.includes('youtube.com/feeds/videos.xml')) {
      const urlObj = new URL(strUrl);
      const channelId = urlObj.searchParams.get('channel_id') || 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
      const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <yt:channelId>${channelId}</yt:channelId>
  <entry>
    <yt:videoId>vid-periodic-${Date.now()}</yt:videoId>
    <title>Periodic Sync Video</title>
    <published>2026-09-19T09:00:00Z</published>
  </entry>
</feed>`;
      const response = new Response(xml, { status: 200, headers: { 'Content-Type': 'application/atom+xml' } });
      Object.defineProperty(response, 'url', { value: strUrl });
      return response;
    }
    return nativeFetch(url, opts);
  };

  try {
    await runPeriodicRssSync();
    assert.ok(true, 'runPeriodicRssSync executed cleanly');
  } finally {
    globalThis.fetch = origFetch;
  }
});

