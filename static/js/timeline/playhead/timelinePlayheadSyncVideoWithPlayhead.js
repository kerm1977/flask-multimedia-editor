// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Inicia el timer independiente del timeline al cargar.
// ============================================================================

function syncPlayheadWithVideo() {
    const playhead = document.getElementById('timeline-playhead');
    const videoPlayer = document.getElementById('video-player');

    if (!playhead || !videoPlayer) return;

    // Start independent timeline timer
    startTimelineTimer();

    console.log('Playhead sincronizado con video');
}
