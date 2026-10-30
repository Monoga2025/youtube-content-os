const fs = require('fs');
const path = require('path');

/**
 * TELEPROMPTER BATCH GENERATOR (40 VIDEOS)
 * Converts raw script text into mobile-optimized teleprompter HTML files
 * with auto-scroll and font size controls for iPhone recording.
 */

function buildTeleprompterHtml(videoNumber, dayNumber, title, hookText, spokeScript, ctaText) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Video ${videoNumber} (Día ${dayNumber}) — Teleprompter LA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #030712; color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow-x: hidden; }
    .prompter-text { font-size: 26px; line-height: 1.5; font-weight: 700; color: #ffffff; }
    .prompter-container { max-width: 480px; margin: 0 auto; min-height: 80vh; padding: 20px; }
  </style>
</head>
<body class="p-4">
  <div class="prompter-container flex flex-col justify-between">
    <!-- Header info -->
    <div class="border-b border-gray-800 pb-3 mb-4">
      <div class="flex items-center justify-between text-xs text-pink-400 font-bold uppercase tracking-wider">
        <span>📅 Día ${dayNumber} • Video ${videoNumber}</span>
        <span>LA Growth Studio</span>
      </div>
      <h1 class="text-lg font-extrabold text-white mt-1">${title}</h1>
    </div>

    <!-- Hook callout -->
    <div class="bg-pink-500/10 border border-pink-500/30 p-3 rounded-2xl mb-6">
      <span class="text-[10px] uppercase font-bold text-pink-400 block">Hook en Pantalla (0-3s):</span>
      <p class="text-sm font-bold text-white mt-0.5">"${hookText}"</p>
    </div>

    <!-- Spoken Teleprompter Text -->
    <div class="prompter-text my-4 bg-gray-900/80 p-5 rounded-3xl border border-gray-800 shadow-2xl">
      "${spokeScript}"
    </div>

    <!-- CTA footer -->
    <div class="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl mt-6">
      <span class="text-[10px] uppercase font-bold text-emerald-400 block">Llamado a la Acción (CTA):</span>
      <p class="text-xs font-bold text-emerald-200 mt-0.5">${ctaText}</p>
    </div>

    <!-- Interactive controls -->
    <div class="sticky bottom-4 left-0 right-0 mt-8 flex items-center justify-center space-x-3 bg-gray-950/90 backdrop-blur border border-gray-800 p-3 rounded-2xl">
      <button onclick="changeFontSize(-2)" class="bg-gray-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs">A-</button>
      <button onclick="changeFontSize(2)" class="bg-gray-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs">A+</button>
      <button onclick="toggleScroll()" id="scroll-btn" class="bg-pink-600 text-white px-5 py-1.5 rounded-xl font-bold text-xs">▶ Start Scroll</button>
    </div>
  </div>

  <script>
    let scrolling = false;
    let timer = null;
    let fontSize = 26;

    function changeFontSize(delta) {
      fontSize += delta;
      document.querySelector('.prompter-text').style.fontSize = fontSize + 'px';
    }

    function toggleScroll() {
      scrolling = !scrolling;
      const btn = document.getElementById('scroll-btn');
      if (scrolling) {
        btn.textContent = '⏸ Pause Scroll';
        btn.className = 'bg-yellow-600 text-white px-5 py-1.5 rounded-xl font-bold text-xs';
        timer = setInterval(() => { window.scrollBy(0, 1); }, 40);
      } else {
        btn.textContent = '▶ Start Scroll';
        btn.className = 'bg-pink-600 text-white px-5 py-1.5 rounded-xl font-bold text-xs';
        clearInterval(timer);
      }
    }
  </script>
</body>
</html>`;
}

function generateAllTeleprompters() {
  const outputDir = path.resolve(__dirname, 'teleprompters_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const scriptsFile = path.resolve(__dirname, '../docs/guiones_diarios_hermano_la.md');
  if (!fs.existsSync(scriptsFile)) {
    console.error('File not found:', scriptsFile);
    return;
  }

  const content = fs.readFileSync(scriptsFile, 'utf8');
  const videoBlocks = content.split('### 🎬 Video ').slice(1);

  console.log(`🚀 [Teleprompter Batch] Procesando ${videoBlocks.length} guiones de video...`);

  let count = 0;
  for (const block of videoBlocks) {
    const lines = block.split('\n');
    const headerMatch = lines[0].match(/^(\d+):\s*"(.*?)"/);
    if (!headerMatch) continue;

    const videoNum = parseInt(headerMatch[1]);
    const title = headerMatch[2];
    const dayNum = Math.ceil(videoNum / 5);

    let hook = '';
    let script = '';
    let cta = '';

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].includes('**Hook en Pantalla')) {
        hook = lines[i].split(':"')[1] ? lines[i].split(':"')[1].replace(/"\*$/, '').trim() : lines[i];
      } else if (lines[i].includes('> *"')) {
        script = lines[i].replace(/^>\s*\*"\(?/, '').replace(/"\*$/, '').trim();
      } else if (lines[i].includes('**Llamado a la Acción')) {
        cta = lines[i].split(':**')[1] ? lines[i].split(':**')[1].trim() : lines[i];
      }
    }

    const htmlContent = buildTeleprompterHtml(videoNum, dayNum, title, hook, script, cta);
    const fileName = `video_${videoNum.toString().padStart(2, '0')}_prompter.html`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    count++;
  }

  console.log(`🎉 [Teleprompter Batch] Generados ${count} archivos de Teleprompter HTML en: ${outputDir}`);
}

generateAllTeleprompters();
