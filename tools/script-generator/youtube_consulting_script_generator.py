"""
🎥 YOUTUBE CONSULTING SCRIPT GENERATOR — GUIONES LARGOS DE CONSULTORÍA 1-A-1
=============================================================================
Genera guiones exhaustivos de alta autoridad (10 a 15 minutos) estructurados en 6 etapas
con metodología de auditoría y consultoría estratégica para YouTube (Estilo Consultora Senior).
Diseñado para generar confianza masiva, autoridad técnica y cierre de tratos high-ticket.
"""

import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


class YouTubeConsultingScriptGenerator:
    """Generador de guiones largos de consultoría técnica y de negocio para YouTube."""

    def __init__(self):
        pass

    def generate_consulting_script(self, business: Dict[str, Any], niche: str = "MedSpa & Estética", city: str = "Pasadena, CA") -> Dict[str, Any]:
        """Genera un guion de consultoría largo de 10-15 min en 6 etapas estructuradas."""
        biz_name = business.get("name") or business.get("business_name") or "Negocio Local"
        rating = business.get("rating", 4.9)
        reviews = business.get("reviews_count", 150)
        key_service = business.get("key_service", "Servicios Principales de Alto Valor")
        address = business.get("address", city)

        timestamp_id = f"yt_consulting_{biz_name.lower().replace(' ', '_')[:18]}_{int(time.time())}"

        # 6 Módulos de Consultoría Estratégica
        stages = [
            {
                "stage_number": 1,
                "title": "🎯 ETAPA 1: GANCHO DE ALTO VALOR & TESIS CENTRAL",
                "timestamp": "00:00 - 01:00",
                "duration_min": 1.0,
                "screen_direction": "Plano medio a cámara, iluminación suave, micrófono Shure visible, fondo sobrio de estudio.",
                "dialogue": (
                    f"¿Qué pasaría si tu negocio en {city} tuviera el mejor servicio de su sector, "
                    f"cientos de clientes felices recomendándolo, pero estuviera dejando sobre la mesa "
                    f"más de $30,000 dólares al mes simplemente porque su infraestructura digital se construyó "
                    f"como un folleto estático y no como un activo generador de ingresos?\n\n"
                    f"Hoy vamos a hacer una consultoría estratégica en vivo analizando el caso real de {biz_name}. "
                    f"Vamos a desglosar exactamente qué están haciendo bien, dónde se está fugando el 40% de su tráfico calificado "
                    f"y cómo una arquitectura de conversión de alta gama puede transformar sus números este trimestre."
                )
            },
            {
                "stage_number": 2,
                "title": "🩺 ETAPA 2: RADIOGRAFÍA & DIAGNÓSTICO DEL NEGOCIO",
                "timestamp": "01:00 - 03:30",
                "duration_min": 2.5,
                "screen_direction": "Compartir pantalla mostrando ficha de Google Maps, calificación de 5 estrellas y métricas de reputación.",
                "dialogue": (
                    f"Analicemos primero el fundamento del negocio. {biz_name} tiene una reputación sólida con {rating} estrellas "
                    f"y más de {reviews} reseñas verificadas en {city}. En el mundo físico, su experiencia en {key_service} es impecable.\n\n"
                    f"Sin embargo, existe una desconexión crítica entre la experiencia dentro del establecimiento y lo que vive un cliente "
                    f"cuando llega desde su teléfono a su sitio web. Hoy en día, más del 82% de las personas que buscan {niche} en Los Ángeles "
                    f"toman la decisión de agendar o abandonar en los primeros 4 segundos de interacción con la pantalla."
                )
            },
            {
                "stage_number": 3,
                "title": "🔍 ETAPA 3: AUDITORÍA EN VIVO DEL EMBUDO VS COMPETENCIA EN LA",
                "timestamp": "03:30 - 06:30",
                "duration_min": 3.0,
                "screen_direction": "Inspección técnica en vivo (PageSpeed Insights, análisis de fuentes, tiempos de respuesta móvil y formularios).",
                "dialogue": (
                    f"Vamos a inspeccionar los 3 cuellos de botella que detectamos en la auditoría técnica:\n\n"
                    f"1. Fricción en la Reserva Móvil: El usuario promedio tiene que hacer 5 clics y llenar campos innecesarios para consultar disponibilidad.\n"
                    f"2. Falta de Anclaje de Valor Visual: Las fotos y testimonios están ocultos debajo del pliegue principal, lo que diluye la percepción de lujo.\n"
                    f"3. Velocidad y Latencia: La web tarda más de 3.2 segundos en cargar en redes móviles 5G, lo que dispara la tasa de rebote al 54%.\n\n"
                    f"Mientras tanto, los competidores agresivos en Beverly Hills y Glendale están implementando embudos conversacionales instantáneos con WhatsApp y Stripe."
                )
            },
            {
                "stage_number": 4,
                "title": "🚀 ETAPA 4: DEMOSTRACIÓN DE LA SOLUCIÓN MONOGA OS (ARQUITECTURA PRO)",
                "timestamp": "06:30 - 11:00",
                "duration_min": 4.5,
                "screen_direction": "Demostración en pantalla del prototipo interactivo Monoga OS: Bento Grid, tipografía Plus Jakarta Sans, carga en 400ms, integración de reservas 1-clic.",
                "dialogue": (
                    f"Aquí es donde entra la ingeniería de diseño. En Monoga Studio maquetamos una solución a medida bajo estándar CRO:\n\n"
                    f"• Lienzo Blanco Puro Luxury con iluminación ambiental difusa que transmite exclusividad médica/técnica.\n"
                    f"• Bento Grid Inteligente que presenta los servicios estrella ({key_service}) con comparativa clara de beneficios.\n"
                    f"• Sticky Action Bar flotante en móviles con confirmación de turno y recordatorio automático sincronizado al calendario.\n"
                    f"• Cero fricción: el usuario puede ver la disponibilidad en tiempo real y asegurar su cita en menos de 30 segundos."
                )
            },
            {
                "stage_number": 5,
                "title": "📈 ETAPA 5: ECONOMÍA UNITARIA & RETORNO DE INVERSIÓN (ROI)",
                "timestamp": "11:00 - 13:30",
                "duration_min": 2.5,
                "screen_direction": "Gráfico de desglose de números: Tráfico mensual, Tasa de conversión actual (1.5%) vs Optimizada (3.8%), Valor de Vida del Cliente (LTV).",
                "dialogue": (
                    f"Hagamos los números reales de esta consultoría:\n\n"
                    f"Supongamos que {biz_name} recibe 1,200 visitas mensuales a su perfil. Con una tasa de conversión tradicional del 1.5%, captan 18 clientes.\n"
                    f"Al elevar la tasa al 3.8% mediante la arquitectura optimizada, estamos hablando de 45 clientes al mes (+27 clientes nuevos).\n"
                    f"Con un ticket promedio de $350 USD por tratamiento, eso representa un incremento neto de más de $9,450 USD cada 30 días, o más de $113,000 USD al año.\n\n"
                    f"La inversión en infraestructura digital no es un gasto operativo; es un multiplicador directo del LTV de la empresa."
                )
            },
            {
                "stage_number": 6,
                "title": "🤝 ETAPA 6: CIERRE & LLAMADO A CONSULTORÍA PRIVADA 1-A-1",
                "timestamp": "13:30 - 15:00",
                "duration_min": 1.5,
                "screen_direction": "Cámara principal frontal con banner inferior invitando a agendar sesión privada de diagnóstico.",
                "dialogue": (
                    f"Si eres dueño o directivo de {biz_name}, o si diriges un negocio de servicios premium en Los Ángeles y quieres que auditemos "
                    f"tu infraestructura y construyamos tu embudo a medida, puedes agendar una sesión de consultoría privada 1 a 1 con nuestro equipo.\n\n"
                    f"En el enlace de la descripción encontrarás acceso directo a nuestra agenda para revisar tu caso específico, mostrarte el prototipo funcional "
                    f"y trazar un plan de crecimiento de 90 días.\n\n"
                    f"Suscríbete para más desgloses estratégicos y nos vemos en la próxima consultoría."
                )
            }
        ]

        full_transcript = "\n\n".join([f"[{s['title']} - {s['timestamp']}]\n{s['dialogue']}" for s in stages])

        return {
            "id": timestamp_id,
            "title": f"Consultoría 1-a-1: Auditoría y Embudo de Alto Impacto para {biz_name}",
            "format": "YOUTUBE_LONG_FORM_CONSULTING",
            "target_duration": "10-15 min",
            "business_name": biz_name,
            "city": city,
            "niche": niche,
            "rating": rating,
            "reviews_count": reviews,
            "key_service": key_service,
            "stages": stages,
            "full_transcript": full_transcript,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

    def generate_batch(self, businesses: List[Dict[str, Any]], niche: str = "MedSpa & Estética", city: str = "Pasadena, CA") -> List[Dict[str, Any]]:
        """Genera un lote de guiones de consultoría para YouTube."""
        results = []
        for biz in businesses:
            script = self.generate_consulting_script(biz, niche=niche, city=city)
            results.append(script)
        return results


if __name__ == "__main__":
    sample = {
        "name": "Le Jolie Medi Spa Pasadena",
        "city": "Pasadena, CA",
        "rating": 4.9,
        "reviews_count": 312,
        "key_service": "HydraFacial & Laser",
        "niche": "MedSpa & Estética"
    }
    gen = YouTubeConsultingScriptGenerator()
    script = gen.generate_consulting_script(sample)
    print(f"✅ Guion Largo YouTube Generado: {script['title']}")
    print(f"Etapas: {len(script['stages'])}")
