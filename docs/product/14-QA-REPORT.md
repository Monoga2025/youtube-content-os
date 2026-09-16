---
artifact: qa-report
phase: 14
status: draft
reason: ""
last_updated: "2026-09-15"
---

# 14 — QA Report de YouTube Content OS

## Release candidate

- Versión/commit:
- Ambiente:
- Fecha:
- Responsable:

## Cobertura

| Área | Casos | Pasaron | Fallaron | Evidencia |
|---|---:|---:|---:|---|
| Flujos MUST | | | | |
| Auth | | | | |
| Permisos | | | | |
| Responsive | | | | |
| Densidad visual móvil | | | | |
| Integraciones | | | | |

## Bugs

| ID | Severidad | Flujo | Descripción | Reproducción | Estado |
|---|---|---|---|---|---|
| BUG-001 | S1 | | | | Open |

## Pruebas funcionales

- [ ] Happy paths
- [ ] Editar
- [ ] Cancelar
- [ ] Duplicados
- [ ] Límites
- [ ] Concurrencia relevante

## Auth y permisos

- [ ] Login/logout
- [ ] Recuperación
- [ ] Sesión
- [ ] URL directa
- [ ] Rol incorrecto
- [ ] Otro usuario
- [ ] Otro tenant
- [ ] Archivos

## UI

- [ ] Móvil pequeño
- [ ] Móvil
- [ ] Anchos 360, 375, 390, 412 y 430 px
- [ ] Densidad visual y cantidad de contenido visible
- [ ] Proporciones de hero, cards, tipografía, gaps y márgenes
- [ ] Edge-to-edge sin letterboxing ni barras laterales
- [ ] Tablet
- [ ] Desktop
- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Success
- [ ] Textos largos

## Operación

- [ ] Logs
- [ ] Monitoring
- [ ] Backups
- [ ] Fallo integración
- [ ] Conexión lenta

## Riesgos aceptados

- ...

## Gate

- [ ] No hay S0.
- [ ] No hay S1.
- [ ] Todos los MUST tienen evidencia.
- [ ] Se probaron permisos negativos.
- [ ] La regresión visual móvil cumple densidad, proporciones, contenido visible y ocupación edge-to-edge.
- [ ] El release candidate es reproducible.
- [ ] Los bugs aceptados tienen dueño y razón.
