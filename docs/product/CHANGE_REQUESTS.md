# Change Requests de YouTube Content OS

## CR-001 — Título

- **Fecha:**
- **Solicitante:**
- **Clasificación:** Bug / Aclaración / Copy / UX / Nueva feature / Arquitectura
- **Estado:** Proposed

### Solicitud

...

### Razón

...

### Impacto

- Producto:
- UI:
- Datos:
- Permisos:
- Arquitectura:
- QA:
- Plazo/costo:

### Recomendación

Now / Later / Reject

### Decisión

...
# CR-002 — Local-first pivot and B2B editorial package

- **Date:** 2026-09-15
- **Solicitante:** Product owner
- **Classification:** Architecture
- **State:** Accepted by explicit approved-pivot instruction

## Request
Make Node 24 + SQLite the authoritative local implementation, preserve Apps Script only as dormant legacy, make RSS the zero-key core path, and ship the durable B2B editorial package.

## Impact
- Product: local operator workflow; public publishing remains human-approved.
- Data: SQLite authoritative; XLSX is editable export/import surface with revision protection.
- Permissions: optional API key is environment-only; no new publisher permission.
- Architecture: replaces Apps Script/Sheets core dependency; Sheets is optional enhancement.
- QA: deterministic network-free tests plus an optional live smoke only with independently verified ID.
- Cost/schedule: no committed external spend; live smoke is an external owner-controlled blocker.

## Recommendation and decision
**Now.** Implement local-first core while keeping Phase 12 `in_progress` until real evidence is supplied.

## Correction evidence (2026-09-15)
- CR-002 is local-first: Node 24 + SQLite and verified public RSS are the active runtime; Apps Script is dormant legacy.
- The official Google for Developers feed was live-smoked. This is feed identity evidence, not a claim of private account or API ownership coverage.
- Phase 12 remains in progress. No approval is changed without the project gate script, which was not present in this checkout.

