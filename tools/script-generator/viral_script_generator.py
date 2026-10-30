"""
🎬 VIRAL SCRIPT GENERATOR — GENERADOR DE GUIONES POV DE ALTA CONVERSIÓN
========================================================================
Genera guiones estructurados POV con segmentación estricta Hook-Story-CTA
y acotaciones de cámara Ray-Ban Meta codificadas cromáticamente para Creator.
Inspirado en los mejores repositorios y frameworks virales (>10,000 estrellas / Hormozi, Brunson, Direct Response).
"""

import os
import sys
import json
import hashlib
from typing import List, Dict, Any, Optional

try:
    from shared_context import load_shared_context
except ImportError:  # permite importar el generador como paquete o script aislado
    load_shared_context = None

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


# Personal-brand formats: claims stay grounded in the supplied business/context.
PERSONA_PROFILES = {
    "sebastian": {
        "creator": "Creator (Grabación con Gafas Meta Ray-Ban)",
        "brand_pillar": "field_pov",
        "direction_label": "HABLAR A CÁMARA / RECEPCIÓN",
    },
    "daniel": {
        "creator": "Daniel Monoga (Estrategia y educación)",
        "brand_pillar": "strategist_educator",
        "direction_label": "EXPLICAR A CÁMARA / PANTALLA",
    },
}

DANIEL_HOOK_TEMPLATES = [
    {
        "id": "strategy_lens", "name": "Lente estratégico",
        "hook_pattern": "La pregunta estratégica que haría sobre {niche} antes de rediseñar nada.",
        "rayban_cue": "Mostrar una pantalla o libreta propia con el criterio de análisis; ocultar datos privados.",
        "speech_pattern": "Antes de cambiar la apariencia, revisaría qué debe entender una persona sobre {business_name}. {key_service} puede ser el punto de partida si se explica con claridad.",
        "cta_pattern": "Guarda esta pregunta y comenta qué parte de tu negocio quieres revisar.",
    },
    {
        "id": "screen_teardown", "name": "Desglose de pantalla",
        "hook_pattern": "Así analizaría la primera pantalla de un negocio de {niche}.",
        "rayban_cue": "Señalar en pantalla o en una libreta los elementos observables, sin mostrar información privada.",
        "speech_pattern": "Buscaría tres cosas: qué ofrece {business_name}, para quién es y cuál es el siguiente paso. Empezaría por {key_service}, sin completar los vacíos con suposiciones.",
        "cta_pattern": "Guarda el criterio, comenta tu duda o pregunta si quieres una auditoría.",
    },
    {
        "id": "teaching_note", "name": "Nota didáctica",
        "hook_pattern": "Una lección de comunicación para un negocio de {niche}.",
        "rayban_cue": "Escribir la idea en una libreta o mostrar una pantalla de trabajo sin datos de clientes.",
        "speech_pattern": "Una buena explicación conecta una necesidad con una decisión clara. En {business_name}, usaría {key_service} como ejemplo y probaría que el mensaje se entienda antes de añadir más.",
        "cta_pattern": "¿Quieres que haga una auditoría de tu mensaje? Coméntalo y guarda esta idea.",
    },
]

HOOK_TEMPLATES = [
    {
        "id": "opinion", "name": "Opinión / lección contraria",
        "hook_pattern": "Una opinión poco popular sobre {niche}: una web bonita no arregla una experiencia confusa.",
        "rayban_cue": "Caminar por la calle y señalar un detalle visible del negocio sin invadir la privacidad de nadie.",
        "speech_pattern": "Veo muchos negocios de {niche} enfocarse en verse premium, pero yo empezaría por hacerle fácil la siguiente decisión al cliente. En {business_name} me fijé en {key_service}; esa es la conversación que vale la pena tener.",
        "cta_pattern": "¿Qué parte de la experiencia de tu negocio harías más clara hoy? Déjamelo en comentarios."
    },
    {
        "id": "street_observation", "name": "Observación de calle",
        "hook_pattern": "Caminando por {city}, esto fue lo primero que noté sobre {niche}.",
        "rayban_cue": "Grabar la fachada y el entorno, manteniendo a las personas fuera de cuadro o desenfocadas.",
        "speech_pattern": "La gente no decide solo por el local: decide por la señal que recibe antes de entrar. En {business_name}, {key_service} cuenta una historia clara; yo la haría visible desde el primer contacto.",
        "cta_pattern": "Si tienes un negocio local, mira hoy qué entiende alguien que pasa por primera vez."
    },
    {
        "id": "build_reveal", "name": "Revelación de construcción",
        "hook_pattern": "Estoy construyendo una idea para que {business_name} comunique mejor lo que ya hace.",
        "rayban_cue": "Mostrar notas o bocetos propios, sin grabar pantallas privadas ni afirmar que el prototipo está listo.",
        "speech_pattern": "La idea parte de {key_service}: convertir una fortaleza real en una experiencia más fácil de entender. Todavía estoy probando el enfoque y prefiero enseñar el proceso antes que prometer resultados.",
        "cta_pattern": "¿Qué mostrarías primero al presentar un negocio así? Te leo."
    },
    {
        "id": "myth_reality", "name": "Mito versus realidad",
        "hook_pattern": "Mito: {niche} necesita más promesas. Realidad: necesita más claridad.",
        "rayban_cue": "Alternar un plano de la fachada con una nota escrita de ‘mito’ y ‘realidad’.",
        "speech_pattern": "La realidad es que {business_name} ya tiene algo concreto que contar: {key_service}. La comunicación debe ayudar a reconocerlo, no inventar una historia alrededor.",
        "cta_pattern": "¿Qué mito de tu industria te gustaría desmontar?"
    },
    {
        "id": "mistake_lesson", "name": "Error y aprendizaje",
        "hook_pattern": "El error que yo evitaría al comunicar un negocio de {niche}.",
        "rayban_cue": "Grabar una libreta con el error y la corrección; no mostrar datos de clientes.",
        "speech_pattern": "Antes pensaba que había que explicar todo de una vez. Aprendí que es mejor empezar con lo que la persona necesita entender. En {business_name}, empezaría por {key_service} y dejaría el resto para después.",
        "cta_pattern": "¿Qué aprendiste a fuerza de equivocarte en tu negocio?"
    },
    {
        "id": "practical_teardown", "name": "Desglose práctico",
        "hook_pattern": "Así desglosaría la primera impresión digital de un negocio de {niche}.",
        "rayban_cue": "Señalar tres elementos observables del exterior o de material público, sin filmar conversaciones.",
        "speech_pattern": "Primero: que se entienda qué haces. Segundo: que se vea para quién es. Tercero: que el siguiente paso sea obvio. Con {business_name}, empezaría revisando cómo presenta {key_service}; eso sí se puede mejorar sin inventar datos.",
        "cta_pattern": "Guarda este desglose y úsalo para revisar tu propia presencia digital."
    }
]


class ViralScriptGenerator:
    """Generador de guiones POV con división Hook / Ray-Ban / Verbatim / CTA."""

    def __init__(self, custom_templates: Optional[List[Dict[str, Any]]] = None):
        self.templates = custom_templates or HOOK_TEMPLATES

    def _persona_config(self, persona: str, shared_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        normalized = (persona or "sebastian").strip().lower()
        if normalized not in PERSONA_PROFILES:
            raise ValueError(f"Persona inválida: {persona!r}. Usa 'sebastian' o 'daniel'.")
        profile = dict(PERSONA_PROFILES[normalized])
        if shared_context and isinstance(shared_context.get("brands"), dict):
            brand = shared_context["brands"].get(normalized, {})
            if isinstance(brand, dict) and brand.get("brand_pillar"):
                profile["brand_pillar"] = brand["brand_pillar"]
        return profile

    def generate_field_script(
        self,
        business: Dict[str, Any],
        niche: str,
        city: str,
        template_index: int = 0,
        viral_reference: Optional[Dict[str, Any]] = None,
        brand_context: Optional[Dict[str, Any]] = None,
        topic: Optional[str] = None,
        persona: str = "sebastian",
        shared_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Genera un guion estructurado individual para un negocio específico."""
        normalized_persona = (persona or "sebastian").strip().lower()
        profile = self._persona_config(normalized_persona, shared_context)
        templates = DANIEL_HOOK_TEMPLATES if normalized_persona == "daniel" and self.templates is HOOK_TEMPLATES else self.templates
        tpl = templates[template_index % len(templates)]
        
        business_name = business.get("name", "este negocio local")
        business_city = business.get("city", city)
        rating = business.get("rating", "")
        reviews_count = business.get("reviews_count", "")
        key_service = business.get("key_service") or topic or niche
        context = brand_context or {}
        source_urls = business.get("source_urls", context.get("source_urls", []))
        if isinstance(source_urls, str):
            source_urls = [source_urls]
        verified_claims = []
        for field, label in (("rating", "calificación"), ("reviews_count", "reseñas")):
            if business.get(field) is not None and business.get(field) != "":
                verified_claims.append({"claim": f"{label}: {business[field]}", "source": source_urls})
        risk_flags = []
        if viral_reference:
            reference_urls = viral_reference.get("source_urls", viral_reference.get("source_url", []))
            if isinstance(reference_urls, str):
                reference_urls = [reference_urls]
            if reference_urls:
                source_urls = list(dict.fromkeys(source_urls + reference_urls))
            risk_flags.append("viral_reference_no_usado_como_guion")
        if not source_urls:
            risk_flags.append("sin_fuente_url_proporcionada")
        if not business.get("key_service") and not topic:
            risk_flags.append("servicio_inferido_del_nicho")
        
        # Formatear secciones
        hook_text = tpl["hook_pattern"].format(
            business_name=business_name,
            city=business_city,
            rating=rating,
            reviews_count=reviews_count,
            key_service=key_service,
            niche=niche
        )

        # Las referencias externas nunca sustituyen el hook generado.
        rayban_action = tpl["rayban_cue"]
        
        speech_text = tpl["speech_pattern"].format(
            business_name=business_name,
            city=business_city,
            rating=rating,
            reviews_count=reviews_count,
            key_service=key_service,
            niche=niche
        )
        
        cta_text = tpl["cta_pattern"].format(
            business_name=business_name,
            city=business_city,
            rating=rating,
            reviews_count=reviews_count,
            key_service=key_service,
            niche=niche
        )
        
        stable_key = f"{business_name}|{business_city}|{template_index}|{topic or ''}|{normalized_persona}"
        script_id = f"script_{business_name.lower().replace(' ', '_')[:16]}_{hashlib.sha1(stable_key.encode()).hexdigest()[:10]}"
        
        # Formato de guion completo para lectura combinada
        full_verbatim = f"{hook_text} {speech_text} {cta_text}"
        
        return {
            "id": script_id,
            "title": f"POV: {business_name} ({business_city})",
            "business_name": business_name,
            "address": business.get("address", business_city),
            "phone": business.get("phone", "N/A"),
            "rating": rating,
            "reviews_count": reviews_count,
            "website": business.get("website", ""),
            "niche": niche,
            "city": business_city,
            "template_used": tpl["name"],
            "persona": normalized_persona,
            "creator": profile["creator"],
            "editor": "Daniel Monoga",
            "direction_label": profile["direction_label"],
            "duration_est_seconds": 25,
            "structure": {
                "hook": {
                    "time": "0-3s",
                    "color_tag": "YELLOW_GOLD",
                    "color_hex": "#FBBF24",
                    "label": "🟡 GANCHO VIRAL (0-3s)",
                    "text": hook_text
                },
                "rayban_cues": {
                    "color_tag": "PURPLE_ACCENT",
                    "color_hex": "#C084FC",
                    "label": "🟣 NO LEER EN VOZ ALTA · ACCIÓN RAY-BAN",
                    "action": rayban_action
                },
                "body_speech": {
                    "time": "4-22s",
                    "color_tag": "WHITE_TEXT",
                    "color_hex": "#FFFFFF",
                    "label": "⚪ HABLAR A CÁMARA / RECEPCIÓN (4-22s)",
                    "text": speech_text
                },
                "cta": {
                    "time": "23-30s",
                    "color_tag": "RED_CORAL",
                    "color_hex": "#F87171",
                    "label": "🔴 CIERRE & LLAMADO A LA ACCIÓN (23-30s)",
                    "text": cta_text
                }
            },
            "full_verbatim": full_verbatim,
            "brand_pillar": context.get("brand_pillar", profile["brand_pillar"]),
            "claim_ledger": verified_claims,
            "source_urls": source_urls,
            "risk_flags": risk_flags
        }

    def generate_batch(
        self,
        businesses: List[Dict[str, Any]],
        niche: str,
        city: str,
        viral_references: Optional[List[Dict[str, Any]]] = None,
        persona: str = "sebastian",
        shared_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Genera un lote de guiones asignando diferentes plantillas y ganchos a cada negocio."""
        scripts = []
        references = viral_references or []
        for i, biz in enumerate(businesses):
            ref = references[i % len(references)] if references else None
            script = self.generate_field_script(biz, niche=niche, city=city, template_index=i, viral_reference=ref, persona=persona, shared_context=shared_context)
            scripts.append(script)
        return scripts


if __name__ == "__main__":
    from apify_miner import ApifyMiner
    miner = ApifyMiner()
    context = miner.get_content_context(niche="MedSpa & Estética", city="Pasadena, CA", count=2)
    
    generator = ViralScriptGenerator()
    batch = generator.generate_batch(
        context["businesses"],
        niche=context["niche"],
        city=context["city"],
        viral_references=context.get("viral_references")
    )
    
    print("\n🎬 GUIONES VIRALES GENERADOS:")
    for s in batch:
        print(f"\n==========================================")
        print(f"📌 {s['title']}")
        print(f"🟡 [0-3s GANCHO]: {s['structure']['hook']['text']}")
        print(f"🟣 [RAY-BAN ACCIÓN]: {s['structure']['rayban_cues']['action']}")
        print(f"⚪ [4-22s SPEECH]: {s['structure']['body_speech']['text']}")
        print(f"🔴 [23-30s CTA]: {s['structure']['cta']['text']}")
