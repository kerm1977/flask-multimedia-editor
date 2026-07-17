// ============================================================================
// Click en la regla de tiempo (.time-ruler) mueve el playhead a esa posición.
//
// Este archivo NO modifica timelinePlayhead.js (BLINDADO). Solo reutiliza sus
// funciones/variables globales ya existentes:
//   - timelineTime (reloj independiente del timeline)
//   - currentClip (fuerza re-sync del segmento de video)
//   - checkPlayheadOverGap(playheadPosition) (aplica el corte real / seek)
//
// Regla de tiempo usada en todo el proyecto: pixelsPerSecond = 10
// (1 segundo de video = 10px en el timeline). El playhead usa su centro
// (offset de 9px) como punto de referencia exacto, igual que el resto del
// sistema (ver timelinePlayhead.js).
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initTimelineRulerClick();
});

function initTimelineRulerClick() {
    const timeRuler = document.querySelector('.time-ruler');
    const videoTrack = document.getElementById('video-track');

    if (!timeRuler || !videoTrack) {
        console.error('No se encontró la regla de tiempo o el track de video');
        return;
    }

    timeRuler.style.cursor = 'pointer';

    timeRuler.addEventListener('click', function(e) {
        movePlayheadToRulerClick(e, videoTrack);
    });

    console.log('Click en regla de tiempo inicializado');
}

function movePlayheadToRulerClick(e, videoTrack) {
    const playhead = document.getElementById('timeline-playhead');
    if (!playhead) {
        console.error('No se encontró el playhead');
        return;
    }

    // Map the click to video-track's own coordinate space (same space the
    // playhead lives in), since the ruler and the track can have different
    // horizontal offsets inside the timeline layout.
    const videoTrackRect = videoTrack.getBoundingClientRect();
    const clickPosition = e.clientX - videoTrackRect.left;

    const pixelsPerSecond = 10; // Regla de tiempo del proyecto
    const maxLeft = videoTrack.offsetWidth - 20; // Playhead width = 20px

    // Constrain so the playhead center lands exactly on the click point
    const constrainedCenter = Math.max(9, Math.min(clickPosition, maxLeft + 9));
    const newLeft = constrainedCenter - 9;

    playhead.style.left = newLeft + 'px';

    // Keep the independent timeline clock consistent with the new position
    timelineTime = constrainedCenter / pixelsPerSecond;

    // Force a fresh segment lookup/seek at this new position
    currentClip = null;
    checkPlayheadOverGap(constrainedCenter);

    console.log('Playhead movido por click en regla a:', timelineTime.toFixed(2), 'segundos');
}
