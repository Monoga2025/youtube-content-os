// Native Node.js HTTP Server for CreadorPro Web Platform
// Zero external dependencies required. Works natively with Node.js 20+.
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

let contentDb = null;
try {
  contentDb = require('./public/content-database.js');
} catch (e) {
  console.warn('content-database.js could not be required in server:', e.message);
}

let dashboardDb = null;
try {
  dashboardDb = require('./lib/dashboard-db.js');
} catch (e) {
  console.warn('dashboard-db.js could not be initialized:', e.message);
}

let localCore = null;
try {
  localCore = require('./lib/local-core.js');
} catch (e) {
  console.warn('local-core.js could not be required in server:', e.message);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Normalize URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let reqPath = parsedUrl.pathname;

  // Default to index.html
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // REST API Endpoints
  if (reqPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      app: 'CreadorPro',
      db: dashboardDb ? 'sqlite-active' : 'memory-fallback',
      timestamp: new Date().toISOString()
    }));
  }

  if (reqPath === '/api/state' && req.method === 'GET') {
    const profile = (parsedUrl.searchParams.get('profile') || 'daniel').toLowerCase();
    try {
      if (dashboardDb) {
        dashboardDb.seedDefaultsIfEmpty(profile);
        const state = dashboardDb.getDashboardState(profile);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', profile, data: state }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', profile, data: null }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/kanban/card' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const card = dashboardDb.saveKanbanCard(profile, payload.card || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', card }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/kanban/move' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const card = dashboardDb.moveKanbanCard(profile, payload.cardId, payload.newColKey, payload.newPosition);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', card }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/kanban/delete' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const result = dashboardDb.deleteKanbanCard(profile, payload.cardId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', ...result }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/tasks' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const task = dashboardDb.saveTask(profile, payload.task || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', task }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/tasks/toggle' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const task = dashboardDb.toggleTask(profile, payload.taskId, payload.done);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', task }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/tasks/delete' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const result = dashboardDb.deleteTask(profile, payload.taskId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', ...result }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/weekly-plan' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const savedPlan = dashboardDb.saveWeeklyPlan(profile, payload.plan || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', plan: savedPlan }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/radar' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const radar = contentDb?.DAILY_YOUTUBE_RADAR || [];
    return res.end(JSON.stringify({ status: 'ok', count: radar.length, data: radar }));
  }

  if (reqPath === '/api/radar/save' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const saved = dashboardDb.saveRadarVideo(profile, payload.video || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', saved }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/radar/convert-to-card' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (!dashboardDb) throw new Error('Database not initialized');
      const vid = payload.video || {};
      const card = dashboardDb.saveKanbanCard(profile, {
        col_key: 'ideas',
        title: vid.title || 'Idea inspirada en Radar YouTube',
        pilar: vid.niche === 'home_services' ? 'Home Services USA' : 'B2B Systems & AI',
        hook: vid.hookBreakdown?.split('\n')?.[0] || 'Hook extraído de video viral.',
        full_script: `Estructura inspirada en canal "${vid.channel || 'Referente'}":\n\nDesglose de Hook:\n${vid.hookBreakdown || ''}\n\nEstrategia de Retención:\n${vid.whyItWorks || ''}`,
        lead_magnet: 'Recurso / Calculadora B2B descargable',
        monetization: 'Conversión directa a clientes de alto ticket',
        cta: 'Descarga el recurso en el enlace de la descripción.',
        duration: '10-12 min'
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', card }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  // Channel Management Endpoints
  if (reqPath === '/api/channels' && req.method === 'GET') {
    try {
      const profile = (parsedUrl.searchParams.get('profile') || 'daniel').toLowerCase();
      if (localCore) localCore.profileDefinition(profile);
      if (!dashboardDb) throw new Error('Database not initialized');
      dashboardDb.seedDefaultsIfEmpty(profile);
      const configuredSources = dashboardDb.getConfiguredSources(profile);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'ok',
        profile,
        count: configuredSources.length,
        data: configuredSources
      }));
    } catch (err) {
      const isClientError = /unknown profile|invalid/i.test(err.message);
      res.writeHead(isClientError ? 400 : 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/channels/add' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (localCore) localCore.profileDefinition(profile);
      if (!dashboardDb) throw new Error('Database not initialized');
      const channelId = payload.channelId || payload.channel_id;
      if (!channelId || typeof channelId !== 'string' || !/^UC[\w-]{20,}$/.test(channelId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'error', error: 'Invalid channel ID format. Must match /^UC[\\w-]{20,}$/' }));
      }
      const channelName = payload.channelName || payload.channel_name || channelId;
      const source = dashboardDb.addConfiguredSource(profile, channelId, channelName);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', source }));
    } catch (err) {
      const isClientError = /unknown profile|invalid/i.test(err.message);
      res.writeHead(isClientError ? 400 : 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/channels/remove' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (localCore) localCore.profileDefinition(profile);
      if (!dashboardDb) throw new Error('Database not initialized');
      const channelId = payload.channelId || payload.channel_id;
      if (!channelId || typeof channelId !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'error', error: 'channelId is required' }));
      }
      const result = dashboardDb.removeConfiguredSource(profile, channelId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', removed: true, channelId: result.channelId || channelId }));
    } catch (err) {
      const isClientError = /unknown profile|invalid|required/i.test(err.message);
      res.writeHead(isClientError ? 400 : 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  // Live RSS Radar Ingestion & Signals Endpoints
  if (reqPath === '/api/radar/refresh' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profile || 'daniel').toLowerCase();
      if (localCore) localCore.profileDefinition(profile);
      if (!dashboardDb) throw new Error('Database not initialized');
      if (!localCore) throw new Error('Local core not initialized');

      const sources = dashboardDb.getConfiguredSources(profile);
      let refreshedSources = 0;
      let newSignalsCount = 0;

      if (sources && sources.length > 0) {
        const batches = await localCore.fetchAllFeeds(sources, async (channelId) => {
          try {
            return await localCore.fetchFeed(channelId);
          } catch (err) {
            console.warn(`[RSS Refresh] feed fetch error for ${channelId}:`, err.message);
            return [];
          }
        });

        for (const batch of batches) {
          if (batch.entries && batch.entries.length > 0) {
            const saveResult = dashboardDb.saveRssSignals(profile, batch.source, batch.entries);
            newSignalsCount += (saveResult?.created || 0);
          }
          refreshedSources++;
        }
      }

      const signals = dashboardDb.getRssSignals(profile, 30);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'ok',
        refreshedSources,
        newSignalsCount,
        signals
      }));
    } catch (err) {
      const isClientError = /unknown profile|invalid/i.test(err.message);
      res.writeHead(isClientError ? 400 : 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/radar/signals' && req.method === 'GET') {
    try {
      const profile = (parsedUrl.searchParams.get('profile') || 'daniel').toLowerCase();
      if (localCore) localCore.profileDefinition(profile);
      if (!dashboardDb) throw new Error('Database not initialized');
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10) || 50;
      const signals = dashboardDb.getRssSignals(profile, limit);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'ok',
        profile,
        count: signals.length,
        data: signals
      }));
    } catch (err) {
      const isClientError = /unknown profile|invalid/i.test(err.message);
      res.writeHead(isClientError ? 400 : 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/eloisa/history' && req.method === 'GET') {
    const profile = (parsedUrl.searchParams.get('profile') || 'daniel').toLowerCase();
    try {
      if (dashboardDb) {
        const state = dashboardDb.getDashboardState(profile);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', history: state.chatHistory }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', history: [] }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/eloisa/chat' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.contextProfile || payload.profile || 'daniel').toLowerCase();
      const userMsg = payload.message || '';
      
      const reply = contentDb?.answerEloisaConsultation
        ? contentDb.answerEloisaConsultation(userMsg, profile, payload.activeScriptTitle)
        : 'Respuesta generada por el motor de Eloísa Wolf.';

      if (dashboardDb) {
        dashboardDb.saveChatMessage(profile, 'user', userMsg, payload.activeScriptTitle || '');
        dashboardDb.saveChatMessage(profile, 'eloisa', reply, payload.activeScriptTitle || '');
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', reply }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  if (reqPath === '/api/generate-plan' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const profile = (payload.profileKey || payload.profile || 'daniel').toLowerCase();
      const plan = contentDb?.generateWeeklyPlanWithEloisa
        ? contentDb.generateWeeklyPlanWithEloisa(profile, contentDb.DAILY_YOUTUBE_RADAR)
        : null;

      if (plan && dashboardDb) {
        dashboardDb.saveWeeklyPlan(profile, plan);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', plan }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', error: err.message }));
    }
  }

  // Static File Serving
  const safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access denied');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

// Background Periodic Refresh (Every 60 minutes, non-blocking)
async function runPeriodicRssSync() {
  if (!dashboardDb || !localCore) return;
  for (const profile of ['daniel', 'sebastian']) {
    try {
      const sources = dashboardDb.getConfiguredSources(profile);
      if (sources && sources.length > 0) {
        const batches = await localCore.fetchAllFeeds(sources, async (channelId) => {
          try {
            return await localCore.fetchFeed(channelId);
          } catch (err) {
            console.warn(`[Periodic RSS Sync] feed error for ${channelId}:`, err.message);
            return [];
          }
        });
        for (const batch of batches) {
          if (batch.entries && batch.entries.length > 0) {
            dashboardDb.saveRssSignals(profile, batch.source, batch.entries);
          }
        }
      }
    } catch (err) {
      console.warn(`[Periodic RSS Sync] Error syncing for profile ${profile}:`, err.message);
    }
  }
}

const RSS_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const rssInterval = setInterval(async () => {
  try {
    await runPeriodicRssSync();
  } catch (e) {
    console.warn('[Periodic RSS Sync] Unhandled interval error:', e.message);
  }
}, RSS_REFRESH_INTERVAL_MS);

if (rssInterval.unref) {
  rssInterval.unref();
}

let currentPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

function startServer(portToTry) {
  if (dashboardDb) {
    dashboardDb.seedDefaultsIfEmpty('daniel');
    dashboardDb.seedDefaultsIfEmpty('sebastian');
  }
  server.listen(portToTry, () => {
    console.log('====================================================');
    console.log(`🚀 CreadorPro Web Platform corriendo con éxito!`);
    console.log(`🌐 Accede en tu navegador: http://localhost:${portToTry}`);
    console.log('====================================================');
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Puerto ${currentPort} en uso, intentando puerto alternativo ${currentPort + 1}...`);
    currentPort += 1;
    startServer(currentPort);
  } else {
    console.error('Error en el servidor HTTP:', err);
  }
});

if (require.main === module) {
  startServer(currentPort);
}

module.exports = {
  server,
  startServer,
  runPeriodicRssSync,
  rssInterval
};
