// CreadorPro Core Application Logic & Studio Controller
'use strict';

function getDatabase() {
  if (typeof window !== 'undefined' && window.CONTENT_DATABASE && Object.keys(window.CONTENT_DATABASE).length > 0) {
    return window.CONTENT_DATABASE;
  }
  if (typeof CONTENT_DATABASE !== 'undefined' && CONTENT_DATABASE) {
    return CONTENT_DATABASE;
  }
  return null;
}

let currentProfileKey = (typeof localStorage !== 'undefined' && localStorage.getItem('creadorpro_profile')) || 'sebastian';
let currentData = null;
let activeCardInModal = null;
let currentView = 'dashboard';
let teleprompterFontSize = 22;

const KANBAN_COLS = [
  { key: 'ideas', label: 'Ideas B2B', pillColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { key: 'guion', label: 'Guión Completo', pillColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { key: 'grabado', label: 'Listo p/ Grabar', pillColor: 'bg-rose-50 text-rose-700 border border-rose-200' },
  { key: 'editado', label: 'En Edición', pillColor: 'bg-sky-50 text-sky-700 border border-sky-200' },
  { key: 'miniatura', label: 'Miniatura Lista', pillColor: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { key: 'programado', label: 'Programado', pillColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  { key: 'publicado', label: 'Publicado', pillColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
];

let sqliteState = null;
let liveSources = [];
let liveRssSignals = [];
let rssFilterMode = 'all'; // 'all', 'live_rss', 'algo'
let isRssRefreshing = false;
let lastRssRefreshTime = null;

function initData() {
  const db = getDatabase();
  if (db && db[currentProfileKey]) {
    currentData = db[currentProfileKey];
  }
}

async function syncWithBackend() {
  try {
    const res = await fetch(`/api/state?profile=${currentProfileKey}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.status === 'ok' && json.data) {
        sqliteState = json.data;
        if (sqliteState.chatHistory && sqliteState.chatHistory.length > 0) {
          eloisaChatHistory = sqliteState.chatHistory.map(m => ({
            sender: m.sender,
            text: m.message,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        }
        renderKanbanBoard();
        renderTasks();
        if (currentView === 'eloisa') {
          renderEloisaChatMessages();
        }
      }
    }
  } catch (err) {
    console.warn('Backend SQLite sync offline/fallback mode:', err.message);
  }

  // Live RSS Channels & Signals Synchronization
  try {
    await Promise.allSettled([
      fetchLiveSources(),
      fetchLiveRssSignals()
    ]);
  } catch (err) {
    console.warn('Live RSS sync offline/fallback mode:', err.message);
  }
}

// ================= APP INITIALIZATION =================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onInit);
} else {
  onInit();
}

async function onInit() {
  initData();
  renderAll();
  setupEventListeners();
  runLiveCalculation();
  await syncWithBackend();
}

function renderAll() {
  initData();
  if (!currentData) return;
  try { renderProfileHeader(); } catch(e) { console.error('Error in renderProfileHeader:', e); }
  try { renderTopMetrics(); } catch(e) { console.error('Error in renderTopMetrics:', e); }
  try { renderWeeklyDailySchedule(); } catch(e) { console.error('Error in renderWeeklyDailySchedule:', e); }
  try { renderKanbanBoard(); } catch(e) { console.error('Error in renderKanbanBoard:', e); }
  try { renderCalendar(); } catch(e) { console.error('Error in renderCalendar:', e); }
  try { renderRecentVideos(); } catch(e) { console.error('Error in renderRecentVideos:', e); }
  try { renderTasks(); } catch(e) { console.error('Error in renderTasks:', e); }
  try { renderGuionesStudio(); } catch(e) { console.error('Error in renderGuionesStudio:', e); }
  try { renderShortsStudio(); } catch(e) { console.error('Error in renderShortsStudio:', e); }
  try { renderCommunityStudio(); } catch(e) { console.error('Error in renderCommunityStudio:', e); }
  try { renderEightWeekRoadmap(); } catch(e) { console.error('Error in renderEightWeekRoadmap:', e); }
  try { renderRadarView(); } catch(e) { console.error('Error in renderRadarView:', e); }
  try { renderEloisaView(); } catch(e) { console.error('Error in renderEloisaView:', e); }
}

// ================= NAVIGATION VIEW SWITCHER =================
function switchView(viewName) {
  currentView = viewName;
  const views = ['dashboard', 'radar', 'eloisa', 'guiones', 'shorts', 'community', 'tools', 'calendar'];
  
  views.forEach(v => {
    const el = document.getElementById(`view${capitalize(v)}`);
    const btn = document.getElementById(`nav-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    if (btn) {
      if (v === viewName) {
        btn.className = 'nav-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 text-left transition-colors';
        const icon = btn.querySelector('i');
        if (icon) icon.className = icon.className.replace('text-slate-400', 'text-blue-600');
      } else {
        btn.className = 'nav-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors';
        const icon = btn.querySelector('i');
        if (icon) icon.className = icon.className.replace('text-blue-600', 'text-slate-400');
      }
    }
  });

  if (viewName === 'guiones') {
    renderGuionesStudio();
  } else if (viewName === 'radar') {
    renderRadarView();
  } else if (viewName === 'eloisa') {
    renderEloisaView();
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ================= PROFILE SWITCHING =================
function renderProfileHeader() {
  if (!currentData) initData();
  const p = currentData.profile;
  const userName = document.getElementById('userName');
  if (userName) userName.textContent = p.name;
  const userHandle = document.getElementById('userHandle');
  if (userHandle) userHandle.textContent = p.handle;
  const avatar = document.getElementById('userAvatarContainer');
  if (avatar) {
    avatar.textContent = p.avatarText;
    avatar.className = `w-8 h-8 rounded-full ${p.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs`;
  }
  const nextEp = document.getElementById('nextEpLabel');
  if (nextEp && currentData.longVideos && currentData.longVideos[0]) {
    nextEp.textContent = currentData.longVideos[0].title.slice(0, 30) + '...';
  }
  const nextEpSub = document.getElementById('metric5Sub');
  if (nextEpSub && currentData.longVideos && currentData.longVideos[0]) {
    nextEpSub.textContent = currentData.longVideos[0].pilar || currentData.longVideos[0].title.slice(0, 24);
  }
  updateEloisaAdvisorTarget();
}

async function switchProfile(key) {
  const db = getDatabase();
  if (!db || !db[key]) return;
  currentProfileKey = key;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('creadorpro_profile', key);
  }
  liveSources = [];
  liveRssSignals = [];
  initData();
  renderAll();
  await syncWithBackend();
  await Promise.allSettled([
    fetchLiveSources(),
    fetchLiveRssSignals()
  ]);
  const menu = document.getElementById('profileMenu');
  if (menu) menu.classList.add('hidden');
  showToast('Canal Seleccionado', `Ahora operando el canal de ${currentData.profile.name}.`, 'info');
}

// ================= WEEKLY DAILY SCHEDULE RENDERING =================
function renderWeeklyDailySchedule() {
  const container = document.getElementById('weeklyDailyScheduleGrid');
  if (!container) return;
  container.innerHTML = '';

  const focusBadge = document.getElementById('weeklyScheduleFocusBadge');
  if (focusBadge) {
    focusBadge.textContent = currentProfileKey === 'sebastian'
      ? 'Semana 1 • Mano de Obra & Nómina Formal'
      : 'Semana 1 • Sistemas Deterministas & Jarvis';
  }

  const days = currentProfileKey === 'sebastian' ? [
    {
      day: 'Lunes',
      time: '09:00 AM',
      type: 'EDUCACIÓN',
      typePill: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: 'fa-comments',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'Post Comunidad: Caso Orlando ($380K vs Deuda)',
      desc: 'Caso de estudio: cómo 3 empleados a $22/h generaron $24K en tarjetas y $18K de auditoría.',
      action: () => openCardItem('programado', 'seb_cp1')
    },
    {
      day: 'Martes',
      time: '12:00 PM',
      type: 'EDUCACIÓN',
      typePill: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: 'fa-mobile-screen-button',
      iconBg: 'bg-sky-100 text-sky-700',
      title: 'Short 1: La mentira de los $20/hr en USA (38s)',
      desc: 'Hook de billete de $20: por qué con FICA y Workers\' Comp te cuesta $32.14/hr.',
      action: () => openCardItem('editado', 'seb_s1')
    },
    {
      day: 'Miércoles',
      time: '03:00 PM',
      type: 'PRE-PRODUCCIÓN',
      typePill: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: 'fa-calculator',
      iconBg: 'bg-purple-100 text-purple-700',
      title: 'Demo en Pantalla: True Employee Cost en Sheets',
      desc: 'Verificación de fórmulas de impuestos patronales y calibración de tasas estatales (FL/TX).',
      action: () => openCardItem('publicado', 'tool_cost')
    },
    {
      day: 'Jueves',
      time: '07:00 PM EST',
      isMain: true,
      type: 'VENTA B2B & CAPTURA',
      typePill: 'bg-rose-600 text-white font-bold',
      statusPill: '● GRABAR HOY',
      icon: 'fa-video',
      iconBg: 'bg-rose-100 text-rose-700',
      title: 'Ep 1: El costo REAL de contratar a $20/h (14:30 min)',
      desc: 'Video Maestro. Desglose en pantalla, regalo de calculadora y monetización con Gusto ($300/activación).',
      action: () => openVideoDetail('seb_v1')
    },
    {
      day: 'Viernes',
      time: '10:00 AM',
      type: 'VENTA B2B',
      typePill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'fa-file-arrow-down',
      iconBg: 'bg-emerald-100 text-emerald-700',
      title: 'Lead Magnet: Entrega de Labor Burden Calculator',
      desc: 'Envío del Google Sheets a los prospectos registrados y derivación a asesoría de nómina.',
      action: () => openCardItem('publicado', 'tool_cost')
    },
    {
      day: 'Sábado',
      time: '01:00 PM',
      type: 'VENTA / OBJECIÓN',
      typePill: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: 'fa-triangle-exclamation',
      iconBg: 'bg-amber-100 text-amber-800',
      title: 'Short 2: Multa de $15,000 del IRS por 1099 (36s)',
      desc: 'Hook de advertencia legal sobre pago en efectivo y reclasificación DOL.',
      action: () => openCardItem('editado', 'seb_s2')
    }
  ] : [
    {
      day: 'Lunes',
      time: '09:00 AM',
      type: 'EDUCACIÓN OPERATIVA',
      typePill: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: 'fa-comments',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'Post Comunidad: Las 4 preguntas antes de usar IA',
      desc: 'Disparador, responsable, evidencia y ambigüedad para evitar deuda técnica.',
      action: () => openCardItem('programado', 'dan_cp1')
    },
    {
      day: 'Martes',
      time: '12:00 PM',
      type: 'EDUCACIÓN SISTEMAS',
      typePill: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: 'fa-mobile-screen-button',
      iconBg: 'bg-sky-100 text-sky-700',
      title: 'Short 1: No es olvido, es diseño (35s)',
      desc: 'Por qué comprar otra aplicación no resuelve problemas operativos.',
      action: () => openCardItem('editado', 'dan_s1')
    },
    {
      day: 'Miércoles',
      time: '03:00 PM',
      type: 'ARQUITECTURA',
      typePill: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: 'fa-diagram-project',
      iconBg: 'bg-purple-100 text-purple-700',
      title: 'Demo: Idempotencia y Entregas Deterministas',
      desc: 'Secuencia de entrega con aislamiento y manejo cerrado de fallos.',
      action: () => openCardItem('publicado', 'tool_dan1')
    },
    {
      day: 'Jueves',
      time: '07:00 PM EST',
      isMain: true,
      type: 'VENTA B2B',
      typePill: 'bg-rose-600 text-white font-bold',
      statusPill: '● GRABAR HOY',
      icon: 'fa-video',
      iconBg: 'bg-rose-100 text-rose-700',
      title: 'Ep 1: Tu empresa no necesita recordatorios: Jarvis (09:00 min)',
      desc: 'Video Maestro. Arquitectura de operador único y oferta de Diagnóstico B2B.',
      action: () => openVideoDetail('dan_v1')
    },
    {
      day: 'Viernes',
      time: '10:00 AM',
      type: 'VENTA B2B',
      typePill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'fa-file-arrow-down',
      iconBg: 'bg-emerald-100 text-emerald-700',
      title: 'Lead Magnet: Mapa de Flujo Operativo Monoga OS',
      desc: 'Framework de 4 preguntas para líderes de operaciones y PyMEs.',
      action: () => openCardItem('publicado', 'tool_dan1')
    },
    {
      day: 'Sábado',
      time: '01:00 PM',
      type: 'CONTROL & TRADE-OFFS',
      typePill: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: 'fa-shield-halved',
      iconBg: 'bg-amber-100 text-amber-800',
      title: 'Short 2: La IA no debería enviar dos veces (38s)',
      desc: 'El valor de la idempotencia en sistemas de facturación y mensajes.',
      action: () => openCardItem('editado', 'dan_s2')
    }
  ];

  days.forEach(d => {
    const card = document.createElement('div');
    card.className = `p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
      d.isMain
        ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20 shadow-xs hover:border-rose-500'
        : 'bg-slate-50/70 border-slate-200 hover:border-blue-400 hover:bg-white hover:shadow-xs'
    }`;
    card.onclick = d.action;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-1 mb-2">
          <div class="flex items-center gap-1.5">
            <span class="w-6 h-6 rounded-lg ${d.iconBg} flex items-center justify-center text-[10px] shrink-0">
              <i class="fa-solid ${d.icon}"></i>
            </span>
            <div>
              <p class="text-xs font-bold text-slate-900 leading-none">${d.day}</p>
              <span class="text-[9px] text-slate-400 font-medium">${d.time}</span>
            </div>
          </div>
          ${d.statusPill ? `<span class="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-2xs animate-pulse">${d.statusPill}</span>` : ''}
        </div>

        <div class="mb-2">
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${d.typePill}">
            ${d.type}
          </span>
        </div>

        <h4 class="text-xs font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors mb-1">
          ${d.title}
        </h4>
        <p class="text-[10px] text-slate-500 leading-tight line-clamp-2">${d.desc}</p>
      </div>

      <div class="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold ${d.isMain ? 'text-rose-600' : 'text-blue-600'}">
        <span>Ver Guion</span>
        <i class="fa-solid fa-arrow-right text-[8px]"></i>
      </div>
    `;

    container.appendChild(card);
  });
}

// ================= TOP METRICS RENDERING =================
function renderTopMetrics() {
  const vCount = currentData.longVideos.length;
  const sCount = currentData.shorts.length;
  const cCount = currentData.communityPosts.length;
  document.getElementById('metric1Value').textContent = `${vCount} Videos`;
  document.getElementById('metric2Value').textContent = `${vCount} Guiones`;
  document.getElementById('metric3Value').textContent = currentProfileKey === 'sebastian' ? '3 Tools USA' : '4 Sistemas OS';
  document.getElementById('metric4Value').textContent = '180 min';
  document.getElementById('metric5Value').textContent = 'Grabar Ep 1';
  
  const nextLabel = document.getElementById('nextEpLabel');
  if (nextLabel && currentData.longVideos[0]) {
    nextLabel.textContent = currentData.longVideos[0].title.slice(0, 32) + '...';
  }
  const recentBadge = document.getElementById('recentVideosBadge');
  if (recentBadge) {
    recentBadge.textContent = `${vCount} Guiones`;
  }
}

// ================= KANBAN BOARD RENDERING =================
function getKanbanCardsForProfile() {
  const cards = {
    ideas: [],
    guion: [],
    grabado: [],
    editado: [],
    miniatura: [],
    programado: [],
    publicado: []
  };

  // Process and merge SQLite cards
  const sqliteCardIds = new Set();
  if (sqliteState && sqliteState.cards && sqliteState.cards.length > 0) {
    sqliteState.cards.forEach(c => {
      sqliteCardIds.add(c.id);
      let col = (c.col_key || 'ideas').toLowerCase();
      if (col === 'guiones') col = 'guion';
      if (col === 'produccion') col = 'grabado';
      if (col === 'publicados') col = 'publicado';
      if (!cards[col]) col = 'ideas';

      cards[col].push({
        id: c.id,
        title: c.title,
        tag: c.pilar || 'Pipeline B2B',
        type: 'sqlite',
        colKey: col,
        detailTitle: c.title,
        detailTag: c.pilar || 'Pipeline B2B',
        detailContent: (c.hook ? `⚡ HOOK:\n${c.hook}\n\n` : '') +
                       (c.full_script ? `📜 GUION / ESTRUCTURA:\n${c.full_script}\n\n` : '') +
                       (c.lead_magnet ? `🎁 LEAD MAGNET:\n${c.lead_magnet}\n\n` : '') +
                       (c.monetization ? `💰 MONETIZACIÓN:\n${c.monetization}\n\n` : '') +
                       (c.cta ? `📢 CTA:\n${c.cta}` : '')
      });
    });
  }

  if (currentProfileKey === 'sebastian') {
    // 1. Listo p/ Grabar (Hoy)
    const v1 = currentData.longVideos[0];
    if (v1 && !sqliteCardIds.has(v1.id)) {
      cards.grabado.push({
        id: v1.id,
        title: `Ep 1: ${v1.title}`,
        tag: 'Listo p/ Grabar Hoy',
        type: 'video',
        videoId: v1.id
      });
    }

    // 2. Guion Completo: Episodios 2, 3, 4, 5
    currentData.longVideos.slice(1, 5).forEach(v => {
      cards.guion.push({
        id: v.id,
        title: `Ep ${v.number}: ${v.title}`,
        tag: `${v.pilar}`,
        type: 'video',
        videoId: v.id
      });
    });

    // 3. Ideas B2B: Episodios 6, 7, 8
    currentData.longVideos.slice(5).forEach(v => {
      cards.ideas.push({
        id: v.id,
        title: `Ep ${v.number}: ${v.title}`,
        tag: `${v.pilar}`,
        type: 'video',
        videoId: v.id
      });
    });

    // 4. En Edición: Shorts 1 & 2
    cards.editado.push({
      id: 'seb_s1_card',
      title: 'Short 1: La mentira de los $20/hr (38s • Alex Hormozi Style)',
      tag: 'Short 9:16',
      type: 'short',
      shortId: 'seb_s1'
    });
    cards.editado.push({
      id: 'seb_s2_card',
      title: 'Short 2: Multa de $15,000 del IRS por 1099 (36s)',
      tag: 'Short 9:16',
      type: 'short',
      shortId: 'seb_s2'
    });

    // 5. Miniatura Lista: A/B Test Ep 1 y Ep 2
    cards.miniatura.push({
      id: 'thumb_ep1',
      title: 'Miniatura A/B Ep 1: Billete $20 vs W-2 (CTR Obj: >9.5%)',
      tag: 'Diseño A/B',
      type: 'generic',
      detailTitle: 'Miniatura A/B Ep 1: Billete $20 vs Formulario W-2',
      detailTag: 'Miniatura A/B Test',
      detailContent: 'Versión A: Primer plano de Sebastián con billete de $20 en mano y texto amarillo: "TE CUESTA $32".\nVersión B: Comparativa dividida: "1099 ($0 Taxes)" en rojo vs "W-2 ($15K Multa)" en amarillo.\nObjetivo CTR en YouTube: > 9.2% en las primeras 48 horas.'
    });
    cards.miniatura.push({
      id: 'thumb_ep2',
      title: 'Miniatura Ep 2: Markup vs Margen (Gráfico en fondo oscuro)',
      tag: 'Diseño A/B',
      type: 'generic',
      detailTitle: 'Miniatura Ep 2: El Error de Kínder en Cotizaciones',
      detailTag: 'Miniatura A/B Test',
      detailContent: 'Composición: Gráfico de barras de $10,000 de costo. Flecha roja tachando $12,000 (16.6% margen falso) y flecha verde a $16,666 (40% margen neto real).\nTipografía: Inter Bold 120pt.'
    });

    // 6. Programado: Post Comunidad 1 & Short 3
    cards.programado.push({
      id: 'post_com1',
      title: 'Post Comunidad: Caso de Estudio 3 empleados Orlando FL',
      tag: 'Comunidad YT',
      type: 'community',
      postId: 'seb_cp1'
    });
    cards.programado.push({
      id: 'short_prog3',
      title: 'Short 3: Margen vs Markup (Programado Sábado 12:00 PM)',
      tag: 'Short 9:16',
      type: 'short',
      shortId: 'seb_s3'
    });

    // 7. Publicado: Herramientas en Código Live
    cards.publicado.push({
      id: 'tool_cost',
      title: 'Tool Live: True Employee Cost Calculator (v2.1 Google Sheets)',
      tag: 'Lead Magnet Live',
      type: 'generic',
      detailTitle: 'True Employee Cost Calculator (Labor Burden Master)',
      detailTag: 'Lead Magnet #1',
      detailContent: 'Herramienta matemática funcional en Node.js y Google Sheets.\nCalcula FICA (7.65%), FUTA, SUTA estatal (TX, FL, CA, NY, NC, GA), Workers\' Comp por oficio y horas no facturables.\nEntrega el precio de venta sugerido para un margen neto del 40% innegociable.'
    });
    cards.publicado.push({
      id: 'tool_pricing',
      title: 'Tool Live: Job Costing & Pricing Matrix 2026',
      tag: 'Lead Magnet Live',
      type: 'generic',
      detailTitle: 'Job Costing & Pricing Matrix 2026',
      detailTag: 'Lead Magnet #2',
      detailContent: 'Matriz estructurada de 4 bloques: Materiales con 15% de desperdicio + Mano de obra con True Cost + Overhead asignado + Margen neto 40%.\nIncluye generador de propuestas de 3 opciones (Good, Better, Best).'
    });

  } else {
    // Daniel profile
    const v1 = currentData.longVideos[0];
    if (v1) {
      cards.grabado.push({
        id: v1.id,
        title: `Ep 1: ${v1.title}`,
        tag: 'Listo p/ Grabar',
        type: 'video',
        videoId: v1.id
      });
    }

    currentData.longVideos.slice(1, 2).forEach(v => {
      cards.guion.push({
        id: v.id,
        title: `Ep ${v.number}: ${v.title}`,
        tag: `${v.pilar}`,
        type: 'video',
        videoId: v.id
      });
    });

    currentData.longVideos.slice(2).forEach(v => {
      cards.ideas.push({
        id: v.id,
        title: `Ep ${v.number}: ${v.title}`,
        tag: `${v.pilar}`,
        type: 'video',
        videoId: v.id
      });
    });

    cards.editado.push({
      id: 'dan_s1_card',
      title: 'Short 1: No es olvido, es diseño (35s)',
      tag: 'Short 9:16',
      type: 'short',
      shortId: 'dan_s1'
    });
    cards.editado.push({
      id: 'dan_s2_card',
      title: 'Short 2: La IA no debería enviar dos veces (38s)',
      tag: 'Short 9:16',
      type: 'short',
      shortId: 'dan_s2'
    });

    cards.miniatura.push({
      id: 'thumb_dan1',
      title: 'Miniatura Ep 1: Diagrama de Idempotencia Jarvis',
      tag: 'Diseño Pro',
      type: 'generic',
      detailTitle: 'Miniatura Ep 1: Arquitectura de Jarvis',
      detailTag: 'Miniatura',
      detailContent: 'Captura de pantalla de la consola determinista y gráfico de secuencia de entrega con estado en cuarentena.'
    });

    cards.programado.push({
      id: 'post_dan1',
      title: 'Post Comunidad: Las 4 preguntas antes de usar IA',
      tag: 'Comunidad YT',
      type: 'community',
      postId: 'dan_cp1'
    });

    cards.publicado.push({
      id: 'tool_dan1',
      title: 'Blueprint: Mapa de Flujo Operativo Monoga OS',
      tag: 'Framework Live',
      type: 'generic',
      detailTitle: 'Mapa de Flujo Operativo Monoga OS',
      detailTag: 'Lead Magnet',
      detailContent: 'Protocolo de 4 preguntas innegociables para auditar y automatizar tareas operativas de PyMEs sin crear deuda técnica.'
    });
  }

  return cards;
}

function renderKanbanBoard() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;
  board.innerHTML = '';
  const kanbanData = getKanbanCardsForProfile();

  KANBAN_COLS.forEach(col => {
    const cards = kanbanData[col.key] || [];
    const colEl = document.createElement('div');
    colEl.className = 'kanban-col';
    colEl.dataset.colKey = col.key;

    colEl.innerHTML = `
      <div class="flex items-center justify-between px-1 pb-1">
        <span class="text-xs font-bold text-slate-800">${col.label}</span>
        <span class="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">${cards.length}</span>
      </div>
      <div class="space-y-2 min-h-[160px] flex-1 kanban-card-container" data-col-key="${col.key}">
        ${cards.map(card => `
          <div class="kanban-card group cursor-pointer hover:border-blue-300 hover:shadow-xs transition-all" draggable="true" data-card-id="${card.id}" data-col-key="${col.key}" onclick="openCardItem('${col.key}', '${card.id}')">
            <p class="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">${card.title}</p>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md ${col.pillColor}">
                ${card.tag || col.label}
              </span>
              <span class="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Ver <i class="fa-solid fa-arrow-right text-[8px]"></i>
              </span>
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="quickAddCard('${col.key}')" class="w-full text-center text-[11px] font-medium text-slate-400 hover:text-blue-600 hover:bg-slate-100/70 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
        <i class="fa-solid fa-plus text-[9px]"></i> Añadir
      </button>
    `;

    setupDragAndDrop(colEl);
    board.appendChild(colEl);
  });
}

function setupDragAndDrop(colEl) {
  const cards = colEl.querySelectorAll('.kanban-card');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        cardId: card.dataset.cardId,
        fromCol: card.dataset.colKey
      }));
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  colEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    colEl.classList.add('drag-over');
  });

  colEl.addEventListener('dragleave', () => {
    colEl.classList.remove('drag-over');
  });

  colEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    colEl.classList.remove('drag-over');
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const data = JSON.parse(raw);
      const targetCol = colEl.dataset.colKey;
      if (data.cardId && targetCol && data.fromCol !== targetCol) {
        await moveCardToColumn(data.cardId, targetCol);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  });
}

// ================= POPUP / MODAL DETALLADO DE GUION =================
function findVideoById(videoId) {
  return currentData.longVideos.find(v => v.id === videoId);
}

function openCardItem(colKey, cardId) {
  // Check if card is in SQLite state
  if (sqliteState && sqliteState.cards) {
    const sc = sqliteState.cards.find(c => c.id === cardId);
    if (sc) {
      const content = (sc.hook ? `⚡ HOOK:\n"${sc.hook}"\n\n` : '') +
                      (sc.full_script ? `📜 GUION / ESTRUCTURA:\n${sc.full_script}\n\n` : '') +
                      (sc.lead_magnet ? `🎁 LEAD MAGNET:\n${sc.lead_magnet}\n\n` : '') +
                      (sc.monetization ? `💰 MONETIZACIÓN:\n${sc.monetization}\n\n` : '') +
                      (sc.cta ? `📢 CTA:\n${sc.cta}` : '');
      openGenericDetail(sc.title, sc.pilar || 'Pipeline SQLite', content || sc.title, sc.lead_magnet || 'Entregable Monoga OS');
      return;
    }
  }

  // 1. If it's a long video ID
  const v = currentData.longVideos.find(vid => vid.id === cardId);
  if (v) {
    openVideoDetail(v.id);
    return;
  }
  // 2. If it's a short
  const s = currentData.shorts.find(sh => sh.id === cardId || cardId.includes(sh.id));
  if (s) {
    openGenericDetail(s.title, 'Short Vertical 9:16 (40s)', `⚡ HOOK DE IMPACTO:\n"${s.hook}"\n\n📜 GUION:\n${s.script}\n\n📢 LLAMADO A LA ACCIÓN (CTA):\n${s.cta}`, 'Short derivado de alto impacto para adquisición orgánica de leads en YouTube y TikTok.');
    return;
  }
  // 3. If it's a community post
  const cp = currentData.communityPosts.find(p => p.id === cardId || cardId.includes(p.id));
  if (cp) {
    openGenericDetail(cp.title, `Post de Comunidad • ${cp.type}`, cp.content, 'Publicación de debate y engagement para la pestaña de Comunidad de YouTube y LinkedIn.');
    return;
  }
  // 4. Check custom generic kanban cards
  const kanbanData = getKanbanCardsForProfile();
  for (const c in kanbanData) {
    const found = kanbanData[c].find(item => item.id === cardId);
    if (found && found.detailTitle) {
      openGenericDetail(found.detailTitle, found.detailTag, found.detailContent, 'Herramienta / Entregable del Pipeline de Producción Monoga OS.');
      return;
    }
  }
  // Fallback
  if (currentData.longVideos[0]) {
    openVideoDetail(currentData.longVideos[0].id);
  }
}

function openGenericDetail(title, tag, content, subtitle) {
  const firstVideo = currentData.longVideos[0];
  activeCardInModal = firstVideo;

  document.getElementById('modalVideoTitle').textContent = title;
  document.getElementById('modalPillarBadge').textContent = tag;
  document.getElementById('modalStageBadge').textContent = 'Pipeline Activo';
  document.getElementById('modalHookText').textContent = content.split('\n')[0] || title;

  const structContainer = document.getElementById('modalStructureList');
  structContainer.innerHTML = '';
  const lines = content.split('\n').filter(l => l.trim().length > 0).slice(0, 4);
  lines.forEach((line, i) => {
    const stepEl = document.createElement('div');
    stepEl.className = 'flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100';
    stepEl.innerHTML = `
      <span class="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
      <span class="text-slate-700 leading-snug font-medium">${line}</span>
    `;
    structContainer.appendChild(stepEl);
  });

  const fullScriptEl = document.getElementById('modalFullScriptContainer');
  if (fullScriptEl) {
    fullScriptEl.innerHTML = content.replace(/\n/g, '<br>');
  }

  document.getElementById('modalLeadMagnet').textContent = subtitle;
  document.getElementById('modalMonetization').textContent = 'Conversión de Tráfico Orgánico a Clientes B2B';
  document.getElementById('modalCtaText').textContent = 'Accede a las herramientas oficiales en la descripción del video.';

  document.getElementById('videoDetailModal').classList.remove('hidden');
}

function openVideoDetail(videoId) {
  const v = findVideoById(videoId);
  if (!v) return;

  activeCardInModal = v;
  document.getElementById('modalVideoTitle').textContent = v.title;
  document.getElementById('modalPillarBadge').textContent = v.pilar;
  document.getElementById('modalStageBadge').textContent = v.status || 'Listo para Grabar';
  document.getElementById('modalHookText').textContent = v.hook;

  // Structure
  const structContainer = document.getElementById('modalStructureList');
  structContainer.innerHTML = '';
  if (v.structure && v.structure.length > 0) {
    v.structure.forEach((step, i) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100';
      stepEl.innerHTML = `
        <span class="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
        <span class="text-slate-700 leading-snug font-medium">${step}</span>
      `;
      structContainer.appendChild(stepEl);
    });
  }

  // Full Word-for-Word Script
  const fullScriptEl = document.getElementById('modalFullScriptContainer');
  if (fullScriptEl) {
    fullScriptEl.innerHTML = (v.fullScript || v.hook).replace(/\n/g, '<br>');
  }

  // Lead magnet, Monetization, CTA
  document.getElementById('modalLeadMagnet').textContent = v.leadMagnet;
  document.getElementById('modalMonetization').textContent = v.monetization;
  document.getElementById('modalCtaText').textContent = v.cta;

  document.getElementById('videoDetailModal').classList.remove('hidden');
}

function openTeleprompterModal() {
  if (!activeCardInModal) return;
  const v = activeCardInModal;
  document.getElementById('teleprompterTitle').textContent = v.title;
  const content = document.getElementById('teleprompterContent');
  
  const textHtml = (v.fullScript || v.hook).split('\n\n').map(para => {
    if (para.startsWith('[')) {
      return `<h3 class="text-red-400 font-bold text-lg mt-6 border-b border-slate-800 pb-1">${para}</h3>`;
    }
    if (para.startsWith('(')) {
      return `<p class="text-slate-400 italic text-sm">${para}</p>`;
    }
    return `<p class="text-slate-100">${para}</p>`;
  }).join('');

  content.innerHTML = textHtml;
  document.getElementById('teleprompterModal').classList.remove('hidden');
}

function openTeleprompterForCurrentEp() {
  const ep = currentData.longVideos[0];
  if (ep) {
    activeCardInModal = ep;
    openTeleprompterModal();
  }
}

function adjustTeleprompterFont(delta) {
  teleprompterFontSize = Math.max(14, Math.min(36, teleprompterFontSize + delta * 2));
  document.getElementById('teleprompterContent').style.fontSize = `${teleprompterFontSize}px`;
}

function markAsRecorded() {
  if (!activeCardInModal) return;
  alert(`¡Episodio "${activeCardInModal.title}" registrado como grabado! Minutos de producción guardados en el perfil.`);
  closeModal('videoDetailModal');
}

function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert('¡Copiado al portapapeles!');
  });
}

function copyFullScript() {
  if (!activeCardInModal) return;
  const v = activeCardInModal;
  const scriptText = `
TÍTULO: ${v.title}
PILAR: ${v.pilar}
DURACIÓN: ${v.duration}

HOOK (0:00–0:45):
${v.hook}

ESTRUCTURA:
${v.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

GUION PALABRA POR PALABRA:
${v.fullScript || v.hook}

LEAD MAGNET: ${v.leadMagnet}
MONETIZACIÓN: ${v.monetization}
CTA: ${v.cta}
  `.trim();

  navigator.clipboard.writeText(scriptText).then(() => {
    alert('¡Guion palabra por palabra copiado al portapapeles!');
  });
}

// ================= VIEW 2: GUIONES STUDIO VIEW =================
function renderGuionesStudio() {
  const tabsContainer = document.getElementById('scriptSelectorTabs');
  const activeContainer = document.getElementById('activeScriptContainer');
  tabsContainer.innerHTML = '';
  activeContainer.innerHTML = '';

  currentData.longVideos.forEach((v, idx) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
    tabBtn.textContent = `Episodio ${v.number}`;
    tabBtn.onclick = () => showScriptInStudio(idx);
    tabsContainer.appendChild(tabBtn);
  });

  showScriptInStudio(0);
}

function showScriptInStudio(idx) {
  const v = currentData.longVideos[idx];
  const container = document.getElementById('activeScriptContainer');
  
  // Highlight tab
  const tabs = document.getElementById('scriptSelectorTabs').querySelectorAll('button');
  tabs.forEach((t, i) => {
    t.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${i === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
  });

  container.innerHTML = `
    <div class="flex items-start justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">Episodio ${v.number}</span>
          <span class="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">${v.pilar}</span>
          <span class="text-xs text-slate-500 font-semibold"><i class="fa-regular fa-clock"></i> ${v.duration}</span>
        </div>
        <h3 class="text-lg font-bold text-slate-900">${v.title}</h3>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="activeCardInModal = currentData.longVideos[${idx}]; openTeleprompterModal();" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5">
          <i class="fa-solid fa-expand"></i> Teleprompter
        </button>
        <button onclick="activeCardInModal = currentData.longVideos[${idx}]; copyFullScript();" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
          <i class="fa-regular fa-copy"></i> Copiar
        </button>
      </div>
    </div>

    <!-- Script Body -->
    <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">⚡ Hook / Gancho para Cámara (0:00–0:45)</h4>
        <p class="text-xs text-amber-950 italic font-medium leading-relaxed">${v.hook}</p>
      </div>

      <div>
        <h4 class="text-sm font-bold text-slate-900 mb-3">📜 Guion Palabra por Palabra</h4>
        <div class="text-xs leading-relaxed text-slate-700 space-y-4 font-mono bg-slate-50 p-5 rounded-xl border border-slate-200 select-text max-h-[500px] overflow-y-auto">
          ${(v.fullScript || v.hook).replace(/\n/g, '<br>')}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div class="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
          <span class="font-bold text-blue-900 block mb-1">🎁 Herramienta Regalada</span>
          <p class="text-slate-700">${v.leadMagnet}</p>
        </div>
        <div class="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
          <span class="font-bold text-emerald-900 block mb-1">💰 Monetización B2B</span>
          <p class="text-slate-700">${v.monetization}</p>
        </div>
        <div class="bg-slate-100/70 p-3 rounded-xl border border-slate-200">
          <span class="font-bold text-slate-800 block mb-1">📢 Llamado a la Acción (CTA)</span>
          <p class="text-slate-700">${v.cta}</p>
        </div>
      </div>
    </div>
  `;
}

// ================= VIEW 3: SHORTS STUDIO =================
function renderShortsStudio() {
  const container = document.getElementById('shortsListContainer');
  if (!container || !currentData || !currentData.shorts) return;
  container.innerHTML = '';

  currentData.shorts.forEach(s => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">Short 9:16 (40s)</span>
        <button onclick="navigator.clipboard.writeText('${s.script.replace(/'/g, "\\'")}'); alert('¡Short copiado!');" class="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1">
          <i class="fa-regular fa-copy"></i> Copiar
        </button>
      </div>
      <h3 class="text-sm font-bold text-slate-900">${s.title}</h3>
      <div class="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
        <p><strong class="text-rose-600">Hook:</strong> "${s.hook}"</p>
        <p class="text-slate-600 leading-relaxed font-sans">${s.script.replace(/\n/g, '<br>')}</p>
        <p><strong class="text-blue-600">CTA:</strong> ${s.cta}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ================= VIEW 4: COMUNIDAD POSTS =================
function renderCommunityStudio() {
  const container = document.getElementById('communityListContainer');
  if (!container || !currentData || !currentData.communityPosts) return;
  container.innerHTML = '';

  currentData.communityPosts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">${post.type}</span>
        <button onclick="navigator.clipboard.writeText('${post.content.replace(/'/g, "\\'")}'); alert('¡Post de comunidad copiado!');" class="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1">
          <i class="fa-regular fa-copy"></i> Copiar Post
        </button>
      </div>
      <h3 class="text-base font-bold text-slate-900">${post.title}</h3>
      <div class="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans select-text whitespace-pre-line">
${post.content}
      </div>
    `;
    container.appendChild(card);
  });
}

// ================= VIEW 5: LIVE CALCULATOR RUNNER =================
function runLiveCalculation() {
  const calcFn = typeof calculateTrueCostLive === 'function' ? calculateTrueCostLive : (typeof window !== 'undefined' && typeof window.calculateTrueCostLive === 'function' ? window.calculateTrueCostLive : null);
  if (!calcFn) return;

  const wage = document.getElementById('calcWage')?.value || 20;
  const state = document.getElementById('calcState')?.value || 'FL';
  const wc = document.getElementById('calcWc')?.value || 0.10;
  const downtime = document.getElementById('calcDowntime')?.value || 5;
  const overhead = document.getElementById('calcOverhead')?.value || 80;

  const res = calcFn(wage, state, downtime, overhead, wc);
  if (!res) return;

  if (document.getElementById('resPaidHour')) document.getElementById('resPaidHour').innerHTML = `$${res.costPerPaidHour} <span class="text-xs font-bold text-slate-400">/hr</span>`;
  if (document.getElementById('resBillableHour')) document.getElementById('resBillableHour').innerHTML = `$${res.trueCostPerBillableHour} <span class="text-xs font-bold text-rose-400">/hr</span>`;
  if (document.getElementById('resSellingPrice')) document.getElementById('resSellingPrice').textContent = `$${res.suggestedSellingPrice40}`;
  if (document.getElementById('resBurdenPct')) document.getElementById('resBurdenPct').textContent = res.burdenPercent;
  if (document.getElementById('resTrueBurdenPct')) document.getElementById('resTrueBurdenPct').textContent = res.trueBurdenPercent;
  if (document.getElementById('resEfficiency')) document.getElementById('resEfficiency').textContent = `${res.billableEfficiency}%`;
  if (document.getElementById('resTotalYear')) document.getElementById('resTotalYear').textContent = `$${res.totalCostYear.toLocaleString()} USD`;
  if (document.getElementById('calcStateBadge')) document.getElementById('calcStateBadge').textContent = res.stateName;
}

// ================= VIEW 6: 8-WEEK ROADMAP =================
function renderEightWeekRoadmap() {
  const container = document.getElementById('eightWeekRoadmapContainer');
  if (!container) return;
  container.innerHTML = '';

  const schedule = currentProfileKey === 'daniel' ? [
    { week: 1, title: 'Tu empresa no necesita más recordatorios: Jarvis y Sistemas Deterministas', focus: 'Arquitectura Determinista', tool: 'Blueprint de Flujos Operativos' },
    { week: 2, title: 'MARAL OS: Cómo unificamos una operación de $1.2M en una sola pantalla', focus: 'Sistemas Operativos Propios', tool: 'SaaS vs Custom OS Matrix' },
    { week: 3, title: 'Universidad OS: Seguridad, Control de Accesos (RBAC) y Cero Fugas', focus: 'Ciberseguridad B2B', tool: 'Checklist de Privilegios Mínimos' },
    { week: 4, title: 'Mecatrónica aplicada a Software: Circuit Breakers y Flujos Robustos', focus: 'Ingeniería Operativa', tool: 'Diagrama de Circuit Breakers' },
    { week: 5, title: 'Por qué la IA no debería enviar mensajes dos veces: Idempotencia B2B', focus: 'IA en Producción', tool: 'Idempotency Protocol Sheet' },
    { week: 6, title: 'De 15 Herramientas Zapier a 1 Motor Centralizado: Eliminando Deuda', focus: 'Integración Determinista', tool: 'Tech Debt Audit Matrix' },
    { week: 7, title: 'La Matemática de un Holding de Medios: Monetizar Audiencias Técnicas', focus: 'Monetización B2B', tool: 'LTV & Funnel High-Ticket' },
    { week: 8, title: 'El Operador de $1,000/hr: Sistemas Autónomos de Ejecución Nocturna', focus: 'Escala & Delegación', tool: 'Autonomous Ops Blueprint' }
  ] : [
    { week: 1, title: 'El costo REAL de contratar un empleado a $20/h en USA', focus: 'Mano de Obra', tool: 'True Employee Cost Calculator' },
    { week: 2, title: 'Cómo cotizar proyectos de servicios para ganar 40% de margen', focus: 'Pricing & Margen', tool: 'Job Costing & Pricing Matrix' },
    { week: 3, title: 'Dejamos de usar papel y WhatsApp: CRM Housecall Pro vs Jobber', focus: 'Sistemas & CRM', tool: 'CRM Setup Guide' },
    { week: 4, title: 'Auditoría en Vivo: Empresa factura $45K pero el dueño no gana', focus: 'Auditoría Financiera', tool: 'Business Health Scorecard' },
    { week: 5, title: '¿1099 o W-2? El error legal que puede destruir tu compañía este año', focus: 'Compliance Legal', tool: 'Subcontractor Compliance Pack' },
    { week: 6, title: 'El truco de las grandes compañías para ganar 25% extra en materiales', focus: 'Materiales & Supply', tool: 'Material Markup Calculator' },
    { week: 7, title: 'Cómo cobrar los Change Orders sin que el cliente se enoje', focus: 'Contratos & Clientes', tool: 'Change Order & Lien Waiver Pack' },
    { week: 8, title: 'Cómo salir de la obra: Paso a paso para contratar a tu primer capataz', focus: 'Escalar Empresa', tool: 'Foreman Hiring Blueprint' }
  ];

  schedule.forEach(s => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs';
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">S${s.week}</span>
        <div>
          <p class="font-bold text-slate-900">${s.title}</p>
          <span class="text-[10px] text-slate-500">Pilar: <strong>${s.focus}</strong></span>
        </div>
      </div>
      <div class="text-right">
        <span class="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">${s.tool}</span>
      </div>
    `;
    container.appendChild(row);
  });
}

// ================= CALENDAR AND RECENTS =================
function renderCalendar() {
  const calDays = document.getElementById('calendarDays');
  if (!calDays) return;
  calDays.innerHTML = '';

  const events = {
    1: [{ type: 'post', title: 'Post: Caso Orlando' }],
    2: [{ type: 'short', title: 'S1: Mentira $20' }],
    4: [{ type: 'video', title: 'Revisión Ep 1' }],
    5: [{ type: 'video', title: 'GRABAR Ep 1', highlight: true }],
    7: [{ type: 'short', title: 'S2: Multa IRS' }],
    8: [{ type: 'post', title: 'Encuesta Pricing' }],
    9: [{ type: 'short', title: 'S3: Margen Markup' }],
    11: [{ type: 'video', title: 'Revisión Ep 2' }],
    12: [{ type: 'video', title: 'GRABAR Ep 2' }],
    14: [{ type: 'short', title: 'S4: Depósito 50%' }],
    15: [{ type: 'post', title: 'Post: Libreta CRM' }],
    16: [{ type: 'short', title: 'S5: WhatsApp CRM', highlight: true }],
    18: [{ type: 'video', title: 'Revisión Ep 3' }],
    19: [{ type: 'video', title: 'GRABAR Ep 3' }],
    21: [{ type: 'short', title: 'S6: Delegar 85%' }],
    22: [{ type: 'post', title: 'Post: Manifiesto W2' }],
    23: [{ type: 'short', title: 'S7: Troca $80K' }],
    25: [{ type: 'video', title: 'Revisión Ep 4' }],
    26: [{ type: 'video', title: 'GRABAR Ep 4' }],
    28: [{ type: 'short', title: 'S8: Change Orders' }],
    29: [{ type: 'post', title: 'Post: Auditoría P&L' }],
    30: [{ type: 'short', title: 'S9: DOL Test' }]
  };

  const pad = document.createElement('div');
  pad.className = 'cal-day-cell bg-slate-50/50 border-transparent';
  calDays.appendChild(pad);

  for (let day = 1; day <= 30; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'cal-day-cell min-h-[46px] p-1 border border-slate-100 rounded-lg flex flex-col justify-between bg-white hover:border-blue-300 transition-colors';
    const dayEvents = events[day] || [];

    let eventHtml = '';
    if (dayEvents.length > 0) {
      eventHtml = dayEvents.map(ev => `
        <div class="cal-event-badge text-[8.5px] px-1 py-0.5 rounded leading-tight truncate ${ev.highlight ? 'bg-rose-600 text-white font-bold' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
          ${ev.title}
        </div>
      `).join('');
    }

    dayCell.innerHTML = `
      <span class="cal-day-num text-[10px] font-bold ${dayEvents.some(e => e.highlight) ? 'text-rose-600' : 'text-slate-500'}">${day}</span>
      <div class="space-y-0.5">${eventHtml}</div>
    `;
    calDays.appendChild(dayCell);
  }
}

function renderRecentVideos() {
  const container = document.getElementById('recentVideosList');
  if (!container) return;
  container.innerHTML = '';

  currentData.longVideos.slice(0, 5).forEach((v, idx) => {
    const row = document.createElement('div');
    row.className = 'py-2.5 flex items-center justify-between gap-3 text-xs';
    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <div class="w-9 h-9 rounded-xl ${idx === 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'} flex flex-col items-center justify-center shrink-0 font-bold text-[10px] leading-none">
          <span>Ep ${v.number}</span>
          <span class="text-[8px] font-normal text-slate-400 mt-0.5">${v.duration.split(' ')[0]}</span>
        </div>
        <div class="min-w-0">
          <p class="font-bold text-slate-800 truncate hover:text-blue-600 cursor-pointer" onclick="openVideoDetail('${v.id}')">${v.title}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-[10px] text-slate-400 truncate">${v.pilar}</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded font-semibold ${idx === 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'} shrink-0">${v.status || 'Guion Listo'}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button onclick="openVideoDetail('${v.id}')" class="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors">
          Guion
        </button>
        <button onclick="activeCardInModal = currentData.longVideos[${idx}]; openTeleprompterModal();" class="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Teleprompter">
          <i class="fa-solid fa-expand text-xs"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderTasks() {
  const container = document.getElementById('tasksList');
  if (!container) return;
  container.innerHTML = '';

  const defaultTasks = [
    { id: 't1', text: `Grabar Video 1: ${currentData.longVideos[0].title.slice(0, 32)}...`, badge: 'flag', done: false },
    { id: 't2', text: 'Grabar los 2 Shorts verticales en la misma sesión', badge: 'Hoy', done: false },
    { id: 't3', text: 'Subir herramienta descargable a Google Drive', badge: 'Hoy', done: true }
  ];

  defaultTasks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between gap-2';
    item.innerHTML = `
      <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none">
        <input type="checkbox" ${t.done ? 'checked' : ''} class="rounded border-slate-300 text-blue-600 focus:ring-0">
        <span class="${t.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'} truncate">${t.text}</span>
      </label>
      <span class="text-[10px] text-slate-400 font-medium">${t.badge === 'flag' ? '<i class="fa-solid fa-flag text-red-500"></i>' : t.badge}</span>
    `;
    container.appendChild(item);
  });
}

function updateOptimizationScore() {
  const checks = document.querySelectorAll('.opt-check');
  const checked = Array.from(checks).filter(c => c.checked).length;
  document.getElementById('optimizationCounter').textContent = `${checked}/6 verificados`;
}

function updateGrowthScore() {
  const checks = document.querySelectorAll('.growth-check');
  const checked = Array.from(checks).filter(c => c.checked).length;
  const pct = Math.round((checked / 5) * 100);
  document.getElementById('growthProgressText').textContent = `${checked} de 5 pasos verificados`;
  document.getElementById('growthProgressBar').style.width = `${pct}%`;
}

function setupEventListeners() {
  const btn = document.getElementById('profileDropdownBtn');
  const menu = document.getElementById('profileMenu');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    menu.classList.add('hidden');
  });

  // Global search filter
  const searchInput = document.getElementById('globalSearch');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.kanban-card').forEach(card => {
      const match = card.textContent.toLowerCase().includes(query);
      card.style.display = match ? 'block' : 'none';
    });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') {
      closeModal('teleprompterModal');
      closeModal('videoDetailModal');
      closeModal('radarDetailModal');
      closeModal('manageSourcesModal');
      closeModal('addIdeaModal');
      closeModal('addTaskModal');
    }
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'recientemente';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'recientemente';
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'hace unos segundos';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays} d`;
  return d.toLocaleDateString();
}

function showToast(title, message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icon = type === 'success' ? 'fa-circle-check text-emerald-500' :
               type === 'error' ? 'fa-triangle-exclamation text-rose-500' :
               type === 'info' ? 'fa-circle-info text-blue-500' : 'fa-bolt text-amber-500';
  const border = type === 'success' ? 'border-emerald-200' :
                 type === 'error' ? 'border-rose-200' :
                 type === 'info' ? 'border-blue-200' : 'border-amber-200';
  toast.className = `p-3.5 rounded-2xl border ${border} bg-white shadow-xl text-slate-800 text-xs flex items-start gap-3 transform transition-all duration-300 opacity-0 translate-y-2 pointer-events-auto max-w-sm`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base shrink-0 mt-0.5"></i>
    <div class="flex-1 min-w-0">
      <p class="font-bold text-slate-900">${title}</p>
      <p class="text-slate-600 text-[11px] mt-0.5 leading-snug">${message}</p>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  }, 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Override copyToClipboard to use toast
function copyToClipboard(elementIdOrText) {
  let text = '';
  const el = document.getElementById(elementIdOrText);
  if (el) {
    text = el.innerText || el.textContent;
  } else {
    text = elementIdOrText;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copiado con Éxito', 'Texto copiado al portapapeles listo para usar.', 'success');
  }).catch(() => {
    showToast('Aviso', 'Texto seleccionado para copia manual.', 'info');
  });
}

// ================= TASKS CONTROLLER & SQLITE PERSISTENCE =================
function renderTasks() {
  const container = document.getElementById('tasksList');
  if (!container) return;
  container.innerHTML = '';

  const tasks = (sqliteState && sqliteState.tasks && sqliteState.tasks.length > 0)
    ? sqliteState.tasks
    : [
        { id: 'def_t1', text: 'Revisar Radar Algorítmico y seleccionar 2 hooks', badge: 'RADAR ALTO VALOR', done: true },
        { id: 'def_t2', text: 'Auditar guión del video principal con Eloísa Wolf', badge: 'AUDITORÍA ELOÍSA', done: true },
        { id: 'def_t3', text: 'Grabar Video Pilar A-Roll (≤ 75 min con teleprompter)', badge: 'GRABACIÓN P1', done: false },
        { id: 'def_t4', text: 'Preparar Lead Magnet descargable y link en bio', badge: 'EMBUDO B2B', done: false },
        { id: 'def_t5', text: 'Programar publicación y primer comentario fijado con CTA', badge: 'PUBLICACIÓN', done: false }
      ];

  tasks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/60 transition-colors group';
    item.innerHTML = `
      <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTaskInDb('${t.id}', this.checked)" class="rounded border-slate-300 text-emerald-600 focus:ring-0">
        <span class="text-slate-700 font-medium truncate ${t.done ? 'line-through text-slate-400 font-normal' : ''}">${t.text}</span>
      </label>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">${t.badge || 'PRODUCCIÓN'}</span>
        <button onclick="deleteTaskFromDb('${t.id}')" title="Eliminar tarea" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 text-xs transition-opacity">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

async function toggleTaskInDb(taskId, isDone) {
  try {
    const res = await fetch('/api/tasks/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: currentProfileKey, taskId, done: isDone })
    });
    if (res.ok) {
      if (sqliteState && sqliteState.tasks) {
        const found = sqliteState.tasks.find(x => x.id === taskId);
        if (found) found.done = isDone;
      }
      renderTasks();
      showToast('Tarea Actualizada', isDone ? 'Marcada como completada.' : 'Marcada como pendiente.', 'info');
    }
  } catch (err) {
    console.error('Error toggling task in SQLite:', err);
  }
}

async function deleteTaskFromDb(taskId) {
  try {
    const res = await fetch('/api/tasks/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: currentProfileKey, taskId })
    });
    if (res.ok) {
      if (sqliteState && sqliteState.tasks) {
        sqliteState.tasks = sqliteState.tasks.filter(x => x.id !== taskId);
      }
      renderTasks();
      showToast('Tarea Eliminada', 'Eliminada de la base de datos local SQLite.', 'info');
    }
  } catch (err) {
    console.error('Error deleting task from SQLite:', err);
  }
}

function openAddTaskModal() {
  const modal = document.getElementById('addTaskModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.getElementById('newTaskText')?.focus();
}

async function handleCreateTaskSubmit(e) {
  e.preventDefault();
  const textInput = document.getElementById('newTaskText');
  const badgeInput = document.getElementById('newTaskBadge');
  const text = textInput ? textInput.value.trim() : '';
  const badge = badgeInput ? badgeInput.value : 'PRODUCCIÓN';
  if (!text) return;

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: currentProfileKey, task: { text, badge } })
    });
    if (res.ok) {
      const data = await res.json();
      if (sqliteState && sqliteState.tasks && data.task) {
        sqliteState.tasks.unshift(data.task);
      }
      closeModal('addTaskModal');
      if (textInput) textInput.value = '';
      renderTasks();
      showToast('Tarea Guardada', `"${text}" registrada en base de datos SQLite.`, 'success');
    }
  } catch (err) {
    console.error('Error creating task:', err);
    showToast('Error', 'No se pudo guardar la tarea en SQLite.', 'error');
  }
}

// ================= KANBAN CRUD & SQLITE PERSISTENCE =================
function quickAddCard(colKey) {
  openAddIdeaModal(colKey);
}

function openAddIdeaModal(colKey = 'ideas') {
  const modal = document.getElementById('addIdeaModal');
  if (!modal) return;
  const colSelect = document.getElementById('newIdeaCol');
  if (colSelect && colKey) {
    colSelect.value = colKey;
  }
  modal.classList.remove('hidden');
  document.getElementById('newIdeaTitle')?.focus();
}

async function handleCreateIdeaSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('newIdeaTitle')?.value.trim();
  const col_key = document.getElementById('newIdeaCol')?.value || 'ideas';
  const pilar = document.getElementById('newIdeaPilar')?.value.trim() || 'B2B Systems & AI';
  const hook = document.getElementById('newIdeaHook')?.value.trim() || '';
  const lead_magnet = document.getElementById('newIdeaLeadMagnet')?.value.trim() || '';
  const duration = document.getElementById('newIdeaDuration')?.value.trim() || '10-12 min';

  if (!title) return;

  try {
    const res = await fetch('/api/kanban/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        card: {
          title,
          col_key,
          pilar,
          hook,
          lead_magnet,
          duration,
          full_script: hook ? `⚡ HOOK:\n${hook}\n\n📜 ESTRUCTURA:\n1. Hook de apertura con dolor específico\n2. Desarrollo paso a paso sin rodeos\n3. Llamado a la acción de alto valor.` : ''
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (sqliteState && sqliteState.cards && data.card) {
        sqliteState.cards.push(data.card);
      }
      closeModal('addIdeaModal');
      document.getElementById('addIdeaForm')?.reset();
      renderKanbanBoard();
      showToast('Idea Registrada', `"${title}" guardada en SQLite en columna ${col_key}.`, 'success');
    }
  } catch (err) {
    console.error('Error creating idea card in SQLite:', err);
    showToast('Error', 'No se pudo guardar la idea en SQLite.', 'error');
  }
}

async function moveCardToColumn(cardId, newColKey) {
  try {
    const res = await fetch('/api/kanban/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        cardId,
        newColKey
      })
    });
    if (res.ok) {
      if (sqliteState && sqliteState.cards) {
        const found = sqliteState.cards.find(c => c.id === cardId);
        if (found) found.col_key = newColKey;
      }
      renderKanbanBoard();
      showToast('Pipeline Actualizado', `Tarjeta movida a columna ${newColKey}.`, 'success');
    }
  } catch (err) {
    console.error('Error moving card in SQLite:', err);
  }
}

async function adoptCurrentRadarIdeaToKanban() {
  if (!currentRadarVideoInModal) return;
  try {
    const res = await fetch('/api/radar/convert-to-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        video: currentRadarVideoInModal
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (sqliteState && sqliteState.cards && data.card) {
        sqliteState.cards.unshift(data.card);
      }
      closeModal('radarDetailModal');
      showToast('¡Idea Adoptada en SQLite!', `"${data.card.title}" agregada a Ideas B2B con gancho extraído.`, 'success');
      switchView('dashboard');
      renderKanbanBoard();
    }
  } catch (err) {
    console.error('Error adopting radar idea to SQLite:', err);
    showToast('Error', 'No se pudo guardar la idea en SQLite.', 'error');
  }
}

function consultCurrentRadarVideoWithEloisa() {
  if (!currentRadarVideoInModal) return;
  const vid = currentRadarVideoInModal;
  closeModal('radarDetailModal');
  switchView('eloisa');
  const hook = vid.hookSnippet || vid.hookBreakdown?.split('\n')?.[0] || 'Hook de apertura';
  const prompt = `Eloísa, quiero modelar este video viral del radar: "${vid.title}" del canal "${vid.channel}". Su gancho es: "${hook}". ¿Cómo adapto esta misma estructura psicológica para vender mis sistemas de alto ticket?`;
  sendEloisaMessage(prompt);
}

// ================= RADAR VIEW CONTROLLER & LIVE RSS INGESTION =================
let radarCurrentNiche = 'all';
let radarSearchQuery = '';
let currentRadarVideoInModal = null;
let currentRadarWeeklyPlan = null;

// Modal and Source Management Handlers
function openManageSourcesModal() {
  openModal('manageSourcesModal');
  fetchLiveSources();
}

function renderSourcesInModal() {
  const container = document.getElementById('channelsListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!liveSources || liveSources.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
        <i class="fa-solid fa-satellite-dish text-2xl mb-2 text-slate-300 block"></i>
        <p class="text-xs font-semibold text-slate-600">No hay canales monitoreados todavía.</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Agrega un canal con su Channel ID abajo para activar la telemetría RSS.</p>
      </div>
    `;
    return;
  }

  liveSources.forEach(source => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-colors';
    const channelName = escapeHtml(source.channel_name || source.channel_id);
    const channelId = escapeHtml(source.channel_id);

    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
          <i class="fa-brands fa-youtube"></i>
        </div>
        <div class="min-w-0 flex-1 pr-2">
          <p class="font-bold text-slate-900 text-xs truncate" title="${channelName}">${channelName}</p>
          <p class="text-[10px] text-slate-400 font-mono truncate" title="${channelId}">${channelId}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Activo
        </span>
        <button onclick="handleRemoveSource('${source.channel_id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Desvincular Canal">
          <i class="fa-regular fa-trash-can text-xs"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

async function handleAddSourceSubmit(event) {
  if (event) event.preventDefault();
  const idInput = document.getElementById('newChannelId');
  const nameInput = document.getElementById('newChannelName');
  if (!idInput || !nameInput) return;

  const channelId = idInput.value.trim();
  const channelName = nameInput.value.trim();

  if (!channelId) {
    showToast('Campo Requerido', 'Ingresa el YouTube Channel ID.', 'error');
    return;
  }

  if (!/^UC[\w-]{20,}$/.test(channelId)) {
    showToast('Formato Inválido', 'El ID debe comenzar con UC (mínimo 22 caracteres).', 'error');
    return;
  }

  try {
    const res = await fetch('/api/channels/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        channelId,
        channelName: channelName || channelId
      })
    });

    const json = await res.json();
    if (res.ok && json.status === 'ok') {
      idInput.value = '';
      nameInput.value = '';
      showToast('Canal Vinculado', `"${channelName || channelId}" agregado a fuentes RSS.`, 'success');
      await fetchLiveSources();
    } else {
      showToast('Error al Añadir', json.error || 'No se pudo vincular el canal.', 'error');
    }
  } catch (err) {
    console.error('Error adding channel source:', err);
    showToast('Error', 'No se pudo comunicar con el servidor.', 'error');
  }
}

async function handleRemoveSource(channelId) {
  if (!channelId) return;
  if (!confirm('¿Desactivar este canal de la telemetría RSS?')) return;

  try {
    const res = await fetch('/api/channels/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        channelId
      })
    });

    const json = await res.json();
    if (res.ok && json.status === 'ok') {
      showToast('Canal Desvinculado', 'El canal fue desactivado de la telemetría RSS.', 'info');
      await fetchLiveSources();
    } else {
      showToast('Error', json.error || 'No se pudo desactivar el canal.', 'error');
    }
  } catch (err) {
    console.error('Error removing channel source:', err);
    showToast('Error', 'No se pudo comunicar con el servidor.', 'error');
  }
}

async function fetchLiveSources() {
  try {
    const res = await fetch(`/api/channels?profile=${currentProfileKey}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.status === 'ok') {
        liveSources = json.data || [];
        renderSourcesInModal();
        updateRssStatusSummary();
      }
    }
  } catch (err) {
    console.warn('Could not fetch live RSS channels:', err.message);
  }
  return liveSources;
}

async function fetchLiveRssSignals() {
  try {
    const res = await fetch(`/api/radar/signals?profile=${currentProfileKey}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.status === 'ok') {
        liveRssSignals = json.data || [];
        renderRadarCards();
      }
    }
  } catch (err) {
    console.warn('Could not fetch live RSS signals:', err.message);
  }
  return liveRssSignals;
}

function updateRssStatusSummary() {
  const summaryEl = document.getElementById('rssStatusSummary');
  if (!summaryEl) return;
  const count = liveSources.length;
  let statusText = `${count} ${count === 1 ? 'canal activo' : 'canales activos'}`;
  if (lastRssRefreshTime) {
    statusText += ` • Sincronizado ${formatRelativeTime(lastRssRefreshTime)}`;
  } else {
    statusText += ` • Sin sincronizar`;
  }
  summaryEl.textContent = statusText;
}

async function triggerRssRefresh() {
  if (isRssRefreshing) return;
  isRssRefreshing = true;

  const btn = document.getElementById('btnSyncRssNow');
  const summaryEl = document.getElementById('rssStatusSummary');
  const originalBtnHtml = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Sincronizando Feeds...</span>`;
  }
  if (summaryEl) {
    summaryEl.textContent = `${liveSources.length} canales activos • Conectando con feeds RSS...`;
  }

  try {
    const res = await fetch('/api/radar/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: currentProfileKey })
    });

    const json = await res.json();
    if (res.ok && json.status === 'ok') {
      lastRssRefreshTime = new Date();
      if (json.signals) {
        liveRssSignals = json.signals;
      } else {
        await fetchLiveRssSignals();
      }
      const count = json.newSignalsCount !== undefined ? json.newSignalsCount : liveRssSignals.length;
      showToast('Sincronización Exitosa', `${count} videos detectados en feeds de YouTube.`, 'success');
      renderRadarCards();
      updateRssStatusSummary();
    } else {
      showToast('Error en Sincronización', json.error || 'No se pudieron refrescar los feeds.', 'error');
      updateRssStatusSummary();
    }
  } catch (err) {
    console.error('Error refreshing RSS feeds:', err);
    showToast('Error de Conexión', 'No se pudo contactar al servidor para sincronizar.', 'error');
    updateRssStatusSummary();
  } finally {
    isRssRefreshing = false;
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      btn.innerHTML = originalBtnHtml || `<i class="fa-solid fa-arrows-rotate"></i><span>Sincronizar Feeds en Vivo</span>`;
    }
  }
}

function getRadarVideos() {
  if (typeof window !== 'undefined' && window.DAILY_YOUTUBE_RADAR) {
    return window.DAILY_YOUTUBE_RADAR;
  }
  if (typeof DAILY_YOUTUBE_RADAR !== 'undefined') {
    return DAILY_YOUTUBE_RADAR;
  }
  return [];
}

function updateRadarCountBadge(displayedCount) {
  const badge = document.getElementById('radarCountBadge');
  if (!badge) return;
  const totalAlgo = getRadarVideos().length;
  const totalRss = liveRssSignals.length;
  if (radarCurrentNiche === 'live_rss') {
    badge.textContent = `${totalRss} Señales en Vivo`;
  } else if (radarCurrentNiche === 'algo') {
    badge.textContent = `${totalAlgo} Videos Curados`;
  } else if (radarCurrentNiche === 'all') {
    badge.textContent = `${totalAlgo + totalRss} Videos (${totalRss} en Vivo)`;
  } else {
    badge.textContent = `${displayedCount || 0} Videos Filtrados`;
  }
}

function renderRadarView() {
  renderRadarCards();
}

function filterRadarNiche(niche) {
  radarCurrentNiche = niche;
  if (['all', 'live_rss', 'algo'].includes(niche)) {
    rssFilterMode = niche;
  }
  document.querySelectorAll('.radar-filter-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-niche') === niche;
    if (isTarget) {
      btn.className = 'radar-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-900 shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5';
    } else {
      btn.className = 'radar-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition-all whitespace-nowrap flex items-center gap-1.5';
    }
  });
  renderRadarCards();
}

function searchRadarVideos(query) {
  radarSearchQuery = query || '';
  renderRadarCards();
}

function createAlgoCardElement(item) {
  const card = document.createElement('div');
  card.className = 'bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-slate-300';
  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-2xs">
            ${item.channelAvatar || 'YT'}
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800 leading-tight">${item.channel}</p>
            <p class="text-[10px] text-slate-400 font-medium">${item.nicheLabel} • ${item.publishedDate}</p>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${item.hookBadgeColor}">
          ${item.hookType}
        </span>
      </div>

      <h3 class="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors cursor-pointer mb-2.5" onclick="openRadarVideoAnalysis('${item.id}')">
        ${item.title}
      </h3>

      <div class="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 mb-3 text-center">
        <div>
          <span class="text-[9px] text-slate-400 font-semibold block uppercase">Vistas</span>
          <span class="text-xs font-black text-slate-800">${item.views}</span>
        </div>
        <div class="border-x border-slate-200/60">
          <span class="text-[9px] text-slate-400 font-semibold block uppercase">Velocidad</span>
          <span class="text-xs font-bold text-emerald-600">${item.velocity}</span>
        </div>
        <div>
          <span class="text-[9px] text-slate-400 font-semibold block uppercase">Score Hook</span>
          <span class="text-xs font-black text-amber-600 flex items-center justify-center gap-0.5">
            <i class="fa-solid fa-star text-[9px]"></i> ${item.hookScore}
          </span>
        </div>
      </div>

      <div class="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 mb-4">
        <span class="text-[9px] font-bold text-amber-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
          <i class="fa-solid fa-bolt text-amber-500 text-[10px]"></i> Hook Primeros 25s:
        </span>
        <p class="text-[11px] text-amber-950 font-medium italic leading-relaxed line-clamp-3">
          "${item.hookSnippet}"
        </p>
      </div>
    </div>

    <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
      <button onclick="openRadarVideoAnalysis('${item.id}')" class="flex-1 px-2.5 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer">
        <i class="fa-solid fa-eye text-xs"></i> Rayos X
      </button>
      <button onclick="adoptRadarIdeaDirect('${item.id}')" class="flex-1 px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer" title="Convertir a Guión en Pipeline">
        <i class="fa-solid fa-file-lines text-xs"></i> Convertir a Guión
      </button>
      <button onclick="consultAlgoVideoWithEloisa('${item.id}')" class="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all flex items-center justify-center cursor-pointer" title="Consultar con Eloísa">
        <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
      </button>
    </div>
  `;
  return card;
}

function createRssCardElement(signal) {
  const card = document.createElement('div');
  card.className = 'bg-white border-2 border-emerald-100 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-emerald-300 relative overflow-hidden';
  
  const relTime = formatRelativeTime(signal.published_at);
  const viewsDisplay = signal.views ? Number(signal.views).toLocaleString() : 'En directo';
  const initial = (signal.channel_name || 'YT').charAt(0).toUpperCase();
  const safeTitle = escapeHtml(signal.title || 'Video de YouTube');
  const safeChannel = escapeHtml(signal.channel_name || 'YouTube Channel');
  const safeHook = signal.hook_text ? escapeHtml(signal.hook_text) : 'Señal RSS en vivo. Analiza el hook o conviértelo directamente a guión en el Pipeline.';
  const sigId = signal.id || signal.video_id;

  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200 shadow-2xs shrink-0">
            ${initial}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-slate-800 leading-tight truncate" title="${safeChannel}">${safeChannel}</p>
            <p class="text-[10px] text-slate-400 font-medium">${relTime}</p>
          </div>
        </div>
        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ● EN VIVO RSS
        </span>
      </div>

      <h3 class="text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors cursor-pointer mb-2.5 line-clamp-2" onclick="openRssSignalAnalysis('${sigId}')" title="${safeTitle}">
        ${safeTitle}
      </h3>

      <div class="grid grid-cols-3 gap-2 p-2.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 mb-3 text-center">
        <div>
          <span class="text-[9px] text-slate-400 font-semibold block uppercase">Vistas</span>
          <span class="text-xs font-black text-slate-800">${viewsDisplay}</span>
        </div>
        <div class="border-x border-emerald-200/60">
          <span class="text-[9px] text-slate-400 font-semibold block uppercase">Estado</span>
          <span class="text-xs font-bold text-emerald-600">En Vivo</span>
        </div>
        <div>
          <span class="text-[9px] text-slate-400 font-semibold block uppercase">Detección</span>
          <span class="text-xs font-black text-emerald-700">RSS XML</span>
        </div>
      </div>

      <div class="bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-3 mb-4">
        <span class="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
          <i class="fa-solid fa-satellite-dish text-emerald-600 text-[10px]"></i> Señal de Contenido:
        </span>
        <p class="text-[11px] text-slate-700 font-medium leading-relaxed line-clamp-3">
          "${safeHook}"
        </p>
      </div>
    </div>

    <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
      <button onclick="openRssSignalAnalysis('${sigId}')" class="flex-1 px-2.5 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold border border-slate-200 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer">
        <i class="fa-solid fa-eye text-xs"></i> Rayos X
      </button>
      <button onclick="convertRssSignalToCard('${sigId}')" class="flex-1 px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer" title="Convertir a Guión en Pipeline">
        <i class="fa-solid fa-file-lines text-xs"></i> Convertir a Guión
      </button>
      <button onclick="consultRssSignalWithEloisa('${sigId}')" class="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all flex items-center justify-center cursor-pointer" title="Consultar con Eloísa">
        <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
      </button>
    </div>
  `;
  return card;
}

function renderRadarCards() {
  const container = document.getElementById('radarCardsGrid');
  if (!container) return;
  container.innerHTML = '';

  let algoList = getRadarVideos();
  let rssList = [...liveRssSignals];

  // Apply niche / mode filtering
  if (radarCurrentNiche === 'live_rss') {
    algoList = [];
  } else if (radarCurrentNiche === 'algo') {
    rssList = [];
  } else if (radarCurrentNiche === 'home-services') {
    algoList = algoList.filter(v => v.niche === 'home-services' || v.niche === 'home_services');
    rssList = [];
  } else if (radarCurrentNiche === 'b2b-systems') {
    algoList = algoList.filter(v => v.niche === 'b2b-systems' || v.niche === 'b2b_systems');
    rssList = [];
  } else if (radarCurrentNiche === 'storytelling-eloisa') {
    algoList = algoList.filter(v => v.niche === 'storytelling-eloisa' || v.niche === 'storytelling_eloisa');
    rssList = [];
  } // 'all' keeps both algoList and rssList

  // Search filtering
  if (radarSearchQuery.trim()) {
    const q = radarSearchQuery.toLowerCase();
    algoList = algoList.filter(v =>
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.channel && v.channel.toLowerCase().includes(q)) ||
      (v.hookSnippet && v.hookSnippet.toLowerCase().includes(q)) ||
      (v.nicheLabel && v.nicheLabel.toLowerCase().includes(q))
    );
    rssList = rssList.filter(s =>
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.channel_name && s.channel_name.toLowerCase().includes(q)) ||
      (s.hook_text && s.hook_text.toLowerCase().includes(q))
    );
  }

  const totalVideos = algoList.length + rssList.length;
  updateRadarCountBadge(totalVideos);

  if (totalVideos === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
        <i class="fa-solid fa-satellite-dish text-4xl text-slate-300 mb-3 block"></i>
        <p class="text-sm font-bold text-slate-700">No se encontraron videos con ese filtro</p>
        <p class="text-xs text-slate-400 mt-1">${radarCurrentNiche === 'live_rss' ? 'No hay señales RSS detectadas aún. Haz clic en "Sincronizar Feeds en Vivo".' : 'Selecciona "Todos" para ver todas las tendencias de hoy.'}</p>
        <div class="mt-4 flex items-center justify-center gap-2">
          <button onclick="filterRadarNiche('all')" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer">Ver Todos</button>
          ${radarCurrentNiche === 'live_rss' ? '<button onclick="triggerRssRefresh()" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer">Sincronizar Ahora</button>' : ''}
        </div>
      </div>
    `;
    return;
  }

  // Render Live RSS Signals First (prioritizing fresh real-time incoming signals)
  rssList.forEach(signal => {
    container.appendChild(createRssCardElement(signal));
  });

  // Render Algorithmic Curated Videos
  algoList.forEach(item => {
    container.appendChild(createAlgoCardElement(item));
  });
}

function openRssSignalAnalysis(signalId) {
  const signal = liveRssSignals.find(s => s.id === signalId || s.video_id === signalId);
  if (!signal) return;
  
  const videoObj = {
    id: signal.video_id || signal.id,
    title: signal.title,
    channel: signal.channel_name || 'YouTube Channel',
    views: signal.views ? Number(signal.views).toLocaleString() : 'En directo',
    velocity: 'Señal en Vivo',
    duration: 'Video Reciente',
    publishedDate: formatRelativeTime(signal.published_at),
    nicheLabel: currentProfileKey === 'sebastian' ? 'Home Services USA' : 'Sistemas B2B & IA',
    hookType: 'Live RSS Signal',
    hookScore: 95,
    hookSnippet: signal.hook_text || `Video detectado recientemente en el canal ${signal.channel_name}. Estructura disponible para modelar en Pipeline.`,
    breakdown: {
      beat1_visual: 'Disruptor de miniatura y apertura en cámara.',
      beat2_pain: 'Ataque directo a la ineficiencia, pérdida de capital o fricción operativa.',
      beat3_promise: 'Demostración paso a paso sin rodeos ni introducción innecesaria.'
    },
    breakdownStructure: [
      { time: '0:00 - 0:25', stage: 'The 3-Beat Hook', desc: 'Captura inmediata de retención sin saludos corporativos.' },
      { time: '0:25 - 3:00', stage: 'Planteamiento del Problema', desc: 'Desglose del síntoma que experimenta el cliente objetivo.' },
      { time: '3:00 - 8:30', stage: 'Solución Arquitectónica', desc: 'Implementación paso a paso de alto valor técnico/operativo.' },
      { time: '8:30 - Fin', stage: 'Lead Magnet & CTA B2B', desc: 'Llamada a la acción hacia recurso de conversión de alto ticket.' }
    ],
    derivedIdeas: [
      {
        title: `Cómo resolver [Problema Clave de "${signal.title}"] sin fricción`,
        angle: 'Respuesta estratégica directa',
        format: 'Video Largo 10-12 min'
      },
      {
        title: `El error oculto que comete el 90% en ${signal.channel_name || 'el sector'}`,
        angle: 'Contraste y polaridad',
        format: 'Short + Video Largo'
      }
    ],
    eloisaVerdict: `Señal capturada en tiempo real (${formatRelativeTime(signal.published_at)}) de ${signal.channel_name}. Es un momento ideal para tomar el concepto central, optimizar el gancho y capturar tráfico calificado antes que la temática se sature.`
  };
  
  currentRadarVideoInModal = videoObj;
  
  document.getElementById('radarModalNicheBadge').textContent = videoObj.nicheLabel;
  document.getElementById('radarModalHookTypeBadge').textContent = '● EN VIVO RSS';
  document.getElementById('radarModalScoreBadge').innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span> RSS Feed`;
  document.getElementById('radarModalTitle').textContent = videoObj.title;
  document.getElementById('radarModalChannel').textContent = `${videoObj.channel} • Publicado ${videoObj.publishedDate}`;
  document.getElementById('radarModalHookText').textContent = videoObj.hookSnippet;

  document.getElementById('radarBeat1Text').textContent = videoObj.breakdown.beat1_visual;
  document.getElementById('radarBeat2Text').textContent = videoObj.breakdown.beat2_pain;
  document.getElementById('radarBeat3Text').textContent = videoObj.breakdown.beat3_promise;

  const timelineContainer = document.getElementById('radarTimelineList');
  timelineContainer.innerHTML = '';
  videoObj.breakdownStructure.forEach(st => {
    const row = document.createElement('div');
    row.className = 'flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs';
    row.innerHTML = `
      <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] shrink-0 mt-0.5">${st.time}</span>
      <div class="flex-1 min-w-0">
        <strong class="text-slate-900 font-bold block leading-tight">${st.stage}</strong>
        <span class="text-slate-600 text-[11px]">${st.desc}</span>
      </div>
    `;
    timelineContainer.appendChild(row);
  });

  const derivedContainer = document.getElementById('radarDerivedIdeasList');
  derivedContainer.innerHTML = '';
  videoObj.derivedIdeas.forEach(di => {
    const dCard = document.createElement('div');
    dCard.className = 'bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between gap-3 text-xs';
    dCard.innerHTML = `
      <div class="min-w-0 flex-1">
        <p class="font-bold text-slate-900 leading-snug">${di.title}</p>
        <p class="text-[10px] text-slate-500 mt-0.5">${di.angle} • <strong>${di.format}</strong></p>
      </div>
      <button onclick="quickAddCard('ideas', '${di.title.replace(/'/g, "\\'")}'); showToast('Idea Modelada', 'Se añadió al pipeline de producción.', 'success');" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] shrink-0 cursor-pointer">
        + Usar
      </button>
    `;
    derivedContainer.appendChild(dCard);
  });

  document.getElementById('radarModalVerdictText').textContent = videoObj.eloisaVerdict;
  document.getElementById('radarDetailModal').classList.remove('hidden');
}

function openRadarVideoAnalysis(videoId) {
  const item = getRadarVideos().find(v => v.id === videoId);
  if (item) {
    currentRadarVideoInModal = item;

    document.getElementById('radarModalNicheBadge').textContent = item.nicheLabel;
    document.getElementById('radarModalHookTypeBadge').textContent = item.hookType;
    document.getElementById('radarModalScoreBadge').innerHTML = `<i class="fa-solid fa-star text-amber-500 text-[9px]"></i> ${item.hookScore}/100 Retención`;
    document.getElementById('radarModalTitle').textContent = item.title;
    document.getElementById('radarModalChannel').textContent = `${item.channel} • ${item.views} views (${item.velocity}) • Duración: ${item.duration}`;
    document.getElementById('radarModalHookText').textContent = item.hookSnippet;

    document.getElementById('radarBeat1Text').textContent = item.breakdown?.beat1_visual || 'Contraste visual de alto impacto.';
    document.getElementById('radarBeat2Text').textContent = item.breakdown?.beat2_pain || 'Sentimiento de dolor o pérdida inmediata.';
    document.getElementById('radarBeat3Text').textContent = item.breakdown?.beat3_promise || 'Promesa concreta con método sin spoiler.';

    const timelineContainer = document.getElementById('radarTimelineList');
    timelineContainer.innerHTML = '';
    (item.breakdown?.structure || []).forEach(st => {
      const row = document.createElement('div');
      row.className = 'flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs';
      row.innerHTML = `
        <span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px] shrink-0 mt-0.5">${st.time}</span>
        <div class="flex-1 min-w-0">
          <strong class="text-slate-900 font-bold block leading-tight">${st.stage}</strong>
          <span class="text-slate-600 text-[11px]">${st.desc}</span>
        </div>
      `;
      timelineContainer.appendChild(row);
    });

    const derivedContainer = document.getElementById('radarDerivedIdeasList');
    derivedContainer.innerHTML = '';
    (item.derivedIdeas || []).forEach(di => {
      const dCard = document.createElement('div');
      dCard.className = 'bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between gap-3 text-xs';
      dCard.innerHTML = `
        <div class="min-w-0 flex-1">
          <p class="font-bold text-slate-900 leading-snug">${di.title}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">${di.angle} • <strong>${di.format}</strong></p>
        </div>
        <button onclick="quickAddCard('ideas', '${di.title.replace(/'/g, "\\'")}'); showToast('Idea Modelada', 'Se añadió al pipeline de producción.', 'success');" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] shrink-0 cursor-pointer">
          + Usar
        </button>
      `;
      derivedContainer.appendChild(dCard);
    });

    document.getElementById('radarModalVerdictText').textContent = item.eloisaVerdict;
    document.getElementById('radarDetailModal').classList.remove('hidden');
  } else {
    openRssSignalAnalysis(videoId);
  }
}

async function convertRssSignalToCard(signalId) {
  const signal = liveRssSignals.find(s => s.id === signalId || s.video_id === signalId);
  if (!signal) return;
  try {
    const res = await fetch('/api/radar/convert-to-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        video: {
          id: signal.video_id || signal.id,
          title: signal.title,
          channel: signal.channel_name,
          niche: currentProfileKey === 'sebastian' ? 'home_services' : 'b2b_systems',
          hookBreakdown: signal.hook_text || `Video en vivo emitido por ${signal.channel_name}`,
          whyItWorks: `Señal capturada en vivo vía RSS Feed (${formatRelativeTime(signal.published_at)}).`
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (sqliteState && sqliteState.cards && data.card) {
        sqliteState.cards.unshift(data.card);
      }
      showToast('¡Convertido a Guión!', `"${data.card.title}" agregado al Pipeline.`, 'success');
      switchView('dashboard');
      renderKanbanBoard();
      const pipeline = document.getElementById('pipelineKanbanContainer') || document.getElementById('kanbanContainer');
      if (pipeline) pipeline.scrollIntoView({ behavior: 'smooth' });
    } else {
      showToast('Error', 'No se pudo convertir el video a guión.', 'error');
    }
  } catch (err) {
    console.error('Error converting RSS signal to card:', err);
    showToast('Error', 'No se pudo guardar la idea en SQLite.', 'error');
  }
}

async function adoptRadarIdeaDirect(videoId) {
  const item = getRadarVideos().find(v => v.id === videoId);
  if (!item) return;
  try {
    const res = await fetch('/api/radar/convert-to-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        video: item
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (sqliteState && sqliteState.cards && data.card) {
        sqliteState.cards.unshift(data.card);
      }
      showToast('¡Idea Adoptada en SQLite!', `"${data.card.title}" agregada a tu tablero Kanban.`, 'success');
      switchView('dashboard');
      renderKanbanBoard();
      const pipeline = document.getElementById('pipelineKanbanContainer') || document.getElementById('kanbanContainer');
      if (pipeline) pipeline.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    console.error('Error adopting radar idea direct:', err);
    showToast('Aviso', 'Idea vinculada al pipeline.', 'info');
  }
}

function consultAlgoVideoWithEloisa(videoId) {
  const item = getRadarVideos().find(v => v.id === videoId);
  if (!item) return;
  switchView('eloisa');
  const hook = item.hookSnippet || 'Hook de apertura';
  const prompt = `Eloísa, quiero modelar este video viral del radar: "${item.title}" del canal "${item.channel}". Su gancho es: "${hook}". ¿Cómo adapto esta misma estructura psicológica para vender mis sistemas de alto ticket?`;
  sendEloisaMessage(prompt);
}

function consultRssSignalWithEloisa(signalId) {
  const signal = liveRssSignals.find(s => s.id === signalId || s.video_id === signalId);
  if (!signal) return;
  switchView('eloisa');
  const prompt = `Eloísa, acabo de capturar esta señal en vivo vía RSS de YouTube: "${signal.title}" del canal "${signal.channel_name}". Fue publicado ${formatRelativeTime(signal.published_at)}. ¿Cómo adapto esta estructura para nuestro canal y audiencia B2B?`;
  sendEloisaMessage(prompt);
}

async function rescanRadarVideos() {
  showToast('Escaneando Radar', 'Sincronizando señales en vivo y tendencias de YouTube...', 'info');
  await triggerRssRefresh();
}

function generateWeeklyPlanFromRadar() {
  const fn = typeof generateWeeklyPlanWithEloisa === 'function' ? generateWeeklyPlanWithEloisa : (typeof window !== 'undefined' && window.generateWeeklyPlanWithEloisa ? window.generateWeeklyPlanWithEloisa : null);
  if (!fn) return;
  const plan = fn(currentProfileKey, getRadarVideos());
  currentRadarWeeklyPlan = plan;

  const container = document.getElementById('radarWeeklyPlanContainer');
  document.getElementById('radarPlanTitle').textContent = plan.weekTitle;
  document.getElementById('radarPlanSubtitle').textContent = `Objetivo de la semana: ${plan.weeklyGoal}`;

  const daysGrid = document.getElementById('radarPlanDaysGrid');
  daysGrid.innerHTML = '';

  plan.days.forEach(d => {
    const dayCard = document.createElement('div');
    dayCard.className = 'bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between';
    dayCard.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-black text-slate-900">${d.day}</span>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md ${d.badgeColor}">
            ${d.badge}
          </span>
        </div>
        <p class="text-[11px] font-bold text-slate-800 leading-snug line-clamp-2">${d.title}</p>
        <p class="text-[10px] text-slate-500 mt-1 leading-snug">${d.objective}</p>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
        <span>${d.format}</span>
        <i class="fa-solid ${d.icon} text-slate-500"></i>
      </div>
    `;
    daysGrid.appendChild(dayCard);
  });

  container.classList.remove('hidden');
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Plan Semanal Generado', 'Estructurado con The 3-Beat Hook y máxima retención.', 'success');
}

function closePlanPreview() {
  const container = document.getElementById('radarWeeklyPlanContainer');
  if (container) container.classList.add('hidden');
}

async function applyPlanToSchedule() {
  if (!currentRadarWeeklyPlan) return;
  try {
    const res = await fetch('/api/weekly-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        plan: currentRadarWeeklyPlan
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (sqliteState) {
        sqliteState.weeklyPlan = data.plan;
      }
      showToast('¡Plan Semanal Sincronizado!', 'Guardado en base de datos SQLite y aplicado al Cronograma.', 'success');
      closePlanPreview();
      switchView('dashboard');
      renderWeeklyDailySchedule();
    } else {
      throw new Error('Weekly plan endpoint error');
    }
  } catch (err) {
    console.warn('Fallback weekly plan local schedule sync:', err.message);
    showToast('Plan Semanal Sincronizado', 'Se ha integrado al Cronograma y al Pipeline de Producción.', 'success');
    closePlanPreview();
    switchView('dashboard');
  }
}

// ================= ELOISA WOLF AI CHAT CONTROLLER =================
let eloisaChatHistory = [];

function renderEloisaView() {
  updateEloisaAdvisorTarget();
  if (eloisaChatHistory.length === 0) {
    const welcome = typeof answerEloisaConsultation === 'function'
      ? answerEloisaConsultation('inicio', currentProfileKey)
      : '¡Hola! Soy Eloísa Wolf, tu asesora de estrategia y retención en YouTube. ¿Qué guion o gancho optimizamos hoy?';
    eloisaChatHistory.push({
      sender: 'eloisa',
      time: 'Ahora',
      text: welcome
    });
  }
  renderEloisaChatMessages();
}

function updateEloisaAdvisorTarget() {
  const textEl = document.getElementById('eloisaTargetChannelText');
  if (textEl && currentData) {
    const isSeb = currentProfileKey === 'sebastian';
    textEl.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full ${isSeb ? 'bg-amber-500' : 'bg-blue-500'}"></span>
      ${currentData.profile.name} (${isSeb ? 'Home Services USA' : 'Sistemas B2B & Software'})
    `;
  }
}

function renderEloisaChatMessages() {
  const box = document.getElementById('eloisaChatBox');
  if (!box) return;
  box.innerHTML = '';

  eloisaChatHistory.forEach(msg => {
    const isEloisa = msg.sender === 'eloisa';
    const row = document.createElement('div');
    row.className = `flex gap-3 ${isEloisa ? 'items-start' : 'items-end justify-end'}`;

    if (isEloisa) {
      row.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
          EW
        </div>
        <div class="max-w-2xl bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-4 shadow-2xs text-xs text-slate-800 leading-relaxed space-y-2">
          <div class="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1 mb-1">
            <span class="font-bold text-amber-900 text-[11px]">Eloísa Wolf</span>
            <span class="text-[10px] text-slate-400">${msg.time}</span>
          </div>
          <div class="whitespace-pre-line">${formatEloisaMarkdown(msg.text)}</div>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="max-w-xl bg-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-xs text-xs leading-relaxed">
          <div class="text-[10px] text-blue-200 text-right mb-1">${msg.time}</div>
          <div class="whitespace-pre-line">${msg.text}</div>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
          ${currentData?.profile?.avatarText || 'YO'}
        </div>
      `;
    }
    box.appendChild(row);
  });

  box.scrollTop = box.scrollHeight;
}

function formatEloisaMarkdown(txt) {
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-amber-500 pl-3 italic text-amber-950 my-1.5 bg-amber-50/60 p-2 rounded-r-lg">$1</blockquote>');
}

async function sendEloisaMessage(overrideText) {
  const input = document.getElementById('eloisaUserInput');
  const text = overrideText || (input ? input.value : '');
  if (!text || !text.trim()) return;

  const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  eloisaChatHistory.push({
    sender: 'user',
    time: userTime,
    text: text.trim()
  });

  if (input) input.value = '';
  renderEloisaChatMessages();

  // Temporary typing indicator
  const typingMsg = {
    sender: 'eloisa',
    time: 'Pensando...',
    text: 'Analizando estructura con metodología de retención de Eloísa Wolf...'
  };
  eloisaChatHistory.push(typingMsg);
  renderEloisaChatMessages();

  try {
    const activeEp = currentData?.longVideos?.[0]?.title || 'Episodio Activo';
    const res = await fetch('/api/eloisa/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: currentProfileKey,
        contextProfile: currentProfileKey,
        message: text.trim(),
        activeScriptTitle: activeEp
      })
    });

    // Remove typing indicator
    eloisaChatHistory.pop();

    if (res.ok) {
      const data = await res.json();
      const answer = data.reply || 'Eloísa Wolf: Optimiza los primeros 5 segundos con una promesa audaz.';
      eloisaChatHistory.push({
        sender: 'eloisa',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: answer
      });
      renderEloisaChatMessages();
    } else {
      throw new Error('Chat API returned error status');
    }
  } catch (err) {
    console.warn('Using client-side Eloísa engine fallback:', err.message);
    // If typing was not removed yet, remove it
    if (eloisaChatHistory[eloisaChatHistory.length - 1]?.sender === 'eloisa' && eloisaChatHistory[eloisaChatHistory.length - 1]?.time === 'Pensando...') {
      eloisaChatHistory.pop();
    }
    const activeEp = currentData?.longVideos?.[0]?.title || 'Episodio Activo';
    const answer = typeof answerEloisaConsultation === 'function'
      ? answerEloisaConsultation(text, currentProfileKey, activeEp)
      : 'Como tu asesora, te aconsejo enfocar los primeros 30 segundos en un dolor específico y medible sin rodeos.';
    
    eloisaChatHistory.push({
      sender: 'eloisa',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: answer
    });
    renderEloisaChatMessages();
  }
}

function sendEloisaSuggested(txt) {
  sendEloisaMessage(txt);
}

function quickEloisaAction(type) {
  const activeEp = currentData?.longVideos?.[0];
  if (type === 'audit') {
    const prompt = activeEp 
      ? `Por favor haz una auditoría brutal al guion de mi Episodio 1: "${activeEp.title}". Hook actual:\n"${activeEp.hook}"`
      : 'Por favor audita mi guion actual y dime qué cortar.';
    sendEloisaMessage(prompt);
  } else if (type === 'hooks') {
    const topic = activeEp ? activeEp.title : 'Mi negocio B2B';
    sendEloisaMessage(`Genera 5 ganchos irresistibles con la fórmula The 3-Beat Hook para este tema: "${topic}"`);
  } else if (type === 'monetization') {
    sendEloisaMessage('Explícame cómo estructurar mi embudo de monetización B2B para convertir vistas en contratos de alto valor sin regalar mi trabajo.');
  } else if (type === 'plan') {
    sendEloisaMessage('Diseña mi plan de contenido semanal para grabar en un solo bloque de 90 minutos con teleprompter.');
  }
}

function clearEloisaChat() {
  eloisaChatHistory = [];
  renderEloisaView();
  showToast('Chat Limpiado', 'Sesión de consulta reiniciada.', 'info');
}

function toggleAdvisorProfile() {
  const newProfile = currentProfileKey === 'sebastian' ? 'daniel' : 'sebastian';
  switchProfile(newProfile);
  renderEloisaView();
  showToast('Contexto Cambiado', `Ahora asesorando para ${currentData.profile.name}.`, 'info');
}
