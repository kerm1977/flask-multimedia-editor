// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Mueve el playhead a una posición específica (usado por timelineRulerClick.js)
// y sincroniza el video con la nueva posición.
// ============================================================================

function movePlayheadToPosition(position) {
    const playhead = document.getElementById('timeline-playhead');
    if (!playhead) return;

    const timelinePanel = document.getElementById('timeline-panel');
    const maxLeft = timelinePanel.offsetWidth - 2;

    const newPosition = Math.max(0, Math.min(position, maxLeft));
    playhead.style.left = newPosition + 'px';

    syncVideoToPlayhead();
}
