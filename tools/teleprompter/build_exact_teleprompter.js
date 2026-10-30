const fs = require('fs');
const path = require('path');

const transcriptRaw = fs.readFileSync(path.join(__dirname, 'instagram_audio_transcript.txt'), 'utf8');

// Dividimos el texto exacto en bloques legibles de teleprompter
const paragraphs = [
  "Ya puedes ver tus agentes IA de Forja en tu teléfono totalmente gratis.",
  "Si no saben qué es Forja, es básicamente una aplicación que le permite a tus agentes como Claude o ChatGPT crear chatbots para Instagram, para WhatsApp, para Facebook y que contesten para tu negocio.",
  "Y el día de hoy me complace anunciar que ya tiene una aplicación móvil en dónde vas a poder ver las conversaciones que contesta tu agente a tus clientes e incluso poder contestar tú mismo desde la aplicación.",
  "Vas a poder configurar a todo tu agente y ya su disponibilidad, cómo habla, preguntas frecuentes, las ofertas, la ubicación, las formas de pago, qué no tiene que decir...",
  "...y aparte vas a tener funcionalidades como reportes con Inteligencia Artificial, mantenimiento automático, y eso no es todo: también va a filtrar y cualificar tus leads: los interesados, los que no están interesados, los que solo son spam...",
  "...y aparte te va a avisar con una notificación cuando ocupes intervenir en alguna conversación. Por ejemplo aquí podemos ver que estas tres conversaciones el agente ya me avisó que necesita que yo intervenga personalmente.",
  "Puedes mandar imágenes, audios o archivos así como lo harías desde cualquier red social, y sí, vas a poder tener a todas tus redes sociales unificadas.",
  "Es decir que si tu agente ya responde en todas estas redes sociales, todas las vas a poder ver en una sola aplicación y contestar desde ahí.",
  "Y ahora si eres parte de mi comunidad y tienes acceso a Forja Plus, vas a poder tener un modo exclusivo de agencia en dónde vas a poder administrar todos los bots de tus clientes, darles mantenimiento, configurar, ver casos pendientes, tickets, incluso el gasto que están haciendo durante el mes.",
  "Otra cosa también: le vas a poder dar acceso a tus clientes a sus chatbots desde la misma aplicación de Forja para que ellos también puedan ver sus chats desde la aplicación, e incluso puedes hacer un White Label con tus colores con tu logo para que ellos vean literal tu marca.",
  "Este es uno de los anuncios más grandes que he hecho hasta el día de hoy. Si quieren conectar su bot gratis a Forja Inbox, simplemente comenten FORJA y les mando todas las instrucciones."
];

function generateHTML(title, rawTranscript, paragraphs) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title} — Teleprompter POV Móvil</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .mirror { transform: scaleX(-1); }
    .prompter-text {
      font-size: clamp(26px, 5.5vw, 38px);
      line-height: 1.65;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .highlight-active {
      color: #38bdf8;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    }
  </style>
</head>
<body class="p-4 sm:p-8 flex flex-col justify-between min-h-screen">
  
  <!-- Fixed Top Bar Navigation & Controls -->
  <header class="sticky top-0 z-50 bg-black/95 backdrop-blur-xl pb-4 pt-2 border-b border-gray-900 flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-2">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span class="text-[11px] text-pink-500 font-bold uppercase tracking-wider">Monoga Teleprompter · POV Los Ángeles</span>
      </div>
      <h1 class="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">${title}</h1>
    </div>
    
    <div class="flex items-center space-x-2">
      <button onclick="toggleScroll()" id="playBtn" class="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-full text-xs shadow-lg shadow-pink-600/30 transition-all flex items-center space-x-1">
        <span id="playIcon">▶</span>
        <span id="playLabel">Iniciar Scroll</span>
      </button>
      <button onclick="toggleMirror()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-3 py-2 rounded-full text-xs">
        🪞 Espejo
      </button>
      <button onclick="resetScroll()" class="bg-gray-900 text-gray-400 font-semibold px-2.5 py-2 rounded-full text-xs">
        ↺
      </button>
    </div>
  </header>

  <!-- Floating Speed Controller -->
  <div class="fixed top-20 right-3 z-40 bg-gray-950/90 backdrop-blur-md p-2 rounded-2xl border border-gray-800 shadow-2xl flex flex-col items-center space-y-2">
    <span class="text-[9px] text-gray-400 font-mono uppercase tracking-wider">Vel</span>
    <button onclick="adjustSpeed(0.5)" class="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-base transition-colors flex items-center justify-center">+</button>
    <span id="speedIndicator" class="text-xs font-mono font-bold text-pink-400">2.0x</span>
    <button onclick="adjustSpeed(-0.5)" class="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-base transition-colors flex items-center justify-center">-</button>
  </div>

  <!-- Video Origin Badge -->
  <div class="max-w-xl mx-auto mt-6 bg-gray-950 border border-gray-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
    <div class="flex items-center space-x-2">
      <span class="text-pink-500 font-bold">IG Reel Original:</span>
      <a href="https://www.instagram.com/p/DdURuQLoZpv/" target="_blank" class="text-gray-400 hover:text-white underline truncate max-w-[180px]">sanmunoz.ia (Forja App Móvil)</a>
    </div>
    <span class="text-emerald-400 font-mono text-[10px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">100% Exacto Sin Parafrasear</span>
  </div>

  <!-- Teleprompter Main Script Reader -->
  <main id="prompter" class="py-16 max-w-xl mx-auto space-y-10 prompter-text">
    ${paragraphs.map((p, index) => {
      if (index === 0) {
        return `<div class="p-block text-pink-400 border-l-4 border-pink-500 pl-4 py-1.5 bg-pink-950/10 rounded-r-xl">${p}</div>`;
      } else if (index === paragraphs.length - 1) {
        return `<div class="p-block text-emerald-400 border-l-4 border-emerald-500 pl-4 py-1.5 bg-emerald-950/10 rounded-r-xl">${p}</div>`;
      } else {
        return `<p class="p-block text-gray-200 transition-colors duration-200">${p}</p>`;
      }
    }).join('\n    ')}
  </main>

  <!-- Verbatim Raw Transcript Expandable -->
  <details class="max-w-xl mx-auto my-8 bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs text-gray-400">
    <summary class="cursor-pointer font-bold text-gray-300 select-none">Ver transcripción bruta directa (Original)</summary>
    <p class="mt-3 text-gray-400 leading-relaxed font-mono whitespace-pre-wrap">${rawTranscript}</p>
  </details>

  <!-- Footer Indicator -->
  <footer class="text-center py-6 text-xs text-gray-600 border-t border-gray-900">
    Monoga Growth Studio · Optimizado para grabación móvil POV con Meta Ray-Ban / iPhone
  </footer>

  <script>
    let scrolling = false;
    let speed = 2.0;
    let scrollInterval = null;

    function toggleScroll() {
      scrolling = !scrolling;
      const btn = document.getElementById('playBtn');
      const label = document.getElementById('playLabel');
      const icon = document.getElementById('playIcon');

      if (scrolling) {
        label.innerText = 'Pausar';
        icon.innerText = '⏸';
        btn.classList.replace('bg-pink-600', 'bg-amber-600');
        btn.classList.replace('hover:bg-pink-500', 'hover:bg-amber-500');

        scrollInterval = setInterval(() => {
          window.scrollBy(0, speed);
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
            toggleScroll(); // detiene al llegar al final
          }
        }, 30);
      } else {
        label.innerText = 'Iniciar Scroll';
        icon.innerText = '▶';
        btn.classList.replace('bg-amber-600', 'bg-pink-600');
        btn.classList.replace('hover:bg-amber-500', 'hover:bg-pink-500');
        clearInterval(scrollInterval);
      }
    }

    function adjustSpeed(delta) {
      speed = Math.max(0.5, Math.min(8.0, Number((speed + delta).toFixed(1))));
      document.getElementById('speedIndicator').innerText = speed + 'x';
    }

    function resetScroll() {
      if (scrolling) toggleScroll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleMirror() {
      document.getElementById('prompter').classList.toggle('mirror');
    }

    // Atajos de teclado para control remoto Bluetooth / teclado
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleScroll();
      } else if (e.code === 'ArrowUp') {
        adjustSpeed(0.5);
      } else if (e.code === 'ArrowDown') {
        adjustSpeed(-0.5);
      } else if (e.code === 'KeyM') {
        toggleMirror();
      }
    });
  </script>
</body>
</html>`;
}

const html = generateHTML("Forja App Móvil — Guión Exacto", transcriptRaw, paragraphs);

const outputDir = path.join(__dirname, 'teleprompters_output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const targetFile = path.join(outputDir, 'forja_app_exact_teleprompter.html');
fs.writeFileSync(targetFile, html, 'utf8');
console.log("Teleprompter generado exitosamente en:", targetFile);

// También guardamos en deployer/dist/teleprompter/forja/index.html para deploy en grupomonoga.com
const deployDir = path.join(__dirname, '..', 'deployer', 'dist', 'teleprompter', 'forja');
if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });
fs.writeFileSync(path.join(deployDir, 'index.html'), html, 'utf8');
console.log("Teleprompter listo para deploy en Hostinger:", path.join(deployDir, 'index.html'));
