// ============================================================================
// Botones de Mute y Ocultar/VISIBLE por cada pista del timeline.
// Archivo independiente: no modifica código blindado ni timelineMultiTracks.js.
//
// Agrega dos botones junto al número de pista (track-number-badge):
//   1. Mute (bi-volume-up / bi-volume-mute): silencia el audio de la pista
//   2. Ocultar (bi-eye / bi-eye-slash): invisibiliza los clips de la pista
//
// Funciona para todas las pistas: video-track, audio-track, image-track, etc.
// Usa MutationObserver para detectar cuando se agregan nuevas pistas.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackControls);
} else {
    initTrackControls();
}

function initTrackControls() {
    // Agregar botones a las pistas existentes
    addControlsToExistingTracks();

    // Observar nuevas pistas agregadas por timelineMultiTracks.js
    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('track-row')) {
                        // Esperar a que el DOM se complete
                        setTimeout(function() {
                            addControlsToTrackRow(node);
                        }, 50);
                    }
                });
            });
        });
        observer.observe(tracksContainer, { childList: true });
    }

    console.log('Controles de pista (mute/ocultar) inicializados');
}

function addControlsToExistingTracks() {
    const rows = document.querySelectorAll('.track-row');
    rows.forEach(function(row) {
        addControlsToTrackRow(row);
    });
}

function addControlsToTrackRow(row) {
    // Verificar si ya tiene controles
    if (row.querySelector('.track-controls-btns')) return;

    const track = row.querySelector('.track-track');
    if (!track) return;

    const trackId = track.id || '';
    if (!trackId) return;

    // Crear contenedor de botones junto al number badge
    const numBadge = row.querySelector('.track-number-badge');
    if (!numBadge) return;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'track-controls-btns';
    btnContainer.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'gap:2px;flex-shrink:0;width:20px;';

    // --- Botón Mute ---
    const muteBtn = document.createElement('button');
    muteBtn.className = 'btn btn-sm track-mute-btn';
    muteBtn.style.cssText =
        'padding:0;width:18px;height:18px;border:none;background:transparent;' +
        'color:#8899aa;font-size:11px;line-height:1;';
    muteBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
    muteBtn.title = 'Mute/Unmute';
    muteBtn.dataset.trackId = trackId;
    muteBtn.dataset.muted = 'false';

    muteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMute(trackId, muteBtn);
    });

    // --- Botón Ocultar ---
    const hideBtn = document.createElement('button');
    hideBtn.className = 'btn btn-sm track-hide-btn';
    hideBtn.style.cssText =
        'padding:0;width:18px;height:18px;border:none;background:transparent;' +
        'color:#8899aa;font-size:11px;line-height:1;';
    hideBtn.innerHTML = '<i class="bi bi-eye"></i>';
    hideBtn.title = 'Ocultar/Mostrar';
    hideBtn.dataset.trackId = trackId;
    hideBtn.dataset.hidden = 'false';

    hideBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleHide(trackId, hideBtn, track);
    });

    btnContainer.appendChild(muteBtn);
    btnContainer.appendChild(hideBtn);

    // Insertar después del number badge
    numBadge.parentNode.insertBefore(btnContainer, numBadge.nextSibling);
}

function toggleMute(trackId, btn) {
    const isMuted = btn.dataset.muted === 'true';
    const newMuted = !isMuted;

    btn.dataset.muted = newMuted ? 'true' : 'false';
    btn.innerHTML = newMuted
        ? '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>'
        : '<i class="bi bi-volume-up"></i>';

    // Usar la función de audioPlaybackSync.js si está disponible
    if (typeof window.setTrackMuted === 'function') {
        window.setTrackMuted(trackId, newMuted);
    }

    // Track 1: controlar el video-player original
    if (trackId === 'video-track') {
        const videoPlayer = document.getElementById('video-player');
        if (videoPlayer) {
            videoPlayer.muted = newMuted;
        }
    }
    // Tracks 2+: controlar el overlay video element
    if (trackId.startsWith('video-track-') && typeof overlayState !== 'undefined' && overlayState[trackId]) {
        overlayState[trackId].videoEl.muted = newMuted;
    }

    console.log('Mute toggle:', trackId, newMuted);
}

function toggleHide(trackId, btn, track) {
    const isHidden = btn.dataset.hidden === 'true';
    const newHidden = !isHidden;

    btn.dataset.hidden = newHidden ? 'true' : 'false';
    btn.innerHTML = newHidden
        ? '<i class="bi bi-eye-slash" style="color:#e53e3e;"></i>'
        : '<i class="bi bi-eye"></i>';

    // Ocultar/mostrar los clips de la pista
    const clips = track.querySelectorAll('.timeline-clip');
    clips.forEach(function(clip) {
        if (newHidden) {
            clip.style.opacity = '0.2';
            clip.style.filter = 'grayscale(100%)';
        } else {
            clip.style.opacity = '';
            clip.style.filter = '';
        }
    });

    // Para video-track, no manipular el video-player directamente.
    // videoTrackVisibility.js maneja el track 1 via CSS class.
    // multiVideoPreview.js maneja los tracks 2+ via overlay opacity.

    console.log('Hide toggle:', trackId, newHidden);
}
