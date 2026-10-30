"""Read-only bridge to Monoga's central business context."""

import json
from pathlib import Path
from typing import Any, Dict

REQUIRED_KEYS = {
    "schema_version", "brands", "offer_status", "audiences_status",
    "sales_stages", "content_to_sales_handoff_fields", "evidence_rules",
    "external_action_policy",
}


def load_shared_context() -> Dict[str, Any]:
    """Load and minimally validate the local context; never performs I/O beyond reading JSON."""
    context_path = Path(__file__).resolve().parents[3] / "contexto-general.json"
    try:
        with context_path.open("r", encoding="utf-8") as handle:
            context = json.load(handle)
        if not isinstance(context, dict) or not REQUIRED_KEYS.issubset(context):
            raise ValueError("contexto incompleto")
        if not isinstance(context["brands"], dict) or not {"sebastian", "daniel"}.issubset(context["brands"]):
            raise ValueError("marcas incompletas")
        return context
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return {"context_error": str(exc), "brands": {}}
