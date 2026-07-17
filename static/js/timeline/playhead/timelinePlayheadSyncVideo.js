// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Sincroniza el reloj del timeline (timelineTime) y el video con la posición
// manual del playhead tras un arrastre. Usa el centro del playhead (+9px)
// como referencia exacta.
// ============================================================================

function syncVideoToPlayhead() {
    const playhead = document.getElementById('timeline-playhead');
    const videoPlayer = document.getElementById('video-player');

    if (!playhead || !videoPlayer) return;

    // Use center of playhead (9px offset from left edge)
    const playheadPosition = playhead.offsetLeft + 9;
    const pixelsPerSecond = 10; // Same as in libraryTimeline.js

    // Keep the independent timeline clock in sync with the manually dragged position
    timelineTime = playheadPosition / pixelsPerSecond;

    // Force a fresh segment lookup/seek on the next check (drag may have
    // landed on the same clip reference but at a different offset, or on a gap)
    currentClip = null;
    checkPlayheadOverGap(playheadPosition);
}
