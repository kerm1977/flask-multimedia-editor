// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR SIN AUTORIZACIÓN ⚠️
// ============================================================================
// globalMute.js — Mute global de todas las pistas
//
// Archivo INDEPENDIENTE. No toca ni modifica trackMute.js ni ningún otro archivo.
// Solo controla el botón #btn-volume-control de la barra de herramientas.
//
// ────────────────────────────────────────────────────────────────────────────
// FUNCIONALIDAD:
// ────────────────────────────────────────────────────────────────────────────
//   - Click en #btn-volume-control: silencia/desilencia TODAS las pistas
//   - Es INDEPENDIENTE de los botones de mute individuales de cada track
//   - Cuando se activa, todas las pistas se silencian sin importar su estado
//   - Cuando se desactiva, las pistas vuelven a su estado individual
//
// ────────────────────────────────────────────────────────────────────────────
// IDs Y CLASES QUE USA:
// ────────────────────────────────────────────────────────────────────────────
//   - #btn-volume-control: botón en la barra de herramientas del timeline
//     (HTML, entre #btn-speed-control y #btn-add-text)
//     Icono: <i class="bi bi-volume-up">
//     Al mutear: icono cambia a <i class="bi bi-volume-mute"> color rojo
//
// ────────────────────────────────────────────────────────────────────────────
// DEPENDENCIAS:
// ────────────────────────────────────────────────────────────────────────────
//   - Ninguna. No depende de trackMute.js ni de ningún otro archivo.
//   - Usa su propia variable globalGlobalMuted
//   - El loop requestAnimationFrame enforce el mute global cada frame
//
// ────────────────────────────────────────────────────────────────────────────
// ARCHIVOS QUE NO DEBEN TOCAR #btn-volume-control:
// ────────────────────────────────────────────────────────────────────────────
//   - videoEditor.js: NO debe agregar #btn-volume-control a setupEditingTools()
//     (Removido de la lista de alerts. Si se vuelve a agregar, mostrará alert)
//   - trackMute.js: NO controla este botón. Solo controla #btn-volume y
//     .track-mute-btn individuales.
//
// ────────────────────────────────────────────────────────────────────────────
// VARIABLE GLOBAL:
// ────────────────────────────────────────────────────────────────────────────
//   - globalMuted: boolean. true = todas las pistas silenciadas
//     Independiente del estado de mute individual de cada track.
// ============================================================================

// ⚠️ NO RENOMBRAR. Es la variable de estado del mute global.
var globalMuted = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalMute);
} else {
    initGlobalMute();
}

// ---------------------------------------------------------------------------
// initGlobalMute()
// ---------------------------------------------------------------------------
// Inicializa el mute global. Enlaza #btn-volume-control con event delegation.
// Usa event delegation en document para no perder el listener si otro script
// clona o reemplaza el botón.
// ---------------------------------------------------------------------------
function initGlobalMute() {
    // Event delegation para #btn-volume-control
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('#btn-volume-control');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            toggleGlobalMute();
        }
    });

    // Inicializar dataset e icono
    var btn = document.getElementById('btn-volume-control');
    if (btn) {
        btn.dataset.globalMuted = 'false';
        btn.title = 'Mute global';
    }

    // Iniciar loop de enforcement
    requestAnimationFrame(globalMuteEnforceLoop);

    console.log('globalMute inicializado (botón #btn-volume-control)');
}

// ---------------------------------------------------------------------------
// toggleGlobalMute()
// ---------------------------------------------------------------------------
// Alterna el mute global entre true y false.
// Actualiza el icono del botón #btn-volume-control.
// NO cambia el estado de los botones de mute individuales de cada track.
// ---------------------------------------------------------------------------
function toggleGlobalMute() {
    globalMuted = !globalMuted;
    updateGlobalMuteButton(globalMuted);
    console.log('globalMute:', globalMuted ? 'TODAS las pistas silenciadas' : 'mute global desactivado');
}

// ---------------------------------------------------------------------------
// updateGlobalMuteButton(isMuted)
// ---------------------------------------------------------------------------
// Actualiza el icono y tooltip del botón #btn-volume-control.
// ---------------------------------------------------------------------------

function updateGlobalMuteButton(isMuted) {
    var btn = document.getElementById('btn-volume-control');
    if (!btn) return;
    btn.dataset.globalMuted = isMuted ? 'true' : 'false';
    btn.innerHTML = isMuted
        ? '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>'
        : '<i class="bi bi-volume-up"></i>';
    btn.title = isMuted ? 'Desmutear todo' : 'Mute global';
}

// ---------------------------------------------------------------------------
// globalMuteEnforceLoop()
// ---------------------------------------------------------------------------
// Loop con requestAnimationFrame. Cada frame, si globalMuted es true,
// fuerza muted=true en TODOS los elementos de audio y video.
// Esto es necesario porque otros loops (trackMute.js, código blindado)
// pueden setear muted=false en clips, sobrescribiendo el mute global.
//
// Cuando globalMuted es false, NO hace nada. Los otros archivos
// (trackMute.js, multiVideoPreview.js) controlan el mute individual.
// ---------------------------------------------------------------------------
function globalMuteEnforceLoop() {
    try {
        if (globalMuted) {
            // === Track 1 (video-track) → #video-player ===
            var vp = document.getElementById('video-player');
            if (vp) {
                vp.muted = true;
            }

            // === Tracks 2+ (video-track-2, etc.) → overlays ===
            if (typeof overlayState !== 'undefined') {
                Object.keys(overlayState).forEach(function(trackId) {
                    if (overlayState[trackId] && overlayState[trackId].videoEl) {
                        overlayState[trackId].videoEl.muted = true;
                    }
                });
            }

            // === Audio tracks → silenciar ===
            var audioTracks = document.querySelectorAll('.track-track[id^="audio-track"]');
            audioTracks.forEach(function(track) {
                if (typeof window.setTrackMuted === 'function') {
                    window.setTrackMuted(track.id, true);
                }
            });
        }
    } catch (err) {
        // Silenciar errores para no romper el loop
    }

    requestAnimationFrame(globalMuteEnforceLoop);
}
