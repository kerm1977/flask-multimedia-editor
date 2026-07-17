// ============================================================================
// Integración de archivos de audio a la pista de timeline de audio.
// Archivo independiente: no modifica código blindado.
//
// Funcionalidad:
//   1. Intercepta el double-click en archivos de audio de la biblioteca
//      y los envía a la pista de audio (audio-track), no a la de video.
//   2. Si hay múltiples pistas de audio, envía a la primera disponible.
//   3. También intercepta el drag & drop para asegurar que el audio
//      caiga en una pista de audio, no de video.
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initAudioTimelineIntegration();
});

function initAudioTimelineIntegration() {
    const grid = document.getElementById('library-files-grid');
    if (!grid) {
        console.log('No se encontró library-files-grid para integración de audio');
        return;
    }

    // Use event delegation instead of MutationObserver to avoid infinite loops.
    // Intercept dblclick on the grid and check if the target is an audio card.
    grid.addEventListener('dblclick', function(e) {
        const card = e.target.closest('[data-file-type="audio"]');
        if (!card) return;

        e.preventDefault();
        e.stopPropagation();

        const fileData = {
            fileId: card.dataset.fileId,
            filename: card.dataset.filename,
            fileType: card.dataset.fileType,
            originalPath: card.dataset.originalPath
        };

        addAudioToTimeline(fileData);
    });

    // Intercept dragstart for audio cards
    grid.addEventListener('dragstart', function(e) {
        const card = e.target.closest('[data-file-type="audio"]');
        if (!card) return;

        const fileData = {
            fileId: card.dataset.fileId,
            filename: card.dataset.filename,
            fileType: card.dataset.fileType,
            originalPath: card.dataset.originalPath
        };

        e.dataTransfer.setData('text/plain', JSON.stringify(fileData));
        e.dataTransfer.effectAllowed = 'copy';
        card.style.opacity = '0.5';
    });

    grid.addEventListener('dragend', function(e) {
        const card = e.target.closest('[data-file-type="audio"]');
        if (card) card.style.opacity = '1';
    });

    console.log('Integración audio-timeline inicializada');
}

function addAudioToTimeline(fileData) {
    console.log('Agregando audio al timeline:', fileData.filename);

    // Buscar la primera pista de audio disponible
    let targetTrack = document.getElementById('audio-track');

    // Si no existe la pista original, buscar pistas adicionales
    if (!targetTrack) {
        const audioTracks = document.querySelectorAll('[id^="audio-track"]');
        if (audioTracks.length > 0) {
            targetTrack = audioTracks[0];
        }
    }

    // Buscar pistas adicionales de audio (audio-track-2, audio-track-3, etc.)
    if (!targetTrack) {
        const extraTracks = document.querySelectorAll('[id^="audio-track-"]');
        if (extraTracks.length > 0) {
            targetTrack = extraTracks[0];
        }
    }

    if (!targetTrack) {
        console.error('No se encontró ninguna pista de audio');
        return;
    }

    // Usar la función existente addClipToTimeline si está disponible
    if (typeof addClipToTimeline === 'function') {
        addClipToTimeline(fileData, targetTrack);
    } else {
        // Fallback: crear el clip manualmente
        createAudioClipManually(fileData, targetTrack);
    }

    // Cargar el audio en el reproductor de audio si existe
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer && fileData.originalPath) {
        audioPlayer.src = fileData.originalPath;
        audioPlayer.load();
        console.log('Audio cargado en reproductor:', fileData.filename);
    }
}

function createAudioClipManually(fileData, track) {
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
    clip.style.backgroundColor = '#28a745';
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
    clip.dataset.videoStartTime = '0';
    clip.dataset.videoEndTime = fileData.duration || '0';

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
        console.log('Clip de audio seleccionado:', fileData.filename);
    });

    track.appendChild(clip);
    console.log('Clip de audio agregado al timeline con ancho:', clipWidth);
}
