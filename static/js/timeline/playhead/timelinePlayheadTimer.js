// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Reloj independiente del timeline. Avanza timelineTime en tiempo real vía
// requestAnimationFrame SIN importar el estado del <video> (por eso no usa
// videoPlayer.currentTime como fuente). Esto es lo que garantiza el
// movimiento continuo del playhead a través de gaps.
// ============================================================================

function startTimelineTimer() {
    function updateTimeline(timestamp) {
        if (isPlaying && !isDraggingPlayhead) {
            const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
            lastTimestamp = timestamp;

            timelineTime += deltaTime;
            const pixelsPerSecond = 10;
            const newPosition = timelineTime * pixelsPerSecond - 9; // Subtract center offset

            const videoTrack = document.getElementById('video-track');
            const maxLeft = videoTrack.offsetWidth - 20; // Account for playhead width

            const constrainedPosition = Math.max(0, Math.min(newPosition, maxLeft));
            const playhead = document.getElementById('timeline-playhead');
            playhead.style.left = constrainedPosition + 'px';

            // Check if playhead is over a gap and control video display
            checkPlayheadOverGap(constrainedPosition + 9); // Use center position
        } else {
            lastTimestamp = timestamp;
        }

        requestAnimationFrame(updateTimeline);
    }

    requestAnimationFrame(updateTimeline);
}
