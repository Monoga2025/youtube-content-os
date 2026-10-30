# Qué es esto y qué puede hacer

**Fecha:** 2026-10-12.
**Para qué sirve este documento:** para que dentro de dos semanas no tengas que recordar qué se construyó, qué no, y qué se puede afirmar delante de una cámara. Si algo de aquí no está en un archivo, no existe.

---

## Parte 1 — Aclaración urgente: NO instalé ningún repo

**No instalé nada. Ni Frigate, ni HyperFrames, ni Chatwoot, ni Pipecat.** No descargué ni ejecuté ningún repositorio de los 5 del video.

Lo único que hice con ellos fue:
1. Leer la descripción del video en YouTube.
2. Consultar la API pública de GitHub para ver cuántas estrellas y qué licencia tiene cada uno.
3. Leer la documentación de Frigate para confirmar que admite modelos YOLO propios.

**Nada más.** Los 5 repos siguen sin estar instalados en tu computador.

**Lo que sí está instalado y lo instalaste tú antes de esta conversación:**

| Cosa | Dónde | Quién lo puso |
|---|---|---|
| HyperFrames `0.8.140` y `0.8.141` | `Dia-01` a `Dia-04` de Loovo-42 | Tú, para editar la serie |
| OBS 32.2.2 con Branch Output | Tu computador | Tú |
| ffmpeg 9.0.1 | Tu computador | Tú |
| yt-dlp (módulo de Python) | Tu Python | Ya estaba |

HyperFrames es el único de los 5 que tienes, y lo tienes porque tú lo montaste para la serie. No lo instalé yo.

---

## Parte 2 — Qué es «el agente» que construimos

Está en `<repo-root>`.

**No es un generador de guiones.** Es un **verificador**. La diferencia importa:

- Un generador escribe guiones. **Eso ya lo tienes y es mejor que cualquier cosa que yo escriba:** la skill `monoga-guionista`, con tu voz y tus 42 días. Ya rechazaste dos veces guiones generados por IA por genéricos.
- Un verificador **comprueba** si un texto se puede afirmar. Eso no lo tenías.

### Qué hace, en concreto

| Archivo | Qué hace | Estado |
|---|---|---|
| `codigo/validar_contexto.py` | Comprueba que el contexto de marca tiene los 11 campos obligatorios. Si falta uno, **se niega a dejar generar** y dice cuál falta | Funciona |
| `codigo/validar_pieza.py` | Comprueba 19 reglas sobre un guion: que el gancho sea corto, que haya 5 ángulos distintos, que las 4 capas estén escritas, que haya CTA, que el framework esté declarado, y **que no haya cifras ni superlativos que no estén respaldados** | Funciona |
| `codigo/validar_pieza.py --escribir-checklist` | Reescribe el bloque de checklist del guion con el veredicto. **No cambia el estado**: aprobar es tuyo | Funciona |
| `codigo/derivar_indice.py` | Genera el índice del banco de guiones desde los propios archivos | Funciona |
| `codigo/verificar_reglas.py` | Comprueba que las reglas no se contradicen entre documentos | Funciona |
| `codigo/tests/run_tests.py` | **90 pruebas.** 1 guion válido y 18 inválidos (uno por cada regla) | **90/90 correctas** |

### La prueba de que sirve

Cuando pedí al verificador que revisara un texto con la cifra inventada `2000 euros` y con la palabra `revolucionario`, la rechazó:

```
FALLO: [C-06b] (BR-005) Afirmacion no respaldada por el contexto:
       '2000 euros' no aparece en marca/contexto-marca.md.
Resultado: RECHAZADO (1 fallo(s) bloqueante(s))
```

**Y encontró dos fallos reales míos mientras lo construía:**
1. Estaba leyendo tu «vocabulario prohibido» como si fuera respaldo. Es decir: **habría aprobado exactamente la frase que existe para prohibir.**
2. No distinguía subsecciones anidadas en los documentos.

Los dos están corregidos y con prueba de regresión.

### Lo que el verificador NO hace

- **No escribe guiones.** No genera contenido.
- **No oye ni ve.** No revisa audio ni video.
- **No publica nada.** No toca redes sociales.
- **No aprueba nada.** Los estados (borrador, aprobado, publicado) son tuyos, y el sistema no los puede cambiar.
- **Tiene un punto ciego:** detecta cifras con unidad (`2000 euros`, `40%`) y superlativos de una lista. Una promesa sin cifra ni superlativo, como «vas a vender más», **puede pasar el filtro**. Está declarado en el propio reporte, no escondido.

### El contexto de marca

Está en `marca/contexto-marca.md` y lo saqué de tu ZIP de 466 fuentes con **procedencia declarada** en cada afirmación. Contiene:

- Tu posicionamiento: *«Monoga organiza la adopción e integración de inteligencia artificial en profesiones y empresas»*.
- Tus dos perfiles vigentes: `CONTADOR` (consulta documental DIAN) y `ODOO` (proceso empresarial).
- **Tu lista negra:** «oferta única», «calidad insuperable», «soluciones integrales», «experiencia diferencial»...
- **5 ejemplos de voz literales tuyos**, con el archivo de origen de cada uno.
- Marca lo histórico como `[HISTORICO — NO USAR]`: los precios de Los Ángeles, el piloto de COP 490.000, MedSpas, Pasadena.

**El verificador lo aprueba: 11/11 comprobaciones.**

---

## Parte 3 — Qué hacen los 5 repos del video

**No los tienes instalados.** Esto es solo para que sepas qué son.

| # | Repo | Qué hace | Estrellas | Licencia | ¿Lo tienes? |
|---:|---|---|---:|---|---|
| 1 | **Frigate** | Convierte cámaras normales en cámaras con IA. Detecta personas, vehículos y objetos. **Corre en local**, sin depender de un servidor en otro país | 36.523 | MIT | **No** |
| 2 | **HyperFrames** | Convierte código en video. Animaciones y motion graphics editables por un agente de IA, porque son archivos de texto | 61.587 | Apache-2.0 | **SÍ, desde el Día 1** |
| 3 | **Chatwoot** | Junta WhatsApp, Instagram, Facebook y email en una sola bandeja, con IA para responder | 37.734 | **por verificar** | **No** |
| 4 | **Pipecat** | Recepcionista de voz: contesta llamadas y conversa por voz en tiempo real | 16.395 | BSD-2 | **No** |
| 5 | **sin identificar** | Sistema de pedidos para restaurantes: web propia, menú, carrito y pago, para no pagar el ~30% a Uber Eats | — | — | **No** |

**El sistema 5 no tiene nombre confirmado.** El subtítulo automático lo escribe «Ignider» y «Overage», y ninguna existe. Hay que leerlo en pantalla en el minuto 12:25 del video.

**Antes de vender cualquiera: lee su archivo `LICENSE`.** Frigate, HyperFrames y Pipecat permiten uso comercial. Chatwoot aparece sin licencia determinada, así que hay que leerla.

---

## Parte 4 — Qué puedes afirmar y qué no (esto es lo que más te protege)

### Puedes decir, porque está verificado

- Que HyperFrames lo **usas** para editar tu serie, y que pasaste **7 min 37 s a 38 s** (ese dato es tuyo y está medido).
- Que **Frigate es gratis, open source, y admite modelos propios** para detectar cosas como un casco.
- Que la detección de casco **no viene hecha**: hay que entrenarla con datos y validarla.
- Que esos precios de venta son **lo que dice el video**, no tu medición.

### No puedes decir, en ninguna forma

| No digas | Por qué |
|---|---|
| «Tengo instalado el sistema de cámaras» | No lo tienes |
| «Detecto si un empleado lleva casco o dotación» | No existe. Ni en tu material ni en tu computador |
| «Lo instalo en una tarde» | Es la frase del video. Tú no lo has hecho |
| «La IA reemplaza contadores» o «mata editores» | No tienes un dato, y contradice tu propio método |
| «Ahorra 40%», «triplica ventas», «100% automático» | Cifras sin medición. Tu propia regla: «pendiente de medir» |
| Cualquier precio de Los Ángeles (USD 997, COP 490.000) | Tu material lo marca histórico y no autorizado |
| Nombres de clientes | Nadie te ha autorizado |

**Y una advertencia de contenido:** el video vende HyperFrames como *«matar a los editores»* y como no *«depender de un joven de 17 años que está en Colombia»*. **Ese no es tu ángulo y en Bucaramanga es un tiro en el pie.** Tu versión es la contraria y es cierta: **la herramienta hace la parte mecánica, el criterio sigue siendo tuyo.**

---

## Parte 5 — Lo que quedó escrito (dónde está cada cosa)

### En `Agente generador de contenido`

| Ruta | Qué es |
|---|---|
| `marca/contexto-marca.md` | Tu contexto de marca, sacado de tus 466 fuentes |
| `reglas/aida.md` | Las 4 capas de AIDA, con criterio negativo y errores típicos |
| `reglas/reglas.md` | Las 12 reglas de negocio, con ejemplo y excepción |
| `reglas/disparadores.md` | Los 6 tipos de gancho, con ejemplo de cada uno |
| `reglas/taxonomia.md` | Plataformas, formatos, frameworks y métricas válidas |
| `reglas/checklist.md` | Los 7 ítems de calidad, marcando cuáles son automáticos y cuáles dependen de criterio |
| `codigo/*.py` | El verificador. **90/90 pruebas correctas** |
| `docs/product/01-...` a `12-...` | Las 12 fases del método, incluido el modelo de dominio y la arquitectura |

### En `Loovo-42`

| Ruta | Qué es |
|---|---|
| `00_Serie/videos-5-repos.md` | Los 5 videos de los repos: ganchos, puntos, y lo que sí y no puedes afirmar |
| `00_Serie/videos-repos-01-hyperframes.md` | El primer video completo: 3 ganchos, 2 cierres, título, caption, nota de grabación |
| `00_Serie/guiones/investigacion/repo-video/INDICE-REPOS.md` | Los repos con datos verificados, licencias, errores del video y una ficha para rellenar antes de grabar |

**Lo que NO construí y no hace falta:** no reemplacé tu `monoga-guionista`, no toqué tus 42 días, no instalé skills de terceros, no toqué tu CRM ni `growth-studio`.

---

## Parte 6 — Lo que falta, sin adornos

1. **El verificador no está conectado a nada.** Se ejecuta a mano desde la terminal. Si nadie lo ejecuta, no protege nada.
2. **No hay remoto de git.** Todo esto vive solo en tu disco. Si el disco falla, se pierde.
3. **Falta el sistema 5 por identificar** antes de grabar ese video.
4. **Falta la licencia de Chatwoot** antes de venderlo.
5. **Cero piezas reales generadas.** El verificador está probado con fixtures, no con un guion tuyo de verdad. El primer guion que pases por él es la prueba real.
6. **El punto ciego de BR-005 sigue ahí:** una promesa sin cifra puede pasar el filtro.
7. **No sé si esto te sirve.** Puede que prefieras no usar un verificador y confiar en tu criterio. Eso también es válido y es tu decisión.

---

## Resumen en cinco líneas

1. **No instalé ningún repo.** Solo los investigué.
2. **Lo que construimos es un verificador**, no un generador de guiones. Tu `monoga-guionista` sigue siendo el que escribe.
3. **Verifica que un guion no afirme cosas que no puedes respaldar**, con 90 pruebas que lo demuestran.
4. **Tu contexto de marca está escrito y validado**, sacado de tu propio material, con lo histórico marcado como no usar.
5. **De los 5 repos, tienes uno: HyperFrames.** Por eso el primer video es ese.
