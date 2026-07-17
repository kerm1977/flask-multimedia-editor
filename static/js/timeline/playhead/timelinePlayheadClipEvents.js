// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Re-conecta los event listeners (contextmenu, click) a un clip recién creado
// por un corte. Mantiene el comportamiento de selección y eliminación.
// ============================================================================

function reattachClipEvents(clip) {
    const filename = clip.dataset.filename;

    clip.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (typeof saveTimelineState === 'function') {
            saveTimelineState();
        }
        clip.remove();
    });

    clip.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.timeline-clip').forEach(c => {
            c.classList.remove('selected');
            c.style.border = '1px solid #666';
        });
        clip.classList.add('selected');
        clip.style.border = '2px solid #fff';
        console.log('Clip seleccionado:', filename);
        console.log('Segmento de video:', clip.dataset.videoStartTime, '-', clip.dataset.videoEndTime);
    });
}
