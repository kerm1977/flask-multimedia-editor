// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Creación del playhead (DOM, estilos y dimensiones exactas).
// Ancho de 20px, línea central roja con offset de 9px, handle superior de
// 20x20px. Estos valores son la base de TODOS los cálculos de posición del
// resto del sistema (corte, seek, drag). No cambiar sin actualizar también
// el offset de 9px usado en syncVideoToPlayhead, checkPlayheadOverGap,
// cutSelectedClipAtPlayhead y startTimelineTimer.
// ============================================================================

function initTimelinePlayhead() {
    console.log('Inicializando playhead del timeline...');

    const videoTrack = document.getElementById('video-track');
    if (!videoTrack) {
        console.error('No se encontró el track de video');
        return;
    }

    // Create main draggable playhead directly in video track
    const mainPlayhead = document.createElement('div');
    mainPlayhead.id = 'timeline-playhead';
    mainPlayhead.style.position = 'absolute';
    mainPlayhead.style.left = '0px'; // Start at beginning of track
    mainPlayhead.style.top = '0';
    mainPlayhead.style.width = '20px'; // Wider for easier grabbing
    mainPlayhead.style.height = '100%';
    mainPlayhead.style.backgroundColor = 'transparent';
    mainPlayhead.style.zIndex = '1000';
    mainPlayhead.style.cursor = 'ew-resize';
    mainPlayhead.style.pointerEvents = 'auto';

    // Add visible line in the center
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.left = '9px';
    line.style.top = '0';
    line.style.width = '2px';
    line.style.height = '100%';
    line.style.backgroundColor = '#ff0000';
    mainPlayhead.appendChild(line);

    // Add drag handle at top (larger for easier grabbing)
    const handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.top = '-15px';
    handle.style.left = '0px';
    handle.style.width = '20px';
    handle.style.height = '20px';
    handle.style.backgroundColor = '#ff0000';
    handle.style.borderRadius = '50%';
    handle.style.cursor = 'grab';
    handle.style.opacity = '0.8';
    mainPlayhead.appendChild(handle);

    videoTrack.appendChild(mainPlayhead);

    // Make entire playhead draggable
    makePlayheadDraggable(mainPlayhead, handle);

    // Sync playhead with video playback
    syncPlayheadWithVideo();

    // Keyboard shortcut for cut (X key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'x' || e.key === 'X') {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                cutSelectedClipAtPlayhead();
            }
        }

        // Keyboard shortcut for delete (D key)
        if (e.key === 'd' || e.key === 'D') {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                deleteSelectedClip();
            }
        }

        // Keyboard shortcut for remove gaps (W key)
        if (e.key === 'w' || e.key === 'W') {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                removeGapsAndJoinClips();
            }
        }
    });

    console.log('Playhead del timeline inicializado en video track');
}

document.addEventListener('DOMContentLoaded', function() {
    initTimelinePlayhead();
});
