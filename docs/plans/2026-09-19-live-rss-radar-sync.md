# Plan de Implementación: Sincronización Automática de Canales RSS & Radar en Vivo en Dashboard Web

**Fecha:** 2026-09-19  
**Objetivo:** Integrar la ingesta en vivo de feeds RSS de YouTube directamente dentro del Dashboard Web SQLite de CreadorPro para los perfiles de Daniel y Sebastián, eliminando la necesidad de invocar comandos CLI manuales y permitiendo la gestión dinámica de fuentes, escaneo periódico en background y adopción instantánea de videos como guiones en el Pipeline.

**Contexto y Restricciones Globales:**
- CERO DOCKER. Todo corre sobre Node.js nativo (>=24) y SQLite local (`node:sqlite`).
- Aislamiento estricto de perfiles (`daniel` y `sebastian`) en `%LOCALAPPDATA%\Monoga\YouTubeContentOS\profiles\<profile>\dashboard.sqlite`.
- Parsing defensivo de XML/Atom respetando los límites de seguridad de `lib/local-core.js` (sin ejecución externa, tamaño acotado, IDs `UC...` validados).
- Compatibilidad hacia atrás: no romper `npm test` ni los 44 tests existentes.
- UI/UX estándar Pro Max: botones interactivos, feedback visual en tiempo real (spinners, toasts), cero modales rotos.

---

## Task 1: Schema de Fuentes RSS y Señales en SQLite (`lib/dashboard-db.js`)
- **Propósito:** Agregar tablas `configured_sources` y `rss_radar_signals` a `dashboard.sqlite` con índices y seeding de canales de referencia para Daniel y Sebastián.
- **Archivos:** `lib/dashboard-db.js`, `tests/live-rss-radar.test.js`
- **Criterios de Aceptación:**
  - Crear tablas `configured_sources` y `rss_radar_signals` si no existen.
  - Métodos implementados:
    - `getConfiguredSources(profile)`
    - `addConfiguredSource(profile, channelId, channelName)`
    - `removeConfiguredSource(profile, channelId)`
    - `saveRssSignals(profile, source, entries)`
    - `getRssSignals(profile)`
  - Seeding inicial si la tabla está vacía:
    - Daniel: canales de tecnología, IA y B2B (`UC_x5XG1OV2P6uZZ5FSM9Ttw`, `UCUyDOdBWhC1MCxEjC46d-zw`, etc.).
    - Sebastián: canales de construcción y contratistas USA (`UCB4KBpuuJ2QKGdVn_e0E_kg`, etc.).
  - Test unitario que valida inserción, deduplicación de `video_id` y aislamiento entre Daniel y Sebastián.

---

## Task 2: Motor de Ingesta RSS y Endpoints REST en `server.js`
- **Propósito:** Conectar el parsing de feeds RSS (`lib/local-core.js`) con SQLite y exponer endpoints REST en `server.js` con tarea de refresco periódico en background.
- **Archivos:** `server.js`, `lib/dashboard-db.js`, `tests/live-rss-radar.test.js`
- **Criterios de Aceptación:**
  - `GET /api/channels?profile=<profile>`: lista fuentes activas.
  - `POST /api/channels/add`: valida formato de channel ID (`^UC[\w-]{20,}$`) y registra fuente.
  - `POST /api/channels/remove`: desactiva/elimina fuente.
  - `POST /api/radar/refresh`: ejecuta `fetchAllFeeds` de forma atómica y actualiza `rss_radar_signals` en SQLite.
  - `GET /api/radar/signals?profile=<profile>`: devuelve señales RSS capturadas.
  - Intervalo en background en `server.js` que ejecuta refresco automático y registra logs de ejecución en SQLite.
  - Test de integración HTTP validando los endpoints.

---

## Task 3: Modal de Fuentes y Selector de Feeds en Vivo en `public/index.html`
- **Propósito:** Agregar elementos visuales en el Radar para gestionar fuentes RSS y visualizar el estado de sincronización en tiempo real.
- **Archivos:** `public/index.html`, `public/style.css`
- **Criterios de Aceptación:**
  - Barra de estado en `#viewRadar` con contador de canales, timestamp de último refresco y botón `[Sincronizar Feeds en Vivo]`.
  - Botón `[Gestionar Fuentes]` que abre el modal `#manageSourcesModal`.
  - Modal `#manageSourcesModal`:
    - Listado de canales activos con botón de eliminar.
    - Formulario para añadir nuevo canal: Channel ID (`UC...`) y Nombre del canal.
  - Pestañas de filtro de Radar actualizadas: `Todos`, `Radar Algorítmico`, `Feeds RSS en Vivo`.

---

## Task 4: Lógica de Sincronización y Renderizado en `public/app.js`
- **Propósito:** Integrar el frontend con los endpoints de RSS, renderizar las tarjetas de feeds en vivo, animar el estado de sincronización y permitir adopción directa a guiones.
- **Archivos:** `public/app.js`
- **Criterios de Aceptación:**
  - `fetchLiveSources()` y `fetchLiveRssSignals()` llamados al inicializar o cambiar de perfil.
  - `triggerRssRefresh()`: ejecuta llamada a `/api/radar/refresh`, activa animación de carga, actualiza lista de videos y muestra Toast con nuevos videos detectados.
  - `handleAddSourceSubmit()` y `handleRemoveSource()`: mutaciones en SQLite con actualización inmediata de la UI.
  - Renderizado de tarjetas RSS con etiqueta "EN VIVO", canal, fecha relativa y botones de acción (Rayos X, Adoptar como Guión, Consultar con Eloísa).

---

## Task 5: Suite de Verificación Rigurosa y Cierre
- **Propósito:** Verificar el funcionamiento completo sin regresiones en todo el proyecto.
- **Archivos:** `tests/live-rss-radar.test.js`, suite general de tests
- **Criterios de Aceptación:**
  - `npm test` pasa 100% (todas las pruebas anteriores + nuevas pruebas).
  - `npm run check` pasa sin errores de sintaxis ni lints.
  - Verificación en vivo de los endpoints HTTP en `http://localhost:3031`.
