"""
📱 TELEPROMPTER COMPILER & MASTER DYNAMIC APP (MONOGA OS)
=========================================================
Compila y gestiona la aplicación web única e interactiva de Teleprompter POV
con selector de guiones dinámico, botón de pausa de grabación,
código cromático (Oro 🟡, Púrpura 🟣, Blanco ⚪, Rojo 🔴), y despliegue atómico a Hostinger.
"""

import os
import sys
import json
import time
import posixpath
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

OUTPUT_DIR = CURRENT_DIR / "teleprompters_output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
SCRIPTS_JSON_PATH = OUTPUT_DIR / "scripts.json"
DYNAMIC_APP_TEMPLATE_PATH = CURRENT_DIR / "dynamic_teleprompter_app.html"

# Importar cliente SFTP de Hostinger
try:
    sys.path.insert(0, str(DEPLOYER_DIR))
    from hostinger_cli.sftp_client import HostingerSFTPClient
    from hostinger_cli.config import load_config
    SFTP_AVAILABLE = True
except Exception:
    SFTP_AVAILABLE = False


class TeleprompterCompiler:
    """Compilador de base de datos JSON de guiones y desplegador de la app única dinámica."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.scripts_json_file = self.output_dir / "scripts.json"
        self._init_scripts_store()

    def _init_scripts_store(self):
        """Inicializa o carga el almacén maestro de guiones."""
        if not self.scripts_json_file.exists():
            self.scripts_json_file.write_text("[]", encoding="utf-8")

    def load_all_scripts(self) -> List[Dict[str, Any]]:
        """Lee todos los guiones guardados en el JSON maestro."""
        try:
            content = self.scripts_json_file.read_text(encoding="utf-8")
            data = json.loads(content)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def save_all_scripts(self, scripts: List[Dict[str, Any]]):
        """Guarda la lista de guiones formateada."""
        self.scripts_json_file.write_text(json.dumps(scripts, indent=2, ensure_ascii=False), encoding="utf-8")

    def format_script_record(self, script_data: Dict[str, Any], slug_prefix: str = "pov") -> Dict[str, Any]:
        """Estructura un guion para la base de datos JSON del teleprompter."""
        clean_biz = script_data.get("business_name", "script").lower().replace(" ", "_")
        clean_biz = "".join(c for c in clean_biz if c.isalnum() or c == "_")[:18]
        timestamp = int(time.time())
        slug = f"{slug_prefix}_{clean_biz}_{timestamp}"
        
        struct = script_data.get("structure", {})
        hook = struct.get("hook", {}).get("text", "")
        rayban = struct.get("rayban_cues", {}).get("action", "")
        body = struct.get("body_speech", {}).get("text", "")
        cta = struct.get("cta", {}).get("text", "")
        verbatim = script_data.get("full_verbatim", f"{hook} {body} {cta}")

        record = {
            "id": slug,
            "slug": slug,
            "business_name": script_data.get("business_name", "Negocio Local"),
            "city": script_data.get("city", "Los Ángeles, CA"),
            "niche": script_data.get("niche", "Servicios"),
            "archetype": script_data.get("template_used", "POV Standard"),
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "structure": {
                "hook": {"text": hook},
                "rayban_cues": {"action": rayban},
                "body_speech": {"text": body},
                "cta": {"text": cta}
            },
            "full_verbatim": verbatim,
            "raw_data": script_data
        }
        return record

    def build_dynamic_app(self) -> Path:
        """Copia o genera el archivo index.html de la aplicación web única en la carpeta de salida."""
        app_target = self.output_dir / "index.html"
        if DYNAMIC_APP_TEMPLATE_PATH.exists():
            html_content = DYNAMIC_APP_TEMPLATE_PATH.read_text(encoding="utf-8")
        else:
            # Fallback a string si no existe el archivo
            html_content = "<!DOCTYPE html><html><body><h1>Monoga Teleprompter</h1></body></html>"
        app_target.write_text(html_content, encoding="utf-8")
        return app_target

    def compile_and_deploy_batch(self, scripts_batch: list, auto_deploy: bool = True) -> list:
        """Agrega el nuevo lote de guiones a scripts.json y despliega la app a Hostinger."""
        existing_scripts = self.load_all_scripts()
        new_records = []
        compiled_results = []

        for script in scripts_batch:
            record = self.format_script_record(script)
            new_records.append(record)
            public_url = f"https://grupomonoga.com/teleprompter/?id={record['id']}"
            compiled_results.append({
                "slug": record["slug"],
                "public_url": public_url,
                "script_data": script,
                "record": record
            })

        # Prepend new scripts so they appear first
        combined_scripts = new_records + existing_scripts
        self.save_all_scripts(combined_scripts)
        
        # Generar index.html de la app
        app_html_file = self.build_dynamic_app()

        if auto_deploy:
            self.deploy_app_and_scripts_to_hostinger(app_html_file, self.scripts_json_file)
        else:
            print("ℹ️ [Deploy Omitido] Archivos generados localmente.")

        return compiled_results

    def deploy_app_and_scripts_to_hostinger(self, app_html_path: Path, scripts_json_path: Path) -> bool:
        """Despliega atómicamente la app universal (index.html) y la base de datos (scripts.json) a Hostinger."""
        if not SFTP_AVAILABLE:
            print("ℹ️ [SFTP Mock] Despliegue simulado exitosamente a https://grupomonoga.com/teleprompter/.")
            return True

        try:
            config = load_config()
            client = HostingerSFTPClient(config)
            client.connect()
            sftp = client._ensure_connected()

            base_root = config.get_root_for_domain(config.target_domain)
            teleprompter_dir = posixpath.join(base_root, "teleprompter")

            # Crear directorio remoto /teleprompter si no existe
            try:
                sftp.stat(teleprompter_dir)
            except IOError:
                try:
                    sftp.mkdir(teleprompter_dir)
                except Exception:
                    pass

            # Subir index.html y scripts.json
            remote_index = posixpath.join(teleprompter_dir, "index.html")
            remote_json = posixpath.join(teleprompter_dir, "scripts.json")

            client.put_file_atomic(str(app_html_path), remote_index)
            client.put_file_atomic(str(scripts_json_path), remote_json)
            client.close()

            print(f"🚀 [Hostinger SFTP] App de Teleprompter y scripts.json actualizados en vivo:")
            print(f"   👉 https://grupomonoga.com/teleprompter/")
            return True

        except Exception as e:
            print(f"⚠️ [Hostinger Deploy Warning] {e}. La app local quedó lista.")
            return False


if __name__ == "__main__":
    from viral_script_generator import ViralScriptGenerator
    sample_biz = {
        "name": "Le Jolie Medi Spa Pasadena",
        "city": "Pasadena, CA",
        "rating": 4.9,
        "reviews_count": 312,
        "key_service": "HydraFacial & Laser",
        "niche": "MedSpa & Estética"
    }
    gen = ViralScriptGenerator()
    script = gen.generate_field_script(sample_biz, niche="MedSpa & Estética", city="Pasadena, CA")
    
    compiler = TeleprompterCompiler()
    results = compiler.compile_and_deploy_batch([script], auto_deploy=True)
    print(f"✅ Compilación y Despliegue Completado: {results[0]['public_url']}")
