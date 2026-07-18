// ============================================================================
// Atajo "A": selecciona todos los clips de una pista completa (video, audio
// o efectos). No modifica timelinePlayhead.js ni ningún otro archivo blindado.
//
// Regla para determinar QUÉ pista seleccionar:
//   1. La pista sobre la que está el mouse en ese momento (hover), o
//   2. Si no hay hover reciente, la pista del clip actualmente seleccionado, o
//   3. Si nada de lo anterior aplica, la pista de video por defecto.
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initTimelineSelectTrack();
});

let lastHoveredTrack = null;

function initTimelineSelectTrack() {
    const videoTrack = document.getElementById('video-track');
    const audioTrack = document.getElementById('audio-track');

    [videoTrack, audioTrack].forEach(track => {
        if (!track) return;
        track.addEventListener('mouseenter', () => {
            lastHoveredTrack = track;
        });
    });

    document.addEventListener('keydown', function(e) {
        if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey) {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                selectEntireTrack();
            }
        }
    });

    console.log('Atajo de selección de pista completa (A) inicializado');
}

function getTargetTrackForSelectAll() {
    if (lastHoveredTrack) {
        return lastHoveredTrack;
    }

    const selectedClip = document.querySelector('.timeline-clip.selected');
    if (selectedClip && selectedClip.parentElement) {
        return selectedClip.parentElement;
    }

    return document.getElementById('video-track');
}

function selectEntireTrack() {
    const targetTrack = getTargetTrackForSelectAll();
    if (!targetTrack) {
        console.log('No se encontró ninguna pista para seleccionar');
        return;
    }

    // Clear selection on every track first
    document.querySelectorAll('.timeline-clip').forEach(clip => {
        clip.classList.remove('selected');
        clip.style.border = '1px solid #666';
    });

    // Select every real clip (skip gap placeholders) in the target track
    const clipsInTrack = targetTrack.querySelectorAll('.timeline-clip');
    let selectedCount = 0;

    clipsInTrack.forEach(clip => {
        if (clip.dataset.isGap === 'true') return;
        clip.classList.add('selected');
        clip.style.border = '2px solid #fff';
        selectedCount++;
    });

    console.log('Pista completa seleccionada:', targetTrack.id, '-', selectedCount, 'clip(s)');
}
