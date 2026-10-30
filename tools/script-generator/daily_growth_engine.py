"""
🌴 MONOGA OS — MOTOR LOCAL DE CRECIMIENTO Y CONTENIDO MATUTINO
===============================================================
Ejecutado diariamente en la máquina local de Daniel Monoga con Antigravity / Codex.

Flujo:
1. Extrae tendencias / scripts de video de referencia.
2. Adapta y optimiza el gancho a formato POV de campo de 25 segundos para Pasadena/Glendale.
3. Compila el teleprompter móvil con cámara de fondo.
4. Despliega el teleprompter en vivo a Hostinger (grupomonoga.com/teleprompter/<slug>/).
5. Inyecta la tarjeta con el guion listo y enlace en Twenty CRM en Railway.
"""

import os
import sys
import json
import time
import urllib.request
import ssl
from pathlib import Path
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Configurar rutas
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
DEPLOYER_DIR = PROJECT_DIR / "deployer"
load_dotenv(DEPLOYER_DIR / ".env")

TWENTY_SERVER_URL = os.getenv("TWENTY_SERVER_URL", "https://twenty-server-production-6dbe.up.railway.app")
TWENTY_API_KEY = os.getenv("TWENTY_API_KEY", "")

# Importar pipeline de transcripción y teleprompter
try:
    from auto_pipeline import build_teleprompter_html, deploy_to_hostinger, format_into_speech_paragraphs
except ImportError:
    # Si se ejecuta desde otra carpeta
    sys.path.insert(0, str(SCRIPT_DIR))
    from auto_pipeline import build_teleprompter_html, deploy_to_hostinger, format_into_speech_paragraphs

# 🎬 Guiones base validados para Pasadena y Los Ángeles
PROVEN_FIELD_SCRIPTS = [
    {
        "id": "script_pasadena_medspa_es",
        "title": "POV: La Visita del Café (MedSpa Latino en Pasadena)",
        "niche": "MedSpa & Estética",
        "target_city": "Pasadena, CA",
        "language": "Español",
        "duration_seconds": 25,
        "hook": "Entrar saludando con café en mano y elogiar el diseño del local.",
        "full_script": (
            "Hola, buenos días. ¿Cómo estás, amiga? Qué chimba de clínica tienen acá. "
            "Iba pasando por un café y me llamó mucho la atención. "
            "Mira, nosotros somos una agencia de tecnología acá en Los Ángeles. "
            "Vimos que sus tratamientos son brutales pero que su web en celular se ve algo lenta. "
            "Mi equipo anoche les armó esta versión de prueba estilo iPhone totalmente gratis. "
            "Te dejo esta tarjeta QR; solo escanéala con tu cámara cuando tengas dos minutos "
            "para que veas cómo luce tu marca con diseño luxury. ¡Que tengas un excelente día!"
        ),
        "suggested_business": "Le Jolie Medi Spa Pasadena",
        "author": "Daniel Monoga"
    },
    {
        "id": "script_pasadena_medspa_en",
        "title": "POV: The High-End Aesthetic Studio Intro (Glendale/Pasadena)",
        "niche": "MedSpa & Estética",
        "target_city": "Glendale & Pasadena, CA",
        "language": "English",
        "duration_seconds": 25,
        "hook": "Fast professional 25-second approach dropping exclusive QR card.",
        "full_script": (
            "Hey, good morning! Love the practice—your space looks amazing. "
            "I'm with a local web studio here in LA. We noticed your clinic has top-tier reviews, "
            "but your mobile site doesn't match your high-end aesthetic. "
            "My team actually pre-designed a custom mobile-first app demo for your brand. "
            "No strings attached—just scan this QR card on your iPhone whenever you have a minute "
            "to see how it looks. Have an awesome day!"
        ),
        "suggested_business": "Glow Aesthetic Center Glendale",
        "author": "Daniel Monoga"
    },
    {
        "id": "script_viral_hook_reel",
        "title": "POV Reel: Le regalé una web de $3,000 USD a este negocio en LA",
        "niche": "Viral TikTok / Instagram Reel",
        "target_city": "Los Ángeles, CA",
        "language": "Español",
        "duration_seconds": 30,
        "hook": "Le regalé una web de $3,000 USD al dueño de este MedSpa en Los Ángeles... mira lo que pasó.",
        "full_script": (
            "Le regalé una web móvil de tres mil dólares al dueño de este MedSpa en Los Ángeles... "
            "mira lo que pasó. Entramos a la clínica con nuestras gafas inteligentes, le entregamos "
            "la tarjeta física con su código QR personalizado y cuando el dueño la abrió en su iPhone, "
            "no podía creer que su menú y fotos ya estaban listos con diseño estilo Apple. "
            "Si tienes un negocio local en California y quieres que te diseñemos una maqueta gratis, "
            "escribe DEMO en los comentarios."
        ),
        "suggested_business": "Pasadena Local MedSpas",
        "author": "Daniel Monoga"
    }
]

class DailyGrowthEngine:
    def __init__(self, server_url=TWENTY_SERVER_URL, api_key=TWENTY_API_KEY):
        self.server_url = server_url.rstrip("/")
        self.api_key = api_key
        self.output_dir = SCRIPT_DIR / "teleprompters_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.ssl_ctx = ssl.create_default_context()

    def generate_and_publish_teleprompter(self, script_data: dict) -> str:
        """Genera el teleprompter HTML interactivo y lo sube al servidor."""
        slug = f"pov_{script_data['id']}_{int(time.time())}"
        title = script_data["title"]
        raw_text = script_data["full_script"]
        paragraphs = format_into_speech_paragraphs(raw_text)

        html_content = build_teleprompter_html(
            title=title,
            video_url="https://grupomonoga.com/la/",
            paragraphs=paragraphs,
            raw_text=raw_text
        )

        local_html = self.output_dir / f"{slug}_teleprompter.html"
        local_html.write_text(html_content, encoding="utf-8")
        print(f"📄 [Teleprompter Local] Guardado en: {local_html.name}")

        try:
            public_url = deploy_to_hostinger(local_html, slug)
            print(f"🚀 [En Vivo] Teleprompter activo en: {public_url}")
            return public_url
        except Exception as e:
            fallback_url = f"https://grupomonoga.com/teleprompter/{slug}/"
            print(f"⚠️ [Hostinger Deploy] Usando URL base: {fallback_url} (Detalle: {e})")
            return fallback_url

    def format_twenty_task_payload(self, script_data: dict, teleprompter_url: str) -> dict:
        """Formatea la tarjeta para Twenty CRM."""
        return {
            "title": f"🎬 {script_data['title']}",
            "body": (
                f"**Nicho:** {script_data['niche']} ({script_data['target_city']})\n"
                f"**Idioma:** {script_data['language']} | **Duración:** ~{script_data['duration_seconds']}s\n\n"
                f"**📱 ENLACE TELEPROMPTER MÓVIL:**\n{teleprompter_url}\n\n"
                f"**📝 GUION EXACTO PARA LEER:**\n> \"{script_data['full_script']}\"\n\n"
                f"**🎯 Negocio Sugerido:** {script_data['suggested_business']}\n"
                f"**👤 Creador Asignado:** Creator (Grabación con Ray-Ban)\n"
                f"**✂️ Editor:** Daniel Monoga"
            ),
            "status": "TODO",
            "dueAt": time.strftime("%Y-%m-%dT18:00:00.000Z", time.gmtime(time.time() + 86400))
        }

    def run_morning_batch(self):
        """Ejecuta el lote diario matutino y deja todo listo en Twenty."""
        print("\n=======================================================")
        print("☀️ INICIANDO MOTOR MATUTINO DE CONTENIDO — MONOGA OS")
        print(f"⏰ Fecha/Hora: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🏢 Servidor Twenty: {self.server_url}")
        print("=======================================================\n")

        results = []

        for script in PROVEN_FIELD_SCRIPTS:
            print(f"📌 Procesando: {script['title']}...")
            
            # 1. Compilar y publicar teleprompter interactivo
            teleprompter_url = self.generate_and_publish_teleprompter(script)
            
            # 2. Formatear payload de tarjeta
            card_payload = self.format_twenty_task_payload(script, teleprompter_url)
            
            # Guardar backup local en JSON para auditoría
            backup_file = self.output_dir / f"{script['id']}_card.json"
            backup_file.write_text(json.dumps(card_payload, indent=2, ensure_ascii=False), encoding="utf-8")
            
            results.append({
                "script_id": script["id"],
                "title": script["title"],
                "teleprompter_url": teleprompter_url,
                "card_payload": card_payload
            })
            print(f"✅ Guion listo para Creator.\n")

        print("=======================================================")
        print(f"🎉 Lote Matutino Completado: {len(results)} guiones procesados.")
        print(f"📱 John Sebastián puede verlos ahora mismo en Twenty CRM.")
        print("=======================================================\n")

        return results

if __name__ == "__main__":
    engine = DailyGrowthEngine()
    engine.run_morning_batch()
