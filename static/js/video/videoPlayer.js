document.addEventListener('DOMContentLoaded', function() {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;

    initVideoPlayer(videoPlayer);
});

function initVideoPlayer(videoPlayer) {
    videoPlayer.addEventListener('loadedmetadata', handleVideoLoaded);
    videoPlayer.addEventListener('timeupdate', handleTimeUpdate);
    videoPlayer.addEventListener('play', handlePlay);
    videoPlayer.addEventListener('pause', handlePause);
    
    console.log('Reproductor de video inicializado');
}

function handleVideoLoaded(event) {
    const video = event.target;
    console.log('Video cargado:', video.duration, 'segundos');
}

function handleTimeUpdate(event) {
    const video = event.target;
    const currentTime = video.currentTime;
    const duration = video.duration;
    
    updateTimeline(currentTime, duration);
}

function handlePlay(event) {
    console.log('Video reproduciendo');
}

function handlePause(event) {
    console.log('Video pausado');
}

function loadVideo(file) {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) return;
    
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.load();
    
    console.log('Video cargado:', file.name);
}

function loadVideoInPlayer(videoPath) {
    const videoPlayer = document.getElementById('video-player');
    if (!videoPlayer) {
        console.error('No se encontró el reproductor de video');
        return;
    }
    
    // Convert relative path to absolute URL
    const url = '/' + videoPath;
    
    // Stop any current playback
    if (!videoPlayer.paused) {
        videoPlayer.pause();
    }
    
    // Clear any existing error
    videoPlayer.src = '';
    
    // Set new source
    videoPlayer.src = url;
    videoPlayer.load();
    
    console.log('Video cargado desde servidor:', url);
    
    // Wait for video to be ready
    videoPlayer.addEventListener('loadeddata', function onLoaded() {
        console.log('Video listo para reproducir, duración:', videoPlayer.duration);
        videoPlayer.removeEventListener('loadeddata', onLoaded);
    }, { once: true });
    
    videoPlayer.addEventListener('error', function onError(e) {
        console.error('Error cargando video:', e);
        console.error('Error code:', videoPlayer.error?.code);
        console.error('Error message:', videoPlayer.error?.message);
        
        if (videoPlayer.error?.name === 'AbortError') {
            console.warn('Carga de video abortada (posiblemente archivo muy grande)');
        }
        
        videoPlayer.removeEventListener('error', onError);
    }, { once: true });
    
    // Handle abort errors gracefully
    videoPlayer.addEventListener('abort', function onAbort() {
        console.warn('Carga de video abortada por el navegador');
        videoPlayer.removeEventListener('abort', onAbort);
    }, { once: true });
}

function playVideo() {
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        // Check if video has a source
        if (!videoPlayer.src || videoPlayer.src === '') {
            console.warn('No hay video cargado en el reproductor');
            return;
        }
        
        const playPromise = videoPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Video reproduciendo exitosamente');
                })
                .catch(error => {
                    console.error('Error al reproducir video:', error);
                    if (error.name === 'AbortError') {
                        console.warn('Reproducción abortada por el usuario o el navegador');
                    } else if (error.name === 'NotSupportedError') {
                        console.error('Formato de video no soportado');
                    } else {
                        console.error('Error desconocido:', error);
                    }
                });
        }
    }
}

function pauseVideo() {
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        videoPlayer.pause();
    }
}

function stopVideo() {
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
}

function seekVideo(time) {
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        videoPlayer.currentTime = time;
    }
}

