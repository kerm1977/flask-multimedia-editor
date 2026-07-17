// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Crea un clip de gap invisible que mantiene el espaciado del timeline cuando
// se elimina un clip. El gap es transparente, sin borde y con pointerEvents
// none para que los clicks pasen al track.
// ============================================================================

function createGapClip(originalClip) {
    const gapClip = document.createElement('div');
    gapClip.className = 'timeline-clip gap-clip';
    gapClip.style.position = 'absolute';
    gapClip.style.left = originalClip.style.left;
    gapClip.style.top = originalClip.style.top;
    gapClip.style.height = originalClip.style.height;
    gapClip.style.width = originalClip.style.width;
    gapClip.style.backgroundColor = '';
    gapClip.style.background = 'none';
    gapClip.style.border = 'none';
    gapClip.style.cursor = 'default';
    gapClip.style.pointerEvents = 'none'; // Let clicks pass through to track
    gapClip.style.display = 'none'; // Completely hide the gap element
    gapClip.dataset.isGap = 'true';

    return gapClip;
}
