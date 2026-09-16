const test = require('node:test');
const assert = require('node:assert/strict');

const Core = require('../apps-script/Core.js');

const VERIFIED_CHANNEL_REFERENCE = 'verified-channel-id-fixture';

test('enabled sources require a verified YouTube channel ID', () => {
  assert.throws(() => Core.normalizeChannelSource({
    displayName: 'Reference', channelId: '', enabled: true,
  }), /verified channel ID/i);
  const disabled = Core.normalizeChannelSource({ displayName: 'Reference', channelId: '', enabled: false });
  assert.equal(disabled.enabled, false);
});

test('signal upsert preserves human curation while refreshing raw fields', () => {
  const existing = [{ videoId: 'video-1', title: 'Old', viewCount: '10', status: 'CURATED', pillar: 'Jarvis', relevanceNote: 'Use failure evidence' }];
  const incoming = [{ videoId: 'video-1', channelId: VERIFIED_CHANNEL_REFERENCE, channelName: 'Reference', title: 'New', publishedAt: '2026-09-14T00:00:00Z', fetchedAt: '2026-09-15T00:00:00Z', viewCount: '20', likeCount: '2', commentCount: '1' }];
  const result = Core.planSignalUpsert(existing, incoming);
  assert.equal(result.rows[0].title, 'New');
  assert.equal(result.rows[0].viewCount, '20');
  assert.equal(result.rows[0].status, 'CURATED');
  assert.equal(result.rows[0].pillar, 'Jarvis');
  assert.equal(result.rows[0].relevanceNote, 'Use failure evidence');
  assert.deepEqual(result.counts, { created: 0, updated: 1 });
});

test('mission creation requires owner, curated signal, and safe verified evidence', () => {
  const base = {
    operatorEmail: 'daniel@example.com', ownerEmail: 'daniel@example.com', week: '2026-W38',
    signal: { videoId: 'video-1', channelName: 'Reference', title: 'A useful signal', fetchedAt: '2026-09-15T00:00:00Z', status: 'CURATED', pillar: 'Jarvis', relevanceNote: 'Explain the tradeoff' },
    evidence: { evidenceId: 'EV-1', pillar: 'Jarvis', sanitizedSummary: 'Demo-only failed run', proof: 'Sanitized test output', status: 'VERIFIED', privacyStatus: 'SAFE' },
  };
  assert.equal(Core.createMissionBrief(base).status, 'DRAFT');
  assert.throws(() => Core.createMissionBrief({ ...base, operatorEmail: 'other@example.com' }), /not authorized/i);
  assert.throws(() => Core.createMissionBrief({ ...base, evidence: { ...base.evidence, privacyStatus: 'UNREVIEWED' } }), /privacy/i);
});

test('mission creation rejects blank mission text and incomplete evidence fields', () => {
  const base = {
    operatorEmail: 'daniel@example.com', ownerEmail: 'daniel@example.com', week: '2026-W38',
    signal: { videoId: 'video-1', channelName: 'Reference', title: 'A useful signal', fetchedAt: '2026-09-15T00:00:00Z', status: 'CURATED', pillar: 'Jarvis', relevanceNote: 'Explain the tradeoff' },
    evidence: { evidenceId: 'EV-1', pillar: 'Jarvis', sanitizedSummary: 'Demo-only failed run', proof: 'Sanitized test output', status: 'VERIFIED', privacyStatus: 'SAFE' },
  };
  assert.throws(() => Core.createMissionBrief({ ...base, signal: { ...base.signal, relevanceNote: '   ' } }), /Mission is required/i);
  assert.throws(() => Core.createMissionBrief({ ...base, evidence: { ...base.evidence, sanitizedSummary: undefined } }), /Sanitized summary is required/i);
  assert.throws(() => Core.createMissionBrief({ ...base, evidence: { ...base.evidence, proof: undefined } }), /Evidence proof is required/i);
});

test('formula-like external strings are forced to text', () => {
  assert.equal(Core.safeCell('=IMPORTXML("x")'), "'=IMPORTXML(\"x\")");
  assert.equal(Core.safeCell('Normal title'), 'Normal title');
});

test('API batch validation fails closed on partial responses', () => {
  assert.throws(() => Core.validateApiBatch([{ complete: true }, { complete: false }]), /partial/i);
  assert.equal(Core.validateApiBatch([{ complete: true }]), true);
});
