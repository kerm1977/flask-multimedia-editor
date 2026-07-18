# ARQUITECTURA DEL EDITOR DE MEDIOS — Referencia técnica completa

## REPOSITORIO
- GitHub: https://github.com/kerm1977/flask-multimedia-editor.git
- Rama: main
- Último commit: 621830b

---

## 1. ESTRUCTURA DE PISTAS (TIMELINE)

### Tipos de pista
- **Solo 2 tipos**: `video` y `audio`
- NO existen pistas de imágenes ni efectos
- Imágenes, GIFs, efectos y todo lo que no sea audio → va a pistas de video
- Máximo 3 pistas por tipo (`MAX_TRACKS_PER_TYPE = 3`)

### IDs de pistas
- Track 1 video: `video-track`
- Track 2 video: `video-track-2`
- Track 3 video: `video-track-3`
- Track 1 audio: `audio-track`
- Track 2 audio: `audio-track-2`
- Track 3 audio: `audio-track-3`

### Estructura DOM
```
.track-row
  ├── .track-number-badge
  ├── .track-controls-btns
  │     ├── .track-mute-btn (data-muted, data-track-id)
  │     └── .track-hide-btn (data-hidden, data-track-id)
  ├── .track-label
  └── .track-track (id="video-track" | "audio-track" | "video-track-2" etc.)
        └── .timeline-clip (data-original-path, data-is-gap, data-video-start-time, style.left, style.width)
```

---

## 2. ARQUITECTURA MULTI-VIDEO (Capas visuales)

### Elementos del previsualizador
- `#video-player`: `<video>` original del HTML, controlado por código blindado
- `#overlay-video-layer`: `<div>` creado dinámicamente por `multiVideoPreview.js`
- Contenedor: `.video-preview-container`
- Host de controles: `#preview-controls-host` (vacío, llenado por `previewControls.js`)

### Jerarquía z-index
- `#video-player`: z-index **2** (siempre encima)
- `#overlay-video-layer`: z-index **1** (detrás del video-player)
- Los overlays se ven cuando el video-player está oculto (botón ojo o gap)

### Track 1 (video-track)
- Usa el `#video-player` original
- Código blindado controla: src, opacity, play/pause, seek
- `loadVideoInPlayer(path)` SOLO se llama para track 1
- Gaps: código blindado setea `opacity = '0'` (corte negro)
- Clips: código blindado setea `opacity = '1'`

### Tracks 2+ (video-track-2, video-track-3)
- Cada track tiene un `<video>` overlay en `#overlay-video-layer`
- `overlayState[trackId] = { videoEl, clip, currentSrc }`
- Audio independiente: `muted = false` por defecto
- Mute controlado por `trackMute.js` (único archivo de mute)
- Ocultar controlado por botón de ojo de cada track

### Botón ocultar track 1 (ojo)
- `multiVideoPreview.js` fuerza `opacity:0 !important`
- Usa `setProperty('opacity', '0', 'important')` para sobrescribir código blindado
- Al restaurar: `removeProperty('opacity')` → código blindado retoma control
- **NUNCA** tocar opacity del video-player cuando track 1 NO está oculto
- Mute NO se maneja aquí → `trackMute.js` maneja todo el mute

---

## 3. ARCHIVOS Y SUS RESPONSABILIDADES

### `static/js/preview/previewControls.js`
- **Función**: Inyecta controles del previsualizador dinámicamente en `#preview-controls-host`
- **Controles que crea**:
  - `#btn-play-pause`: `<button>` circular, play/pause
  - `#video-progress`: `<div class="progress">`, barra de progreso
  - `#video-progress-bar`: `<div class="progress-bar">`, barra interior
  - `#video-current-time`: `<small>`, tiempo actual
  - `#video-duration`: `<small>`, duración total
  - `#btn-volume`: `<i class="bi bi-volume-up">`, icono de mute (sin botón, solo icono)
  - `#btn-speed`: `<i class="bi bi-speedometer2">`, icono de velocidad (sin botón, solo icono)
- **Depende de**: Ningún archivo (se carga primero)
- **Usado por**: `videoEditor.js` (event listeners), `trackMute.js` (btn-volume), `playbackSpeed.js` (btn-speed)
- **Reglas críticas**:
  - Debe cargarse ANTES que `videoEditor.js`, `trackMute.js`, `playbackSpeed.js`
  - No duplicar HTML de controles en index.html
  - `#btn-volume` y `#btn-speed` son `<i>` (iconos), NO `<button>`

### `static/js/preview/previewResizer.js`
- **Función**: Redimensionamiento vertical del previsualizador
- **Crea**: `#preview-resizer` (divisor arrastrable entre preview y timeline)
- **Controla**: `.video-preview-container` height (min 150px, max 800px)
- **Eventos**: mousedown/mousemove/mouseup + touchstart/touchmove/touchend
- **Depende de**: `#video-preview-panel`, `.video-preview-container`

### `static/js/timeline/trackMute.js` — **ÚNICO ARCHIVO DE MUTE**
- **Función**: Control de mute para todas las pistas (video y audio)
- **Si mute falla, el problema está aquí. No hay mute en ningún otro archivo.**
- **Controla**:
  - `#btn-volume` (previsualizador): event delegation en `document`, llama `toggleTrackMute('video-track')`
  - `.track-mute-btn` (cada pista): event delegation + MutationObserver, llama `toggleTrackMute(trackId)`
- **Funciones**:
  - `initTrackMute()`: inicializa event delegation y MutationObserver
  - `toggleTrackMute(trackId)`: toggle mute de una pista, sincroniza `#btn-volume` si es track 1
  - `syncVolumeButton(isMuted)`: cambia clase del `<i>` (`bi-volume-up` ↔ `bi-volume-mute`)
  - `muteEnforceLoop()`: requestAnimationFrame loop, enforce mute cada frame
  - `isTrackMuted(trackId)`: lee `.track-mute-btn` `data-muted`
  - `isTrackHiddenFlag(trackId)`: lee `.track-hide-btn` `data-hidden`
- **Depende de**:
  - `#btn-volume` (creado por `previewControls.js`)
  - `.track-mute-btn` (creado por `trackControls.js`)
  - `overlayState` (definida en `multiVideoPreview.js`)
  - `window.setTrackMuted()` (definida en `audioPlaybackSync.js`)
- **Reglas críticas**:
  - NO hay mute en `trackControls.js`, `videoEditor.js`, ni `multiVideoPreview.js`
  - El loop `muteEnforceLoop` es necesario porque el código blindado fuerza `videoPlayer.muted = false`
  - `#btn-volume` es un `<i>`, usar `className` no `innerHTML`

### `static/js/timeline/splitClip.js`
- **Función**: Dividir clip en el punto del playhead
- **Controla**: `#btn-split` (barra de herramientas) + tecla **X**
- **Funciones**:
  - `initSplitClip()`: enlaza `#btn-split` (clona para remover alert de `videoEditor.js`) + keydown X
  - `splitClipAtPlayhead()`: valida clip seleccionado, delega en `cutSelectedClipAtPlayhead()`
- **Depende de**:
  - `cutSelectedClipAtPlayhead()` (BLINDADO, en `timelinePlayheadCut.js`)
  - `.timeline-clip.selected` (selección de clip)
  - `#timeline-playhead` (posición del playhead)
- **Reglas críticas**:
  - Solo funciona sobre clip seleccionado, no gaps
  - El playhead debe estar dentro del clip

### `static/js/timeline/deleteClip.js`
- **Función**: Eliminar clip seleccionado
- **Controla**: `#btn-delete` (barra de herramientas)
- **Funciones**:
  - `initDeleteClip()`: enlaza `#btn-delete` (clona para remover alert de `videoEditor.js`)
  - `deleteClipAction()`: valida clip seleccionado, delega en `deleteSelectedClip()`
- **Depende de**:
  - `deleteSelectedClip()` (BLINDADO, en `timelinePlayheadDelete.js`)
  - `.timeline-clip.selected` (selección de clip)
- **Reglas críticas**:
  - La tecla **D** ya funciona desde `timelinePlayheadInit.js` (código blindado)
  - `#btn-delete` y tecla D usan la misma función blindada

### `static/js/timeline/playbackSpeed.js`
- **Función**: Control de velocidad de reproducción
- **Controla**: `#btn-speed` (previsualizador) + `#btn-speed-control` (barra de herramientas)
- **Velocidades**: 0.25, 0.50, 0.75, 1.0, 1.25, 1.50, 1.75, 2.0, 2.5, 3.0
- **Funciones**:
  - `initPlaybackSpeed()`: enlaza ambos botones con `bindSpeedButton()`
  - `bindSpeedButton(btn)`: clona botón, agrega click (cyclear) + contextmenu (menú)
  - `applyPlaybackSpeed(speed)`: aplica a `#video-player` y overlays
  - `updateAllSpeedLabels()`: actualiza texto de `#btn-speed` (textContent) y `#btn-speed-control` (innerHTML)
  - `showSpeedMenu(x, y, btn)`: menú contextual con todas las velocidades
- **Depende de**:
  - `#btn-speed` (creado por `previewControls.js`, es un `<i>`)
  - `#btn-speed-control` (en HTML, es un `<button>`)
  - `overlayState` (definida en `multiVideoPreview.js`)
- **Reglas críticas**:
  - Ambos botones comparten `currentSpeedIndex` (misma velocidad)
  - `#btn-speed` es `<i>` → usar `textContent`
  - `#btn-speed-control` es `<button>` → usar `innerHTML`
  - Removido de `videoEditor.js`: no mostrar alert

### `static/js/timeline/multiVideoPreview.js`
- **Función**: Overlays para tracks 2+, visibilidad del video-player (opacity)
- **Variables globales**: `overlayState`, `track1WasHidden`
- **Funciones**: `initMultiVideoPreview()`, `syncOverlays()`, `loadOverlayVideo()`, `clearOverlay()`, `isTrackHidden()`, `mainLoop()`
- **Depende de**: `#video-player`, `#overlay-video-layer`, `.track-track[id^="video-track-"]`
- **Reglas críticas**:
  - NO redeclarar `PIXELS_PER_SECOND` (const en `autoTrackCreation.js`)
  - NO tocar opacity del video-player excepto cuando track 1 está oculto
  - NO crear overlay para `video-track` (track 1)
  - NO tocar `muted` → `trackMute.js` maneja todo el mute
  - Overlays `muted` controlado por `trackMute.js`

### `static/js/timeline/autoTrackCreation.js`
- **Función**: Creación automática de pistas, interceptación de `addFileToTimelineByType`
- **Variables globales**: `PIXELS_PER_SECOND` (const = 10)
- **Funciones**: `initAutoTrackCreation()`, `findFirstEmptyTrack()`, `createNewAutoTrack()`, `findLastTrackOfType()`, `getEndOfLastClip()`, `addClipDirectly()`, `findNearestFreeSpace()`
- **Reglas críticas**:
  - `loadVideoInPlayer()` SOLO para track 1 (`video-track`)
  - Todo lo que no es audio → pistas de video
  - Máximo 3 pistas por tipo

### `static/js/timeline/timelineMultiTracks.js`
- **Función**: Gestión de pistas adicionales, menú contextual, botón +
- **Constantes**: `MAX_TRACKS_PER_TYPE = 3`, `TRACK_TYPES = { video, audio }`
- **Variables globales**: `trackCounters = { video: 1, audio: 1 }`
- **Funciones**: `initTimelineMultiTracks()`, `addTrackOfType()`, `removeTrack()`, `showDeleteTrackModal()`
- **Reglas críticas**:
  - `trackCounters[type]` DECREMENTA al eliminar pista
  - Solo video y audio en `TRACK_TYPES`

### `static/js/timeline/trackControls.js`
- **Función**: Crear botones de mute y ocultar por pista (UI solamente)
- **Funciones**: `initTrackControls()`, `addControlsToTrackRow()`, `toggleHide()`
- **NO contiene**: `toggleMute()` (eliminada, ahora en `trackMute.js`)
- **Crea**: `.track-mute-btn` (data-muted, data-track-id), `.track-hide-btn` (data-hidden, data-track-id)
- **Reglas críticas**:
  - NO manipular `videoPlayer.style.opacity` directamente
  - Mute: delegado a `trackMute.js`
  - Hide: `toggleHide()` setea `data-hidden`, `multiVideoPreview.js` lo lee

### `static/js/library/libraryTimeline.js`
- **Función**: Drag & drop y doble-click desde biblioteca
- **Funciones**: `initTimelineDropZones()`, `addClipToTimeline()`, `addFileToTimelineByType()`
- **Reglas críticas**:
  - `loadVideoInPlayer()` SOLO si target es `video-track`
  - Todo lo no-audio → `video-track`
  - Solo `video-track` y `audio-track` en drop zones

### `static/js/timeline/timelineShortcuts.js`
- **Función**: Barra espaciadora para play/pause
- **Funciones**: `togglePlayPause()`
- **Reglas críticas**:
  - Delega en `startTimelinePlayback()` / `stopTimelinePlayback()`
  - NO llamar `videoPlayer.play()/pause()` directamente

### `static/js/timeline/timelinePlayhead.js` (BLINDADO)
- **Función**: Núcleo del playhead, sincronización video-timeline
- **Variables globales**: `isPlaying`, `currentClip`
- **Funciones**: `startTimelinePlayback()`, `stopTimelinePlayback()`, `checkPlayheadOverGap()`, `seekVideoToClipSegment()`
- **Reglas críticas**:
  - `checkPlayheadOverGap()` controla opacity del video-player en gaps
  - Gap → `opacity = '0'`, clip → `opacity = '1'`
  - NO forzar `videoPlayer.currentTime` en cada frame

### `static/js/timeline/playhead/timelinePlayheadCheckGap.js` (BLINDADO)
- **Función**: Detección de gaps (espacios vacíos) en track 1
- **Reglas críticas**:
  - Gap → pausa, mute, `opacity = '0'` (corte negro)
  - Clip → `opacity = '1'`, seek al segmento
  - No modificar

### `static/js/timeline/playhead/timelinePlayheadCut.js` (BLINDADO)
- **Función**: Cortar/dividir clip en posición del playhead
- **Función principal**: `cutSelectedClipAtPlayhead()`
- **Llamada por**: `splitClip.js` (botón + tecla X)
- **Reglas críticas**: No modificar

### `static/js/timeline/playhead/timelinePlayheadDelete.js` (BLINDADO)
- **Función**: Eliminar clip seleccionado, reemplaza por gap
- **Función principal**: `deleteSelectedClip()`
- **Llamada por**: `deleteClip.js` (botón), `timelinePlayheadInit.js` (tecla D)
- **Reglas críticas**: No modificar

### `static/js/timeline/playhead/timelinePlayheadInit.js` (BLINDADO)
- **Función**: Inicialización del playhead + atajos de teclado
- **Atajos**: X (cortar), D (eliminar), W (remover gaps)
- **Reglas críticas**: No modificar

### `static/js/timeline/timelineUndoRedo.js`
- **Función**: Undo/redo del timeline
- **Funciones**: `saveTimelineState()`, `performTimelineUndo()`, `performTimelineRedo()`
- **Atajos**: Ctrl+Z (undo), Ctrl+Shift+Z (redo)

### `static/js/video/videoEditor.js`
- **Función**: Setup de controles de video, event listeners
- **Funciones**: `setupVideoControls()`, `setupTimeline()`, `setupEditingTools()`, `formatTime()`
- **Reglas críticas**:
  - `btn-play-pause` usa `togglePlayPause()` (mismo que barra espaciadora)
  - Retry logic: si botón no existe, reintenta cada 100ms
  - NO maneja mute (delegado a `trackMute.js`)
  - NO maneja speed (delegado a `playbackSpeed.js`)
  - NO maneja split (delegado a `splitClip.js`)
  - NO maneja delete (delegado a `deleteClip.js`)
  - `setupEditingTools` solo muestra alerts para: trim, volume-control, text, sticker, filter, transition, music, voiceover, export

### `static/js/video/videoPlayer.js`
- **Función**: `loadVideoInPlayer(videoPath)` — carga video en `#video-player`
- **Reglas críticas**:
  - SOLO se llama para track 1
  - Construye URL: `'/' + videoPath`

### `static/js/timeline/audioPlaybackSync.js`
- **Función**: Sincronización de audio con playhead
- **Función pública**: `window.setTrackMuted(trackId, muted)` — usada por `trackMute.js`
- **Reglas críticas**:
  - `setTrackMuted` pausa/reanuda elementos de audio de la pista

---

## 4. ARCHIVOS ELIMINADOS (no deben volver a crearse)

- `static/js/timeline/videoTransforms.js` — duplicado de multiVideoPreview.js
- `static/js/timeline/videoTrackVisibility.js` — integrado en multiVideoPreview.js

---

## 5. ORDEN DE CARGA DE SCRIPTS (index.html)

Orden crítico (de arriba a abajo):
1. `previewControls.js` — inyecta controles del previsualizador
2. `previewResizer.js` — divisor arrastrable del previsualizador
3. `videoPlayer.js` — `loadVideoInPlayer()`
4. `videoEditor.js` — event listeners de controles (play, progress)
5. `timelineShortcuts.js` — barra espaciadora
6. `timelineUndoRedo.js` — undo/redo
7. `timelinePlayhead*.js` — código blindado del playhead (X, D, W)
8. `trackControls.js` — crea botones mute/ocultar (UI)
9. `trackMute.js` — **ÚNICO archivo de mute** (event delegation + enforcement loop)
10. `autoTrackCreation.js` — creación automática de pistas
11. `multiVideoPreview.js` — overlays para tracks 2+
12. `splitClip.js` — botón dividir + tecla X
13. `deleteClip.js` — botón eliminar
14. `playbackSpeed.js` — control de velocidad (btn-speed + btn-speed-control)

---

## 6. DEPENDENCIAS ENTRE ARCHIVOS

```
previewControls.js
  └── inyecta: #btn-play-pause, #video-progress, #btn-volume (<i>), #btn-speed (<i>)
      ├── #btn-play-pause → usado por videoEditor.js
      ├── #btn-volume → usado por trackMute.js (event delegation)
      └── #btn-speed → usado por playbackSpeed.js

videoEditor.js
  └── btn-play-pause click → togglePlayPause()
      └── definida en: timelineShortcuts.js
          └── llama: startTimelinePlayback() / stopTimelinePlayback()
              └── definidas en: timelinePlayhead.js (blindado)

trackMute.js (ÚNICO archivo de mute)
  ├── #btn-volume click → toggleTrackMute('video-track')
  ├── .track-mute-btn click → toggleTrackMute(trackId)
  ├── muteEnforceLoop() → cada frame:
  │     ├── video-player.muted = isTrackMuted('video-track') || isTrackHidden
  │     ├── overlayState[trackId].videoEl.muted = isTrackMuted || isTrackHidden
  │     └── window.setTrackMuted(trackId, muted) para audio tracks
  └── syncVolumeButton() → cambia clase del <i> (#btn-volume)

splitClip.js
  └── #btn-split click / tecla X → splitClipAtPlayhead()
      └── delega en: cutSelectedClipAtPlayhead() (BLINDADO)

deleteClip.js
  └── #btn-delete click → deleteClipAction()
      └── delega en: deleteSelectedClip() (BLINDADO)
      (tecla D ya funciona desde timelinePlayheadInit.js)

playbackSpeed.js
  ├── #btn-speed click → cyclear velocidades
  ├── #btn-speed-control click → cyclear velocidades (mismo estado)
  └── applyPlaybackSpeed() → video-player.playbackRate + overlays.playbackRate

autoTrackCreation.js
  └── intercepta addFileToTimelineByType
      └── llama loadVideoInPlayer() SOLO para track 1
      └── crea pistas via addTrackOfType() de timelineMultiTracks.js

multiVideoPreview.js
  └── crea overlays para tracks 2+
  └── controla opacity del video-player cuando track 1 oculto
  └── NO controla mute (trackMute.js lo hace)
  └── NO interfiere con checkPlayheadOverGap() del código blindado

trackControls.js
  └── crea .track-mute-btn y .track-hide-btn (UI)
  └── toggleHide() → setea data-hidden
  └── NO tiene toggleMute() (eliminada, está en trackMute.js)
```

---

## 7. CONSTANTES Y VARIABLES GLOBALES

| Variable | Valor | Definida en |
|----------|-------|-------------|
| `PIXELS_PER_SECOND` | 10 | autoTrackCreation.js (const) |
| `MAX_TRACKS_PER_TYPE` | 3 | timelineMultiTracks.js (const) |
| `TRACK_TYPES` | { video, audio } | timelineMultiTracks.js (const) |
| `trackCounters` | { video: 1, audio: 1 } | timelineMultiTracks.js |
| `isPlaying` | boolean | timelinePlayhead.js |
| `currentClip` | HTMLElement \| null | timelinePlayhead.js |
| `overlayState` | {} | multiVideoPreview.js |
| `track1WasHidden` | boolean | multiVideoPreview.js |
| `SPEED_LEVELS` | [0.25...3.0] | playbackSpeed.js |
| `currentSpeedIndex` | 3 (1.0) | playbackSpeed.js |
| `boundMuteButtons` | Set | trackMute.js |

---

## 8. CLASES CSS IMPORTANTES

| Clase | Uso | Creada por |
|-------|-----|------------|
| `.track-row` | Fila completa de pista | HTML/timelineMultiTracks.js |
| `.track-track` | Contenedor de clips | HTML/timelineMultiTracks.js |
| `.timeline-clip` | Clip individual | autoTrackCreation.js/libraryTimeline.js |
| `.timeline-clip.selected` | Clip seleccionado | timelineSelectTrack.js |
| `.track-hide-btn` | Botón ocultar (data-hidden) | trackControls.js |
| `.track-mute-btn` | Botón mute (data-muted) | trackControls.js |
| `.track-controls-btns` | Contenedor de botones mute/ocultar | trackControls.js |
| `.track-number-badge` | Número de pista | trackControls.js |
| `.track-label` | Etiqueta de pista | HTML |
| `.video-preview-container` | Contenedor del previsualizador | HTML |
| `.video-controls-bar` | Barra de controles del preview | previewControls.js |
| `.tracks-container` | Contenedor de todas las pistas | HTML |
| `.timeline-container` | Contenedor del timeline | HTML |
| `.time-ruler` | Regla de tiempo | HTML |
| `.draggable-panel` | Panel arrastrable | HTML |

---

## 9. IDs IMPORTANTES

| ID | Elemento | Creado por |
|----|----------|------------|
| `video-player` | `<video>` track 1 | HTML |
| `video-preview-panel` | Panel del previsualizador | HTML |
| `preview-controls-host` | Host de controles (vacío) | HTML |
| `preview-resizer` | Divisor arrastrable | previewResizer.js |
| `btn-play-pause` | Botón play/pause | previewControls.js |
| `btn-volume` | Icono mute (`<i>`) | previewControls.js |
| `btn-speed` | Icono velocidad (`<i>`) | previewControls.js |
| `video-progress` | Barra de progreso | previewControls.js |
| `video-progress-bar` | Barra interior | previewControls.js |
| `video-current-time` | Tiempo actual | previewControls.js |
| `video-duration` | Duración total | previewControls.js |
| `btn-split` | Botón dividir | HTML |
| `btn-delete` | Botón eliminar | HTML |
| `btn-speed-control` | Botón velocidad (toolbar) | HTML |
| `btn-trim` | Botón recortar | HTML |
| `btn-volume-control` | Botón volumen (toolbar) | HTML |
| `timeline-playhead` | Playhead del timeline | timelinePlayheadInit.js |
| `video-track` | Track 1 video | HTML |
| `audio-track` | Track 1 audio | HTML |
| `overlay-video-layer` | Capa de overlays | multiVideoPreview.js |
| `library-panel` | Panel de biblioteca | HTML |
| `timeline-panel` | Panel de timeline | HTML |

---

## 10. DATASET ATTRIBUTES

### Clips (.timeline-clip)
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `data-original-path` | string | Ruta del archivo original |
| `data-is-gap` | "true"/"false" | Si es un espacio vacío |
| `data-video-start-time` | string | Tiempo de inicio en el video fuente |
| `data-video-end-time` | string | Tiempo de fin en el video fuente |
| `data-filename` | string | Nombre del archivo |

### Botones de mute (.track-mute-btn)
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `data-muted` | "true"/"false" | Estado de mute |
| `data-track-id` | string | ID de la pista |

### Botones de ocultar (.track-hide-btn)
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `data-hidden` | "true"/"false" | Estado de oculto |
| `data-track-id` | string | ID de la pista |

### Icono de volumen (#btn-volume)
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `data-muted` | "true"/"false" | Estado de mute (sincronizado con track 1) |

---

## 11. FLUJO DE REPRODUCCIÓN

1. Usuario presiona play o barra espaciadora
2. `togglePlayPause()` → `startTimelinePlayback()`
3. `isPlaying = true`, timer del playhead inicia
4. `checkPlayheadOverGap()` se ejecuta cada frame (BLINDADO):
   - Si playhead está sobre clip real → `opacity = '1'`, seek, play
   - Si playhead está sobre gap → `opacity = '0'`, pause, mute
5. `multiVideoPreview.js mainLoop()` se ejecuta cada frame:
   - Track 1 oculto → fuerza `opacity:0 !important`
   - Tracks 2+ → sincroniza overlays con playhead
6. `trackMute.js muteEnforceLoop()` se ejecuta cada frame:
   - Enforce mute según `.track-mute-btn` data-muted
   - Sincroniza `#btn-volume` con track 1
7. Al pausar: `stopTimelinePlayback()`, `isPlaying = false`

---

## 12. FLUJO DE MUTE

1. Usuario click en `.track-mute-btn` o `#btn-volume`
2. `toggleTrackMute(trackId)` → toggle `data-muted`, cambia icono
3. Si es track 1 → `syncVolumeButton()` sincroniza `#btn-volume`
4. `muteEnforceLoop()` cada frame:
   - Track 1: `vp.muted = isTrackMuted || isTrackHidden`
   - Tracks 2+: `overlayState[trackId].videoEl.muted = isTrackMuted || isTrackHidden`
   - Audio: `window.setTrackMuted(trackId, muted)`
5. El loop es necesario porque el código blindado fuerza `vp.muted = false` en clips

---

## 13. FLUJO DE DIVIDIR (SPLIT)

1. Usuario presiona botón `#btn-split` o tecla **X**
2. `splitClipAtPlayhead()` valida:
   - Hay clip seleccionado (`.timeline-clip.selected`)
   - No es gap (`data-is-gap !== 'true'`)
   - Playhead dentro del clip
3. Delega en `cutSelectedClipAtPlayhead()` (BLINDADO)
4. El código blindado divide el clip en dos, recalcula `videoStartTime/videoEndTime`

---

## 14. FLUJO DE ELIMINAR (DELETE)

1. Usuario presiona botón `#btn-delete` o tecla **D**
2. `deleteClipAction()` o `deleteSelectedClip()` (BLINDADO)
3. Reemplaza el clip por un gap invisible
4. Si era track 1: código blindado detecta gap → `opacity = '0'`
5. Si era track 2+: `multiVideoPreview.js` detecta que no hay clips → limpia overlay

---

## 15. FLUJO DE VELOCIDAD

1. Usuario click en `#btn-speed` o `#btn-speed-control`
2. `currentSpeedIndex` cyclea al siguiente valor
3. `applyPlaybackSpeed(speed)`:
   - `#video-player.playbackRate = speed`
   - `overlayState[trackId].videoEl.playbackRate = speed` (tracks 2+)
4. `updateAllSpeedLabels()`:
   - `#btn-speed` (es `<i>`): `textContent = ' ' + speed + 'x'`
   - `#btn-speed-control` (es `<button>`): `innerHTML = '<i>...</i> ' + speed + 'x'`
5. Click derecho: `showSpeedMenu()` muestra menú con todas las velocidades
