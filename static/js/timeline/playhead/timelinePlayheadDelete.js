// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Eliminación (tecla D). Reemplaza el clip seleccionado por un gap invisible
// que mantiene el espaciado del timeline.
// ============================================================================

function deleteSelectedClip() {
    const selectedClip = document.querySelector('.timeline-clip.selected');

    if (!selectedClip) {
        console.log('No hay clip seleccionado para eliminar');
        return;
    }

    const filename = selectedClip.dataset.filename;

    // Save state for undo
    if (typeof saveTimelineState === 'function') {
        saveTimelineState();
    }

    // Create a gap clip to maintain spacing
    const gapClip = createGapClip(selectedClip);
    const track = selectedClip.parentElement;

    // Replace selected clip with gap clip
    track.insertBefore(gapClip, selectedClip);
    selectedClip.remove();

    console.log('Clip eliminado y gap creado:', filename);
}
