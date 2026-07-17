// ============================================================================
// Click en el botón/etiqueta de una pista (Video, Audio, Efectos) selecciona
// TODOS los clips de esa pista completa, sin importar cortes o gaps.
//
// Archivo independiente: no modifica timelinePlayhead.js, timelineShortcuts.js
// ni timelineSelectTrack.js (atajo de teclado "A").
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initTimelineSelectTrackByLabel();
});

function initTimelineSelectTrackByLabel() {
    const trackIds = ['video-track', 'audio-track', 'effects-track'];

    trackIds.forEach(trackId => {
        const track = document.getElementById(trackId);
        if (!track) return;

        const trackRow = track.closest('.track-row');
        if (!trackRow) return;

        const trackLabel = trackRow.querySelector('.track-label');
        if (!trackLabel) return;

        trackLabel.style.cursor = 'pointer';

        trackLabel.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectAllClipsInTrack(track);
        });
    });

    console.log('Selección de pista completa por click en etiqueta inicializada');
}

function selectAllClipsInTrack(track) {
    // Clear selection across every track first
    document.querySelectorAll('.timeline-clip').forEach(clip => {
        clip.classList.remove('selected');
        clip.style.border = '1px solid #666';
    });

    // Select absolutely every real clip in this track, cuts or no cuts
    const clipsInTrack = track.querySelectorAll('.timeline-clip');
    let selectedCount = 0;

    clipsInTrack.forEach(clip => {
        if (clip.dataset.isGap === 'true') return;
        clip.classList.add('selected');
        clip.style.border = '2px solid #fff';
        selectedCount++;
    });

    console.log('Pista seleccionada por click en etiqueta:', track.id, '-', selectedCount, 'clip(s)');
}
