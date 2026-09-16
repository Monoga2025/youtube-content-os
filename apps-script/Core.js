/* Pure business rules shared by Apps Script and local Node tests. */
var ContentCore = (function () {
  'use strict';

  var CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
  var PILLARS = ['Jarvis', 'MARAL OS', 'Universidad OS', 'Mechatronics'];

  function required(value, label) {
    if (value === undefined || value === null || String(value).trim() === '') {
      throw new Error(label + ' is required.');
    }
    return String(value).trim();
  }

  function normalizeChannelSource(input) {
    var source = Object.assign({}, input || {});
    source.displayName = required(source.displayName, 'Display name');
    source.channelId = String(source.channelId || '').trim();
    source.enabled = source.enabled === true || String(source.enabled).toLowerCase() === 'true';
    source.verifiedBy = String(source.verifiedBy || '').trim();
    source.verifiedAt = String(source.verifiedAt || '').trim();
    if (source.enabled && (!CHANNEL_ID_PATTERN.test(source.channelId) || !source.verifiedBy || !source.verifiedAt)) {
      throw new Error('Enabled source requires a manually verified channel ID, verifier, and timestamp.');
    }
    return source;
  }

  function safeCell(value) {
    if (value === undefined || value === null) return '';
    var text = String(value);
    return /^[=+\-@]/.test(text) ? "'" + text : text;
  }

  function validateApiBatch(results) {
    if (!Array.isArray(results) || results.length === 0 || results.some(function (item) { return !item || item.complete !== true; })) {
      throw new Error('Partial or empty API batch; no signal writes are allowed.');
    }
    return true;
  }

  function normalizeSignal(raw) {
    return {
      videoId: required(raw.videoId, 'Video ID'),
      channelId: required(raw.channelId, 'Channel ID'),
      channelName: safeCell(required(raw.channelName, 'Channel name')),
      title: safeCell(required(raw.title, 'Title')),
      publishedAt: required(raw.publishedAt, 'Published timestamp'),
      fetchedAt: required(raw.fetchedAt, 'Fetched timestamp'),
      viewCount: String(raw.viewCount || '0'),
      likeCount: String(raw.likeCount || '0'),
      commentCount: String(raw.commentCount || '0'),
      status: raw.status || 'NEW',
      pillar: raw.pillar || '',
      relevanceNote: raw.relevanceNote || ''
    };
  }

  function planSignalUpsert(existing, incoming) {
    var byId = {};
    (existing || []).forEach(function (row) { byId[row.videoId] = Object.assign({}, row); });
    var counts = { created: 0, updated: 0 };
    (incoming || []).forEach(function (raw) {
      var signal = normalizeSignal(raw);
      var previous = byId[signal.videoId];
      if (previous) {
        signal.status = previous.status || signal.status;
        signal.pillar = previous.pillar || '';
        signal.relevanceNote = previous.relevanceNote || '';
        counts.updated += 1;
      } else {
        counts.created += 1;
      }
      byId[signal.videoId] = signal;
    });
    return { rows: Object.keys(byId).map(function (id) { return byId[id]; }), counts: counts };
  }

  function assertOwner(operatorEmail, ownerEmail) {
    var operator = required(operatorEmail, 'Effective operator email').toLowerCase();
    var owner = required(ownerEmail, 'Configured owner email').toLowerCase();
    if (operator !== owner) throw new Error('Operator is not authorized for this workbook.');
    return true;
  }

  function createMissionBrief(input) {
    assertOwner(input.operatorEmail, input.ownerEmail);
    var signal = input.signal || {};
    var evidence = input.evidence || {};
    if (signal.status !== 'CURATED') throw new Error('Mission requires a CURATED signal.');
    if (evidence.status !== 'VERIFIED') throw new Error('Mission requires VERIFIED evidence.');
    if (evidence.privacyStatus !== 'SAFE') throw new Error('Evidence privacy review must be SAFE.');
    var pillar = required(signal.pillar || evidence.pillar, 'Pillar');
    if (PILLARS.indexOf(pillar) < 0 || (evidence.pillar && evidence.pillar !== pillar)) {
      throw new Error('Signal and evidence must use the same allowed pillar.');
    }
    var week = required(input.week, 'Week');
    var mission = required(signal.relevanceNote, 'Mission');
    var sanitizedSummary = required(evidence.sanitizedSummary, 'Sanitized summary');
    var proof = required(evidence.proof, 'Evidence proof');
    return {
      briefId: 'BRIEF-' + week,
      week: week,
      signalVideoId: required(signal.videoId, 'Signal video ID'),
      evidenceId: required(evidence.evidenceId, 'Evidence ID'),
      pillar: pillar,
      mission: safeCell(mission),
      sourceObservation: safeCell(signal.channelName + ': ' + signal.title + ' (fetched ' + signal.fetchedAt + ')'),
      internalEvidence: safeCell(sanitizedSummary + ' — ' + proof),
      outline: 'Problem → sanitized evidence → decision/tradeoff → smallest useful proof → alternate viewpoint → result/limits → viewer mission',
      productionBudgetMinutes: 180,
      status: 'DRAFT',
      approvedBy: '',
      approvedAt: ''
    };
  }

  return {
    PILLARS: PILLARS,
    normalizeChannelSource: normalizeChannelSource,
    safeCell: safeCell,
    validateApiBatch: validateApiBatch,
    planSignalUpsert: planSignalUpsert,
    assertOwner: assertOwner,
    createMissionBrief: createMissionBrief
  };
}());

if (typeof module !== 'undefined' && module.exports) module.exports = ContentCore;
