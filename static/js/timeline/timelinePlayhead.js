// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// ============================================================================
// Este archivo completo implementa el comportamiento FINAL y APROBADO del
// playhead y el sistema de corte real del timeline. Cada pieza fue ajustada
// deliberadamente tras múltiples iteraciones para lograr EXACTAMENTE esto:
//
//   1. El playhead avanza de forma CONTINUA (requestAnimationFrame + reloj
//      independiente `timelineTime`), segundo a segundo, SIN pausarse y SIN
//      saltarse ningún tramo del timeline, incluyendo los gaps (huecos).
//   2. Cada clip del timeline representa un segmento real del video original
//      (`dataset.videoStartTime` / `dataset.videoEndTime`). Al cortar con la
//      tecla X, esos segmentos se recalculan y quedan mapeados 1:1.
//   3. Cuando el playhead entra a un fragmento NUEVO, el video hace un seek
//      exacto (`seekVideoToClipSegment`) al punto de video correspondiente.
//      Mientras el playhead permanece en el mismo fragmento, el video se
//      reproduce con su avance nativo (no se re-sincroniza cada frame, para
//      evitar tartamudeo/jitter).
//   4. Cuando el playhead está sobre un gap (fragmento eliminado con D), el
//      video se CORTA literalmente: se pausa, se mutea y se oculta (pantalla
//      negra). El playhead sigue avanzando igual. Esto NO es una pausa
//      visual, es un corte real de reproducción.
//   5. El estado "reproduciendo" del timeline (`isPlaying`) es TOTALMENTE
//      independiente de los eventos nativos `play`/`pause` del <video>,
//      porque el video se pausa internamente al cruzar un gap y eso NO debe
//      detener el avance del timeline. Por eso existen
//      `startTimelinePlayback()` / `stopTimelinePlayback()` como único punto
//      de entrada para iniciar/detener el timeline (usadas desde la barra
//      espaciadora en timelineShortcuts.js).
//   6. El playhead se puede arrastrar en pausa o en play, desde cualquier
//      punto de su área (20px de ancho), y su posición central (offset de
//      9px) es la referencia exacta usada tanto para cortar (X) como para
//      sincronizar el video.
//
// Si necesitas agregar una funcionalidad nueva, hazlo en un archivo/función
// aparte y consume estas funciones existentes. NO reescribas la lógica de
// `checkPlayheadOverGap`, `seekVideoToClipSegment`, `startTimelineTimer`,
// `startTimelinePlayback`/`stopTimelinePlayback`, `cutSelectedClipAtPlayhead`
// ni la creación/arrastre del playhead en `initTimelinePlayhead` /
// `makePlayheadDraggable`, sin antes confirmarlo explícitamente con el
// usuario. Este comportamiento fue validado y aprobado tal cual está.
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initTimelinePlayhead();
});

// ----------------------------------------------------------------------------
// BLINDADO: Creación del playhead (DOM, estilos y dimensiones exactas).
// Ancho de 20px, línea central roja con offset de 9px, handle superior de
// 20x20px. Estos valores son la base de TODOS los cálculos de posición del
// resto del archivo (corte, seek, drag). No cambiar sin actualizar también
// el offset de 9px usado en syncVideoToPlayhead, checkPlayheadOverGap,
// cutSelectedClipAtPlayhead y startTimelineTimer.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// BLINDADO: Arrastre del playhead. Funciona en pausa o en play, desde
// cualquier punto del playhead (no solo el handle). El flag global
// isDraggingPlayhead evita que startTimelineTimer mueva el playhead mientras
// el usuario lo arrastra manualmente.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// BLINDADO: Sincroniza el reloj del timeline (timelineTime) y el video con
// la posición manual del playhead tras un arrastre. Usa el centro del
// playhead (+9px) como referencia exacta.
// ----------------------------------------------------------------------------
function syncVideoToPlayhead() {
    const playhead = document.getElementById('timeline-playhead');
    const videoPlayer = document.getElementById('video-player');
    
    if (!playhead || !videoPlayer) return;
    
    // Use center of playhead (9px offset from left edge)
    const playheadPosition = playhead.offsetLeft + 9;
    const pixelsPerSecond = 10; // Same as in libraryTimeline.js
    
    // Keep the independent timeline clock in sync with the manually dragged position
    timelineTime = playheadPosition / pixelsPerSecond;
    
    // Force a fresh segment lookup/seek on the next check (drag may have
    // landed on the same clip reference but at a different offset, or on a gap)
    currentClip = null;
    checkPlayheadOverGap(playheadPosition);
}

let currentClip = null;
let lastClip = null;
let isDraggingPlayhead = false;
let timelineTime = 0;
let isPlaying = false;
let lastTimestamp = 0;

function syncPlayheadWithVideo() {
    const playhead = document.getElementById('timeline-playhead');
    const videoPlayer = document.getElementById('video-player');
    
    if (!playhead || !videoPlayer) return;
    
    // Start independent timeline timer
    startTimelineTimer();
    
    console.log('Playhead sincronizado con video');
}

// Explicit timeline play/pause control (called from spacebar / play button).
// This is intentionally independent from the native <video> play/pause events,
// because the video element gets paused/muted internally while crossing gaps,
// and that must NOT stop the timeline from advancing.
// ----------------------------------------------------------------------------
// BLINDADO: Único punto de entrada para iniciar el timeline (tecla espacio).
// isPlaying es independiente del <video>.play()/pause() nativo a propósito.
// ----------------------------------------------------------------------------
function startTimelinePlayback() {
    isPlaying = true;
    lastTimestamp = performance.now();
    
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer && currentClip) {
        videoPlayer.play().catch(() => {});
    }
    console.log('Timeline iniciado');
}

function stopTimelinePlayback() {
    isPlaying = false;
    
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer && !videoPlayer.paused) {
        videoPlayer.pause();
    }
    console.log('Timeline pausado');
}

// ----------------------------------------------------------------------------
// BLINDADO: Reloj independiente del timeline. Avanza timelineTime en tiempo
// real vía requestAnimationFrame SIN importar el estado del <video> (por eso
// no usa videoPlayer.currentTime como fuente). Esto es lo que garantiza el
// movimiento continuo del playhead a través de gaps.
// ----------------------------------------------------------------------------
function startTimelineTimer() {
    function updateTimeline(timestamp) {
        if (isPlaying && !isDraggingPlayhead) {
            const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
            lastTimestamp = timestamp;
            
            timelineTime += deltaTime;
            const pixelsPerSecond = 10;
            const newPosition = timelineTime * pixelsPerSecond - 9; // Subtract center offset
            
            const videoTrack = document.getElementById('video-track');
            const maxLeft = videoTrack.offsetWidth - 20; // Account for playhead width
            
            const constrainedPosition = Math.max(0, Math.min(newPosition, maxLeft));
            const playhead = document.getElementById('timeline-playhead');
            playhead.style.left = constrainedPosition + 'px';
            
            // Check if playhead is over a gap and control video display
            checkPlayheadOverGap(constrainedPosition + 9); // Use center position
        } else {
            lastTimestamp = timestamp;
        }
        
        requestAnimationFrame(updateTimeline);
    }
    
    requestAnimationFrame(updateTimeline);
}

// ----------------------------------------------------------------------------
// BLINDADO: Núcleo del corte real. Decide si el playhead está sobre un clip
// real o un gap, y controla el <video> en consecuencia:
//   - Gap: pausa + mute + oculta (corte literal, no solo pausa visual).
//   - Clip nuevo: seek exacto al segmento (seekVideoToClipSegment).
//   - Mismo clip: no re-sincroniza (evita jitter), deja avance nativo.
// No agregar aquí lógica que fuerce videoPlayer.currentTime en cada frame.
// ----------------------------------------------------------------------------
function checkPlayheadOverGap(playheadPosition) {
    const videoTrack = document.getElementById('video-track');
    if (!videoTrack) return;
    
    const clips = videoTrack.querySelectorAll('.timeline-clip');
    let isOverGap = false;
    let isOverAnyClip = false;
    let foundClip = null;
    
    clips.forEach(clip => {
        const clipLeft = parseInt(clip.style.left) || 0;
        const clipWidth = parseInt(clip.style.width) || 0;
        const clipRight = clipLeft + clipWidth;
        
        // Check if playhead is within this clip
        if (playheadPosition >= clipLeft && playheadPosition <= clipRight) {
            isOverAnyClip = true;
            foundClip = clip;
            // Check if this is a gap
            if (clip.dataset.isGap === 'true') {
                isOverGap = true;
            } else {
                isOverGap = false;
            }
        }
    });
    
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;
    
    if (isOverAnyClip && isOverGap) {
        // Playhead is over a gap - CUT video completely (black screen, no audio)
        if (!videoPlayer.paused) {
            videoPlayer.pause();
        }
        videoPlayer.muted = true;
        videoPlayer.style.backgroundColor = 'black';
        videoPlayer.style.opacity = '0';
        // Force re-sync when we enter the next clip
        currentClip = null;
    } else if (isOverAnyClip && !isOverGap && foundClip) {
        videoPlayer.style.backgroundColor = 'transparent';
        videoPlayer.style.opacity = '1';
        videoPlayer.muted = false;
        
        if (foundClip !== currentClip) {
            // Entering a new clip/segment - seek to its exact mapped video time
            seekVideoToClipSegment(foundClip, playheadPosition);
            currentClip = foundClip;
        }
        
        // Keep video playing while timeline is playing and we're on a real clip
        if (isPlaying && videoPlayer.paused) {
            videoPlayer.play().catch(() => {});
        }
    } else {
        // Playhead is not over any clip at all (before start / after end)
        if (!videoPlayer.paused) {
            videoPlayer.pause();
        }
        videoPlayer.muted = true;
        videoPlayer.style.backgroundColor = 'black';
        videoPlayer.style.opacity = '0';
        currentClip = null;
    }
}

// ----------------------------------------------------------------------------
// BLINDADO: Traduce posición de píxel dentro de un clip a tiempo real del
// video original, usando dataset.videoStartTime del clip. Solo debe llamarse
// al ENTRAR a un clip nuevo (ver checkPlayheadOverGap), nunca en cada frame.
// ----------------------------------------------------------------------------
function seekVideoToClipSegment(clip, playheadPosition) {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer || !clip) return;
    
    const clipLeft = parseInt(clip.style.left) || 0;
    const pixelsPerSecond = 10;
    
    const positionInClip = playheadPosition - clipLeft;
    const timeInClip = positionInClip / pixelsPerSecond;
    
    const videoStartTime = parseFloat(clip.dataset.videoStartTime) || 0;
    const targetVideoTime = videoStartTime + timeInClip;
    
    videoPlayer.currentTime = targetVideoTime;
    console.log('Segmento cambiado, video buscado a:', targetVideoTime, 'segundos');
}

// ----------------------------------------------------------------------------
// BLINDADO: Corte (tecla X). Usa el centro del playhead (+9px) como punto de
// corte exacto y recalcula dataset.videoStartTime/videoEndTime de ambos
// clips resultantes para mantener el mapeo 1:1 con el video original.
// ----------------------------------------------------------------------------
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

function removeGapsAndJoinClips() {
    const videoTrack = document.getElementById('video-track');
    if (!videoTrack) {
        console.log('No se encontró el track de video');
        return;
    }
    
    // Save state for undo
    if (typeof saveTimelineState === 'function') {
        saveTimelineState();
    }
    
    // Get all clips (including gaps)
    const allClips = Array.from(videoTrack.querySelectorAll('.timeline-clip'));
    
    // Filter out gaps and get regular clips
    const regularClips = allClips.filter(clip => clip.dataset.isGap !== 'true');
    
    // Remove all clips from track
    allClips.forEach(clip => clip.remove());
    
    // Reposition regular clips without gaps
    let currentPosition = 10; // Start position
    regularClips.forEach(clip => {
        clip.style.left = currentPosition + 'px';
        videoTrack.appendChild(clip);
        currentPosition += parseInt(clip.style.width) + 2; // Add small gap between clips
    });
    
    // Recalculate video duration based on remaining clips
    recalculateVideoDuration(regularClips);
    
    console.log('Gaps eliminados y clips unidos');
}

function recalculateVideoDuration(clips) {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;
    
    const pixelsPerSecond = 10;
    let totalDuration = 0;
    
    clips.forEach(clip => {
        const clipWidth = parseInt(clip.style.width) || 0;
        const clipDuration = clipWidth / pixelsPerSecond;
        totalDuration += clipDuration;
    });
    
    console.log('Nueva duración del video:', totalDuration, 'segundos');
    
    // Update video player duration (this is a visual representation)
    // The actual video file duration doesn't change, but we track the edited duration
    videoPlayer.dataset.editedDuration = totalDuration;
}

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

function movePlayheadToPosition(position) {
    const playhead = document.getElementById('timeline-playhead');
    if (!playhead) return;
    
    const timelinePanel = document.getElementById('timeline-panel');
    const maxLeft = timelinePanel.offsetWidth - 2;
    
    const newPosition = Math.max(0, Math.min(position, maxLeft));
    playhead.style.left = newPosition + 'px';
    
    syncVideoToPlayhead();
}
