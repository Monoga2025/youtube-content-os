// CreadorPro Core Application Logic
'use strict';

// ================= APP STATE & DATA =================
const PROFILES_DATA = {
  alex: {
    name: 'Alex Martinez',
    handle: '@alexmartinez',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    metrics: {
      vistas: { val: '125,4K', badge: '12%', sub: '+13,2K que el mes pasado' },
      subs: { val: '8,320', badge: '8%', sub: '+612 que el mes pasado' },
      tiempo: { val: '4,1K horas', badge: '14%', sub: '+500 horas que el mes pasado' },
      ctr: { val: '6,8%', badge: '1,2%', sub: '+0,8% que el mes pasado' },
      prog: { val: '3', sub: 'Próximo: 12 abr 2025' }
    },
    kanban: {
      ideas: [
        { id: 'i1', title: '10 apps que uso a diario', tag: 'Idea', color: 'amber' },
        { id: 'i2', title: 'Cómo ser más productivo', tag: 'Idea', color: 'amber' },
        { id: 'i3', title: 'Mi setup 2025', tag: 'Idea', color: 'amber' }
      ],
      guion: [
        { id: 'g1', title: 'Errores al empezar en YouTube', tag: 'Guion', color: 'blue' },
        { id: 'g2', title: 'Hábitos para creadores', tag: 'Guion', color: 'blue' }
      ],
      grabado: [
        { id: 'gr1', title: 'Tour de mi estudio', tag: 'Grabado', color: 'sky' },
        { id: 'gr2', title: 'Un día en mi vida', tag: 'Grabado', color: 'sky' }
      ],
      editado: [
        { id: 'e1', title: 'La verdad sobre YouTube', tag: 'Editado', color: 'emerald' },
        { id: 'e2', title: 'Mi rutina de mañana', tag: 'Editado', color: 'emerald' }
      ],
      miniatura: [
        { id: 'm1', title: 'Cómo organizo mi vida', tag: 'Miniatura', color: 'purple' }
      ],
      programado: [
        { id: 'p1', title: '5 herramientas de IA', tag: '12 abr 2025', color: 'indigo' }
      ],
      publicado: [
        { id: 'pb1', title: 'De 0 a 10K suscriptores', tag: '2 abr 2025', color: 'emerald' },
        { id: 'pb2', title: 'Mi setup minimalista', tag: '28 mar 2025', color: 'emerald' }
      ]
    },
    recents: [
      { id: 'v1', title: 'De 0 a 10K suscriptores', dur: '12:34', status: 'Publicado', date: '2 abr 2025', views: '24,5K', ctr: '8,1%', thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80' },
      { id: 'v2', title: 'Mi setup minimalista 2025', dur: '10:21', status: 'Publicado', date: '28 mar 2025', views: '18,2K', ctr: '6,4%', thumb: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&auto=format&fit=crop&q=80' },
      { id: 'v3', title: '5 herramientas de IA para creadores', dur: '11:05', status: 'Programado', date: '12 abr 2025', views: '—', ctr: '—', thumb: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=100&auto=format&fit=crop&q=80' }
    ],
    calendarEvents: {
      2: [{ type: 'video', title: 'Video: De 0 a 10k', color: 'emerald' }],
      9: [{ type: 'video', title: 'Video: Mi rutina', color: 'emerald' }],
      11: [{ type: 'short', title: 'Short: Tips rápido', color: 'amber' }],
      12: [{ type: 'video', title: 'Video: 5 herramie...', color: 'blue', highlight: true }],
      18: [{ type: 'short', title: 'Short: Setup', color: 'amber' }],
      25: [{ type: 'video', title: 'Video: Errores co...', color: 'emerald' }]
    },
    tasks: [
      { id: 't1', text: 'Grabar intro para próximo video', badge: 'flag', done: false },
      { id: 't2', text: 'Diseñar miniatura', badge: 'Hoy', done: false },
      { id: 't3', text: 'Escribir descripción', badge: 'Mañana', done: false },
      { id: 't4', text: 'Programar short', badge: 'Mañana', done: false },
      { id: 't5', text: 'Revisar comentarios', badge: '12 abr', done: false },
      { id: 't6', text: 'Responder comentarios pendientes', badge: 'Completada', done: true }
    ]
  },

  daniel: {
    name: 'Daniel Monoga',
    handle: '@daniel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    metrics: {
      vistas: { val: '48,2K', badge: '24%', sub: '+9,4K que el mes pasado' },
      subs: { val: '3,450', badge: '18%', sub: '+420 que el mes pasado' },
      tiempo: { val: '2,9K horas', badge: '21%', sub: '+380 horas que el mes pasado' },
      ctr: { val: '7,4%', badge: '1,5%', sub: '+1,1% que el mes pasado' },
      prog: { val: '2', sub: 'Próximo: 21 sep 2026' }
    },
    kanban: {
      ideas: [
        { id: 'di1', title: 'Cómo diseñar ERPs con Supabase', tag: 'B2B', color: 'amber' },
        { id: 'di2', title: 'Por qué los chatbots sin límites fallan', tag: 'IA', color: 'amber' }
      ],
      guion: [
        { id: 'dg1', title: 'MARAL OS: Conectando ventas con inventario', tag: 'Guion', color: 'blue' },
        { id: 'dg2', title: 'Universidad OS: 5 Controles con datos sensibles', tag: 'Guion', color: 'blue' }
      ],
      grabado: [
        { id: 'dgr1', title: 'Clínica Mecatrónica: Señal vs Ruido', tag: 'Grabado', color: 'sky' }
      ],
      editado: [
        { id: 'de1', title: 'Tu empresa no necesita más recordatorios (Jarvis)', tag: 'Editado', color: 'emerald' }
      ],
      miniatura: [
        { id: 'dm1', title: 'Jarvis Architecture Blueprint', tag: 'Miniatura', color: 'purple' }
      ],
      programado: [
        { id: 'dp1', title: 'Jarvis: Idempotencia y Estado', tag: '21 sep 2026', color: 'indigo' }
      ],
      publicado: [
        { id: 'dpb1', title: 'Arquitectura de Sistemas Operativos Locales', tag: '14 sep 2026', color: 'emerald' }
      ]
    },
    recents: [
      { id: 'dv1', title: 'Tu empresa no necesita más recordatorios (Jarvis)', dur: '09:15', status: 'Programado', date: '21 sep 2026', views: '—', ctr: '—', thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80' },
      { id: 'dv2', title: 'MARAL OS: Arquitectura de Cotización con WhatsApp', dur: '10:45', status: 'En Edición', date: '28 sep 2026', views: '—', ctr: '—', thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&auto=format&fit=crop&q=80' }
    ],
    calendarEvents: {
      21: [{ type: 'video', title: 'Video: Jarvis Ep 1', color: 'blue', highlight: true }],
      28: [{ type: 'video', title: 'Video: MARAL OS', color: 'emerald' }]
    },
    tasks: [
      { id: 'dt1', text: 'Grabar pantalla demo sintética Jarvis', badge: 'flag', done: false },
      { id: 'dt2', text: 'Verificar enlace CTA palabra clave MAPA', badge: 'Hoy', done: false },
      { id: 'dt3', text: 'Revisar checklist de privacidad sin rutas reales', badge: 'Mañana', done: true }
    ]
  },

  sebastian: {
    name: 'Sebastián Monoga',
    handle: '@sebastian',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    metrics: {
      vistas: { val: '62,8K', badge: '31%', sub: '+14,8K que el mes pasado' },
      subs: { val: '4,190', badge: '22%', sub: '+740 que el mes pasado' },
      tiempo: { val: '3,8K horas', badge: '28%', sub: '+620 horas que el mes pasado' },
      ctr: { val: '8,2%', badge: '2,1%', sub: '+1,4% que el mes pasado' },
      prog: { val: '3', sub: 'Próximo: 24 sep 2026' }
    },
    kanban: {
      ideas: [
        { id: 'si1', title: 'Cómo conseguir contratos comerciales de $50K', tag: 'Ventas', color: 'amber' },
        { id: 'si2', title: 'Los 3 seguros obligatorios para contratistas en USA', tag: 'Seguros', color: 'amber' }
      ],
      guion: [
        { id: 'sg1', title: 'Cómo cotizar pintura con 40% de margen neto', tag: 'Guion', color: 'blue' },
        { id: 'sg2', title: 'Housecall Pro vs Jobber: Cuál elegir en 2026', tag: 'Guion', color: 'blue' }
      ],
      grabado: [
        { id: 'sgr1', title: 'El costo REAL de un empleado a $20/hr en USA', tag: 'Grabado', color: 'sky' }
      ],
      editado: [
        { id: 'se1', title: 'Auditoría en vivo: Compañía factura $45K pero pierde dinero', tag: 'Editado', color: 'emerald' }
      ],
      miniatura: [
        { id: 'sm1', title: 'La verdad de los $20/hr (True Cost)', tag: 'Miniatura', color: 'purple' }
      ],
      programado: [
        { id: 'sp1', title: 'El costo REAL de contratar en USA', tag: '24 sep 2026', color: 'indigo' }
      ],
      publicado: [
        { id: 'spb1', title: 'Por qué pagar cash te puede cerrar el negocio', tag: '10 sep 2026', color: 'emerald' }
      ]
    },
    recents: [
      { id: 'sv1', title: 'El costo REAL de contratar un empleado a $20/hr en USA', dur: '09:40', status: 'Listo para grabar', date: '24 sep 2026', views: '—', ctr: '—', thumb: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&auto=format&fit=crop&q=80' },
      { id: 'sv2', title: 'Cómo cotizar pintura y remodelación al 40% de margen', dur: '11:20', status: 'En Guion', date: '01 oct 2026', views: '—', ctr: '—', thumb: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=100&auto=format&fit=crop&q=80' }
    ],
    calendarEvents: {
      24: [{ type: 'video', title: 'Video: True Cost $20/hr', color: 'blue', highlight: true }]
    },
    tasks: [
      { id: 'st1', text: 'Probar employee-cost-calculator.js en pantalla', badge: 'flag', done: false },
      { id: 'st2', text: 'Configurar enlace de afiliado Gusto Payroll', badge: 'Hoy', done: false },
      { id: 'st3', text: 'Subir True Cost Calculator a Google Drive', badge: 'Mañana', done: true }
    ]
  }
};

let currentProfileKey = 'alex';
let currentData = JSON.parse(JSON.stringify(PROFILES_DATA.alex));

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  setupEventListeners();
});

function renderAll() {
  renderProfileHeader();
  renderTopMetrics();
  renderKanbanBoard();
  renderCalendar();
  renderRecentVideos();
  renderTasks();
}

// ================= PROFILE SWITCHER =================
function renderProfileHeader() {
  document.getElementById('userName').textContent = currentData.name;
  document.getElementById('userHandle').textContent = currentData.handle;
  document.getElementById('userAvatar').src = currentData.avatar;
}

function switchProfile(key) {
  if (!PROFILES_DATA[key]) return;
  currentProfileKey = key;
  currentData = JSON.parse(JSON.stringify(PROFILES_DATA[key]));
  renderAll();
  document.getElementById('profileMenu').classList.add('hidden');
}

// ================= TOP METRICS =================
function renderTopMetrics() {
  const m = currentData.metrics;
  document.getElementById('metric1Value').textContent = m.vistas.val;
  document.getElementById('metric1Sub').textContent = m.vistas.sub;
  document.getElementById('metric2Value').textContent = m.subs.val;
  document.getElementById('metric2Sub').textContent = m.subs.sub;
  document.getElementById('metric3Value').textContent = m.tiempo.val;
  document.getElementById('metric3Sub').textContent = m.tiempo.sub;
  document.getElementById('metric4Value').textContent = m.ctr.val;
  document.getElementById('metric4Sub').textContent = m.ctr.sub;
  document.getElementById('metric5Value').textContent = m.prog.val;
  document.getElementById('metric5Sub').textContent = m.prog.sub;
  document.getElementById('chartMetricDisplay').textContent = m.vistas.val;
}

// ================= KANBAN BOARD (DRAG & DROP) =================
const KANBAN_COLS = [
  { key: 'ideas', label: 'Ideas', pillColor: 'bg-amber-50 text-amber-600 border border-amber-200' },
  { key: 'guion', label: 'Guión', pillColor: 'bg-blue-50 text-blue-600 border border-blue-200' },
  { key: 'grabado', label: 'Grabado', pillColor: 'bg-sky-50 text-sky-600 border border-sky-200' },
  { key: 'editado', label: 'Editado', pillColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  { key: 'miniatura', label: 'Miniatura lista', pillColor: 'bg-purple-50 text-purple-600 border border-purple-200' },
  { key: 'programado', label: 'Programado', pillColor: 'bg-indigo-50 text-indigo-600 border border-indigo-200' },
  { key: 'publicado', label: 'Publicado', pillColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200' }
];

function renderKanbanBoard() {
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = '';

  KANBAN_COLS.forEach(col => {
    const cards = currentData.kanban[col.key] || [];
    const colEl = document.createElement('div');
    colEl.className = 'kanban-col';
    colEl.dataset.colKey = col.key;

    // Header
    colEl.innerHTML = `
      <div class="flex items-center justify-between px-1 pb-1">
        <span class="text-xs font-bold text-slate-800">${col.label}</span>
        <span class="text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded-md">${cards.length}</span>
      </div>
      <div class="space-y-2 min-h-[160px] flex-1 kanban-card-container" data-col-key="${col.key}">
        ${cards.map(card => `
          <div class="kanban-card" draggable="true" data-card-id="${card.id}" data-col-key="${col.key}">
            <p class="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">${card.title}</p>
            <div class="mt-2 flex items-center gap-1.5">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-md ${col.pillColor}">
                ${card.tag}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="quickAddCard('${col.key}')" class="w-full text-center text-[11px] font-medium text-slate-400 hover:text-blue-600 hover:bg-slate-100/70 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
        <i class="fa-solid fa-plus text-[9px]"></i> Añadir tarjeta
      </button>
    `;

    setupDragAndDrop(colEl);
    board.appendChild(colEl);
  });
}

function setupDragAndDrop(colEl) {
  const container = colEl.querySelector('.kanban-card-container');
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
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const toCol = colEl.dataset.colKey;
      moveCard(data.cardId, data.fromCol, toCol);
    } catch (err) {
      console.error(err);
    }
  });
}

function moveCard(cardId, fromCol, toCol) {
  if (fromCol === toCol) return;
  const fromList = currentData.kanban[fromCol];
  const toList = currentData.kanban[toCol];
  const idx = fromList.findIndex(c => c.id === cardId);
  if (idx === -1) return;

  const [card] = fromList.splice(idx, 1);
  // Update tag label based on new stage
  if (toCol === 'ideas') card.tag = 'Idea';
  else if (toCol === 'guion') card.tag = 'Guion';
  else if (toCol === 'grabado') card.tag = 'Grabado';
  else if (toCol === 'editado') card.tag = 'Editado';
  else if (toCol === 'miniatura') card.tag = 'Miniatura';
  else if (toCol === 'programado') card.tag = '15 abr 2025';
  else if (toCol === 'publicado') card.tag = 'Hoy';

  toList.push(card);
  renderKanbanBoard();
}

function quickAddCard(colKey) {
  const title = prompt(`Escribe el título para la nueva tarjeta en "${colKey}":`);
  if (!title || !title.trim()) return;
  const newCard = {
    id: 'k_' + Date.now(),
    title: title.trim(),
    tag: colKey.charAt(0).toUpperCase() + colKey.slice(1)
  };
  currentData.kanban[colKey].push(newCard);
  renderKanbanBoard();
}

// ================= CALENDAR =================
function renderCalendar() {
  const calDays = document.getElementById('calendarDays');
  calDays.innerHTML = '';

  // April 2025 starts on Tuesday (day 2 in Mon=1, Sun=7 format)
  // Total 30 days
  const events = currentData.calendarEvents || {};

  // Empty padding cell for Monday (April 1st is Tuesday)
  const pad = document.createElement('div');
  pad.className = 'cal-day-cell bg-slate-50/50 border-transparent';
  calDays.appendChild(pad);

  for (let day = 1; day <= 30; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'cal-day-cell';
    const dayEvents = events[day] || [];

    let eventHtml = '';
    if (dayEvents.length > 0) {
      eventHtml = dayEvents.map(ev => {
        if (ev.highlight) {
          return `
            <div class="cal-event-badge bg-blue-600 text-white font-bold flex items-center gap-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
              <span class="truncate">${ev.title}</span>
            </div>
          `;
        }
        const colorClass = ev.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200';
        return `
          <div class="cal-event-badge ${colorClass} flex items-center gap-0.5">
            <span class="w-1 h-1 rounded-full ${ev.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'} inline-block"></span>
            <span class="truncate">${ev.title}</span>
          </div>
        `;
      }).join('');
    }

    dayCell.innerHTML = `
      <span class="cal-day-num ${dayEvents.length > 0 && dayEvents[0].highlight ? 'text-blue-600 font-bold' : ''}">${day}</span>
      ${eventHtml}
    `;
    calDays.appendChild(dayCell);
  }
}

// ================= RECENT VIDEOS TABLE =================
function renderRecentVideos() {
  const container = document.getElementById('recentVideosList');
  container.innerHTML = '';

  currentData.recents.forEach(video => {
    const row = document.createElement('div');
    row.className = 'py-2.5 flex items-center justify-between gap-3 text-xs';
    const isProg = video.status === 'Programado';
    const statusColor = isProg ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200';

    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <div class="relative w-12 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
          <img src="${video.thumb}" class="w-full h-full object-cover">
          <span class="absolute bottom-0.5 right-0.5 bg-slate-900/80 text-white text-[8px] font-bold px-1 rounded">${video.dur}</span>
        </div>
        <div class="min-w-0">
          <p class="font-bold text-slate-800 truncate">${video.title}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${statusColor}">${video.status}</span>
            <span class="text-[10px] text-slate-400">${video.date}</span>
          </div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <p class="font-bold text-slate-800">${video.views}</p>
        <p class="text-[10px] text-slate-400">${video.ctr}</p>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button onclick="editVideo('${video.id}')" class="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-medium transition-colors">
          Editar
        </button>
        <button class="p-1 text-slate-400 hover:text-slate-600 text-xs">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

// ================= TASKS LIST =================
function renderTasks() {
  const container = document.getElementById('tasksList');
  container.innerHTML = '';

  currentData.tasks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between gap-2';

    let badgeHtml = '';
    if (t.badge === 'flag') {
      badgeHtml = `<i class="fa-solid fa-flag text-red-500 text-xs"></i>`;
    } else if (t.badge === 'Completada') {
      badgeHtml = `<span class="text-[10px] text-slate-400 font-medium">Completada</span>`;
    } else if (t.badge) {
      badgeHtml = `<span class="text-[10px] text-slate-400 font-medium">${t.badge}</span>`;
    }

    item.innerHTML = `
      <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none">
        <input type="checkbox" ${t.done ? 'checked' : ''} class="rounded border-slate-300 text-blue-600 focus:ring-0" onchange="toggleTask('${t.id}')">
        <span class="${t.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'} truncate">${t.text}</span>
      </label>
      <div class="shrink-0">${badgeHtml}</div>
    `;
    container.appendChild(item);
  });
}

function toggleTask(id) {
  const t = currentData.tasks.find(x => x.id === id);
  if (t) {
    t.done = !t.done;
    renderTasks();
  }
}

// ================= CHECKLIST SCORES =================
function updateOptimizationScore() {
  const checks = document.querySelectorAll('.opt-check');
  const checked = Array.from(checks).filter(c => c.checked).length;
  document.getElementById('optimizationCounter').textContent = `${checked}/8 completadas`;
}

function updateGrowthScore() {
  const checks = document.querySelectorAll('.growth-check');
  const checked = Array.from(checks).filter(c => c.checked).length;
  const pct = Math.round((checked / 5) * 100);
  document.getElementById('growthProgressText').textContent = `${checked} de 5 tareas completadas`;
  document.getElementById('growthProgressBar').style.width = `${pct}%`;
}

// ================= VIDEO UPLOAD & SUBMISSION =================
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    const badge = document.getElementById('selectedFileName');
    badge.textContent = `Archivo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
    badge.classList.remove('hidden');
    if (!document.getElementById('formTitle').value) {
      document.getElementById('formTitle').value = file.name.replace(/\.[^/.]+$/, '');
    }
  }
}

function handleVideoSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('formTitle').value;
  if (!title) return;

  // Add to kanban under 'programado'
  const newCard = {
    id: 'v_' + Date.now(),
    title: title,
    tag: '12 abr 2025'
  };
  currentData.kanban.programado.push(newCard);

  // Add to recents
  const newRecent = {
    id: 'vr_' + Date.now(),
    title: title,
    dur: '08:45',
    status: 'Programado',
    date: '12 abr 2025',
    views: '—',
    ctr: '—',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'
  };
  currentData.recents.unshift(newRecent);

  renderKanbanBoard();
  renderRecentVideos();

  // Reset form
  document.getElementById('videoUploadForm').reset();
  document.getElementById('selectedFileName').classList.add('hidden');
  alert(`¡Video "${title}" subido y programado con éxito!`);
}

function saveDraft() {
  const title = document.getElementById('formTitle').value || 'Borrador sin título';
  currentData.kanban.ideas.push({
    id: 'd_' + Date.now(),
    title: title,
    tag: 'Borrador'
  });
  renderKanbanBoard();
  alert(`Guardado como borrador en la columna de Ideas.`);
}

function focusUploadForm() {
  document.getElementById('formTitle').focus();
}

// ================= MODALS & EVENT LISTENERS =================
function setupEventListeners() {
  // Profile dropdown toggle
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

  // Keyboard shortcut cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

function openAddIdeaModal() {
  document.getElementById('ideaModal').classList.remove('hidden');
}

function openAddTaskModal() {
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function saveNewIdea() {
  const title = document.getElementById('modalIdeaTitle').value;
  const stage = document.getElementById('modalIdeaStage').value;
  if (!title) return;
  currentData.kanban[stage].push({
    id: 'id_' + Date.now(),
    title: title,
    tag: stage.charAt(0).toUpperCase() + stage.slice(1)
  });
  renderKanbanBoard();
  closeModal('ideaModal');
  document.getElementById('modalIdeaTitle').value = '';
}

function saveNewTask() {
  const text = document.getElementById('modalTaskText').value;
  const badge = document.getElementById('modalTaskBadge').value || 'Hoy';
  if (!text) return;
  currentData.tasks.unshift({
    id: 'tk_' + Date.now(),
    text: text,
    badge: badge,
    done: false
  });
  renderTasks();
  closeModal('taskModal');
  document.getElementById('modalTaskText').value = '';
}

function editVideo(id) {
  const v = currentData.recents.find(x => x.id === id);
  if (v) {
    document.getElementById('formTitle').value = v.title;
    document.getElementById('formTitle').focus();
  }
}

function updateChartMetric() {
  const sel = document.getElementById('chartMetricSelect').value;
  const disp = document.getElementById('chartMetricDisplay');
  if (sel === 'vistas') disp.textContent = currentData.metrics.vistas.val;
  else if (sel === 'suscriptores') disp.textContent = currentData.metrics.subs.val;
  else if (sel === 'tiempo') disp.textContent = currentData.metrics.tiempo.val;
}
