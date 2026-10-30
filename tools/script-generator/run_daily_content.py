"""
🚀 RUN DAILY CONTENT — EJECUTOR MAESTRO DE CREACIÓN DE CONTENIDOS (MONOGA OS)
=============================================================================
Orquestador de 1 solo comando en Python para la prospección, generación de guiones POV,
compilación cromática de teleprompters, despliegue a Hostinger SFTP y sincronización en Twenty CRM.

Uso CLI:
  python run_daily_content.py --niche "MedSpa & Estética" --city "Pasadena, CA" --count 3 --deploy
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = CURRENT_DIR.parent
DEPLOYER_DIR = PROJECT_DIR / "deployer"

load_dotenv(CURRENT_DIR / ".env")
load_dotenv(DEPLOYER_DIR / ".env")

from apify_miner import ApifyMiner
from viral_script_generator import ViralScriptGenerator
from teleprompter_compiler import TeleprompterCompiler
from twenty_card_sync import TwentyCardSync

INDEX_HTML_PATH = CURRENT_DIR / "INDEX_SCRIPTS.html"


def update_sebastian_index(new_items: list):
    """Actualiza el índice interactivo HTML de Creator con los nuevos guiones generados."""
    cards_html = ""
    for item in new_items:
        script = item.get("script_data", {})
        title = script.get("title", "Guion POV")
        biz = script.get("business_name", "")
        city = script.get("city", "Los Ángeles, CA")
        niche = script.get("niche", "")
        public_url = item.get("public_url", "#")
        struct = script.get("structure", {})
        hook = struct.get("hook", {}).get("text", "")
        tpl_name = script.get("template_used", "POV Standard")
        
        cards_html += f"""
        <div class="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-400/50 transition-all space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30">
              {niche}
            </span>
            <span class="text-[11px] text-neutral-400 font-mono">{city}</span>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">{biz}</h3>
            <span class="text-[10px] text-purple-400 font-mono">🎯 {tpl_name}</span>
          </div>
          <p class="text-xs text-neutral-300 italic line-clamp-2">"{hook}"</p>
          <div class="pt-2 flex items-center justify-between border-t border-neutral-800">
            <span class="text-[10px] text-neutral-500 font-mono">⏱️ ~25s POV (Ray-Ban)</span>
            <a href="{public_url}" target="_blank" class="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all">
              Abrir Teleprompter ▶
            </a>
          </div>
        </div>
        """

    index_page = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>🎬 Sebastián Teleprompter Hub · Monoga OS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {{ background-color: #050508; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }}
    .glass-header {{ background: rgba(15, 15, 20, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.08); }}
  </style>
</head>
<body class="p-4 max-w-lg mx-auto min-h-screen pb-20">

  <!-- Header -->
  <div class="sticky top-0 z-50 glass-header p-4 rounded-3xl mb-6 shadow-2xl">
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">Producción Los Ángeles</span>
        <h1 class="text-base font-extrabold text-white">🎬 Guiones POV Creator</h1>
      </div>
      <a href="https://crm.grupomonoga.com" target="_blank" class="bg-amber-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95">Twenty CRM</a>
    </div>
    <p class="text-xs text-neutral-400 mt-2">Guiones con división cromática: 🟡 Gancho (Oro), 🟣 Ray-Ban (Púrpura), ⚪ Diálogo (Blanco), 🔴 CTA (Rojo).</p>
  </div>

  <!-- Lista de Guiones -->
  <div class="space-y-4">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-xs font-bold text-neutral-400 uppercase tracking-wider">🔥 Guiones Listos para Grabación</h2>
      <span class="text-xs text-amber-400 font-bold">{len(new_items)} activos</span>
    </div>
    
    {cards_html}
  </div>

  <!-- Footer Info -->
  <div class="mt-8 text-center text-xs text-neutral-600 space-y-1">
    <p>Ecosistema Monoga OS · Grabación POV con Gafas Meta Ray-Ban</p>
    <p>Actualizado: {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
  </div>

</body>
</html>"""
    
    INDEX_HTML_PATH.write_text(index_page, encoding="utf-8")
    print(f"📑 [Índice Actualizado] Guardado en: {INDEX_HTML_PATH.name}")


def run_pipeline(niche: str, city: str, count: int, deploy: bool = True, sync_twenty: bool = True) -> dict:
    """Ejecuta el flujo completo de contenidos de inicio a fin."""
    start_time = time.time()
    print("\n" + "=" * 65)
    print(f"🌴 MONOGA OS — MOTOR DIARIO DE CONTENIDO MATUTINO")
    print(f"🎯 Nicho Objetivo: {niche}")
    print(f"📍 Ciudad: {city}")
    print(f"🔢 Cantidad de Prospectos/Guiones: {count}")
    print(f"🌐 Despliegue SFTP a Hostinger: {'SI' if deploy else 'NO'}")
    print(f"💼 Sincronización en Twenty CRM: {'SI' if sync_twenty else 'NO'}")
    print("=" * 65 + "\n")

    # 1. Extracción de Negocios y Ganchos (ApifyMiner)
    print("🔍 [Paso 1/4] Extrayendo datos de prospectos y referencias virales...")
    miner = ApifyMiner()
    context = miner.get_content_context(niche=niche, city=city, count=count)
    businesses = context.get("businesses", [])
    viral_refs = context.get("viral_references", [])
    print(f"✅ Se obtuvieron {len(businesses)} negocios calificados para {city}.")

    # 2. Generación de Guiones Estructurados (ViralScriptGenerator)
    print("\n📝 [Paso 2/4] Generando guiones POV Hook-Story-CTA con acotaciones Ray-Ban...")
    generator = ViralScriptGenerator()
    scripts_batch = generator.generate_batch(businesses, niche=niche, city=city, viral_references=viral_refs)
    print(f"✅ {len(scripts_batch)} guiones estructurados listos para compilación.")

    # 3. Compilación Cromática y Despliegue SFTP (TeleprompterCompiler)
    print("\n📱 [Paso 3/4] Compilando teleprompters cromáticos móviles y desplegando...")
    compiler = TeleprompterCompiler()
    compiled_batch = compiler.compile_and_deploy_batch(scripts_batch, auto_deploy=deploy)
    print(f"✅ {len(compiled_batch)} teleprompters cromáticos procesados exitosamente.")

    # 4. Sincronización en Twenty CRM (TwentyCardSync)
    synced_tasks = []
    if sync_twenty:
        print("\n💼 [Paso 4/4] Inyectando tarjetas enriquecidas con enlaces a Twenty CRM...")
        syncer = TwentyCardSync()
        synced_tasks = syncer.sync_batch(compiled_batch)
        print(f"✅ {len(synced_tasks)} tareas/tarjetas sincronizadas para John Sebastián.")

    # 5. Actualizar Índice Maestro para Sebastián
    update_sebastian_index(compiled_batch)

    elapsed = round(time.time() - start_time, 2)

    # Resumen Ejecutivo
    print("\n" + "=" * 65)
    print(f"🎉 EJECUCIÓN EXITOSA COMPLETADA EN {elapsed}s")
    print("=" * 65)
    for idx, item in enumerate(compiled_batch, 1):
        s = item.get("script_data", {})
        print(f"\n[{idx}] 🏢 {s.get('business_name')} ({s.get('city')})")
        print(f"    🟡 Gancho: \"{s.get('structure', {}).get('hook', {}).get('text')}\"")
        print(f"    📱 Teleprompter en Vivo: {item.get('public_url')}")

    return {
        "niche": niche,
        "city": city,
        "count": len(compiled_batch),
        "elapsed_seconds": elapsed,
        "items": compiled_batch,
        "tasks": synced_tasks
    }


def main():
    parser = argparse.ArgumentParser(description="Motor de Contenido Diario y Generador de Teleprompter Monoga OS")
    parser.add_argument("--niche", type=str, default="MedSpa & Estética", help="Nicho de negocio objetivo")
    parser.add_argument("--city", type=str, default="Pasadena, CA", help="Ciudad objetivo en Los Ángeles/California")
    parser.add_argument("--count", type=int, default=3, help="Número de guiones/videos a generar")
    parser.add_argument("--deploy", action="store_true", default=True, help="Desplegar automáticamente por SFTP a Hostinger")
    parser.add_argument("--no-deploy", dest="deploy", action="store_false", help="Deshabilitar despliegue SFTP")
    parser.add_argument("--sync-twenty", action="store_true", default=True, help="Sincronizar tarjetas en Twenty CRM")
    parser.add_argument("--no-sync-twenty", dest="sync_twenty", action="store_false", help="Deshabilitar Twenty CRM")

    args = parser.parse_args()
    run_pipeline(
        niche=args.niche,
        city=args.city,
        count=args.count,
        deploy=args.deploy,
        sync_twenty=args.sync_twenty
    )


if __name__ == "__main__":
    main()
