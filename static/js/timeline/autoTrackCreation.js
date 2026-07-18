// ============================================================================
// ⚠️  ARCHIVO BLINDADO — NO MODIFICAR SIN LEER TODOS LOS COMENTARIOS ⚠️
//
// Creación automática de pistas.
// Archivo independiente: no modifica código blindado.
//
// REGLAS CRÍTICAS (NO ROMPER):
//   1. Doble-click en biblioteca:
//      - Si el track de ese tipo YA tiene clips → crea pista nueva automáticamente
//      - Cada video/audio nuevo del doble-click va a su propia pista
//      - Imágenes, GIFs y efectos van a pistas de video
//   2. Drag & drop desde biblioteca:
//      - El clip cae en un espacio vacío del track destino
//      - JAMÁS se superpone a otro clip existente
//   3. Solo existen pistas de Video y Audio. No hay pistas de imágenes ni efectos.
//   4. ⚠️ loadVideoInPlayer SOLO se llama para track 1 (video-track).
//      Tracks 2+ son manejados por multiVideoPreview.js con overlays independientes.
//      Si llamas loadVideoInPlayer para track 2+, el video reemplazará al de track 1
//      en el video-player original, rompiendo la capa de visualización.
//   5. Máximo 3 pistas por tipo (MAX_TRACKS_PER_TYPE = 3 en timelineMultiTracks.js).
//   6. Al eliminar una pista, trackCounters decrementa (timelineMultiTracks.js).
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoTrackCreation);
} else {
    initAutoTrackCreation();
}

const PIXELS_PER_SECOND = 10;

function initAutoTrackCreation() {
    setTimeout(function() {
        interceptAddFileToTimeline();
        interceptAllTrackDrops();
    }, 300);

    console.log('Auto-creación de pistas inicializada');
}

// ---------------------------------------------------------------------------
// Intercept addFileToTimelineByType (doble-click en biblioteca)
// REGLA: Si el track ya tiene clips → crear pista nueva automáticamente
//        Imágenes, GIFs y efectos van a pistas de video
// ---------------------------------------------------------------------------
function interceptAddFileToTimeline() {
    if (typeof window._originalAddFileToTimelineByType === 'undefined') {
        if (typeof addFileToTimelineByType === 'function') {
            window._originalAddFileToTimelineByType = addFileToTimelineByType;
        }
    }

    window.addFileToTimelineByType = function(file) {
        console.log('Auto-track (doble-click): procesando', file.filename, file.file_type);

        const fileType = file.file_type;
        let baseTrackId;
        let trackType;

        switch (fileType) {
            case 'video':
            case 'image':
            case 'gif':
                // Videos, imágenes, GIFs y efectos visuales van a pistas de video
                baseTrackId = 'video-track';
                trackType = 'video';
                break;
            case 'audio':
                baseTrackId = 'audio-track';
                trackType = 'audio';
                break;
            default:
                // Cualquier otro tipo también va a video
                baseTrackId = 'video-track';
                trackType = 'video';
                break;
        }

        // Buscar la PRIMERA pista de este tipo que esté VACÍA (sin clips)
        const emptyTrack = findFirstEmptyTrack(baseTrackId);

        let targetTrack = null;

        if (emptyTrack) {
            // Hay una pista vacía existente - usarla
            addClipDirectly(file, emptyTrack, 10);
            targetTrack = emptyTrack;
        } else {
            // Todas las pistas de este tipo tienen clips → crear pista nueva
            const newTrack = createNewAutoTrack(trackType);
            if (newTrack) {
                addClipDirectly(file, newTrack, 10);
                targetTrack = newTrack;
            } else {
                // No se pudo crear pista nueva (máximo alcanzado)
                // Usar la última pista y colocar después del último clip
                const lastTrack = findLastTrackOfType(baseTrackId);
                if (lastTrack) {
                    const pos = getEndOfLastClip(lastTrack);
                    addClipDirectly(file, lastTrack, pos);
                    targetTrack = lastTrack;
                }
            }
        }

        // Solo cargar en el video-player original si es el track 1 (video-track)
        // Tracks 2+ son manejados por multiVideoPreview.js con overlays independientes
        if (fileType === 'video' && targetTrack && targetTrack.id === 'video-track' && typeof loadVideoInPlayer === 'function') {
            loadVideoInPlayer(file.original_path);
        }
    };

    console.log('addFileToTimelineByType interceptado');
}

// ---------------------------------------------------------------------------
// Buscar la primera pista de este tipo que esté completamente vacía
// ---------------------------------------------------------------------------
function findFirstEmptyTrack(baseTrackId) {
    const tracks = [];
    const mainTrack = document.getElementById(baseTrackId);
    if (mainTrack) tracks.push(mainTrack);

    const allTrackEls = document.querySelectorAll('.track-track[id]');
    allTrackEls.forEach(function(t) {
        if (t.id && t.id.startsWith(baseTrackId + '-') && t.id !== baseTrackId) {
            tracks.push(t);
        }
    });

    for (let i = 0; i < tracks.length; i++) {
        const clips = tracks[i].querySelectorAll('.timeline-clip:not([data-is-gap="true"])');
        if (clips.length === 0) {
            return tracks[i];
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Crear nueva pista automáticamente
// ---------------------------------------------------------------------------
function createNewAutoTrack(trackType) {
    if (typeof addTrackOfType !== 'function') return null;

    if (typeof trackCounters !== 'undefined' && typeof MAX_TRACKS_PER_TYPE !== 'undefined') {
        if (trackCounters[trackType] >= MAX_TRACKS_PER_TYPE) {
            console.log('Máximo de pistas alcanzado para', trackType);
            return null;
        }
    }

    addTrackOfType(trackType);

    const baseId = trackType === 'video' ? 'video-track' :
                   trackType === 'audio' ? 'audio-track' : null;

    if (!baseId) return null;

    const newTrackId = baseId + '-' + (trackCounters ? trackCounters[trackType] : '2');
    const newTrack = document.getElementById(newTrackId);

    return newTrack;
}

function findLastTrackOfType(baseId) {
    const allTracks = document.querySelectorAll('.track-track[id]');
    let lastTrack = null;
    let lastNumber = 0;

    allTracks.forEach(function(t) {
        if (t.id === baseId || (t.id && t.id.startsWith(baseId + '-'))) {
            const num = t.id === baseId ? 1 : parseInt(t.id.split('-').pop()) || 0;
            if (num >= lastNumber) {
                lastNumber = num;
                lastTrack = t;
            }
        }
    });

    return lastTrack;
}

function getEndOfLastClip(track) {
    const clips = track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])');
    let maxRight = 10;
    clips.forEach(function(clip) {
        const left = parseInt(clip.style.left) || 0;
        const width = parseInt(clip.style.width) || 100;
        const right = left + width;
        if (right > maxRight) maxRight = right;
    });
    return maxRight + 2;
}

// ---------------------------------------------------------------------------
// Intercept ALL track drops to prevent overlapping
// REGLA: Drag & drop siempre cae en espacio vacío, jamás superpuesto
// ---------------------------------------------------------------------------
function interceptAllTrackDrops() {
    const allTracks = document.querySelectorAll('.track-track[id]');
    allTracks.forEach(function(track) {
        if (track.dataset.dropIntercepted === 'true') return;
        track.dataset.dropIntercepted = 'true';

        // Capturar el drop antes que libraryTimeline.js
        track.addEventListener('drop', function(e) {
            try {
                const dataStr = e.dataTransfer.getData('text/plain');
                if (!dataStr) return;
                const data = JSON.parse(dataStr);

                // Calcular posición del drop
                const trackRect = track.getBoundingClientRect();
                const dropX = e.clientX - trackRect.left;

                // Calcular ancho del clip
                let clipWidth = 100;
                if (data.duration) {
                    clipWidth = Math.max(50, data.duration * PIXELS_PER_SECOND);
                }

                // Encontrar espacio libre más cercano a la posición del drop
                const safePosition = findNearestFreeSpace(track, dropX, clipWidth);

                // Crear el clip en la posición segura
                addClipDirectly(data, track, safePosition);

                // Prevenir que libraryTimeline.js procese el drop
                e.stopPropagation();
                e.preventDefault();
            } catch (error) {
                // Si falla, dejar que el handler original procese
            }
        }, true); // capture=true para ejecutar antes que libraryTimeline.js
    });

    // Observar nuevas pistas
    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('track-row')) {
                        setTimeout(function() {
                            const track = node.querySelector('.track-track[id]');
                            if (track && track.dataset.dropIntercepted !== 'true') {
                                track.dataset.dropIntercepted = 'true';
                                track.addEventListener('drop', function(e) {
                                    try {
                                        const dataStr = e.dataTransfer.getData('text/plain');
                                        if (!dataStr) return;
                                        const data = JSON.parse(dataStr);
                                        const trackRect = track.getBoundingClientRect();
                                        const dropX = e.clientX - trackRect.left;
                                        let clipWidth = 100;
                                        if (data.duration) {
                                            clipWidth = Math.max(50, data.duration * PIXELS_PER_SECOND);
                                        }
                                        const safePosition = findNearestFreeSpace(track, dropX, clipWidth);
                                        addClipDirectly(data, track, safePosition);
                                        e.stopPropagation();
                                        e.preventDefault();
                                    } catch (error) {}
                                }, true);
                            }
                        }, 50);
                    }
                });
            });
        });
        observer.observe(tracksContainer, { childList: true });
    }
}

// ---------------------------------------------------------------------------
// Encontrar el espacio libre más cercano a la posición deseada
// ---------------------------------------------------------------------------
function findNearestFreeSpace(track, preferredX, clipWidth) {
    const clips = Array.from(track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])'));

    if (clips.length === 0) {
        return Math.max(10, preferredX);
    }

    // Ordenar clips por posición
    clips.sort(function(a, b) {
        return (parseInt(a.style.left) || 0) - (parseInt(b.style.left) || 0);
    });

    // Intentar colocar en la posición preferida
    let bestPos = Math.max(10, preferredX);
    let bestDist = Math.abs(bestPos - preferredX);

    // Opción 1: Antes del primer clip
    const firstLeft = parseInt(clips[0].style.left) || 0;
    if (firstLeft - 10 >= clipWidth) {
        const pos = 10;
        const dist = Math.abs(pos - preferredX);
        if (dist < bestDist) {
            bestPos = pos;
            bestDist = dist;
        }
    }

    // Opción 2: Entre clips
    for (let i = 0; i < clips.length - 1; i++) {
        const right = (parseInt(clips[i].style.left) || 0) + (parseInt(clips[i].style.width) || 100);
        const nextLeft = parseInt(clips[i + 1].style.left) || 0;
        const gap = nextLeft - right - 2;

        if (gap >= clipWidth) {
            const pos = right + 2;
            const dist = Math.abs(pos - preferredX);
            if (dist < bestDist) {
                bestPos = pos;
                bestDist = dist;
            }
        }
    }

    // Opción 3: Después del último clip
    const lastRight = (parseInt(clips[clips.length - 1].style.left) || 0) +
                     (parseInt(clips[clips.length - 1].style.width) || 100);
    const pos = lastRight + 2;
    const dist = Math.abs(pos - preferredX);
    if (dist < bestDist) {
        bestPos = pos;
        bestDist = dist;
    }

    // Verificar que la posición final no tenga colisión
    bestPos = ensureNoOverlap(track, bestPos, clipWidth);

    return bestPos;
}

// ---------------------------------------------------------------------------
// Agregar clip directamente a una pista en una posición específica
// ---------------------------------------------------------------------------
function addClipDirectly(file, track, position) {
    if (typeof saveTimelineState === 'function') {
        saveTimelineState();
    }

    let clipWidth = 100;
    if (file.duration) {
        clipWidth = Math.max(50, file.duration * PIXELS_PER_SECOND);
    }

    // Verificar no superposición final
    position = ensureNoOverlap(track, position, clipWidth);

    const clip = document.createElement('div');
    clip.className = 'timeline-clip';
    clip.style.position = 'absolute';
    clip.style.left = position + 'px';
    clip.style.top = '5px';
    clip.style.height = '50px';
    clip.style.width = clipWidth + 'px';

    if (file.file_type === 'video') {
        clip.style.backgroundColor = '#0d6efd';
    } else if (file.file_type === 'audio') {
        clip.style.backgroundColor = '#28a745';
    } else if (file.file_type === 'image') {
        clip.style.backgroundColor = '#ff9800';
    } else {
        clip.style.backgroundColor = '#6c757d';
    }

    clip.style.borderRadius = '4px';
    clip.style.padding = '4px';
    clip.style.color = 'white';
    clip.style.fontSize = '10px';
    clip.style.overflow = 'hidden';
    clip.style.textOverflow = 'ellipsis';
    clip.style.whiteSpace = 'nowrap';
    clip.style.cursor = 'move';
    clip.textContent = file.filename;
    clip.dataset.fileId = file.fileId || file.id;
    clip.dataset.filename = file.filename;
    clip.dataset.duration = file.duration || 0;
    clip.dataset.originalPath = file.originalPath || file.original_path;
    clip.dataset.videoStartTime = '0';
    clip.dataset.videoEndTime = file.duration || '0';

    clip.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (typeof saveTimelineState === 'function') {
            saveTimelineState();
        }
        clip.remove();
    });

    clip.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.timeline-clip').forEach(function(c) {
            c.classList.remove('selected');
            c.style.border = '1px solid #666';
        });
        clip.classList.add('selected');
        clip.style.border = '2px solid #fff';
        console.log('Clip seleccionado:', file.filename);
    });

    track.appendChild(clip);
    console.log('Clip agregado en posición', position, 'sin superposición:', file.filename);
}

// ---------------------------------------------------------------------------
// Verificar que la posición no se superponga con clips existentes
// ---------------------------------------------------------------------------
function ensureNoOverlap(track, position, clipWidth) {
    const clips = Array.from(track.querySelectorAll('.timeline-clip:not([data-is-gap="true"])'));
    if (clips.length === 0) return position;

    let attempts = 0;
    let currentPos = position;

    while (attempts < 100) {
        let collision = false;

        for (let i = 0; i < clips.length; i++) {
            const clipLeft = parseInt(clips[i].style.left) || 0;
            const clipW = parseInt(clips[i].style.width) || 100;
            const clipRight = clipLeft + clipW;

            if (currentPos < clipRight && (currentPos + clipWidth) > clipLeft) {
                currentPos = clipRight + 2;
                collision = true;
                break;
            }
        }

        if (!collision) break;
        attempts++;
    }

    return currentPos;
}
