"""
📊 GROWTH BUFFER MANAGER — GESTOR DE INVENTARIO Y BUFFER DE CONTENIDO (MONOGA OS)
================================================================================
Aplica estrictamente las políticas de inventario de Monoga OS:
1. BUFFER DE 7 PROSPECTOS ACTIVOS en clúster hiperlocal (Pasadena / Glendale).
   - Deduplicación estricta con prospects_ledger.json (No repetir negocios con QR/visita previa).
   - Umbral de reposición: Solo busca nuevos prospectos si el stock activo cae a <= 3.
2. BUFFER DE 7 GUIONES DE YOUTUBE (Consultoría Estratégica 1-a-1 de 10-15 min).
   - Umbral de reposición: Solo genera si los guiones de YouTube pendientes caen a <= 3.
3. BUFFER DE 7 GUIONES CORTOS POV (TikTok, Reels, Shorts con Teleprompter).
   - Umbral de reposición: Solo genera si los guiones POV pendientes caen a <= 3.
"""

import os
import sys
import json
import time
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

LEDGER_PATH = CURRENT_DIR / "prospects_ledger.json"
OUTPUT_DIR = CURRENT_DIR / "teleprompters_output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
YT_OUTPUT_DIR = CURRENT_DIR / "youtube_consulting_output"
YT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_BUFFER_PROSPECTS = 7
TARGET_BUFFER_YOUTUBE = 7
TARGET_BUFFER_SHORT_POV = 7
REPLENISH_THRESHOLD = 3

from apify_miner import ApifyMiner
from viral_script_generator import ViralScriptGenerator
from youtube_consulting_script_generator import YouTubeConsultingScriptGenerator
from teleprompter_compiler import TeleprompterCompiler
from twenty_card_sync import TwentyCardSync


class GrowthBufferManager:
    """Gestor de inventario y reposición controlada para Monoga OS."""

    def __init__(self):
        self.ledger_file = LEDGER_PATH
        self.miner = ApifyMiner()
        self.viral_gen = ViralScriptGenerator()
        self.yt_gen = YouTubeConsultingScriptGenerator()
        self.teleprompter_compiler = TeleprompterCompiler()
        self.twenty_syncer = TwentyCardSync()
        self._ensure_ledger_exists()

    def _ensure_ledger_exists(self):
        if not self.ledger_file.exists():
            self.ledger_file.write_text("[]", encoding="utf-8")

    def load_ledger(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.ledger_file.read_text(encoding="utf-8"))
        except Exception:
            return []

    def save_ledger(self, ledger: List[Dict[str, Any]]):
        self.ledger_file.write_text(json.dumps(ledger, indent=2, ensure_ascii=False), encoding="utf-8")

    def get_inventory_status(self) -> Dict[str, Any]:
        """Calcula el estado actual del inventario de clientes y guiones."""
        ledger = self.load_ledger()
        
        # Prospectos activos (pendientes de visita o con oportunidad abierta)
        active_prospects = [
            p for p in ledger 
            if p.get("status") in ["PENDING_FIELD_VISIT", "POV_SCRIPT_READY", "MEETING_SCHEDULED", "PROPOSAL_SENT", "SCREENING_ACTIVE"]
        ]

        # Guiones cortos POV en teleprompters_output/scripts.json
        short_scripts = self.teleprompter_compiler.load_all_scripts()

        # Guiones largos de YouTube en youtube_consulting_output/
        yt_files = list(YT_OUTPUT_DIR.glob("yt_*.json"))

        return {
            "prospects_active_count": len(active_prospects),
            "prospects_target": TARGET_BUFFER_PROSPECTS,
            "prospects_need_replenish": len(active_prospects) <= REPLENISH_THRESHOLD,
            
            "youtube_scripts_count": len(yt_files),
            "youtube_target": TARGET_BUFFER_YOUTUBE,
            "youtube_need_replenish": len(yt_files) <= REPLENISH_THRESHOLD,
            
            "short_pov_scripts_count": len(short_scripts),
            "short_pov_target": TARGET_BUFFER_SHORT_POV,
            "short_pov_need_replenish": len(short_scripts) <= REPLENISH_THRESHOLD,
            
            "total_ledger_records": len(ledger),
            "active_prospects": active_prospects
        }

    def replenish_all(self, niche: str = "MedSpa & Estética", city: str = "Pasadena, CA", neighborhood: str = "Old Pasadena / Green St Corridor", auto_deploy: bool = True) -> Dict[str, Any]:
        """Verifica los umbrales y repone inventario exactamente hasta completar el buffer de 7."""
        status = self.get_inventory_status()
        ledger = self.load_ledger()
        delivered_biz_names = set(p.get("business_name", "").lower() for p in ledger if p.get("qr_delivered"))

        replenish_summary = {
            "prospects_added": 0,
            "youtube_added": 0,
            "short_pov_added": 0,
            "details": []
        }

        # 1. Reposición de Prospectos (si count <= 3)
        if status["prospects_need_replenish"] or status["prospects_active_count"] < TARGET_BUFFER_PROSPECTS:
            needed = TARGET_BUFFER_PROSPECTS - status["prospects_active_count"]
            if needed > 0:
                print(f"📦 [Buffer Clientes] Faltan {needed} prospectos para completar el cupo de {TARGET_BUFFER_PROSPECTS}...")
                raw_ctx = self.miner.get_content_context(niche=niche, city=city, count=needed + 3)
                candidates = raw_ctx.get("businesses", [])
                
                # Filtrar deduplicación por ledger
                new_prospects = []
                for b in candidates:
                    b_name = b.get("name", "").strip()
                    if b_name.lower() not in delivered_biz_names and len(new_prospects) < needed:
                        new_record = {
                            "id": f"lead_{b_name.lower().replace(' ', '_')[:18]}_{int(time.time())}",
                            "business_name": b_name,
                            "city": city,
                            "neighborhood_cluster": neighborhood,
                            "address": b.get("address", f"{neighborhood}, {city}"),
                            "phone": b.get("phone", "+1 (626) 555-0100"),
                            "niche": niche,
                            "qr_delivered": False,
                            "qr_delivered_at": None,
                            "assigned_rep": "John Alexander Monoga",
                            "creator": "Creator",
                            "status": "PENDING_FIELD_VISIT",
                            "opportunity_value_usd": 3000,
                            "notes": f"Negocio hiperlocal calificado en {neighborhood}."
                        }
                        new_prospects.append(new_record)
                        ledger.append(new_record)
                
                self.save_ledger(ledger)
                replenish_summary["prospects_added"] = len(new_prospects)
                print(f"✅ [Buffer Clientes] {len(new_prospects)} nuevos prospectos agregados al clúster {neighborhood}.")
        else:
            print(f"⏸️ [Buffer Clientes] Inventario lleno ({status['prospects_active_count']}/{TARGET_BUFFER_PROSPECTS} activos). No requiere prospección.")

        # 2. Reposición de Guiones Largos de YouTube (si count <= 3)
        yt_files = list(YT_OUTPUT_DIR.glob("yt_*.json"))
        if len(yt_files) <= REPLENISH_THRESHOLD or len(yt_files) < TARGET_BUFFER_YOUTUBE:
            needed_yt = TARGET_BUFFER_YOUTUBE - len(yt_files)
            if needed_yt > 0:
                print(f"🎥 [Buffer YouTube] Faltan {needed_yt} guiones de consultoría para completar {TARGET_BUFFER_YOUTUBE}...")
                current_active = [p for p in ledger if p.get("status") in ["PENDING_FIELD_VISIT", "POV_SCRIPT_READY", "MEETING_SCHEDULED"]]
                targets = current_active[:needed_yt]
                
                for b in targets:
                    yt_script = self.yt_gen.generate_consulting_script(b, niche=niche, city=city)
                    yt_file = YT_OUTPUT_DIR / f"{yt_script['id']}.json"
                    yt_file.write_text(json.dumps(yt_script, indent=2, ensure_ascii=False), encoding="utf-8")
                    replenish_summary["youtube_added"] += 1
                print(f"✅ [Buffer YouTube] {replenish_summary['youtube_added']} guiones de consultoría generados en {YT_OUTPUT_DIR.name}.")
        else:
            print(f"⏸️ [Buffer YouTube] Inventario completo ({len(yt_files)}/{TARGET_BUFFER_YOUTUBE}).")

        # 3. Reposición de Guiones Cortos POV (si count <= 3)
        short_scripts = self.teleprompter_compiler.load_all_scripts()
        if len(short_scripts) <= REPLENISH_THRESHOLD or len(short_scripts) < TARGET_BUFFER_SHORT_POV:
            needed_short = TARGET_BUFFER_SHORT_POV - len(short_scripts)
            if needed_short > 0:
                print(f"📱 [Buffer TikTok/Reels] Faltan {needed_short} guiones POV para completar {TARGET_BUFFER_SHORT_POV}...")
                current_active = [p for p in ledger if p.get("status") in ["PENDING_FIELD_VISIT", "POV_SCRIPT_READY", "MEETING_SCHEDULED"]]
                targets = current_active[:needed_short]
                
                raw_scripts = self.viral_gen.generate_batch(targets, niche=niche, city=city)
                compiled = self.teleprompter_compiler.compile_and_deploy_batch(raw_scripts, auto_deploy=auto_deploy)
                self.twenty_syncer.sync_batch(compiled)
                replenish_summary["short_pov_added"] = len(compiled)
                print(f"✅ [Buffer TikTok/Reels] {len(compiled)} guiones POV compilados y desplegados.")
        else:
            print(f"⏸️ [Buffer TikTok/Reels] Inventario completo ({len(short_scripts)}/{TARGET_BUFFER_SHORT_POV}).")

        return replenish_summary


if __name__ == "__main__":
    mgr = GrowthBufferManager()
    status = mgr.get_inventory_status()
    print("\n" + "=" * 60)
    print("📊 MONOGA OS — ESTADO DEL BUFFER DE INVENTARIO")
    print("=" * 60)
    print(f"🏢 Clientes Activos en Campo: {status['prospects_active_count']} / {status['prospects_target']} (Reponer: {'SI' if status['prospects_need_replenish'] else 'NO'})")
    print(f"🎥 Guiones Largos YouTube:    {status['youtube_scripts_count']} / {status['youtube_target']} (Reponer: {'SI' if status['youtube_need_replenish'] else 'NO'})")
    print(f"📱 Guiones Cortos POV Reels:  {status['short_pov_scripts_count']} / {status['short_pov_target']} (Reponer: {'SI' if status['short_pov_need_replenish'] else 'NO'})")
    print(f"🗂️ Total Registros en Ledger: {status['total_ledger_records']}")
    print("=" * 60 + "\n")

    # Ejecutar reposición si se pasa argumento
    if "--replenish" in sys.argv:
        res = mgr.replenish_all(auto_deploy=False)
        print("Resultado reposición:", res)
