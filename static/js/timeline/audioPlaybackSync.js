// ============================================================================
// Sincronización de reproducción de audio con el timeline.
// Archivo independiente: no modifica código blindado.
//
// Problema: El sistema blindado (timelinePlayheadCheckGap.js) solo controla
// el <video> y solo revisa clips en video-track. Los clips de audio en
// audio-track nunca se reproducen.
//
// Solución: Este archivo usa requestAnimationFrame para:
//   1. Detectar si el timeline está reproduciéndose (isPlaying)
//   2. Encontrar clips de audio en audio-track bajo la posición del playhead
//   3. Reproducir el audio correspondiente usando un elemento <audio> oculto
//   4. Pausar el audio cuando el playhead está fuera del clip
//   5. Manejar múltiples pistas de audio simultáneamente
//   6. Respetar el estado de mute de cada pista (data-muted en el track)
// ============================================================================

// Audio elements ocultos, uno por cada clip de audio activo
const audioPlaybackElements = new Map(); // key: clip element, value: audio element

// Inicializar inmediatamente y también en DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioPlaybackSync);
} else {
    initAudioPlaybackSync();
}

function initAudioPlaybackSync() {
    // Crear contenedor oculto para elementos de audio
    let container = document.getElementById('audio-playback-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'audio-playback-container';
        container.style.display = 'none';
        document.body.appendChild(container);
    }

    // Iniciar el loop de sincronización
    requestAnimationFrame(syncAudioPlayback);
    console.log('Sincronización de reproducción de audio inicializada');
}

function syncAudioPlayback(timestamp) {
    if (typeof isPlaying !== 'undefined' && isPlaying && typeof isDraggingPlayhead !== 'undefined' && !isDraggingPlayhead) {
        const playhead = document.getElementById('timeline-playhead');
        if (playhead) {
            const playheadLeft = parseInt(playhead.style.left) || 0;
            const playheadCenter = playheadLeft + 9; // center offset

            // Buscar TODAS las pistas que pueden tener audio:
            // - audio-track, audio-track-2, etc. (clips de audio puro)
            // - video-track, video-track-2, etc. (el video tiene audio)
            const allTracks = document.querySelectorAll('.track-track[id]');
            const activeClips = new Set();

            allTracks.forEach(track => {
                const trackId = track.id || '';

                // Solo procesar pistas de audio y video
                if (!trackId.startsWith('audio-track') && !trackId.startsWith('video-track')) return;

                // Verificar si la pista está muteada
                const isMuted = track.dataset.muted === 'true';

                const clips = track.querySelectorAll('.timeline-clip');
                clips.forEach(clip => {
                    if (clip.dataset.isGap === 'true') return;

                    const clipLeft = parseInt(clip.style.left) || 0;
                    const clipWidth = parseInt(clip.style.width) || 0;
                    const clipRight = clipLeft + clipWidth;

                    if (playheadCenter >= clipLeft && playheadCenter <= clipRight) {
                        activeClips.add(clip);

                        // Solo reproducir clips de audio-track (no video-track,
                        // porque el video-track ya es controlado por el sistema blindado)
                        if (trackId.startsWith('audio-track')) {
                            if (isMuted) {
                                // Pista muteada - pausar audio si existe
                                const audioEl = audioPlaybackElements.get(clip);
                                if (audioEl && !audioEl.paused) {
                                    audioEl.pause();
                                }
                            } else {
                                playAudioClip(clip, playheadCenter);
                            }
                        }
                    }
                });
            });

            // Pausar y limpiar clips de audio que ya no están activos
            audioPlaybackElements.forEach((audioEl, clip) => {
                if (!activeClips.has(clip)) {
                    if (!audioEl.paused) {
                        audioEl.pause();
                    }
                    audioPlaybackElements.delete(clip);
                }
            });
        }
    } else {
        // Timeline no está reproduciéndose - pausar todos los audios
        audioPlaybackElements.forEach((audioEl) => {
            if (!audioEl.paused) {
                audioEl.pause();
            }
        });
    }

    requestAnimationFrame(syncAudioPlayback);
}

function playAudioClip(clip, playheadPosition) {
    let audioEl = audioPlaybackElements.get(clip);

    if (!audioEl) {
        const originalPath = clip.dataset.originalPath;
        if (!originalPath) {
            console.error('Audio clip sin originalPath:', clip.dataset.filename);
            return;
        }

        audioEl = document.createElement('audio');
        audioEl.src = originalPath;
        audioEl.load();

        const container = document.getElementById('audio-playback-container');
        if (container) {
            container.appendChild(audioEl);
        }

        audioPlaybackElements.set(clip, audioEl);

        audioEl.addEventListener('loadedmetadata', function() {
            if (typeof isPlaying !== 'undefined' && isPlaying) {
                seekAudioClip(audioEl, clip, playheadPosition);
                audioEl.play().catch(() => {});
            }
        });
    } else {
        if (typeof isPlaying !== 'undefined' && isPlaying && audioEl.paused) {
            seekAudioClip(audioEl, clip, playheadPosition);
            audioEl.play().catch(() => {});
        }
    }
}

function seekAudioClip(audioEl, clip, playheadPosition) {
    const clipLeft = parseInt(clip.style.left) || 0;
    const pixelsPerSecond = 10;
    const positionInClip = playheadPosition - clipLeft;
    const timeInClip = positionInClip / pixelsPerSecond;
    const videoStartTime = parseFloat(clip.dataset.videoStartTime) || 0;
    const targetTime = videoStartTime + timeInClip;

    if (audioEl.duration && targetTime < audioEl.duration) {
        audioEl.currentTime = targetTime;
    }
}

// Función pública para mutear/desmutear una pista
function setTrackMuted(trackId, muted) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.dataset.muted = muted ? 'true' : 'false';

    if (muted) {
        // Pausar todos los audios de esta pista
        audioPlaybackElements.forEach((audioEl, clip) => {
            if (clip.closest && clip.closest('#' + trackId)) {
                if (!audioEl.paused) audioEl.pause();
            }
        });
    }

    console.log('Pista', trackId, muted ? 'muteada' : 'desmuteada');
}

// Expose para trackControls.js
window.setTrackMuted = setTrackMuted;
