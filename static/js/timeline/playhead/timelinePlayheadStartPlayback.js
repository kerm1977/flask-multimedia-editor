// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Único punto de entrada para iniciar el timeline (tecla espacio).
// isPlaying es independiente del <video>.play()/pause() nativo a propósito.
// ============================================================================

function startTimelinePlayback() {
    isPlaying = true;
    lastTimestamp = performance.now();

    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer && currentClip) {
        videoPlayer.play().catch(() => {});
    }
    console.log('Timeline iniciado');
}
