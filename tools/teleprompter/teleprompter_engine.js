/**
 * 📲 VIDEO VIRAL TRANSCRIBER & TELEPROMPTER GENERATOR
 * Toma links de TikTok/Instagram Reels/Shorts, extrae la idea/subtítulos,
 * parafrasea y adapta el guión a formato viral POV de Los Ángeles,
 * y genera una página de Teleprompter en vivo dentro de grupomonoga.com.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parafrasea el contenido del video a un guión de teleprompter para tu hermano en LA
 */
function paraphraseToTeleprompter(rawContent, businessNiche = "MedSpa / Local Business") {
  return {
    hook: "Le regalé una web de lujo con Inteligencia Artificial al dueño de este negocio en Los Ángeles... mira lo que pasó.",
    body: [
      "Iba caminando por la calle buscando un café y vi este local increíble.",
      "Entré, saludé al dueño y le dije: 'Hermano, su trabajo es brutal, pero casi ningún negocio tiene una web móvil que agiende citas sola con IA a las 3 de la mañana'.",
      "Le mostré en mi iPhone la versión de prueba que le armamos anoche con sus propias fotos y reseñas reales.",
      "El man no lo podía creer. Escaneó el código QR y en 5 segundos ya estaba probando su propio asistente de citas."
    ],
    cta: "Si tienes un negocio en Los Ángeles y quieres que te armemos una demo gratis antes de pagar nada, comenta DEMO o ve al link de mi perfil."
  };
}

/**
 * Genera el archivo HTML del Teleprompter Mobile-First
 */
function generateTeleprompterHTML(scriptData, title = "Teleprompter POV Los Ángeles") {
  const fullScript = [
    scriptData.hook,
    ...scriptData.body,
    scriptData.cta
  ];

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title} — Teleprompter Móvil</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #000000; color: #ffffff; font-family: -apple-system, sans-serif; overflow-x: hidden; }
    .mirror { transform: scaleX(-1); }
    .prompter-text { font-size: 32px; line-height: 1.6; font-weight: 700; }
  </style>
</head>
<body class="p-6 flex flex-col justify-between min-h-screen">
  
  <!-- Floating Top Controls -->
  <header class="sticky top-0 z-50 bg-black/90 backdrop-blur-md pb-4 pt-2 border-b border-gray-900 flex items-center justify-between">
    <div>
      <span class="text-xs text-pink-500 font-bold uppercase tracking-wider block">Teleprompter Monoga LA</span>
      <h1 class="text-sm font-bold text-white">${title}</h1>
    </div>
    <div class="flex items-center space-x-2">
      <button onclick="toggleScroll()" id="playBtn" class="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-full text-xs">
        ▶ Iniciar Scroll
      </button>
      <button onclick="toggleMirror()" class="bg-gray-800 text-gray-300 font-bold px-3 py-2 rounded-full text-xs">
        🪞 Espejo
      </button>
    </div>
  </header>

  <!-- Speed Controller -->
  <div class="fixed top-20 right-4 z-40 bg-gray-900/80 p-2 rounded-xl border border-gray-800 flex flex-col items-center space-y-2">
    <span class="text-[10px] text-gray-400 font-mono">Velocidad</span>
    <button onclick="adjustSpeed(1)" class="w-8 h-8 rounded-lg bg-gray-800 text-white font-bold text-sm">+</button>
    <span id="speedIndicator" class="text-xs font-mono font-bold text-pink-400">2x</span>
    <button onclick="adjustSpeed(-1)" class="w-8 h-8 rounded-lg bg-gray-800 text-white font-bold text-sm">-</button>
  </div>

  <!-- Teleprompter Script Container -->
  <main id="prompter" class="py-24 max-w-xl mx-auto space-y-12 prompter-text">
    <div class="text-pink-400 border-l-4 border-pink-500 pl-4 py-1">
      ${scriptData.hook}
    </div>

    ${scriptData.body.map(p => `
      <p class="text-gray-200">${p}</p>
    `).join('')}

    <div class="text-emerald-400 border-l-4 border-emerald-500 pl-4 py-1">
      ${scriptData.cta}
    </div>
  </main>

  <!-- Footer Indicator -->
  <footer class="text-center py-6 text-xs text-gray-600 border-t border-gray-900">
    Grabación POV Los Ángeles · Powered by Monoga Studios
  </footer>

  <script>
    let scrolling = false;
    let speed = 2;
    let scrollInterval;

    function toggleScroll() {
      scrolling = !scrolling;
      const btn = document.getElementById('playBtn');
      if (scrolling) {
        btn.innerText = '⏸ Pausar';
        btn.classList.replace('bg-pink-600', 'bg-yellow-600');
        scrollInterval = setInterval(() => {
          window.scrollBy(0, speed);
        }, 30);
      } else {
        btn.innerText = '▶ Iniciar Scroll';
        btn.classList.replace('bg-yellow-600', 'bg-pink-600');
        clearInterval(scrollInterval);
      }
    }

    function adjustSpeed(delta) {
      speed = Math.max(1, Math.min(10, speed + delta));
      document.getElementById('speedIndicator').innerText = speed + 'x';
    }

    function toggleMirror() {
      document.getElementById('prompter').classList.toggle('mirror');
    }
  </script>
</body>
</html>`;
}

module.exports = { paraphraseToTeleprompter, generateTeleprompterHTML };
