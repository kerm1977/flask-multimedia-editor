// ============================================================================
// ⚠️  ARCHIVO ÚNICO PARA TODO LO RELACIONADO CON MUTE ⚠️
//
// trackMute.js — Control de mute para todas las pistas (video y audio)
//
// Este es el ÚNICO archivo que controla el mute. Si mute falla, el problema
// está aquí. No hay lógica de mute en ningún otro archivo.
//
// Funcionalidad:
//   1. Botón .track-mute-btn en cada pista: toggle mute individual
//   2. Botón #btn-volume en previsualizador: mute global del video-player
//   3. Loop con requestAnimationFrame: enforce mute cada frame
//      (necesario porque el código blindado fuerza videoPlayer.muted = false
//       en clips, sobrescribiendo cualquier mute anterior)
//
// Tipos de pista soportados:
//   - video-track (track 1): controla #video-player.muted
//   - video-track-2, video-track-3 (tracks 2+): controla overlay videoEl.muted
//   - audio-track, audio-track-2, etc.: pausa/reanuda elementos de audio
//
// Dataset:
//   - .track-mute-btn data-muted = "true" | "false"
//   - #btn-volume data-muted = "true" | "false"
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackMute);
} else {
    initTrackMute();
}

function initTrackMute() {
    // === Botón de volumen del previsualizador (#btn-volume) ===
    // Esperar a que previewControls.js lo inyecte
    var volumeBtn = document.getElementById('btn-volume');
    if (!volumeBtn) {
        setTimeout(initTrackMute, 100);
        return;
    }

    // Clonar para remover listeners previos de videoEditor.js
    var newVolBtn = volumeBtn.cloneNode(true);
    volumeBtn.parentNode.replaceChild(newVolBtn, volumeBtn);
    newVolBtn.dataset.muted = 'false';

    newVolBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var isMuted = newVolBtn.dataset.muted === 'true';
        var newMuted = !isMuted;
        newVolBtn.dataset.muted = newMuted ? 'true' : 'false';
        newVolBtn.innerHTML = newMuted
            ? '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>'
            : '<i class="bi bi-volume-up"></i>';
        console.log('Volume btn (global):', newMuted ? 'muteado' : 'desmuteado');
    });

    // === Botones de mute por pista (.track-mute-btn) ===
    // trackControls.js crea los botones, pero el toggle lo manejamos aquí
    // Usar MutationObserver para detectar nuevos botones
    bindTrackMuteButtons();

    var observer = new MutationObserver(function() {
        bindTrackMuteButtons();
    });
    var tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        observer.observe(tracksContainer, { childList: true, subtree: true });
    }

    // === Loop de enforcement ===
    // Cada frame, forzar el estado de mute según los botones.
    // Esto es necesario porque el código blindado (timelinePlayheadCheckGap.js)
    // fuerza videoPlayer.muted = false cuando el playhead está sobre un clip,
    // sobrescribiendo cualquier mute anterior.
    requestAnimationFrame(muteEnforceLoop);

    console.log('trackMute inicializado (único archivo de mute)');
}

// ---------------------------------------------------------------------------
// Enlazar botones .track-mute-btn que no tengan listener aún
// ---------------------------------------------------------------------------
var boundMuteButtons = new Set();

function bindTrackMuteButtons() {
    var btns = document.querySelectorAll('.track-mute-btn');
    btns.forEach(function(btn) {
        if (boundMuteButtons.has(btn)) return;
        boundMuteButtons.add(btn);

        // Remover listener previo de trackControls.js clonando
        var newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        boundMuteButtons.delete(btn);
        boundMuteButtons.add(newBtn);

        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var isMuted = newBtn.dataset.muted === 'true';
            var newMuted = !isMuted;
            newBtn.dataset.muted = newMuted ? 'true' : 'false';
            newBtn.innerHTML = newMuted
                ? '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>'
                : '<i class="bi bi-volume-up"></i>';
            console.log('Mute toggle:', newBtn.dataset.trackId, newMuted);
        });
    });
}

// ---------------------------------------------------------------------------
// Loop principal: enforce mute cada frame
// Sobrescribe el muted=false que el código blindado setea en clips
// ---------------------------------------------------------------------------
function muteEnforceLoop() {
    try {
        // === Track 1 (video-track) → #video-player ===
        var vp = document.getElementById('video-player');
        if (vp) {
            var track1Muted = isTrackMuted('video-track');
            var globalMuted = isGlobalMuted();
            // También silenciar si el track está oculto
            var track1Hidden = isTrackHiddenFlag('video-track');
            vp.muted = track1Muted || globalMuted || track1Hidden;
        }

        // === Tracks 2+ (video-track-2, etc.) → overlays ===
        if (typeof overlayState !== 'undefined') {
            Object.keys(overlayState).forEach(function(trackId) {
                if (overlayState[trackId] && overlayState[trackId].videoEl) {
                    var trackMuted = isTrackMuted(trackId);
                    var trackHidden = isTrackHiddenFlag(trackId);
                    overlayState[trackId].videoEl.muted = trackMuted || globalMuted || trackHidden;
                }
            });
        }

        // === Audio tracks → pausar/reanudar ===
        var audioTracks = document.querySelectorAll('.track-track[id^="audio-track"]');
        audioTracks.forEach(function(track) {
            var trackMuted = isTrackMuted(track.id);
            var trackHidden = isTrackHiddenFlag(track.id);
            if (trackMuted || globalMuted || trackHidden) {
                // Pausar audios de esta pista
                if (typeof window.setTrackMuted === 'function') {
                    window.setTrackMuted(track.id, true);
                }
            } else {
                if (typeof window.setTrackMuted === 'function') {
                    window.setTrackMuted(track.id, false);
                }
            }
        });
    } catch (err) {
        // Silenciar errores para no romper el loop
    }

    requestAnimationFrame(muteEnforceLoop);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isTrackMuted(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return false;
    var row = track.closest('.track-row');
    if (!row) return false;
    var muteBtn = row.querySelector('.track-mute-btn');
    if (!muteBtn) return false;
    return muteBtn.dataset.muted === 'true';
}

function isTrackHiddenFlag(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return false;
    var row = track.closest('.track-row');
    if (!row) return false;
    var hideBtn = row.querySelector('.track-hide-btn');
    if (!hideBtn) return false;
    return hideBtn.dataset.hidden === 'true';
}

function isGlobalMuted() {
    var volBtn = document.getElementById('btn-volume');
    if (!volBtn) return false;
    return volBtn.dataset.muted === 'true';
}
