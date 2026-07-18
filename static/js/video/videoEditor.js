document.addEventListener('DOMContentLoaded', function() {
    initVideoEditor();
});

function initVideoEditor() {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;

    setupVideoControls(videoPlayer);
    setupTimeline();
    setupEditingTools();
    
    console.log('Editor de video inicializado');
}

function setupVideoControls(videoPlayer) {
    var playPauseBtn = document.getElementById('btn-play-pause');
    // Si previewControls.js aún no ha inyectado los controles, reintentar
    if (!playPauseBtn) {
        setTimeout(function() { setupVideoControls(videoPlayer); }, 100);
        return;
    }
    const progressBar = document.getElementById('video-progress');
    const volumeBtn = document.getElementById('btn-volume');
    const speedBtn = document.getElementById('btn-speed');
    const currentTimeEl = document.getElementById('video-current-time');
    const durationEl = document.getElementById('video-duration');

    videoPlayer.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(videoPlayer.duration);
    });

    videoPlayer.addEventListener('timeupdate', () => {
        const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        document.getElementById('video-progress-bar').style.width = progress + '%';
        currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
        updateTimelinePlayhead(videoPlayer.currentTime, videoPlayer.duration);
    });

    videoPlayer.addEventListener('play', () => {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill fs-4"></i>';
    });

    videoPlayer.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill fs-4"></i>';
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            // Usar togglePlayPause (mismo que barra espaciadora) para sincronizar con timeline
            if (typeof togglePlayPause === 'function') {
                togglePlayPause();
            } else if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        });
    }

    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = percentage * videoPlayer.duration;
        });
    }

    if (volumeBtn) {
        volumeBtn.addEventListener('click', () => {
            videoPlayer.muted = !videoPlayer.muted;
            volumeBtn.innerHTML = videoPlayer.muted ? 
                '<i class="bi bi-volume-mute"></i>' : 
                '<i class="bi bi-volume-up"></i>';
        });
    }

    // Speed control manejado por playbackSpeed.js (archivo independiente)
}

function setupTimeline() {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    initTimeline(timeline);
}

function updateTimelinePlayhead(currentTime, duration) {
    const playhead = document.getElementById('playhead');
    const timeline = document.getElementById('timeline');
    
    if (!playhead || !timeline || duration === 0) return;
    
    const percentage = (currentTime / duration) * 100;
    const position = (percentage / 100) * timeline.offsetWidth;
    
    playhead.style.left = position + 'px';
}

function setupEditingTools() {
    const tools = [
        'btn-trim', 'btn-delete', 'btn-speed-control',
        'btn-volume-control', 'btn-add-text', 'btn-add-sticker',
        'btn-add-filter', 'btn-add-transition', 'btn-add-music',
        'btn-add-voiceover', 'btn-export'
    ];

    tools.forEach(toolId => {
        const btn = document.getElementById(toolId);
        if (btn) {
            btn.addEventListener('click', () => handleToolClick(toolId));
        }
    });
}

function handleToolClick(toolId) {
    const toolNames = {
        'btn-split': 'Dividir',
        'btn-trim': 'Recortar',
        'btn-delete': 'Eliminar',
        'btn-speed-control': 'Control de velocidad',
        'btn-volume-control': 'Control de volumen',
        'btn-add-text': 'Agregar texto',
        'btn-add-sticker': 'Agregar sticker',
        'btn-add-filter': 'Agregar filtro',
        'btn-add-transition': 'Agregar transición',
        'btn-add-music': 'Agregar música',
        'btn-add-voiceover': 'Agregar voz',
        'btn-export': 'Exportar'
    };

    console.log('Herramienta seleccionada:', toolNames[toolId]);
    alert(`${toolNames[toolId]} - Funcionalidad en desarrollo`);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function loadVideoToEditor(file) {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;
    
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.load();
    
    addClipToTimeline(0, file.size / 1000000, file.name);
    
    console.log('Video cargado en editor:', file.name);
}
