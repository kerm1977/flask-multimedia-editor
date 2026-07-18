// ============================================================================
// multiVideoPreview.js — Vista previa para pistas de video 2+
//
// Track 1 (video-track): usa el #video-player original controlado por código blindado.
// Tracks 2+ (video-track-2, etc.): overlays <video> detrás del video-player.
//
// Cuando el track 1 se oculta (botón ojo), se usa setProperty('opacity','0','important')
// para sobrescribir el opacity:1 que el código blindado setea cada frame.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiVideoPreview);
} else {
    initMultiVideoPreview();
}

var overlayState = {};
var track1WasHidden = false;

function initMultiVideoPreview() {
    // CSS para posicionar correctamente
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

    // Crear capa contenedora de overlays
    var container = document.querySelector('.video-preview-container');
    if (container) {
        var layer = document.createElement('div');
        layer.id = 'overlay-video-layer';
        container.appendChild(layer);
        console.log('Capa overlay-video-layer creada');
    } else {
        console.error('No se encontró .video-preview-container');
    }

    setTimeout(syncOverlays, 500);

    // Observar cambios en el timeline
    var tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        var observer = new MutationObserver(function() {
            setTimeout(syncOverlays, 100);
        });
        observer.observe(tracksContainer, { childList: true, subtree: true });
    }

    // Loop principal
    requestAnimationFrame(mainLoop);

    console.log('multiVideoPreview inicializado');
}

// ---------------------------------------------------------------------------
// Crear/eliminar overlays según las pistas que existen
// ---------------------------------------------------------------------------
function syncOverlays() {
    var layer = document.getElementById('overlay-video-layer');
    if (!layer) {
        console.error('syncOverlays: no existe overlay-video-layer');
        return;
    }

    // Buscar tracks 2+ (video-track-2, video-track-3, ...)
    var tracks = document.querySelectorAll('.track-track[id^="video-track-"]');
    console.log('syncOverlays: encontrados', tracks.length, 'tracks de video 2+');

    var trackIds = [];

    tracks.forEach(function(track) {
        trackIds.push(track.id);

        if (!overlayState[track.id]) {
            var videoEl = document.createElement('video');
            videoEl.style.cssText =
                'position:absolute;top:0;left:0;width:100%;height:100%;' +
                'object-fit:contain;pointer-events:none;background:transparent;';
            videoEl.muted = true;
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

    // Eliminar overlays de pistas que ya no existen
    Object.keys(overlayState).forEach(function(id) {
        if (trackIds.indexOf(id) === -1) {
            overlayState[id].videoEl.remove();
            delete overlayState[id];
            console.log('Overlay eliminado para', id);
        }
    });
}

// ---------------------------------------------------------------------------
// Cargar video en overlay
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

    var url = path;
    if (path.indexOf('/') !== 0 && path.indexOf('http') !== 0) {
        url = '/' + path;
    }

    if (state.currentSrc === url) {
        state.clip = clip;
        return;
    }

    state.videoEl.src = url;
    state.videoEl.load();
    state.currentSrc = url;
    state.clip = clip;

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
// Limpiar overlay
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
// Verificar si una pista está oculta
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
// Loop principal
// ---------------------------------------------------------------------------
function mainLoop() {
    try {
        var playhead = document.getElementById('timeline-playhead');
        var playheadLeft = playhead ? (parseInt(playhead.style.left) || 0) : 0;
        var playheadCenter = playheadLeft + 9;
        var playing = (typeof isPlaying !== 'undefined' && isPlaying);

        // === Control de visibilidad del video-player (track 1) ===
        // Usar setProperty con 'important' para sobrescribir el opacity:1
        // que el código blindado setea cada frame con style.opacity = '1'
        var vp = document.getElementById('video-player');
        var track1Hidden = isTrackHidden('video-track');

        if (vp) {
            if (track1Hidden) {
                // Forzar ocultar y silenciar
                vp.style.setProperty('opacity', '0', 'important');
                vp.style.setProperty('visibility', 'hidden', 'important');
                vp.muted = true;
                if (!track1WasHidden) {
                    console.log('Track 1 oculto y silenciado');
                    track1WasHidden = true;
                }
            } else {
                // Restaurar
                if (track1WasHidden) {
                    vp.style.removeProperty('opacity');
                    vp.style.removeProperty('visibility');
                    // Solo desmutear si el botón de mute no está activo
                    var muteBtn = document.querySelector('#video-track') || null;
                    var trackRow = vp.closest('.track-row');
                    var t1Row = document.getElementById('video-track');
                    if (t1Row) {
                        var row = t1Row.closest('.track-row');
                        var mBtn = row ? row.querySelector('.track-mute-btn') : null;
                        if (!mBtn || mBtn.dataset.muted !== 'true') {
                            vp.muted = false;
                        }
                    }
                    console.log('Track 1 visible y con audio restaurado');
                    track1WasHidden = false;
                }
            }
        }

        // === Control de overlays (tracks 2+) ===
        Object.keys(overlayState).forEach(function(trackId) {
            var state = overlayState[trackId];
            var track = document.getElementById(trackId);
            if (!track) return;

            var clips = track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])');

            // Sin clips → limpiar
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
            if (!activeClip) activeClip = clips[0];

            // Verificar botón de ocultar
            if (isTrackHidden(trackId)) {
                state.videoEl.style.opacity = '0';
                if (!state.videoEl.paused) state.videoEl.pause();
                return;
            }

            // Cargar video si cambió el clip
            if (activeClip !== state.clip || !state.videoEl.src) {
                loadOverlayVideo(trackId, activeClip);
            }

            // Mostrar overlay
            state.videoEl.style.opacity = '1';

            // Play/pause
            if (playing) {
                if (state.videoEl.src && state.videoEl.paused) {
                    state.videoEl.play().catch(function() {});
                }
            } else {
                if (!state.videoEl.paused) state.videoEl.pause();
            }

            // Seek
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

window.syncOverlays = syncOverlays;
window.syncMultiVideoTracks = syncOverlays;
