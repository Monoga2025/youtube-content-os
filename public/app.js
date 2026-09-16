// CreadorPro Core Application Logic & Studio Controller
'use strict';

let currentProfileKey = 'sebastian'; // Default to Sebastian
let currentData = CONTENT_DATABASE.sebastian;
let activeCardInModal = null;
let currentView = 'dashboard';
let teleprompterFontSize = 22;

// ================= APP INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  setupEventListeners();
  runLiveCalculation();
});

function renderAll() {
  currentData = CONTENT_DATABASE[currentProfileKey];
  renderProfileHeader();
  renderTopMetrics();
  renderKanbanBoard();
  renderCalendar();
  renderRecentVideos();
  renderTasks();
  renderGuionesStudio();
  renderShortsStudio();
  renderCommunityStudio();
  renderEightWeekRoadmap();
}

// ================= NAVIGATION VIEW SWITCHER =================
function switchView(viewName) {
  currentView = viewName;
  const views = ['dashboard', 'guiones', 'shorts', 'community', 'tools', 'calendar'];
  
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
        btn.className = 'nav-tab-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 text-left transition-colors';
        const icon = btn.querySelector('i');
        if (icon) icon.className = icon.className.replace('text-slate-400', 'text-blue-600');
      } else {
        btn.className = 'nav-tab-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors';
        const icon = btn.querySelector('i');
        if (icon) icon.className = icon.className.replace('text-blue-600', 'text-slate-400');
      }
    }
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ================= PROFILE SWITCHING =================
function renderProfileHeader() {
  const p = currentData.profile;
  document.getElementById('userName').textContent = p.name;
  document.getElementById('userHandle').textContent = p.handle;
  const avatar = document.getElementById('userAvatarContainer');
  avatar.textContent = p.avatarText;
  avatar.className = `w-8 h-8 rounded-full ${p.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs`;
  document.getElementById('nextEpLabel').textContent = currentData.longVideos[0]?.title.slice(0, 30) + '...';
}

function switchProfile(key) {
  if (!CONTENT_DATABASE[key]) return;
  currentProfileKey = key;
  renderAll();
  document.getElementById('profileMenu').classList.add('hidden');
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
const KANBAN_COLS = [
  { key: 'ideas', label: 'Ideas B2B', pillColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { key: 'guion', label: 'Guión Completo', pillColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { key: 'grabado', label: 'Listo p/ Grabar', pillColor: 'bg-rose-50 text-rose-700 border border-rose-200' },
  { key: 'editado', label: 'En Edición', pillColor: 'bg-sky-50 text-sky-700 border border-sky-200' },
  { key: 'miniatura', label: 'Miniatura Lista', pillColor: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { key: 'programado', label: 'Programado', pillColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  { key: 'publicado', label: 'Publicado', pillColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
];

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

  if (currentProfileKey === 'sebastian') {
    // 1. Listo p/ Grabar (Hoy)
    const v1 = currentData.longVideos[0];
    if (v1) {
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

  colEl.addEventListener('drop', (e) => {
    e.preventDefault();
    colEl.classList.remove('drag-over');
  });
}

// ================= POPUP / MODAL DETALLADO DE GUION =================
function findVideoById(videoId) {
  return currentData.longVideos.find(v => v.id === videoId);
}

function openCardItem(colKey, cardId) {
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

// ================= VIEW 4: COMMUNITY POSTS =================
function renderCommunityStudio() {
  const container = document.getElementById('communityListContainer');
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
  const wage = document.getElementById('calcWage')?.value || 20;
  const state = document.getElementById('calcState')?.value || 'FL';
  const wc = document.getElementById('calcWc')?.value || 0.10;
  const downtime = document.getElementById('calcDowntime')?.value || 5;
  const overhead = document.getElementById('calcOverhead')?.value || 80;

  const res = calculateTrueCostLive(wage, state, downtime, overhead, wc);

  document.getElementById('resPaidHour').innerHTML = `$${res.costPerPaidHour} <span class="text-xs font-bold text-slate-400">/hr</span>`;
  document.getElementById('resBillableHour').innerHTML = `$${res.trueCostPerBillableHour} <span class="text-xs font-bold text-rose-400">/hr</span>`;
  document.getElementById('resSellingPrice').textContent = `$${res.suggestedSellingPrice40}`;
  document.getElementById('resBurdenPct').textContent = res.burdenPercent;
  document.getElementById('resTrueBurdenPct').textContent = res.trueBurdenPercent;
  document.getElementById('resEfficiency').textContent = `${res.billableEfficiency}%`;
  document.getElementById('resTotalYear').textContent = `$${res.totalCostYear.toLocaleString()} USD`;
  document.getElementById('calcStateBadge').textContent = res.stateName;
}

// ================= VIEW 6: 8-WEEK ROADMAP =================
function renderEightWeekRoadmap() {
  const container = document.getElementById('eightWeekRoadmapContainer');
  if (!container) return;
  container.innerHTML = '';

  const schedule = [
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
    }
  });
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function openAddIdeaModal() {
  alert('Usa el estudio de Guiones o añade nuevas ideas directamente al repositorio.');
}

function openAddTaskModal() {
  const text = prompt('Descripción de la nueva tarea:');
  if (text) {
    alert(`Tarea "${text}" añadida.`);
  }
}

function quickAddCard(colKey) {
  const title = prompt(`Nueva tarjeta para "${colKey}":`);
  if (title) {
    alert(`Tarjeta "${title}" registrada.`);
  }
}
