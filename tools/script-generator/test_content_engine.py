"""
🧪 TEST SUITE — MONOGA CONTENT & GROWTH ENGINE (BUFFER 7+7 & YOUTUBE CONSULTING)
================================================================================
Valida rigurosamente:
1. Minero de datos y referencias virales.
2. Generador de guiones cortos POV cromáticos.
3. Generador de guiones largos de consultoría para YouTube (6 etapas / 10-15 min).
4. Gestor de buffer (Watermark rule de 7 clientes, 7 YouTube, 7 POV cortos y deduplicación por ledger).
5. App dinámica de teleprompter y tarjetas BlockNote en Twenty CRM.
"""

import os
import sys
import json
import unittest
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from apify_miner import ApifyMiner
from viral_script_generator import ViralScriptGenerator
from shared_context import load_shared_context
from youtube_consulting_script_generator import YouTubeConsultingScriptGenerator
from growth_buffer_manager import GrowthBufferManager
from teleprompter_compiler import TeleprompterCompiler
from twenty_card_sync import TwentyCardSync, format_twenty_card_markdown, format_twenty_card_blocknote


class TestContentEngine(unittest.TestCase):

    def setUp(self):
        self.miner = ApifyMiner()
        self.generator = ViralScriptGenerator()
        self.yt_gen = YouTubeConsultingScriptGenerator()
        self.buffer_mgr = GrowthBufferManager()
        self.compiler = TeleprompterCompiler()
        self.syncer = TwentyCardSync()

    def test_01_miner_curated_and_scaling(self):
        """Verifica que el minero devuelva negocios y escale dinámicamente según count."""
        ctx = self.miner.get_content_context(niche="MedSpa & Estética", city="Pasadena, CA", count=5)
        self.assertEqual(len(ctx["businesses"]), 5)
        self.assertGreater(len(ctx["viral_references"]), 0)

    def test_02_viral_script_structure_and_colors(self):
        """Verifica que cada guion corto contenga los 4 bloques cromáticos estrictos."""
        biz = {
            "name": "Aura Skin Studio",
            "city": "Pasadena, CA",
            "rating": 5.0,
            "reviews_count": 180,
            "key_service": "HydraFacial",
            "niche": "MedSpa & Estética"
        }
        script = self.generator.generate_field_script(biz, niche="MedSpa & Estética", city="Pasadena, CA")
        struct = script["structure"]
        self.assertEqual(struct["hook"]["color_hex"], "#FBBF24")
        self.assertEqual(struct["rayban_cues"]["color_hex"], "#C084FC")
        self.assertEqual(struct["body_speech"]["color_hex"], "#FFFFFF")
        self.assertEqual(struct["cta"]["color_hex"], "#F87171")

    def test_02b_personal_brand_regressions(self):
        """Protege esquema, variación estable y claims sustentados."""
        biz = {"name": "Taller Norte", "city": "Bogotá", "key_service": "reparación de bicicletas"}
        first = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", template_index=0)
        again = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", template_index=0)
        other = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", template_index=1)
        required = {"id", "title", "business_name", "address", "phone", "rating", "reviews_count", "website", "niche", "city", "template_used", "creator", "editor", "duration_est_seconds", "structure", "full_verbatim"}
        self.assertTrue(required.issubset(first))
        self.assertEqual(first, again)
        self.assertNotEqual(first["template_used"], other["template_used"])
        self.assertNotRegex(first["full_verbatim"], r"\d")
        self.assertEqual(first["claim_ledger"], [])
        reference = {"hook": "Afirmación externa no verificada: 99% de clientes convierten.", "source_url": "https://reference.example"}
        referenced = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", viral_reference=reference)
        self.assertEqual(referenced["structure"]["hook"]["text"], first["structure"]["hook"]["text"])
        self.assertNotIn("99%", referenced["full_verbatim"])
        self.assertIn("https://reference.example", referenced["source_urls"])

        verified = dict(biz, rating=4.8, reviews_count=37, source_urls=["https://example.com"])
        with_facts = self.generator.generate_field_script(verified, "bicicletas", "Bogotá")
        self.assertIn("4.8", with_facts["full_verbatim"] if "4.8" in with_facts["full_verbatim"] else str(with_facts["claim_ledger"]))
        self.assertEqual(with_facts["source_urls"], ["https://example.com"])
        self.assertEqual(len(with_facts["claim_ledger"]), 2)

    def test_shared_context_loader_and_persona_bridge(self):
        context = load_shared_context()
        self.assertIn("schema_version", context)
        self.assertEqual(context["offer_status"], "needs_verification")
        self.assertEqual(context["audiences_status"], "hypothesis")
        biz = {"name": "Taller Norte", "city": "Bogotá", "key_service": "reparación de bicicletas"}
        daniel = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", persona="daniel", shared_context=context)
        self.assertEqual(daniel["brand_pillar"], "strategist_educator")
        self.assertNotRegex(daniel["full_verbatim"], r"\\d")

    def test_shared_context_failure_is_safe(self):
        from unittest.mock import patch
        import shared_context
        with patch.object(shared_context.Path, "open", side_effect=OSError("missing")):
            failed = load_shared_context()
        self.assertIn("context_error", failed)
        self.assertEqual(failed["brands"], {})
        with patch("shared_context.json.load", return_value={"schema_version": "1.0"}):
            invalid = load_shared_context()
        self.assertIn("context_error", invalid)
        self.assertEqual(invalid["brands"], {})

    def test_02c_personas_are_distinct_and_safe(self):
        biz = {"name": "Taller Norte", "city": "Bogotá", "key_service": "reparación de bicicletas"}
        sebastian = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", persona="sebastian")
        daniel = self.generator.generate_field_script(biz, "bicicletas", "Bogotá", persona="daniel")
        default = self.generator.generate_field_script(biz, "bicicletas", "Bogotá")
        self.assertEqual(default, sebastian)
        self.assertEqual(sebastian["persona"], "sebastian")
        self.assertEqual(daniel["persona"], "daniel")
        self.assertNotEqual(sebastian["creator"], daniel["creator"])
        self.assertNotEqual(sebastian["template_used"], daniel["template_used"])
        self.assertNotEqual(sebastian["brand_pillar"], daniel["brand_pillar"])
        self.assertNotRegex(daniel["full_verbatim"], r"\\d")
        with self.assertRaisesRegex(ValueError, "Persona inválida"):
            self.generator.generate_field_script(biz, "bicicletas", "Bogotá", persona="unknown")

    def test_03_youtube_long_form_consulting_script(self):
        """Verifica que el generador de YouTube cree un guion de consultoría de 6 etapas (10-15 min)."""
        biz = {
            "name": "Le Jolie Medi Spa Pasadena",
            "city": "Pasadena, CA",
            "rating": 4.9,
            "reviews_count": 312,
            "key_service": "HydraFacial & Laser",
            "niche": "MedSpa & Estética"
        }
        yt_script = self.yt_gen.generate_consulting_script(biz, niche="MedSpa & Estética", city="Pasadena, CA")
        self.assertEqual(len(yt_script["stages"]), 6)
        self.assertEqual(yt_script["format"], "YOUTUBE_LONG_FORM_CONSULTING")
        self.assertIn("00:00 - 01:00", yt_script["stages"][0]["timestamp"])
        self.assertIn("13:30 - 15:00", yt_script["stages"][5]["timestamp"])
        self.assertIn("Le Jolie Medi Spa", yt_script["full_transcript"])

    def test_04_growth_buffer_watermark_and_ledger(self):
        """Verifica que el gestor de inventario mantenga los buffers de 7 y valide el ledger."""
        status = self.buffer_mgr.get_inventory_status()
        self.assertEqual(status["prospects_target"], 7)
        self.assertEqual(status["youtube_target"], 7)
        self.assertEqual(status["short_pov_target"], 7)
        self.assertGreaterEqual(status["total_ledger_records"], 7)

    def test_05_blocknote_and_twenty_crm_card(self):
        """Verifica que la tarjeta de Twenty CRM contenga tanto BlockNote como Markdown."""
        biz = {
            "business_name": "Pasadena Bark Club",
            "city": "Pasadena, CA",
            "rating": 4.8,
            "reviews_count": 195,
            "key_service": "Luxury Grooming",
            "niche": "Luxury Grooming & Spa"
        }
        script = self.generator.generate_field_script(biz, niche="Luxury Grooming & Spa", city="Pasadena, CA")
        task = self.syncer.create_content_task(script, "https://grupomonoga.com/teleprompter/?id=pov_test")
        
        self.assertIn("bodyV2Blocknote", task)
        self.assertIn("bodyV2Markdown", task)
        bn_data = json.loads(task["bodyV2Blocknote"])
        self.assertIsInstance(bn_data, list)
        self.assertGreater(len(bn_data), 5)


if __name__ == "__main__":
    unittest.main()
