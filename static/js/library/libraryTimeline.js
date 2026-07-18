// ============================================================================
// ⚠️  ARCHIVO BLINDADO — NO MODIFICAR SIN LEER TODOS LOS COMENTARIOS ⚠️
//
// libraryTimeline.js — Drag & drop y doble-click desde biblioteca al timeline.
//
// REGLAS CRÍTICAS (NO ROMPER):
//   1. loadVideoInPlayer SOLO se llama si el target es video-track (track 1).
//      Tracks 2+ son manejados por multiVideoPreview.js con overlays.
//   2. Todo lo que no es audio (video, imagen, gif, etc.) va a pistas de video.
//   3. Solo existen pistas de Video y Audio (no images, no effects).
//   4. Solo video-track y audio-track en initTimelineDropZones.
// ============================================================================

function initTimelineDropZones() {
    const videoTrack = document.getElementById('video-track');
    const audioTrack = document.getElementById('audio-track');
    
    [videoTrack, audioTrack].forEach(track => {
        if (!track) return;
        
        track.addEventListener('dragover', (e) => {
            e.preventDefault();
            track.style.backgroundColor = '#3a3a3a';
        });
        
        track.addEventListener('dragleave', () => {
            track.style.backgroundColor = '';
        });
        
        track.addEventListener('drop', (e) => {
            e.preventDefault();
            track.style.backgroundColor = '';
            
            try {
                const dataStr = e.dataTransfer.getData('text/plain');
                if (!dataStr) {
                    console.error('No data transfer found');
                    return;
                }
                const data = JSON.parse(dataStr);
                addClipToTimeline(data, track);
            } catch (error) {
                console.error('Error al procesar drop:', error);
            }
        });
    });
}

function addClipToTimeline(fileData, track) {
    console.log('Agregando clip al timeline:', fileData);
    
    if (typeof saveTimelineState === 'function') {
        saveTimelineState();
    }
    
    let clipWidth = 100;
    if (fileData.duration) {
        const pixelsPerSecond = 10;
        clipWidth = Math.max(50, fileData.duration * pixelsPerSecond);
    }
    
    const clip = document.createElement('div');
    clip.className = 'timeline-clip';
    clip.style.position = 'absolute';
    clip.style.left = '10px';
    clip.style.top = '5px';
    clip.style.height = '50px';
    clip.style.width = clipWidth + 'px';
    clip.style.backgroundColor = '#0d6efd';
    clip.style.borderRadius = '4px';
    clip.style.padding = '4px';
    clip.style.color = 'white';
    clip.style.fontSize = '10px';
    clip.style.overflow = 'hidden';
    clip.style.textOverflow = 'ellipsis';
    clip.style.whiteSpace = 'nowrap';
    clip.style.cursor = 'move';
    clip.textContent = fileData.filename;
    clip.dataset.fileId = fileData.fileId;
    clip.dataset.filename = fileData.filename;
    clip.dataset.duration = fileData.duration || 0;
    clip.dataset.originalPath = fileData.originalPath;
    
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
        console.log('Clip seleccionado:', fileData.filename);
    });
    
    // Store video segment information
    clip.dataset.videoStartTime = '0'; // Start time in original video
    clip.dataset.videoEndTime = fileData.duration || '0'; // End time in original video
    
    track.appendChild(clip);
    
    console.log('Clip agregado al timeline con ancho:', clipWidth);
}

function addFileToTimelineByType(file) {
    console.log('Agregando archivo al timeline por tipo:', file.filename, file.file_type);
    
    let targetTrack;
    
    switch(file.file_type) {
        case 'audio':
            targetTrack = document.getElementById('audio-track');
            break;
        case 'video':
        case 'image':
        case 'gif':
        default:
            // Todo lo que no es audio va a pistas de video
            targetTrack = document.getElementById('video-track');
            break;
    }
    
    if (!targetTrack) {
        console.error('No se encontró la pista correspondiente');
        return;
    }
    
    const fileData = {
        fileId: file.id,
        filename: file.filename,
        fileType: file.file_type,
        originalPath: file.original_path,
        duration: file.duration
    };
    
    addClipToTimeline(fileData, targetTrack);
    
    // Load video in player only if it's going to track 1 (video-track)
    // Tracks 2+ are handled by multiVideoPreview.js overlays
    if (file.file_type === 'video' && targetTrack && targetTrack.id === 'video-track' && typeof loadVideoInPlayer === 'function') {
        loadVideoInPlayer(file.original_path);
    }
}
