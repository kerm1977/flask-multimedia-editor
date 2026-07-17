document.addEventListener('DOMContentLoaded', function() {
    initTimelineShortcuts();
});

function initTimelineShortcuts() {
    console.log('Inicializando atajos de timeline...');
    
    // Spacebar for play/pause
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            togglePlayPause();
        }
    });
    
    console.log('Atajos de timeline inicializados');
}

// ----------------------------------------------------------------------------
// BLINDADO / NO MODIFICAR: NO llamar videoPlayer.play()/pause() directamente
// aquí. Debe delegarse SIEMPRE en startTimelinePlayback()/stopTimelinePlayback()
// (definidas en timelinePlayhead.js), que son la única fuente de verdad del
// estado isPlaying del timeline, independiente del <video> nativo.
// ----------------------------------------------------------------------------
function togglePlayPause() {
    // Timeline playback is controlled independently from the native video
    // element, since the video gets muted/paused while the playhead is
    // crossing an empty gap but the timeline itself must keep advancing.
    if (typeof isPlaying !== 'undefined' && isPlaying) {
        stopTimelinePlayback();
    } else {
        startTimelinePlayback();
    }
}
