// ============================================================================
// Visualización de espectro de audio en tiempo real.
// Archivo independiente: no modifica código blindado.
//
// Funcionalidad:
//   1. Crea un canvas de espectro de audio para el video-player
//   2. Crea un canvas de espectro de audio para el audio-player del editor
//   3. Usa Web Audio API (AnalyserNode) para visualizar frecuencias en tiempo real
//   4. Colores vivos y llamativos
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioSpectrum);
} else {
    initAudioSpectrum();
}

const spectrumAnalyserNodes = new Map();

function initAudioSpectrum() {
    setupSpectrumForMedia('video-player', 'video-spectrum-canvas', '#00e5ff', '#00aaff');
    setupSpectrumForMedia('audio-player', 'audio-spectrum-canvas', '#00ff88', '#00cc66');

    console.log('Visualización de espectro de audio inicializada');
}

function setupSpectrumForMedia(mediaElementId, canvasId, topColor, bottomColor) {
    const mediaEl = document.getElementById(mediaElementId);
    if (!mediaEl) return;

    let canvas = document.getElementById(canvasId);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.width = 600;
        canvas.height = 60;

        if (mediaElementId === 'video-player') {
            const overlay = mediaEl.parentElement.querySelector('.video-overlay');
            if (overlay) {
                overlay.appendChild(canvas);
                canvas.style.cssText =
                    'position:absolute;bottom:60px;left:0;right:0;' +
                    'width:100%;height:40px;display:block;' +
                    'opacity:0.85;pointer-events:none;z-index:5;';
            }
        } else if (mediaElementId === 'audio-player') {
            const waveform = document.getElementById('waveform');
            if (waveform && waveform.parentNode) {
                waveform.parentNode.insertBefore(canvas, waveform.nextSibling);
                canvas.style.cssText =
                    'width:100%;height:60px;display:block;' +
                    'background:rgba(0,0,0,0.4);border-radius:4px;margin-top:4px;';
            } else {
                mediaEl.parentNode.appendChild(canvas);
                canvas.style.cssText =
                    'width:100%;height:60px;display:block;' +
                    'background:rgba(0,0,0,0.4);border-radius:4px;margin-top:4px;';
            }
        }
    }

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(mediaEl);
        const analyser = audioCtx.createAnalyser();
        const gainNode = audioCtx.createGain();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        spectrumAnalyserNodes.set(mediaElementId, {
            analyser: analyser,
            gainNode: gainNode,
            audioCtx: audioCtx,
            source: source
        });

        drawSpectrum(canvas, analyser, topColor, bottomColor);
    } catch (e) {
        console.log('No se pudo crear AnalyserNode para', mediaElementId, ':', e.message);
    }
}

function drawSpectrum(canvas, analyser, topColor, bottomColor) {
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function animate() {
        requestAnimationFrame(animate);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bufferLength * 2.5;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            const x = i * barWidth;
            const y = canvas.height - barHeight;

            const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
            gradient.addColorStop(0, topColor);
            gradient.addColorStop(0.5, topColor);
            gradient.addColorStop(1, bottomColor);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - 1, barHeight);

            // Brillo superior
            if (barHeight > 5) {
                ctx.fillStyle = topColor;
                ctx.fillRect(x, y, barWidth - 1, 2);
            }
        }
    }

    animate();
}

window.spectrumAnalyserNodes = spectrumAnalyserNodes;
