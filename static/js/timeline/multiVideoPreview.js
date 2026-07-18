// ============================================================================
// ⚠️  ARCHIVO BLINDADO — NO MODIFICAR SIN LEER TODOS LOS COMENTARIOS ⚠️
//
// multiVideoPreview.js — Vista previa multi-video para pistas de video 2+
//
// ============================================================================
// ARQUITECTURA GENERAL (leer antes de modificar):
// ============================================================================
//
// 1. TRACK 1 (video-track):
//    - Usa el <video id="video-player"> original del HTML.
//    - El código blindado (timelinePlayhead.js / timelinePlayheadCheckGap.js)
//      controla SU src, opacity, play/pause y seek.
//    - Ese código blindado maneja GAPS: si el playhead está sobre un espacio
//      vacío, setea videoPlayer.style.opacity = '0' (corte negro).
//      Si está sobre un clip real, setea opacity = '1'.
//    - NUNCA debemos tocar el opacity del video-player EXCEPTO cuando el
//      track 1 está explícitamente oculto con el botón ojo.
//
// 2. TRACKS 2+ (video-track-2, video-track-3, etc.):
//    - Cada uno tiene un <video> overlay en #overlay-video-layer.
//    - Los overlays están posicionados DETRÁS del video-player (z-index 1 vs 2).
//    - Cada overlay tiene audio INDEPENDIENTE (muted = false por defecto).
//    - El botón de mute de cada track controla su propio overlay.
//    - El botón de ocultar de cada track oculta Y silencia su propio overlay.
//
// 3. JERARQUÍA VISUAL:
//    - #video-player: z-index 2 (siempre encima de overlays)
//    - #overlay-video-layer: z-index 1 (detrás del video-player)
//    - Cuando el track 1 se oculta (botón ojo) → video-player opacity:0
//      → los overlays se ven a través.
//    - Cuando el playhead pasa por un GAP en track 1 → el código blindado
//      setea opacity:0 en video-player → los overlays se ven.
//
// 4. REGLAS CRÍTICAS (NO ROMPER):
//    a) NO redeclarar PIXELS_PER_SECOND — ya existe como const en otro archivo.
//    b) NO setear video-player.style.opacity cuando track 1 NO está oculto.
//       El código blindado controla los gaps.
//    c) NO llamar loadVideoInPlayer() para tracks 2+. Solo track 1 usa
//       el video-player original. (Ver autoTrackCreation.js y libraryTimeline.js)
//    d) NO crear overlays para video-track (track 1). Solo video-track-2+.
//    e) Los overlays SIEMPRE muted=false por defecto. El mute se controla
//       vía el botón de mute de cada track (trackControls.js).
//    f) Solo 3 pistas máximo por tipo (MAX_TRACKS_PER_TYPE = 3).
//    g) Solo existen pistas de Video y Audio. No hay pistas de imágenes
//       ni efectos. Imágenes, GIFs y todo lo que no sea audio va a video tracks.
//
// 5. ARCHIVOS RELACIONADOS (no modificar sin coordinar):
//    - timelinePlayhead.js / timelinePlayheadCheckGap.js: código blindado que
//      controla el video-player original (src, opacity, gaps, seek).
//    - autoTrackCreation.js: intercepta addFileToTimelineByType, crea pistas
//      nuevas, solo llama loadVideoInPlayer para track 1.
//    - libraryTimeline.js: drag & drop, solo llama loadVideoInPlayer para track 1.
//    - trackControls.js: botones de mute y ocultar por pista.
//      Mute track 1 → videoPlayer.muted. Mute track 2+ → overlayState[trackId].videoEl.muted.
//    - timelineMultiTracks.js: addTrackOfType, MAX_TRACKS_PER_TYPE = 3,
//      decrementa trackCounters al eliminar pista.
//    - keyboardShortcuts.js: Ctrl+Z (undo), Ctrl+Shift+Z (redo).
//    - timelineUndoRedo.js: saveTimelineState, performTimelineUndo, performTimelineRedo.
//
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiVideoPreview);
} else {
    initMultiVideoPreview();
}

// ⚠️ NO redeclarar PIXELS_PER_SECOND — ya existe como const en otro archivo
var overlayState = {};
var track1WasHidden = false;

function initMultiVideoPreview() {
    // CSS: posicionar video-player encima (z-index:2) y overlays detrás (z-index:1)
    var css = document.createElement('style');
    css.id = 'multi-video-css';
    css.textContent =
        '#video-player {' +
            'position: absolute !important;' +
            'top: 0 !important;' +
            'left: 0 !important;' +
            'width: 100% !important;' +
            'height: 100% !important;' +
            'z-index: 2 !important;' +
            'object-fit: contain !important;' +
        '}' +
        '#overlay-video-layer {' +
            'position: absolute !important;' +
            'top: 0 !important;' +
            'left: 0 !important;' +
            'width: 100% !important;' +
            'height: 100% !important;' +
            'z-index: 1 !important;' +
            'pointer-events: none !important;' +
        '}' +
        '#overlay-video-layer video {' +
            'background: transparent !important;' +
        '}';
    document.head.appendChild(css);

    // Crear capa contenedora de overlays dentro de .video-preview-container
    var container = document.querySelector('.video-preview-container');
    if (container) {
        var layer = document.createElement('div');
        layer.id = 'overlay-video-layer';
        container.appendChild(layer);
        console.log('Capa overlay-video-layer creada');
    } else {
        console.error('No se encontró .video-preview-container');
    }

    // Sincronizar overlays después de que el DOM esté listo
    setTimeout(syncOverlays, 500);

    // Observar cambios en el timeline (nuevas pistas, clips agregados/eliminados)
    var tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        var observer = new MutationObserver(function() {
            setTimeout(syncOverlays, 100);
        });
        observer.observe(tracksContainer, { childList: true, subtree: true });
    }

    // Loop principal: sincronizar reproducción, seek y visibilidad
    requestAnimationFrame(mainLoop);

    console.log('multiVideoPreview inicializado');
}

// ---------------------------------------------------------------------------
// syncOverlays: Crear/eliminar overlays según las pistas que existen
// Solo maneja tracks 2+ (video-track-2, video-track-3, ...)
// NO crea overlay para video-track (track 1) — ese usa el video-player original
// ---------------------------------------------------------------------------
function syncOverlays() {
    var layer = document.getElementById('overlay-video-layer');
    if (!layer) {
        console.error('syncOverlays: no existe overlay-video-layer');
        return;
    }

    // Selector: solo tracks 2+ (video-track-2, video-track-3, ...)
    // NO incluye video-track (track 1)
    var tracks = document.querySelectorAll('.track-track[id^="video-track-"]');
    console.log('syncOverlays: encontrados', tracks.length, 'tracks de video 2+');

    var trackIds = [];

    tracks.forEach(function(track) {
        trackIds.push(track.id);

        // Crear overlay si no existe para esta pista
        if (!overlayState[track.id]) {
            var videoEl = document.createElement('video');
            videoEl.style.cssText =
                'position:absolute;top:0;left:0;width:100%;height:100%;' +
                'object-fit:contain;pointer-events:none;background:transparent;';
            // ⚠️ Audio independiente: NO siempre muted. El mute se controla
            // vía el botón de mute de cada track (trackControls.js)
            videoEl.muted = false;
            videoEl.preload = 'auto';
            videoEl.playsInline = true;
            layer.appendChild(videoEl);

            overlayState[track.id] = {
                videoEl: videoEl,
                clip: null,
                currentSrc: null
            };
            console.log('Overlay creado para', track.id);
        }

        // Auto-cargar primer clip si no hay video cargado
        var state = overlayState[track.id];
        if (!state.currentSrc) {
            var clips = track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])');
            console.log(track.id, 'tiene', clips.length, 'clips');
            if (clips.length > 0) {
                loadOverlayVideo(track.id, clips[0]);
            }
        }
    });

    // Eliminar overlays de pistas que ya no existen en el DOM
    Object.keys(overlayState).forEach(function(id) {
        if (trackIds.indexOf(id) === -1) {
            overlayState[id].videoEl.remove();
            delete overlayState[id];
            console.log('Overlay eliminado para', id);
        }
    });
}

// ---------------------------------------------------------------------------
// loadOverlayVideo: Cargar un video en el overlay de una pista
// Construye la URL igual que loadVideoInPlayer: '/' + path
// ---------------------------------------------------------------------------
function loadOverlayVideo(trackId, clip) {
    var state = overlayState[trackId];
    if (!state) {
        console.warn('loadOverlayVideo: no hay state para', trackId);
        return;
    }

    var path = clip.dataset.originalPath;
    if (!path) {
        console.warn('loadOverlayVideo: clip sin originalPath', trackId, clip.dataset.filename);
        return;
    }

    // Construir URL: si no empieza con / o http, prepend /
    var url = path;
    if (path.indexOf('/') !== 0 && path.indexOf('http') !== 0) {
        url = '/' + path;
    }

    // Si ya está cargado el mismo video, solo actualizar clip
    if (state.currentSrc === url) {
        state.clip = clip;
        return;
    }

    state.videoEl.src = url;
    state.videoEl.load();
    state.currentSrc = url;
    state.clip = clip;

    // Mostrar primer frame cuando carga
    state.videoEl.addEventListener('loadeddata', function() {
        var startTime = parseFloat(clip.dataset.videoStartTime) || 0;
        try { state.videoEl.currentTime = startTime; } catch (e) {}
        console.log('Overlay video listo:', trackId, 'duración:', state.videoEl.duration);
    }, { once: true });

    state.videoEl.addEventListener('error', function() {
        console.error('Overlay video ERROR:', trackId, url);
    }, { once: true });

    console.log('Overlay cargando:', trackId, url);
}

// ---------------------------------------------------------------------------
// clearOverlay: Limpiar overlay cuando se eliminan todos los clips de una pista
// ---------------------------------------------------------------------------
function clearOverlay(trackId) {
    var state = overlayState[trackId];
    if (!state) return;
    state.videoEl.pause();
    state.videoEl.removeAttribute('src');
    state.videoEl.load();
    state.currentSrc = null;
    state.clip = null;
    state.videoEl.style.opacity = '0';
}

// ---------------------------------------------------------------------------
// isTrackHidden: Verificar si una pista está oculta (botón ojo)
// Busca .track-hide-btn con data-hidden === 'true' en el .track-row
// ---------------------------------------------------------------------------
function isTrackHidden(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return false;
    var row = track.closest('.track-row');
    if (!row) return false;
    var hideBtn = row.querySelector('.track-hide-btn');
    if (!hideBtn) return false;
    return hideBtn.dataset.hidden === 'true';
}

// ---------------------------------------------------------------------------
// mainLoop: Loop principal con requestAnimationFrame
//
// ⚠️ REGLA CRÍTICA: Solo tocamos el opacity del video-player cuando el
// track 1 está EXPLÍCITAMENTE oculto con el botón ojo.
// En TODOS los demás casos, el código blindado controla el opacity:
//   - Gap (espacio vacío): opacity = 0 (corte negro)
//   - Clip real: opacity = 1
// Si tocamos el opacity cuando no debemos, rompemos el corte en gaps.
// ---------------------------------------------------------------------------
function mainLoop() {
    try {
        var playhead = document.getElementById('timeline-playhead');
        var playheadLeft = playhead ? (parseInt(playhead.style.left) || 0) : 0;
        var playheadCenter = playheadLeft + 9;
        var playing = (typeof isPlaying !== 'undefined' && isPlaying);

        // ====================================================================
        // === CONTROL DE VISIBILIDAD DEL VIDEO-PLAYER (TRACK 1) ===
        // ====================================================================
        // Solo modificamos opacity cuando track 1 está oculto con el botón ojo.
        // Usamos setProperty('opacity', '0', 'important') porque el código blindado
        // setea videoPlayer.style.opacity = '1' cada frame (sin !important).
        // El !important inline tiene mayor prioridad que el estilo inline sin !important.
        //
        // Al restaurar (desocultar), usamos removeProperty para que el código blindado
        // vuelva a controlar el opacity normalmente (gaps, clips, etc.).
        // ====================================================================
        var vp = document.getElementById('video-player');
        var track1Hidden = isTrackHidden('video-track');

        if (vp && track1Hidden) {
            // Track 1 oculto: forzar ocultar y silenciar
            vp.style.setProperty('opacity', '0', 'important');
            vp.style.setProperty('visibility', 'hidden', 'important');
            vp.muted = true;
            if (!track1WasHidden) {
                console.log('Track 1 oculto y silenciado');
                track1WasHidden = true;
            }
        } else if (vp && !track1Hidden && track1WasHidden) {
            // Transición de oculto → visible: restaurar UNA SOLA VEZ
            vp.style.removeProperty('opacity');
            vp.style.removeProperty('visibility');
            // Solo desmutear si el botón de mute no está activo
            var t1Row = document.getElementById('video-track');
            if (t1Row) {
                var row1 = t1Row.closest('.track-row');
                var mBtn = row1 ? row1.querySelector('.track-mute-btn') : null;
                if (!mBtn || mBtn.dataset.muted !== 'true') {
                    vp.muted = false;
                }
            }
            console.log('Track 1 visible - blindado retoma control de opacity');
            track1WasHidden = false;
        }
        // ⚠️ Si track1 no está oculto y track1WasHidden es false:
        // NO hacemos NADA con el video-player. El código blindado controla gaps.

        // ====================================================================
        // === CONTROL DE OVERLAYS (TRACKS 2+) ===
        // ====================================================================
        // Cada overlay se controla de forma independiente:
        // - Si la pista está oculta → opacity:0, muted, pause
        // - Si la pista tiene mute → muted = true (pero visible)
        // - Si hay clip activo → cargar video, mostrar, play/pause, seek
        // - Si no hay clips → limpiar overlay
        // ====================================================================
        Object.keys(overlayState).forEach(function(trackId) {
            var state = overlayState[trackId];
            var track = document.getElementById(trackId);
            if (!track) return;

            var row = track.closest('.track-row');
            var clips = track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])');

            // Sin clips reales → limpiar overlay
            if (clips.length === 0) {
                if (state.currentSrc) clearOverlay(trackId);
                return;
            }

            // Buscar clip bajo el playhead
            var activeClip = null;
            for (var i = 0; i < clips.length; i++) {
                var cl = parseInt(clips[i].style.left) || 0;
                var cw = parseInt(clips[i].style.width) || 0;
                if (playheadCenter >= cl && playheadCenter <= cl + cw) {
                    activeClip = clips[i];
                    break;
                }
            }
            // Si no hay clip bajo el playhead, mostrar el primer clip
            if (!activeClip) activeClip = clips[0];

            // Verificar botón de ocultar (independiente por track)
            if (isTrackHidden(trackId)) {
                state.videoEl.style.opacity = '0';
                state.videoEl.muted = true;
                if (!state.videoEl.paused) state.videoEl.pause();
                return;
            }

            // Verificar botón de mute (independiente por track)
            var muteBtn = row.querySelector('.track-mute-btn');
            var isMuted = muteBtn && muteBtn.dataset.muted === 'true';
            state.videoEl.muted = isMuted;

            // Cargar video si cambió el clip activo
            if (activeClip !== state.clip || !state.videoEl.src) {
                loadOverlayVideo(trackId, activeClip);
            }

            // Mostrar overlay
            state.videoEl.style.opacity = '1';

            // Play/pause según estado global
            if (playing) {
                if (state.videoEl.src && state.videoEl.paused) {
                    state.videoEl.play().catch(function() {});
                }
            } else {
                if (!state.videoEl.paused) state.videoEl.pause();
            }

            // Seek al tiempo correcto basado en posición del playhead
            if (state.videoEl.duration && playhead) {
                var clipLeft = parseInt(activeClip.style.left) || 0;
                var posInClip = playheadCenter - clipLeft;
                var timeInClip = posInClip / PIXELS_PER_SECOND;
                var vidStart = parseFloat(activeClip.dataset.videoStartTime) || 0;
                var target = vidStart + timeInClip;

                if (Math.abs(state.videoEl.currentTime - target) > 0.3) {
                    try {
                        state.videoEl.currentTime = Math.max(0, Math.min(target, state.videoEl.duration));
                    } catch (e) {}
                }
            }
        });
    } catch (err) {
        console.error('mainLoop error:', err);
    }

    requestAnimationFrame(mainLoop);
}

// Exponer globalmente para uso desde otros archivos
window.syncOverlays = syncOverlays;
window.syncMultiVideoTracks = syncOverlays;
