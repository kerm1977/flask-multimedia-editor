// ============================================================================
// Prevención de superposición de clips en el timeline.
// Archivo independiente: no modifica código blindado.
//
// Funcionalidad:
//   1. Detecta cuando un clip se va a soltar sobre otro en la misma pista
//   2. Empuja automáticamente los clips existentes a la derecha
//   3. También valida el arrastre manual de clips (clipDragMove.js)
//   4. No permite que dos clips ocupen el mismo espacio en la misma pista
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipCollisionPrevention);
} else {
    initClipCollisionPrevention();
}

function initClipCollisionPrevention() {
    // Interceptar drops en todas las pistas
    const allTracks = document.querySelectorAll('.track-track[id]');
    allTracks.forEach(function(track) {
        interceptDropOnTrack(track);
    });

    // Observar nuevas pistas
    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('track-row')) {
                        const track = node.querySelector('.track-track[id]');
                        if (track) {
                            interceptDropOnTrack(track);
                        }
                    }
                });
            });
        });
        observer.observe(tracksContainer, { childList: true });
    }

    // Validar arrastre manual de clips existentes
    enableCollisionCheckOnDrag();

    // Observar nuevos clips para habilitar validación de arrastre
    if (tracksContainer) {
        const clipObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('timeline-clip')) {
                            enableCollisionCheckOnClipDrag(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('.timeline-clip').forEach(enableCollisionCheckOnClipDrag);
                        }
                    }
                });
            });
        });
        clipObserver.observe(tracksContainer, { childList: true, subtree: true });
    }

    console.log('Prevención de superposición de clips inicializada');
}

// ---------------------------------------------------------------------------
// Interceptar drops para reposicionar clips y evitar superposición
// ---------------------------------------------------------------------------
function interceptDropOnTrack(track) {
    if (track.dataset.collisionIntercepted === 'true') return;
    track.dataset.collisionIntercepted = 'true';

    // Capturar el drop ANTES de que libraryTimeline.js lo procese
    track.addEventListener('drop', function(e) {
        // Obtener la posición X del drop relativa al track
        const trackRect = track.getBoundingClientRect();
        const dropX = e.clientX - trackRect.left;

        // Leer los datos del clip que se va a soltar
        let dataStr;
        try {
            dataStr = e.dataTransfer.getData('text/plain');
        } catch (err) {
            return;
        }
        if (!dataStr) return;

        let fileData;
        try {
            fileData = JSON.parse(dataStr);
        } catch (err) {
            return;
        }

        // Calcular el ancho del nuevo clip
        let newClipWidth = 100;
        if (fileData.duration) {
            newClipWidth = Math.max(50, fileData.duration * 10);
        }

        // Encontrar el primer espacio libre donde quepa el clip
        const insertPosition = findFreeSpace(track, newClipWidth, dropX);

        // Si la posición es diferente al drop original, ajustar
        // Guardar la posición calculada para que addClipToTimeline la use
        // Como no podemos modificar addClipToTimeline, usamos un enfoque:
        // Después de que se agregue el clip, lo reposicionamos
        setTimeout(function() {
            reposLastClipToPosition(track, insertPosition);
        }, 50);
    }, true); // capture=true para ejecutar antes que libraryTimeline.js
}

function findFreeSpace(track, newClipWidth, preferredX) {
    const clips = Array.from(track.querySelectorAll('.timeline-clip')).filter(function(c) {
        return c.dataset.isGap !== 'true';
    });

    // Si no hay clips, colocar en la posición preferida (mínimo 10px)
    if (clips.length === 0) {
        return Math.max(10, preferredX);
    }

    // Ordenar clips por posición
    clips.sort(function(a, b) {
        return (parseInt(a.style.left) || 0) - (parseInt(b.style.left) || 0);
    });

    // Intentar colocar en la posición preferida
    let bestPos = Math.max(10, preferredX);

    // Verificar colisiones y empujar clips
    let attempts = 0;
    while (attempts < 100) {
        let collision = false;

        for (let i = 0; i < clips.length; i++) {
            const clipLeft = parseInt(clips[i].style.left) || 0;
            const clipWidth = parseInt(clips[i].style.width) || 100;
            const clipRight = clipLeft + clipWidth;

            // Verificar si el nuevo clip se superpone con este
            if (bestPos < clipRight && (bestPos + newClipWidth) > clipLeft) {
                // Hay colisión - colocar después de este clip
                bestPos = clipRight + 2;
                collision = true;
                break;
            }
        }

        if (!collision) break;
        attempts++;
    }

    return bestPos;
}

function reposLastClipToPosition(track, position) {
    // El clip recién agregado debería ser el último hijo
    const clips = track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])');
    if (clips.length === 0) return;

    // El último clip agregado
    const lastClip = clips[clips.length - 1];
    lastClip.style.left = position + 'px';

    // Verificar colisiones y empujar clips existentes si es necesario
    pushOverlappingClips(track, lastClip);

    console.log('Clip reposicionado a:', position, 'para evitar superposición');
}

// ---------------------------------------------------------------------------
// Empujar clips que se superponen
// ---------------------------------------------------------------------------
function pushOverlappingClips(track, referenceClip) {
    const clips = Array.from(track.querySelectorAll('.timeline-clip')).filter(function(c) {
        return c.dataset.isGap !== 'true' && c !== referenceClip;
    });

    const refLeft = parseInt(referenceClip.style.left) || 0;
    const refWidth = parseInt(referenceClip.style.width) || 100;
    const refRight = refLeft + refWidth;

    // Clips que se superponen con el clip de referencia
    clips.forEach(function(clip) {
        const clipLeft = parseInt(clip.style.left) || 0;
        const clipWidth = parseInt(clip.style.width) || 100;
        const clipRight = clipLeft + clipWidth;

        // Si hay superposición, empujar este clip a la derecha
        if (clipLeft < refRight && clipRight > refLeft) {
            const newLeft = refRight + 2;
            clip.style.left = newLeft + 'px';

            // Recursivamente empujar clips que ahora se superponen
            pushOverlappingClips(track, clip);
        }
    });
}

// ---------------------------------------------------------------------------
// Validación de arrastre manual: no permitir soltar sobre otro clip
// ---------------------------------------------------------------------------
function enableCollisionCheckOnDrag() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(enableCollisionCheckOnClipDrag);
}

function enableCollisionCheckOnClipDrag(clip) {
    if (clip.dataset.isGap === 'true') return;
    if (clip.dataset.collisionDragCheck === 'true') return;
    clip.dataset.collisionDragCheck = 'true';

    // Intercept mousemove para validar colisión en tiempo real
    let dragStartLeft = 0;
    let isDragging = false;

    clip.addEventListener('mousedown', function() {
        isDragging = true;
        dragStartLeft = parseInt(clip.style.left) || 0;
    }, true);

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        // Calcular nueva posición propuesta
        const currentLeft = parseInt(clip.style.left) || 0;
        const clipWidth = parseInt(clip.style.width) || 100;

        // Verificar colisión con otros clips en la misma pista
        const track = clip.parentElement;
        if (!track) return;

        const others = Array.from(track.querySelectorAll('.timeline-clip')).filter(function(c) {
            return c !== clip && c.dataset.isGap !== 'true';
        });

        let collision = false;
        for (let i = 0; i < others.length; i++) {
            const otherLeft = parseInt(others[i].style.left) || 0;
            const otherWidth = parseInt(others[i].style.width) || 100;
            const otherRight = otherLeft + otherWidth;

            if (currentLeft < otherRight && (currentLeft + clipWidth) > otherLeft) {
                collision = true;
                // Ajustar posición: colocar justo después del clip con el que colisiona
                if (currentLeft < otherLeft) {
                    // Venía de la izquierda - colocar antes del otro clip
                    clip.style.left = Math.max(0, otherLeft - clipWidth - 2) + 'px';
                } else {
                    // Venía de la derecha - colocar después del otro clip
                    clip.style.left = (otherRight + 2) + 'px';
                }
                break;
            }
        }
    }, true);

    document.addEventListener('mouseup', function() {
        isDragging = false;
    }, true);
}
