// ============================================================================
// ⚠️  ARCHIVO BLINDADO — NO MODIFICAR SIN LEER TODOS LOS COMENTARIOS ⚠️
//
// Botones de Mute y Ocultar/VISIBLE por cada pista del timeline.
// Archivo independiente: no modifica código blindado ni timelineMultiTracks.js.
//
// REGLAS CRÍTICAS (NO ROMPER):
//   1. Mute y ocultar son INDEPENDIENTES por pista:
//      - Mute track 1 (video-track) → videoPlayer.muted = true/false
//      - Mute track 2+ (video-track-2, etc.) → overlayState[trackId].videoEl.muted
//      - Ocultar track 1 → multiVideoPreview.js fuerza opacity:0 !important + muted
//      - Ocultar track 2+ → overlay opacity:0 + muted + pause
//   2. NUNCA silenciar u ocultar un track afecta a los demás tracks.
//   3. NO manipular videoPlayer.style.opacity directamente aquí.
//      multiVideoPreview.js maneja la visibilidad del video-player.
//   4. Solo existen pistas de Video y Audio (no images, no effects).
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
        'gap:4px;flex-shrink:0;width:28px;';

    // --- Botón Mute ---
    const muteBtn = document.createElement('button');
    muteBtn.className = 'btn btn-sm track-mute-btn';
    muteBtn.style.cssText =
        'padding:2px;width:26px;height:26px;border:none;background:transparent;' +
        'color:#8899aa;font-size:16px;line-height:1;';
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
        'padding:2px;width:26px;height:26px;border:none;background:transparent;' +
        'color:#8899aa;font-size:16px;line-height:1;';
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

// MUTE: Toda la lógica de mute está en trackMute.js (archivo independiente)
// No duplicar mute aquí. trackMute.js maneja el click del botón y el enforcement.

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
