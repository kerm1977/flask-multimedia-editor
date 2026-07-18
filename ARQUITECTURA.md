# ARQUITECTURA DEL EDITOR DE MEDIOS — Referencia técnica completa

## REPOSITORIO
- GitHub: https://github.com/kerm1977/flask-multimedia-editor.git
- Rama: main
- Último commit blindado: 8a9cc07

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
- Mute controlado por botón de mute de cada track
- Ocultar controlado por botón de ojo de cada track

### Botón ocultar track 1 (ojo)
- `multiVideoPreview.js` fuerza `opacity:0 !important` + `muted = true`
- Usa `setProperty('opacity', '0', 'important')` para sobrescribir código blindado
- Al restaurar: `removeProperty('opacity')` → código blindado retoma control
- **NUNCA** tocar opacity del video-player cuando track 1 NO está oculto

---

## 3. ARCHIVOS BLINDADOS Y SUS RESPONSABILIDADES

### `static/js/timeline/multiVideoPreview.js`
- **Función**: Overlays para tracks 2+, visibilidad del video-player
- **Variables globales**: `overlayState`, `track1WasHidden`
- **Funciones**: `initMultiVideoPreview()`, `syncOverlays()`, `loadOverlayVideo()`, `clearOverlay()`, `isTrackHidden()`, `mainLoop()`
- **Reglas críticas**:
  - NO redeclarar `PIXELS_PER_SECOND` (const en otro archivo)
  - NO tocar opacity del video-player excepto cuando track 1 está oculto
  - NO crear overlay para video-track (track 1)
  - Overlays `muted = false` por defecto

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
- **Función**: Botones de mute y ocultar por pista
- **Funciones**: `initTrackControls()`, `addControlsToTrackRow()`, `toggleMute()`, `toggleHide()`
- **Reglas críticas**:
  - Mute track 1 → `videoPlayer.muted`
  - Mute track 2+ → `overlayState[trackId].videoEl.muted`
  - NO manipular `videoPlayer.style.opacity` directamente
  - Independencia total entre tracks

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

### `static/js/timeline/timelineUndoRedo.js`
- **Función**: Undo/redo del timeline
- **Funciones**: `saveTimelineState()`, `performTimelineUndo()`, `performTimelineRedo()`
- **Atajos**: Ctrl+Z (undo), Ctrl+Shift+Z (redo)

### `static/js/preview/previewControls.js`
- **Función**: Inyecta controles del previsualizador dinámicamente
- **Controles**: `#btn-play-pause`, `#video-progress`, `#video-progress-bar`, `#video-current-time`, `#video-duration`, `#btn-volume`, `#btn-speed`
- **Host**: `#preview-controls-host` (vacío en HTML, llenado por JS)
- **Reglas críticas**:
  - Debe cargarse ANTES que `videoEditor.js`
  - No duplicar HTML de controles en index.html

### `static/js/video/videoEditor.js`
- **Función**: Setup de controles de video, event listeners
- **Funciones**: `setupVideoControls()`, `setupTimeline()`, `setupEditingTools()`, `formatTime()`
- **Reglas críticas**:
  - `btn-play-pause` usa `togglePlayPause()` (mismo que barra espaciadora)
  - Retry logic: si botón no existe, reintenta cada 100ms

### `static/js/video/videoPlayer.js`
- **Función**: `loadVideoInPlayer(videoPath)` — carga video en `#video-player`
- **Reglas críticas**:
  - SOLO se llama para track 1
  - Construye URL: `'/' + videoPath`

---

## 4. ARCHIVOS ELIMINADOS (no deben volver a crearse)

- `static/js/timeline/videoTransforms.js` — duplicado de multiVideoPreview.js
- `static/js/timeline/videoTrackVisibility.js` — integrado en multiVideoPreview.js

---

## 5. ORDEN DE CARGA DE SCRIPTS (index.html)

Orden crítico (de arriba a abajo):
1. `previewControls.js` — inyecta controles del previsualizador
2. `videoPlayer.js` — `loadVideoInPlayer()`
3. `videoEditor.js` — event listeners de controles
4. `timelineShortcuts.js` — barra espaciadora
5. `timelineUndoRedo.js` — undo/redo
6. `timelinePlayhead*.js` — código blindado del playhead
7. `trackControls.js` — botones mute/ocultar
8. `autoTrackCreation.js` — creación automática de pistas
9. `multiVideoPreview.js` — overlays para tracks 2+

---

## 6. DEPENDENCIAS ENTRE ARCHIVOS

```
previewControls.js
  └── inyecta: #btn-play-pause, #video-progress, #btn-volume, #btn-speed
      └── usados por: videoEditor.js

videoEditor.js
  └── btn-play-pause click → togglePlayPause()
      └── definida en: timelineShortcuts.js
          └── llama: startTimelinePlayback() / stopTimelinePlayback()
              └── definidas en: timelinePlayhead.js (blindado)

autoTrackCreation.js
  └── intercepta addFileToTimelineByType
      └── llama loadVideoInPlayer() SOLO para track 1
      └── crea pistas via addTrackOfType() de timelineMultiTracks.js

multiVideoPreview.js
  └── crea overlays para tracks 2+
  └── controla opacity del video-player cuando track 1 oculto
  └── NO interfiere con checkPlayheadOverGap() del código blindado

trackControls.js
  └── mute track 1 → videoPlayer.muted
  └── mute track 2+ → overlayState[trackId].videoEl.muted
  └── hide → setea data-hidden, multiVideoPreview.js lo lee
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

---

## 8. CLASES CSS IMPORTANTES

| Clase | Uso |
|-------|-----|
| `.track-row` | Fila completa de pista |
| `.track-track` | Contenedor de clips |
| `.timeline-clip` | Clip individual |
| `.track-hide-btn` | Botón ocultar (data-hidden) |
| `.track-mute-btn` | Botón mute (data-muted) |
| `.track-number-badge` | Número de pista |
| `.track-label` | Etiqueta de pista |
| `.video-preview-container` | Contenedor del previsualizador |
| `.tracks-container` | Contenedor de todas las pistas |

---

## 9. DATASET ATTRIBUTES DE CLIPS

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `data-original-path` | string | Ruta del archivo original |
| `data-is-gap` | "true"/"false" | Si es un espacio vacío |
| `data-video-start-time` | string | Tiempo de inicio en el video fuente |
| `data-filename` | string | Nombre del archivo |

---

## 10. FLUJO DE REPRODUCCIÓN

1. Usuario presiona play o barra espaciadora
2. `togglePlayPause()` → `startTimelinePlayback()`
3. `isPlaying = true`, timer del playhead inicia
4. `checkPlayheadOverGap()` se ejecuta cada frame:
   - Si playhead está sobre clip real → `opacity = '1'`, seek, play
   - Si playhead está sobre gap → `opacity = '0'`, pause, mute
5. `multiVideoPreview.js mainLoop()` se ejecuta cada frame:
   - Track 1 oculto → fuerza `opacity:0 !important` + mute
   - Tracks 2+ → sincroniza overlays con playhead
6. Al pausar: `stopTimelinePlayback()`, `isPlaying = false`
