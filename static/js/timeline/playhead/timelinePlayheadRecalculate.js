// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Recalcula la duración total del video editado basándose en los clips
// restantes después de eliminar gaps.
// ============================================================================

function recalculateVideoDuration(clips) {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;

    const pixelsPerSecond = 10;
    let totalDuration = 0;

    clips.forEach(clip => {
        const clipWidth = parseInt(clip.style.width) || 0;
        const clipDuration = clipWidth / pixelsPerSecond;
        totalDuration += clipDuration;
    });

    console.log('Nueva duración del video:', totalDuration, 'segundos');

    // Update video player duration (this is a visual representation)
    // The actual video file duration doesn't change, but we track the edited duration
    videoPlayer.dataset.editedDuration = totalDuration;
}
