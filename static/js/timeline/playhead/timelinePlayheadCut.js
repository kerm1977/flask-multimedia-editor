// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Corte (tecla X). Usa el centro del playhead (+9px) como punto de corte
// exacto y recalcula dataset.videoStartTime/videoEndTime de ambos clips
// resultantes para mantener el mapeo 1:1 con el video original.
// ============================================================================

function cutSelectedClipAtPlayhead() {
    const selectedClip = document.querySelector('.timeline-clip.selected');

    if (!selectedClip) {
        console.log('No hay clip seleccionado para cortar');
        return;
    }

    const playhead = document.getElementById('timeline-playhead');
    if (!playhead) {
        console.error('No se encontró el playhead');
        return;
    }

    const track = selectedClip.parentElement;
    const trackRect = track.getBoundingClientRect();
    // Use center of playhead (9px offset from left edge)
    const playheadPosition = playhead.offsetLeft + 9;

    const clipLeft = parseInt(selectedClip.style.left) || 0;
    const clipWidth = parseInt(selectedClip.style.width) || 100;
    const clipRight = clipLeft + clipWidth;

    console.log('Clip seleccionado:', selectedClip.dataset.filename);
    console.log('Posición playhead (centro):', playheadPosition);
    console.log('Clip left:', clipLeft, 'Clip right:', clipRight);

    // Check if playhead is within the clip
    if (playheadPosition <= clipLeft || playheadPosition >= clipRight) {
        console.log('El playhead no está dentro del clip seleccionado');
        return;
    }

    // Save state for undo
    if (typeof saveTimelineState === 'function') {
        saveTimelineState();
    }

    // Calculate new widths
    const firstClipWidth = playheadPosition - clipLeft;
    const secondClipWidth = clipRight - playheadPosition;

    // Get video segment information
    const originalVideoStartTime = parseFloat(selectedClip.dataset.videoStartTime) || 0;
    const originalVideoEndTime = parseFloat(selectedClip.dataset.videoEndTime) || 0;
    const pixelsPerSecond = 10;

    // Calculate cut point in video time
    const positionInClip = playheadPosition - clipLeft;
    const timeInClip = positionInClip / pixelsPerSecond;
    const cutVideoTime = originalVideoStartTime + timeInClip;

    // Create second clip
    const secondClip = selectedClip.cloneNode(true);
    secondClip.style.left = playheadPosition + 'px';
    secondClip.style.width = secondClipWidth + 'px';
    secondClip.classList.remove('selected');
    secondClip.style.border = '1px solid #666';

    // Update video segment information for second clip
    secondClip.dataset.videoStartTime = cutVideoTime.toString();
    secondClip.dataset.videoEndTime = originalVideoEndTime.toString();

    // Update first clip
    selectedClip.style.width = firstClipWidth + 'px';
    selectedClip.dataset.videoEndTime = cutVideoTime.toString();

    // Add second clip to track
    track.appendChild(secondClip);

    // Re-attach event listeners to second clip
    reattachClipEvents(secondClip);

    console.log('Clip cortado en posición:', playheadPosition);
    console.log('Primer clip ancho:', firstClipWidth, 'video segment:', originalVideoStartTime, '-', cutVideoTime);
    console.log('Segundo clip ancho:', secondClipWidth, 'video segment:', cutVideoTime, '-', originalVideoEndTime);
}
