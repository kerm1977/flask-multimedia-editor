// ============================================================================
// ⚠️  ARCHIVO ÚNICO PARA MUTE INDIVIDUAL DE PISTAS ⚠️
//
// trackMute.js — Control de mute INDIVIDUAL para cada pista (video y audio)
//
// Este archivo controla el mute INDIVIDUAL de cada pista.
// El mute GLOBAL está en globalMute.js (botón #btn-volume-control).
//
// Funcionalidad:
//   1. Botón .track-mute-btn en cada pista: toggle mute individual
//   2. Botón #btn-volume en previsualizador: mute del track 1 (video-track)
//   3. Loop con requestAnimationFrame: enforce mute cada frame
//      (necesario porque el código blindado fuerza videoPlayer.muted = false
//       en clips, sobrescribiendo cualquier mute anterior)
//
// ⚠️ INTERACCIÓN CON globalMute.js:
//   - globalMute.js puede setear TODOS los .track-mute-btn a data-muted=true
//     (muteAllTracks) o a data-muted=false (unmuteAllTracks)
//   - Al ACTIVAR mute global: todos los .track-mute-btn → data-muted=true
//   - Al DESACTIVAR mute global: todos los .track-mute-btn → data-muted=false
//   - Si el usuario desmutea un track individual, globalMute.js detecta el
//     cambio y desactiva el mute global automáticamente (sin desmutear todos)
//   - Ambos archivos comparten data-muted en .track-mute-btn
//   - NO hay conflicto: globalMute escribe data-muted solo en toggleGlobalMute()
//
// Tipos de pista soportados:
//   - video-track (track 1): controla #video-player.muted
//   - video-track-2, video-track-3 (tracks 2+): controla overlay videoEl.muted
//   - audio-track, audio-track-2, etc.: pausa/reanuda elementos de audio
//
// Dataset:
//   - .track-mute-btn data-muted = "true" | "false" (compartido con globalMute.js)
//   - #btn-volume data-muted = "true" | "false" (compartido con globalMute.js)
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackMute);
} else {
    initTrackMute();
}

function initTrackMute() {
    // === Botón de volumen del previsualizador (#btn-volume) ===
    // Usar event delegation en document para no perder el listener
    // si otro script clona/reemplaza el botón
    document.addEventListener('click', function(e) {
        var volBtn = e.target.closest('#btn-volume');
        if (volBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('trackMute: btn-volume click detectado');
            toggleTrackMute('video-track');
        }
    });

    // Inicializar dataset del btn-volume
    var volumeBtn = document.getElementById('btn-volume');
    if (volumeBtn) {
        volumeBtn.dataset.muted = 'false';
    }

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
    // También sincroniza el icono del #btn-volume con el estado del track 1.
    requestAnimationFrame(muteEnforceLoop);

    console.log('trackMute inicializado (único archivo de mute)');
}

// ---------------------------------------------------------------------------
// Toggle mute de una pista y sincronizar iconos
// ---------------------------------------------------------------------------
function toggleTrackMute(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var row = track.closest('.track-row');
    if (!row) return;
    var muteBtn = row.querySelector('.track-mute-btn');
    if (!muteBtn) return;

    var isMuted = muteBtn.dataset.muted === 'true';
    var newMuted = !isMuted;
    muteBtn.dataset.muted = newMuted ? 'true' : 'false';
    muteBtn.innerHTML = newMuted
        ? '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>'
        : '<i class="bi bi-volume-up"></i>';

    // Si es track 1, sincronizar el botón del previsualizador
    if (trackId === 'video-track') {
        syncVolumeButton(newMuted);
    }

    console.log('Mute toggle:', trackId, newMuted);
}

// ---------------------------------------------------------------------------
// Sincronizar el icono del #btn-volume con el estado de mute del track 1
// ---------------------------------------------------------------------------
function syncVolumeButton(isMuted) {
    var volBtn = document.getElementById('btn-volume');
    if (!volBtn) return;
    volBtn.dataset.muted = isMuted ? 'true' : 'false';
    // btn-volume es un <i>, cambiar la clase del icono directamente
    volBtn.className = isMuted
        ? 'bi bi-volume-mute'
        : 'bi bi-volume-up';
    if (isMuted) {
        volBtn.style.color = '#e53e3e';
    } else {
        volBtn.style.color = '';
    }
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
            toggleTrackMute(newBtn.dataset.trackId);
        });
    });
}

// ---------------------------------------------------------------------------
// Loop principal: enforce mute cada frame
// Sobrescribe el muted=false que el código blindado setea en clips
// ---------------------------------------------------------------------------
function muteEnforceLoop() {
    try {
        // === Sincronizar icono del #btn-volume con track 1 ===
        var track1Muted = isTrackMuted('video-track');
        var track1Hidden = isTrackHiddenFlag('video-track');
        syncVolumeButton(track1Muted);

        // === Track 1 (video-track) → #video-player ===
        var vp = document.getElementById('video-player');
        if (vp) {
            vp.muted = track1Muted || track1Hidden;
        }

        // === Tracks 2+ (video-track-2, etc.) → overlays ===
        if (typeof overlayState !== 'undefined') {
            Object.keys(overlayState).forEach(function(trackId) {
                if (overlayState[trackId] && overlayState[trackId].videoEl) {
                    var trackMuted = isTrackMuted(trackId);
                    var trackHidden = isTrackHiddenFlag(trackId);
                    overlayState[trackId].videoEl.muted = trackMuted || trackHidden;
                }
            });
        }

        // === Audio tracks → pausar/reanudar ===
        var audioTracks = document.querySelectorAll('.track-track[id^="audio-track"]');
        audioTracks.forEach(function(track) {
            var trackMuted = isTrackMuted(track.id);
            var trackHidden = isTrackHiddenFlag(track.id);
            if (typeof window.setTrackMuted === 'function') {
                window.setTrackMuted(track.id, trackMuted || trackHidden);
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
