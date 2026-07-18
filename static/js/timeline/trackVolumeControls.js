// ============================================================================
// Controles de volumen independiente por pista.
// Archivo independiente: no modifica código blindado.
//
// Funcionalidad:
//   1. Agrega un slider horizontal compacto de volumen junto a cada pista
//   2. Video-track: controla el volumen del video-player via Web Audio API gainNode
//   3. Audio-track: controla el volumen de los elementos <audio> de audioPlaybackSync.js
//   4. Cada pista tiene su volumen independiente (0% a 100%)
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackVolumeControls);
} else {
    initTrackVolumeControls();
}

// Volumen por pista: { trackId: volume (0-1) }
const trackVolumes = new Map();

// Inyectar estilos CSS personalizados para los sliders
const volumeStyle = document.createElement('style');
volumeStyle.id = 'track-volume-style';
volumeStyle.textContent = `
    .vol-slider-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
        width: 50px;
        height: 60px;
        gap: 2px;
        justify-content: center;
    }
    .vol-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 45px;
        height: 4px;
        border-radius: 2px;
        background: #333;
        outline: none;
        cursor: pointer;
    }
    .vol-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #0d6efd;
        cursor: pointer;
        border: 1px solid #fff;
    }
    .vol-slider::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #0d6efd;
        cursor: pointer;
        border: 1px solid #fff;
    }
    .vol-label {
        font-size: 8px;
        color: #8899aa;
        line-height: 1;
        user-select: none;
    }
`;
document.head.appendChild(volumeStyle);

function initTrackVolumeControls() {
    addVolumeSlidersToExistingTracks();

    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('track-row')) {
                        setTimeout(function() {
                            addVolumeSliderToTrackRow(node);
                        }, 50);
                    }
                });
            });
        });
        observer.observe(tracksContainer, { childList: true });
    }

    requestAnimationFrame(applyVolumesContinuously);
    console.log('Controles de volumen por pista inicializados');
}

function addVolumeSlidersToExistingTracks() {
    document.querySelectorAll('.track-row').forEach(addVolumeSliderToTrackRow);
}

function addVolumeSliderToTrackRow(row) {
    if (row.querySelector('.vol-slider-wrap')) return;

    const track = row.querySelector('.track-track');
    if (!track) return;
    const trackId = track.id || '';
    if (!trackId || (!trackId.startsWith('audio-track') && !trackId.startsWith('video-track'))) return;

    const wrap = document.createElement('div');
    wrap.className = 'vol-slider-wrap';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'vol-slider';
    slider.min = '0';
    slider.max = '100';
    slider.value = '100';
    slider.dataset.trackId = trackId;

    const label = document.createElement('span');
    label.className = 'vol-label';
    label.textContent = '100%';

    slider.addEventListener('input', function() {
        const vol = parseInt(slider.value) / 100;
        trackVolumes.set(trackId, vol);
        label.textContent = slider.value + '%';
        applyVolumeToTrack(trackId, vol);
    });

    // Click directo en cualquier parte del slider
    slider.addEventListener('click', function(e) {
        const vol = parseInt(slider.value) / 100;
        trackVolumes.set(trackId, vol);
        label.textContent = slider.value + '%';
        applyVolumeToTrack(trackId, vol);
    });

    wrap.appendChild(slider);
    wrap.appendChild(label);

    const controlsBtns = row.querySelector('.track-controls-btns');
    if (controlsBtns) {
        controlsBtns.parentNode.insertBefore(wrap, controlsBtns.nextSibling);
    } else {
        const numBadge = row.querySelector('.track-number-badge');
        if (numBadge) {
            numBadge.parentNode.insertBefore(wrap, numBadge.nextSibling);
        } else {
            row.appendChild(wrap);
        }
    }

    trackVolumes.set(trackId, 1.0);
}

function applyVolumeToTrack(trackId, volume) {
    if (trackId.startsWith('video-track')) {
        const nodes = window.spectrumAnalyserNodes ? window.spectrumAnalyserNodes.get('video-player') : null;
        if (nodes && nodes.gainNode) {
            nodes.gainNode.gain.value = volume;
        } else {
            const videoPlayer = document.getElementById('video-player');
            if (videoPlayer) videoPlayer.volume = volume;
        }
    }
}

function applyVolumesContinuously() {
    // Aplicar volumen a los <audio> del audioPlaybackSync.js
    const container = document.getElementById('audio-playback-container');
    if (container) {
        const audioEls = container.querySelectorAll('audio');
        audioEls.forEach(function(audioEl) {
            if (!audioEl.paused) {
                // Buscar el clip padre para determinar el track
                audioPlaybackElements.forEach(function(audioEl2, clip) {
                    if (audioEl2 === audioEl) {
                        const trackEl = clip.closest('.track-track');
                        if (trackEl) {
                            const vol = trackVolumes.get(trackEl.id);
                            if (vol !== undefined) {
                                audioEl.volume = vol;
                            }
                        }
                    }
                });
            }
        });
    }

    // Reaplicar volumen del video-player
    trackVolumes.forEach(function(volume, trackId) {
        if (trackId.startsWith('video-track')) {
            const nodes = window.spectrumAnalyserNodes ? window.spectrumAnalyserNodes.get('video-player') : null;
            if (nodes && nodes.gainNode) {
                nodes.gainNode.gain.value = volume;
            } else {
                const videoPlayer = document.getElementById('video-player');
                if (videoPlayer && !videoPlayer.muted) {
                    videoPlayer.volume = volume;
                }
            }
        }
    });

    requestAnimationFrame(applyVolumesContinuously);
}
