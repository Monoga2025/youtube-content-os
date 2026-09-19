'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { profileDefinition } = require('./local-core');
const { root } = require('./store');

// Cache open database handles per profile to avoid re-opening on every request
const dbCache = new Map();

function getDb(profileId = 'daniel') {
  const normProfile = (profileId || 'daniel').toLowerCase();
  const profile = profileDefinition(normProfile);
  const profileDir = root(profile.id);
  fs.mkdirSync(profileDir, { recursive: true });
  
  const dbPath = path.join(profileDir, 'dashboard.sqlite');
  if (dbCache.has(dbPath)) {
    return dbCache.get(dbPath);
  }

  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and foreign keys for high concurrent performance
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS kanban_cards (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      col_key TEXT NOT NULL,
      title TEXT NOT NULL,
      pilar TEXT DEFAULT '',
      hook TEXT DEFAULT '',
      full_script TEXT DEFAULT '',
      lead_magnet TEXT DEFAULT '',
      monetization TEXT DEFAULT '',
      cta TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      position INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      text TEXT NOT NULL,
      badge TEXT DEFAULT '',
      done INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      week_title TEXT NOT NULL,
      weekly_goal TEXT DEFAULT '',
      days_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS eloisa_chat (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      script_context TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS radar_saved (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      views TEXT DEFAULT '',
      hook_text TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      UNIQUE(profile, video_id)
    );

    CREATE TABLE IF NOT EXISTS configured_sources (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE(profile, channel_id)
    );

    CREATE TABLE IF NOT EXISTS rss_radar_signals (
      id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      source_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at TEXT,
      fetched_at TEXT NOT NULL,
      views INTEGER NULL,
      hook_text TEXT DEFAULT '',
      status TEXT DEFAULT 'new',
      UNIQUE(profile, video_id)
    );

    CREATE INDEX IF NOT EXISTS idx_kanban_profile ON kanban_cards(profile, col_key);
    CREATE INDEX IF NOT EXISTS idx_tasks_profile ON tasks(profile, created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_profile ON eloisa_chat(profile, created_at);
    CREATE INDEX IF NOT EXISTS idx_sources_profile ON configured_sources(profile, enabled);
    CREATE INDEX IF NOT EXISTS idx_rss_signals_profile ON rss_radar_signals(profile, published_at);
  `);

  dbCache.set(dbPath, db);
  return db;
}

function closeDb(profileId) {
  if (profileId) {
    const norm = String(profileId || '').toLowerCase();
    const profile = profileDefinition(norm);
    const dbPath = path.join(root(profile.id), 'dashboard.sqlite');
    if (dbCache.has(dbPath)) {
      try { dbCache.get(dbPath).close(); } catch {}
      dbCache.delete(dbPath);
    }
  } else {
    for (const [key, db] of dbCache.entries()) {
      try { db.close(); } catch {}
    }
    dbCache.clear();
  }
}

// Data Access Methods

function getDashboardState(profileId = 'daniel') {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();

  const cards = db.prepare('SELECT * FROM kanban_cards WHERE profile = ? ORDER BY position ASC, created_at ASC').all(norm);
  const tasks = db.prepare('SELECT * FROM tasks WHERE profile = ? ORDER BY created_at ASC').all(norm);
  const activePlan = db.prepare('SELECT * FROM weekly_plans WHERE profile = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1').get(norm);
  const chatHistory = db.prepare('SELECT * FROM eloisa_chat WHERE profile = ? ORDER BY created_at ASC').all(norm);
  const savedRadar = db.prepare('SELECT * FROM radar_saved WHERE profile = ? ORDER BY created_at DESC').all(norm);

  return {
    profile: norm,
    cards: cards.map(c => ({ ...c, done: undefined })),
    tasks: tasks.map(t => ({ ...t, done: Boolean(t.done) })),
    weeklyPlan: activePlan ? { ...activePlan, days: JSON.parse(activePlan.days_json || '[]') } : null,
    chatHistory,
    savedRadar
  };
}

function saveKanbanCard(profileId, card) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  const cardId = card.id || `card-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM kanban_cards WHERE id = ?').get(cardId);
  if (existing) {
    db.prepare(`
      UPDATE kanban_cards SET
        col_key = COALESCE(?, col_key),
        title = COALESCE(?, title),
        pilar = COALESCE(?, pilar),
        hook = COALESCE(?, hook),
        full_script = COALESCE(?, full_script),
        lead_magnet = COALESCE(?, lead_magnet),
        monetization = COALESCE(?, monetization),
        cta = COALESCE(?, cta),
        duration = COALESCE(?, duration),
        position = COALESCE(?, position),
        updated_at = ?
      WHERE id = ? AND profile = ?
    `).run(
      card.col_key,
      card.title,
      card.pilar,
      card.hook,
      card.full_script,
      card.lead_magnet,
      card.monetization,
      card.cta,
      card.duration,
      card.position !== undefined ? Number(card.position) : null,
      now,
      cardId,
      norm
    );
  } else {
    db.prepare(`
      INSERT INTO kanban_cards (
        id, profile, col_key, title, pilar, hook, full_script,
        lead_magnet, monetization, cta, duration, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cardId,
      norm,
      card.col_key || 'ideas',
      card.title || 'Nueva Idea',
      card.pilar || 'B2B Authority',
      card.hook || '',
      card.full_script || '',
      card.lead_magnet || '',
      card.monetization || '',
      card.cta || '',
      card.duration || '8-12 min',
      Number(card.position || 0),
      now,
      now
    );
  }

  return db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(cardId);
}

function moveKanbanCard(profileId, cardId, newColKey, newPosition) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE kanban_cards 
    SET col_key = ?, position = COALESCE(?, position), updated_at = ?
    WHERE id = ? AND profile = ?
  `).run(newColKey, newPosition !== undefined ? Number(newPosition) : null, now, cardId, norm);

  return db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(cardId);
}

function deleteKanbanCard(profileId, cardId) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  db.prepare('DELETE FROM kanban_cards WHERE id = ? AND profile = ?').run(cardId, norm);
  return { deleted: true, cardId };
}

function saveTask(profileId, task) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  const taskId = task.id || `task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (existing) {
    db.prepare(`
      UPDATE tasks 
      SET text = COALESCE(?, text), badge = COALESCE(?, badge), done = COALESCE(?, done)
      WHERE id = ? AND profile = ?
    `).run(
      task.text,
      task.badge,
      task.done !== undefined ? (task.done ? 1 : 0) : null,
      taskId,
      norm
    );
  } else {
    db.prepare(`
      INSERT INTO tasks (id, profile, text, badge, done, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      norm,
      task.text || '',
      task.badge || 'PRODUCCIÓN',
      task.done ? 1 : 0,
      now
    );
  }

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  return { ...row, done: Boolean(row.done) };
}

function toggleTask(profileId, taskId, isDone) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  db.prepare('UPDATE tasks SET done = ? WHERE id = ? AND profile = ?').run(isDone ? 1 : 0, taskId, norm);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  return row ? { ...row, done: Boolean(row.done) } : null;
}

function deleteTask(profileId, taskId) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  db.prepare('DELETE FROM tasks WHERE id = ? AND profile = ?').run(taskId, norm);
  return { deleted: true, taskId };
}

function saveWeeklyPlan(profileId, plan) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  const planId = plan.id || `plan-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  // Deactivate previous active plans for this profile
  db.prepare('UPDATE weekly_plans SET is_active = 0 WHERE profile = ?').run(norm);

  db.prepare(`
    INSERT INTO weekly_plans (id, profile, week_title, weekly_goal, days_json, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(
    planId,
    norm,
    plan.week_title || plan.title || 'Plan Semanal de Alto Impacto',
    plan.weekly_goal || plan.weeklyGoal || '',
    JSON.stringify(plan.days || []),
    now
  );

  const row = db.prepare('SELECT * FROM weekly_plans WHERE id = ?').get(planId);
  return { ...row, days: JSON.parse(row.days_json || '[]') };
}

function saveChatMessage(profileId, sender, message, scriptContext = '') {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  const msgId = `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO eloisa_chat (id, profile, sender, message, script_context, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msgId, norm, sender, message, scriptContext || '', now);

  return db.prepare('SELECT * FROM eloisa_chat WHERE id = ?').get(msgId);
}

function saveRadarVideo(profileId, video) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();
  const id = `radar-${video.videoId || video.id || Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO radar_saved (id, profile, video_id, title, channel, views, hook_text, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(profile, video_id) DO UPDATE SET
      title = excluded.title,
      channel = excluded.channel,
      views = excluded.views,
      hook_text = excluded.hook_text,
      notes = excluded.notes
  `).run(
    id,
    norm,
    video.videoId || video.id,
    video.title || '',
    video.channel || '',
    video.views || '',
    video.hook_text || video.hookBreakdown?.split?.('\n')?.[0] || '',
    video.notes || '',
    now
  );

  return db.prepare('SELECT * FROM radar_saved WHERE profile = ? AND video_id = ?').get(norm, video.videoId || video.id);
}

function getConfiguredSources(profile = 'daniel') {
  const norm = (profile || 'daniel').toLowerCase();
  const db = getDb(norm);
  return db.prepare('SELECT * FROM configured_sources WHERE profile = ? AND enabled = 1 ORDER BY created_at ASC').all(norm);
}

function addConfiguredSource(profile = 'daniel', channelId, channelName) {
  const norm = (profile || 'daniel').toLowerCase();
  const db = getDb(norm);
  const now = new Date().toISOString();
  const id = `src-${channelId}`;
  const name = channelName || channelId;

  db.prepare(`
    INSERT INTO configured_sources (id, profile, channel_id, channel_name, enabled, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(profile, channel_id) DO UPDATE SET
      channel_name = excluded.channel_name,
      enabled = 1
  `).run(id, norm, channelId, name, now);

  return db.prepare('SELECT * FROM configured_sources WHERE profile = ? AND channel_id = ?').get(norm, channelId);
}

function removeConfiguredSource(profile = 'daniel', channelId) {
  const norm = (profile || 'daniel').toLowerCase();
  const db = getDb(norm);
  db.prepare('UPDATE configured_sources SET enabled = 0 WHERE profile = ? AND channel_id = ?').run(norm, channelId);
  return { success: true, removed: true, channelId };
}

function saveRssSignals(profile = 'daniel', source = {}, entries = []) {
  const norm = (profile || 'daniel').toLowerCase();
  const db = getDb(norm);
  const now = new Date().toISOString();

  let sourceId = '';
  let channelId = '';
  let channelName = '';

  if (typeof source === 'string') {
    channelId = source;
    sourceId = `src-${source}`;
    channelName = source;
  } else if (source && typeof source === 'object') {
    channelId = source.channel_id || source.channelId || '';
    sourceId = source.id || (channelId ? `src-${channelId}` : 'src-unknown');
    channelName = source.channel_name || source.channelName || channelId || 'Unknown Channel';
  }

  const list = Array.isArray(entries) ? entries : [];
  let created = 0;
  let updated = 0;

  const selectExisting = db.prepare('SELECT id, hook_text, status FROM rss_radar_signals WHERE profile = ? AND video_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO rss_radar_signals (
      id, profile, source_id, channel_id, channel_name, video_id,
      title, published_at, fetched_at, views, hook_text, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE rss_radar_signals SET
      title = ?,
      published_at = COALESCE(?, published_at),
      fetched_at = ?,
      views = COALESCE(?, views),
      source_id = COALESCE(?, source_id),
      channel_id = COALESCE(?, channel_id),
      channel_name = COALESCE(?, channel_name)
    WHERE profile = ? AND video_id = ?
  `);

  for (const entry of list) {
    const videoId = entry.videoId || entry.video_id;
    if (!videoId) continue;

    const title = String(entry.title || '');
    const publishedAt = entry.publishedAt || entry.published_at || null;
    const views = (entry.views !== undefined && entry.views !== null && !isNaN(entry.views))
      ? Number(entry.views)
      : null;

    const existing = selectExisting.get(norm, videoId);
    if (existing) {
      updateStmt.run(
        title,
        publishedAt,
        now,
        views,
        sourceId || null,
        channelId || null,
        channelName || null,
        norm,
        videoId
      );
      updated++;
    } else {
      const id = `sig-${norm}-${videoId}`;
      const hookText = entry.hookText || entry.hook_text || '';
      const status = entry.status || 'new';

      insertStmt.run(
        id,
        norm,
        sourceId,
        channelId,
        channelName,
        videoId,
        title,
        publishedAt,
        now,
        views,
        hookText,
        status
      );
      created++;
    }
  }

  return { created, updated };
}

function getRssSignals(profile = 'daniel', limit = 50) {
  const norm = (profile || 'daniel').toLowerCase();
  const db = getDb(norm);
  const max = Number(limit) > 0 ? Number(limit) : 50;
  return db.prepare('SELECT * FROM rss_radar_signals WHERE profile = ? ORDER BY published_at DESC, fetched_at DESC LIMIT ?').all(norm, max);
}

function seedDefaultsIfEmpty(profileId) {
  const db = getDb(profileId);
  const norm = profileId.toLowerCase();

  const cardCount = db.prepare('SELECT count(*) as count FROM kanban_cards WHERE profile = ?').get(norm).count;
  if (cardCount === 0) {
    const isDaniel = norm === 'daniel';
    
    // Seed default cards
    const defaultCards = isDaniel ? [
      {
        id: 'card-d1',
        col_key: 'ideas',
        title: 'Arquitectura de Agentes de IA en Node.js 2026',
        pilar: 'B2B Systems & AI',
        hook: 'El 90% de las empresas que implementan IA están botando su dinero en wrappers inútiles. Hoy te muestro la arquitectura real de grado de producción.',
        full_script: 'Estructura de 4 capas: Orquestación, Context Memory, Verification Loop y Local SQLite. Casos de uso de alto ticket para empresas de $1M+ ARR.',
        lead_magnet: 'Diagrama de Arquitectura + Template en GitHub',
        monetization: 'Consultoría B2B ($5,000/mes) + Enterprise Workshop',
        cta: 'Descarga el blueprint en el primer link y agenda la llamada de diagnóstico.',
        duration: '14 min',
        position: 0
      },
      {
        id: 'card-d2',
        col_key: 'guiones',
        title: 'Cómo Facturar $10K/mes con Sistemas Autónomos de Contenido',
        pilar: 'Monetización B2B',
        hook: 'Si sigues creando contenido manual para tu negocio B2B, estás perdiendo 30 horas semanales que deberías dedicar a cerrar tratos.',
        full_script: 'Paso a paso para montar un Content Engine con YouTube, radar algorítmico, extracción de hooks y conversión a llamadas de ventas.',
        lead_magnet: 'Framework de 8 Semanas de CreadorPro',
        monetization: 'Implementación llave en mano ($3,500 setup)',
        cta: 'Escribe SISTEMAS en los comentarios o link en bio para el checklist.',
        duration: '11 min',
        position: 0
      },
      {
        id: 'card-d3',
        col_key: 'produccion',
        title: 'Por qué dejé Docker y volví a Node.js Nativo + SQLite',
        pilar: 'Engineering & Performance',
        hook: 'Tu stack de desarrollo no necesita 15 contenedores de Docker gastando 12GB de RAM para una app que factura miles de dólares.',
        full_script: 'Comparativa de benchmarks: latencia de arranque, uso de disco, portabilidad y cómo node:sqlite en Node 24 vuela a 60 FPS.',
        lead_magnet: 'Script de Benchmark + Repositorio Boilerplate',
        monetization: 'Sponsorship técnico + CreadorPro SaaS',
        cta: 'Suscríbete y prueba la demo corriendo en local.',
        duration: '9 min',
        position: 0
      },
      {
        id: 'card-d4',
        col_key: 'publicados',
        title: 'De 0 a 100K Vistas en YouTube con Hooks de 3 Golpes',
        pilar: 'Estrategia Eloísa Wolf',
        hook: 'Los primeros 5 segundos de tu video determinan el 80% de tus ingresos en YouTube. Este es el método exacto.',
        full_script: 'Análisis de retención segundo a segundo, el micro-corte a los 3 segundos y la promesa de alto valor sin relleno.',
        lead_magnet: 'Cheat Sheet de 25 Hooks Virales de Eloísa',
        monetization: 'Lead capture a comunidad privada de creadores',
        cta: 'Descarga el PDF de ganchos en el comentario fijado.',
        duration: '12 min',
        position: 0
      }
    ] : [
      {
        id: 'card-s1',
        col_key: 'ideas',
        title: 'Cómo Cotizar Proyectos de Remodelación sin Perder Dinero en USA',
        pilar: 'Home Services USA',
        hook: 'El error número 1 de los contratistas hispanos en Estados Unidos es cotizar por metro o a ojo cerrado.',
        full_script: 'Fórmula de costo real por empleado + materiales + margen del 35% de beneficio neto.',
        lead_magnet: 'Calculadora de Job Pricing en Excel/Google Sheets',
        monetization: 'Asesoría a contratistas hispanos ($1,500)',
        cta: 'Descarga la plantilla de cotización gratis en la descripción.',
        duration: '10 min',
        position: 0
      },
      {
        id: 'card-s2',
        col_key: 'guiones',
        title: 'Costo Real por Empleado de Construcción en Texas y Florida',
        pilar: 'Finanzas de Contratista',
        hook: 'Si le pagas $25 la hora a tu carpintero o pintor, en realidad te está costando más de $35. Aquí está el desglose con taxes y seguros.',
        full_script: 'Explicación de FICA, FUTA, SUTA, Workers Comp y General Liability por estado.',
        lead_magnet: 'Plantilla de Nómina de Empleados para Contratistas',
        monetization: 'Software y plantillas de gestión para contratistas',
        cta: 'Usa la calculadora en el enlace del primer comentario.',
        duration: '13 min',
        position: 0
      },
      {
        id: 'card-s3',
        col_key: 'produccion',
        title: '5 Licencias y Seguros Obligatorios para Contratistas en 2026',
        pilar: 'Legal & Seguros USA',
        hook: 'Una sola inspección o un accidente en tu obra te puede costar el negocio entero si no tienes estos 3 documentos.',
        full_script: 'General Liability, Workers Comp, Bonding y licencias locales por condado.',
        lead_magnet: 'Guía de Cumplimiento para Contratistas en USA',
        monetization: 'Comisión por referidos de aseguradoras asociadas',
        cta: 'Descarga el checklist antes de empezar tu próximo proyecto.',
        duration: '8 min',
        position: 0
      },
      {
        id: 'card-s4',
        col_key: 'publicados',
        title: 'De Empleado a Dueño de Empresa de HVAC en 12 Meses',
        pilar: 'Crecimiento de Negocio',
        hook: 'Trabajaba 60 horas a la semana cargando ductos. Un año después tengo 3 camionetas rodando.',
        full_script: 'Historia de transformación, adquisición de clientes por Google Local Services Ads y recomendaciones.',
        lead_magnet: 'Roadmap de 12 Meses para Nuevos Contratistas',
        monetization: 'Programa de mentoría grupal para Home Services',
        cta: 'Agenda tu llamada de mentoría si ya tienes tu LLC activa.',
        duration: '15 min',
        position: 0
      }
    ];

    for (const card of defaultCards) {
      saveKanbanCard(norm, card);
    }
  }

  const taskCount = db.prepare('SELECT count(*) as count FROM tasks WHERE profile = ?').get(norm).count;
  if (taskCount === 0) {
    const defaultTasks = [
      { text: 'Revisar Radar Algorítmico de YouTube y seleccionar 2 hooks de referencia', badge: 'RADAR ALTO VALOR', done: 1 },
      { text: 'Auditar guión del video principal con Eloísa Wolf (retención > 50%)', badge: 'AUDITORÍA ELOÍSA', done: 1 },
      { text: 'Grabar Video Pilar A-Roll (cámara principal + micro Shure/Rode)', badge: 'GRABACIÓN P1', done: 0 },
      { text: 'Preparar Lead Magnet descargable y verificar link en bio/descripción', badge: 'EMBUDO B2B', done: 0 },
      { text: 'Programar publicación y configurar primer comentario fijado con CTA', badge: 'PUBLICACIÓN', done: 0 }
    ];
    for (const t of defaultTasks) {
      saveTask(norm, t);
    }
  }

  const chatCount = db.prepare('SELECT count(*) as count FROM eloisa_chat WHERE profile = ?').get(norm).count;
  if (chatCount === 0) {
    const welcomeMsg = norm === 'daniel'
      ? '¡Hola Daniel! Soy Eloísa Wolf, tu asesora estratégica de YouTube y monetización 24/7. He analizado tu audiencia de sistemas B2B, automatizaciones de IA y arquitectura de software. Para escalar a $10K+/mes en ingresos directos, cada video debe operar como un embudo de alta conversión: gancho de 3 golpes, retención sostenida con micro-cortes cada 4 segundos y una oferta irresistible. ¿Qué guión o gancho quieres que auditemos hoy?'
      : '¡Hola Sebastián! Soy Eloísa Wolf, tu asesora de contenidos. He adaptado mi metodología para el mercado hispano de Home Services y Contratistas en USA. Tu audiencia necesita confianza técnica inmediata, números reales de licencias/seguros y cálculos de ganancias. Cada video tuyo debe posicionarte como el contratista de mayor autoridad. ¿En qué video o gancho trabajamos?';

    saveChatMessage(norm, 'eloisa', welcomeMsg);
  }

  const sourceCount = db.prepare('SELECT count(*) as count FROM configured_sources WHERE profile = ?').get(norm).count;
  if (sourceCount === 0) {
    const isDaniel = norm === 'daniel';
    const defaultSources = isDaniel ? [
      { channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', channelName: 'Google Developers' },
      { channelId: 'UCUyDOdBWhC1MCxEjC46d-zw', channelName: 'Acquisition.com by Alex Hormozi' },
      { channelId: 'UCcefcZRL2oaA_TsBiDDJ-tw', channelName: 'Y Combinator' }
    ] : [
      { channelId: 'UCB4KBpuuJ2QKGdVn_e0E_kg', channelName: 'The Build Show by Matt Risinger' },
      { channelId: 'UCnorhjQR4z4553VPyb0nBPQ', channelName: 'Home RenoVision DIY' },
      { channelId: 'UC_lD6BfW5F7N_VjP0-4fHqw', channelName: 'The Contractor Fight' }
    ];

    for (const src of defaultSources) {
      addConfiguredSource(norm, src.channelId, src.channelName);
    }
  }
}

module.exports = {
  getDb,
  closeDb,
  getDashboardState,
  saveKanbanCard,
  moveKanbanCard,
  deleteKanbanCard,
  saveTask,
  toggleTask,
  deleteTask,
  saveWeeklyPlan,
  saveChatMessage,
  saveRadarVideo,
  seedDefaultsIfEmpty,
  getConfiguredSources,
  addConfiguredSource,
  removeConfiguredSource,
  saveRssSignals,
  getRssSignals
};
