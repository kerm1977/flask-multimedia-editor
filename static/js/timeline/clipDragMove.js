// ============================================================================
// Arrastre de clips a lo largo del track.
// Archivo independiente: no modifica código blindado.
//
// Funcionalidad:
//   1. Permite arrastrar cualquier clip (audio, video, imagen) a lo largo
//      de su track manteniendo presionado el mouse
//   2. No interfiere con el click (selección) ni el contextmenu (eliminar)
//   3. Guarda el estado para undo antes de mover
//   4. Funciona en clips nuevos agregados por drag & drop desde la biblioteca
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipDragMove);
} else {
    initClipDragMove();
}

function initClipDragMove() {
    enableDragMoveOnAllClips();

    // Observar nuevos clips agregados al timeline
    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('timeline-clip')) {
                            enableDragMoveOnClip(node);
                        } else if (node.querySelectorAll) {
                            const clips = node.querySelectorAll('.timeline-clip');
                            clips.forEach(enableDragMoveOnClip);
                        }
                    }
                });
            });
        });
        observer.observe(tracksContainer, { childList: true, subtree: true });
    }

    console.log('Arrastre de clips inicializado');
}

function enableDragMoveOnAllClips() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(enableDragMoveOnClip);
}

function enableDragMoveOnClip(clip) {
    // No procesar gaps
    if (clip.dataset.isGap === 'true') return;
    // No duplicar listener
    if (clip.dataset.dragMoveEnabled === 'true') return;
    clip.dataset.dragMoveEnabled = 'true';

    let isDragging = false;
    let startX = 0;
    let startLeft = 0;
    let hasMoved = false;

    clip.addEventListener('mousedown', function(e) {
        // No iniciar arrastre con click derecho
        if (e.button === 2) return;

        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startLeft = parseInt(clip.style.left) || 0;
        clip.style.cursor = 'grabbing';
        clip.style.zIndex = '1001';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > 3) {
            hasMoved = true;
        }

        let newLeft = startLeft + deltaX;

        // No permitir valores negativos
        newLeft = Math.max(0, newLeft);

        // Limitar al ancho del track
        const track = clip.parentElement;
        if (track) {
            const clipWidth = parseInt(clip.style.width) || 100;
            const maxLeft = track.offsetWidth - clipWidth;
            newLeft = Math.min(newLeft, Math.max(0, maxLeft));
        }

        clip.style.left = newLeft + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;

        isDragging = false;
        clip.style.cursor = 'move';

        // Restaurar z-index
        setTimeout(function() {
            clip.style.zIndex = '';
        }, 100);

        if (hasMoved) {
            // Guardar estado para undo
            if (typeof saveTimelineState === 'function') {
                saveTimelineState();
            }
            console.log('Clip movido a:', clip.style.left, '-', clip.dataset.filename);
        }
    });
}
