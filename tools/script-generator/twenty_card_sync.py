"""
💼 TWENTY CRM CARD SYNC — SINCRONIZADOR DE TARJETAS ENRIQUECIDAS
================================================================
Genera e inyecta tarjetas enriquecidas en formato BlockNote JSON y Markdown en Twenty CRM (Railway)
con enlaces directos al teleprompter cromático y metadatos de campo para Creator.
"""

import os
import sys
import json
import time
import uuid
import ssl
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = CURRENT_DIR.parent
DEPLOYER_DIR = PROJECT_DIR / "deployer"

load_dotenv(CURRENT_DIR / ".env")
load_dotenv(DEPLOYER_DIR / ".env")

TASKS_OUTPUT_DIR = CURRENT_DIR / "teleprompters_output" / "twenty_tasks"
TASKS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TWENTY_SERVER_URL = os.getenv("TWENTY_SERVER_URL", "https://crm.grupomonoga.com").rstrip("/")
TWENTY_API_KEY = os.getenv("TWENTY_API_KEY", "")


def format_twenty_card_blocknote(script_data: Dict[str, Any], teleprompter_url: str) -> str:
    """Genera los bloques interactivos de BlockNote para Twenty CRM con colores y cajas."""
    struct = script_data.get("structure", {})
    hook = struct.get("hook", {}).get("text", "")
    rayban = struct.get("rayban_cues", {}).get("action", "")
    body = struct.get("body_speech", {}).get("text", "")
    cta = struct.get("cta", {}).get("text", "")
    biz_name = script_data.get("business_name", "Negocio Local")
    city = script_data.get("city", "Los Ángeles, CA")
    niche = script_data.get("niche", "Servicios")

    blocks = [
        {
            "id": str(uuid.uuid4()),
            "type": "heading",
            "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 1 },
            "content": [{ "type": "text", "text": f"🎬 GUION DE CAMPO POV: {biz_name}", "styles": { "bold": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "props": { "textColor": "yellow", "backgroundColor": "yellow", "textAlignment": "left" },
            "content": [
                { "type": "text", "text": "📱 TELEPROMPTER MÓVIL EN VIVO: ", "styles": { "bold": True } },
                { "type": "link", "href": teleprompter_url, "content": [{ "type": "text", "text": "👉 Pulsa aquí para abrir en tu celular", "styles": { "bold": True, "underline": True } }] }
            ],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "heading",
            "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left", "level": 2 },
            "content": [{ "type": "text", "text": "🟡 1. GANCHO VIRAL (0-3s)", "styles": { "bold": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "props": { "textColor": "yellow", "backgroundColor": "default", "textAlignment": "left" },
            "content": [{ "type": "text", "text": f'"{hook}"', "styles": { "bold": True, "italic": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "heading",
            "props": { "textColor": "purple", "backgroundColor": "default", "textAlignment": "left", "level": 2 },
            "content": [{ "type": "text", "text": "🟣 2. ACCIÓN POV / RAY-BAN (NO LEER EN VOZ ALTA)", "styles": { "bold": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "props": { "textColor": "purple", "backgroundColor": "default", "textAlignment": "left" },
            "content": [{ "type": "text", "text": f"👉 {rayban}", "styles": { "italic": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "heading",
            "props": { "textColor": "blue", "backgroundColor": "default", "textAlignment": "left", "level": 2 },
            "content": [{ "type": "text", "text": "⚪ 3. DIÁLOGO A CÁMARA (4-22s)", "styles": { "bold": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "props": { "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
            "content": [{ "type": "text", "text": body, "styles": {} }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "heading",
            "props": { "textColor": "red", "backgroundColor": "default", "textAlignment": "left", "level": 2 },
            "content": [{ "type": "text", "text": "🔴 4. CIERRE Y LLAMADO A LA ACCIÓN (23-30s)", "styles": { "bold": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "props": { "textColor": "red", "backgroundColor": "default", "textAlignment": "left" },
            "content": [{ "type": "text", "text": f'"{cta}"', "styles": { "bold": True } }],
            "children": []
        },
        {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "props": { "textColor": "gray", "backgroundColor": "default", "textAlignment": "left" },
            "content": [{ "type": "text", "text": f"🏢 Negocio: {biz_name} | 📍 Ciudad: {city} | 🎯 Nicho: {niche} | 👤 Creador: Creator (Gafas Meta Ray-Ban)", "styles": { "code": True } }],
            "children": []
        }
    ]
    return json.dumps(blocks, ensure_ascii=False)


def format_twenty_card_markdown(script_data: Dict[str, Any], teleprompter_url: str) -> str:
    """Genera el contenido Markdown de la tarjeta con estilo cromático y metadatos de producción."""
    struct = script_data.get("structure", {})
    hook = struct.get("hook", {}).get("text", "")
    rayban_action = struct.get("rayban_cues", {}).get("action", "")
    body_speech = struct.get("body_speech", {}).get("text", "")
    cta = struct.get("cta", {}).get("text", "")
    
    biz_name = script_data.get("business_name", "Negocio Local")
    city = script_data.get("city", "Los Ángeles, CA")
    niche = script_data.get("niche", "Servicios")
    phone = script_data.get("phone", "N/A")
    address = script_data.get("address", city)
    rating = script_data.get("rating", "4.9")
    reviews_count = script_data.get("reviews_count", "100+")

    return (
        f"# 🎬 GUION DE CAMPO POV: {biz_name}\n\n"
        f"### 📱 ACCESO RÁPIDO TELEPROMPTER:\n"
        f"👉 **[PULSAR AQUÍ PARA ABRIR EN EL CELULAR]({teleprompter_url})**\n\n"
        f"---\n\n"
        f"### 🧭 METADATOS DEL PROSPECTO\n"
        f"- **🏢 Negocio:** `{biz_name}`\n"
        f"- **📍 Ubicación:** `{address}`\n"
        f"- **⭐ Calificación Google:** `{rating} / 5.0` ({reviews_count} reseñas)\n"
        f"- **📞 Teléfono:** `{phone}`\n"
        f"- **🎯 Nicho:** `{niche}`\n"
        f"- **👤 Creador de Campo:** Creator (Gafas Meta Ray-Ban)\n"
        f"- **✂️ Editor Master:** Daniel Monoga\n\n"
        f"---\n\n"
        f"### 🎨 DESGLOSE CROMÁTICO DEL GUION\n\n"
        f"#### 🟡 1. GANCHO VIRAL (0-3s)\n"
        f"> **\"{hook}\"**\n\n"
        f"#### 🟣 2. ACOTACIÓN ESCENOGRÁFICA / RAY-BAN *(NO LEER EN VOZ ALTA)*\n"
        f"> *[ACCIÓN EN CÁMARA]: {rayban_action}*\n\n"
        f"#### ⚪ 3. TEXTO VERBATIM / DIÁLOGO (4-22s)\n"
        f"> \"{body_speech}\"\n\n"
        f"#### 🔴 4. CIERRE Y LLAMADO A LA ACCIÓN (23-30s)\n"
        f"> **\"{cta}\"**\n\n"
        f"---\n\n"
        f"*Generado automáticamente por Monoga OS Content Engine · {time.strftime('%Y-%m-%d %H:%M')}*"
    )


class TwentyCardSync:
    """Sincronizador con Twenty CRM para registrar tareas y guiones de video."""

    def __init__(self, server_url: str = TWENTY_SERVER_URL, api_key: str = TWENTY_API_KEY):
        self.server_url = server_url.rstrip("/")
        self.api_key = api_key
        self.ssl_ctx = ssl.create_default_context()

    def create_content_task(self, script_data: Dict[str, Any], teleprompter_url: str) -> Dict[str, Any]:
        """Construye el payload y realiza la sincronización de la tarjeta en Twenty CRM."""
        biz_name = script_data.get("business_name", "Negocio")
        title = f"🎬 POV Ray-Ban: {biz_name} ({script_data.get('city', 'LA')})"
        body_md = format_twenty_card_markdown(script_data, teleprompter_url)
        body_bn = format_twenty_card_blocknote(script_data, teleprompter_url)
        
        task_payload = {
            "title": title,
            "body": body_md,
            "bodyV2Markdown": body_md,
            "bodyV2Blocknote": body_bn,
            "status": "TODO",
            "dueAt": time.strftime("%Y-%m-%dT20:00:00.000Z", time.gmtime(time.time() + 86400)),
            "teleprompter_url": teleprompter_url,
            "business_name": biz_name,
            "city": script_data.get("city", "LA"),
            "niche": script_data.get("niche", "")
        }

        # Guardar copia local persistente
        clean_name = biz_name.lower().replace(" ", "_")[:18]
        json_file = TASKS_OUTPUT_DIR / f"task_{clean_name}_{int(time.time())}.json"
        md_file = TASKS_OUTPUT_DIR / f"card_{clean_name}_{int(time.time())}.md"
        
        json_file.write_text(json.dumps(task_payload, indent=2, ensure_ascii=False), encoding="utf-8")
        md_file.write_text(body_md, encoding="utf-8")

        # Intentar llamada a la API REST de Twenty si está disponible
        sync_status = "SAVED_LOCAL"
        if self.api_key:
            try:
                url = f"{self.server_url}/rest/tasks"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(task_payload).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                        "User-Agent": "MonogaOS-Engine/2.0"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=8) as res:
                    if res.status in (200, 201):
                        sync_status = "SYNCED_TWENTY_REMOTE"
                        print(f"✅ [Twenty CRM] Tarjeta inyectada exitosamente en la nube.")
            except Exception as e:
                sync_status = f"LOCAL_BACKUP_READY (Server response: {e})"
                print(f"ℹ️ [Twenty CRM] Tarjeta archivada localmente lista para visualización ({e}).")

        task_payload["sync_status"] = sync_status
        task_payload["local_json"] = str(json_file)
        task_payload["local_md"] = str(md_file)
        return task_payload

    def sync_batch(self, compiled_batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sincroniza un lote de guiones compilados."""
        synced_tasks = []
        for item in compiled_batch:
            script_data = item.get("script_data", {})
            url = item.get("public_url", "")
            task = self.create_content_task(script_data, url)
            synced_tasks.append(task)
        return synced_tasks


if __name__ == "__main__":
    from viral_script_generator import ViralScriptGenerator
    sample_biz = {
        "name": "Le Jolie Medi Spa Pasadena",
        "city": "Pasadena, CA",
        "rating": 4.9,
        "reviews_count": 312,
        "key_service": "HydraFacial & Laser",
        "niche": "MedSpa & Estética",
        "address": "120 W Green St, Pasadena, CA 91105",
        "phone": "+1 (626) 555-0192"
    }
    gen = ViralScriptGenerator()
    script = gen.generate_field_script(sample_biz, niche="MedSpa & Estética", city="Pasadena, CA")
    
    syncer = TwentyCardSync()
    task = syncer.create_content_task(script, "https://grupomonoga.com/teleprompter/?id=pov_demo")
    print(f"✅ Tarjeta Twenty CRM Generada: {task['local_md']}")
