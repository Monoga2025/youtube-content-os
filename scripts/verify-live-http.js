'use strict';

const http = require('node:http');
const assert = require('node:assert/strict');
const { server } = require('../server.js');

async function runLiveVerification() {
  console.log('--- Starting Live HTTP Verification Against server.js ---');

  // Start ephemeral server
  const port = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[OK] Server listening on ephemeral port: ${baseUrl}`);

  try {
    // 1. GET /api/channels?profile=daniel
    console.log('\nTesting 1: GET /api/channels?profile=daniel');
    const resChannels = await fetch(`${baseUrl}/api/channels?profile=daniel`);
    assert.equal(resChannels.status, 200, 'Expected status 200 for GET /api/channels');
    const channelsData = await resChannels.json();
    assert.equal(channelsData.status, 'ok');
    assert.equal(channelsData.profile, 'daniel');
    assert.ok(Array.isArray(channelsData.data), 'Expected data to be an array');
    assert.ok(channelsData.data.length >= 3, 'Expected at least 3 seeded channels for daniel');
    console.log(`[PASS] GET /api/channels returned ${channelsData.data.length} sources for daniel.`);

    // 2. POST /api/channels/add
    console.log('\nTesting 2: POST /api/channels/add');
    const testChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
    const testChannelName = 'Google Developers (Live Verified)';
    const resAdd = await fetch(`${baseUrl}/api/channels/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: 'daniel',
        channelId: testChannelId,
        channelName: testChannelName
      })
    });
    assert.equal(resAdd.status, 200, 'Expected status 200 for POST /api/channels/add');
    const addData = await resAdd.json();
    assert.equal(addData.status, 'ok');
    assert.ok(addData.source, 'Expected source object in response');
    assert.equal(addData.source.channel_id, testChannelId);
    assert.equal(addData.source.channel_name, testChannelName);
    console.log(`[PASS] POST /api/channels/add successfully persisted/updated channel: ${addData.source.channel_name} (${addData.source.channel_id}).`);

    // 2b. Test invalid channel ID rejected
    console.log('\nTesting 2b: POST /api/channels/add (Validation failure on invalid ID)');
    const resInvalidAdd = await fetch(`${baseUrl}/api/channels/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: 'daniel',
        channelId: 'invalid-channel-format',
        channelName: 'Invalid'
      })
    });
    assert.equal(resInvalidAdd.status, 400, 'Expected status 400 for invalid channelId');
    console.log('[PASS] POST /api/channels/add correctly rejected invalid channel ID with status 400.');

    // 3. POST /api/radar/refresh
    console.log('\nTesting 3: POST /api/radar/refresh');
    const resRefresh = await fetch(`${baseUrl}/api/radar/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: 'daniel' })
    });
    assert.equal(resRefresh.status, 200, 'Expected status 200 for POST /api/radar/refresh');
    const refreshData = await resRefresh.json();
    assert.equal(refreshData.status, 'ok');
    assert.ok(typeof refreshData.refreshedSources === 'number', 'Expected refreshedSources number');
    assert.ok(Array.isArray(refreshData.signals), 'Expected signals array in response');
    console.log(`[PASS] POST /api/radar/refresh completed. Sources refreshed: ${refreshData.refreshedSources}, signals returned: ${refreshData.signals.length}.`);

    // 4. GET /api/radar/signals?profile=daniel
    console.log('\nTesting 4: GET /api/radar/signals?profile=daniel');
    const resSignals = await fetch(`${baseUrl}/api/radar/signals?profile=daniel`);
    assert.equal(resSignals.status, 200, 'Expected status 200 for GET /api/radar/signals');
    const signalsData = await resSignals.json();
    assert.equal(signalsData.status, 'ok');
    assert.equal(signalsData.profile, 'daniel');
    assert.ok(Array.isArray(signalsData.data), 'Expected data to be array of signals');
    console.log(`[PASS] GET /api/radar/signals returned ${signalsData.data.length} signals for daniel.`);

    // 5. Verify Sebastian Profile Isolation
    console.log('\nTesting 5: Profile Isolation (Sebastian)');
    const resSebChannels = await fetch(`${baseUrl}/api/channels?profile=sebastian`);
    assert.equal(resSebChannels.status, 200);
    const sebChannelsData = await resSebChannels.json();
    assert.equal(sebChannelsData.profile, 'sebastian');
    assert.ok(sebChannelsData.data.some(c => c.channel_id === 'UCB4KBpuuJ2QKGdVn_e0E_kg'), 'Expected The Build Show in Sebastian sources');
    assert.ok(!sebChannelsData.data.some(c => c.channel_id === 'UCUyDOdBWhC1MCxEjC46d-zw'), 'Hormozi should NOT be in Sebastian sources');
    console.log(`[PASS] Profile isolation verified: Sebastian has ${sebChannelsData.data.length} sources distinct from Daniel.`);

    console.log('\n========================================');
    console.log('>>> ALL LIVE HTTP VERIFICATIONS PASSED <<<');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

runLiveVerification().catch(err => {
  console.error('[FAIL] Verification error:', err);
  process.exit(1);
});
