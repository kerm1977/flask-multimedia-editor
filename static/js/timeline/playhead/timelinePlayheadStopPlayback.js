// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Único punto de entrada para detener el timeline.
// ============================================================================

function stopTimelinePlayback() {
    isPlaying = false;

    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer && !videoPlayer.paused) {
        videoPlayer.pause();
    }
    console.log('Timeline pausado');
}
