// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Arrastre del playhead. Funciona en pausa o en play, desde cualquier punto
// del playhead (no solo el handle). El flag global isDraggingPlayhead evita
// que startTimelineTimer mueva el playhead mientras el usuario lo arrastra.
// ============================================================================

function makePlayheadDraggable(playhead, handle) {
    let isDragging = false;
    let startX = 0;
    let startLeft = 0;

    // Enable dragging on entire playhead, not just handle
    playhead.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
        isDraggingPlayhead = true;
        startX = e.clientX;
        startLeft = playhead.offsetLeft;
        handle.style.cursor = 'grabbing';
        playhead.style.cursor = 'grabbing';
    });

    handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        isDraggingPlayhead = true;
        startX = e.clientX;
        startLeft = playhead.offsetLeft;
        handle.style.cursor = 'grabbing';
        playhead.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        let newLeft = startLeft + deltaX;

        // Constrain to track bounds (never go below 0)
        const videoTrack = document.getElementById('video-track');
        const maxLeft = videoTrack.offsetWidth - 20; // Account for playhead width

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));

        playhead.style.left = newLeft + 'px';
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            isDraggingPlayhead = false;
            handle.style.cursor = 'grab';
            playhead.style.cursor = 'ew-resize';

            // Sync video player to playhead position
            syncVideoToPlayhead();
        }
    });
}
