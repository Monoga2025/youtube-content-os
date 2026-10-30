const fs = require('fs');
const path = require('path');
const { paraphraseToTeleprompter, generateTeleprompterHTML } = require('./teleprompter_engine');

// Output Directory
const outputDir = path.resolve(__dirname, 'teleprompters_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Genera un guión teleprompter modelo
const sampleScript = paraphraseToTeleprompter("Video viral de TikTok sobre rediseño de negocio");
const html = generateTeleprompterHTML(sampleScript, "Guión 01: Visita MedSpa Pasadena POV");

const filePath = path.join(outputDir, "guion_pasadena_teleprompter.html");
fs.writeFileSync(filePath, html, 'utf8');

console.log(`✅ Teleprompter generado con éxito en: ${filePath}`);
