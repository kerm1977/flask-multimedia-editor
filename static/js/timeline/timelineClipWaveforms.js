// ============================================================================
// Ondas de espectro estáticas sobre los clips del timeline.
// Archivo totalmente independiente: no modifica código blindado ni otros archivos.
//
// Funcionalidad:
//   1. Dibuja ondas de audio simuladas sobre cada clip de audio y video
//   2. Colores llamativos: cyan brillante para video, verde neón para audio
//   3. Detecta automáticamente nuevos clips agregados al timeline
//   4. No interfiere con el texto del clip ni con el drag & drop
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimelineClipWaveforms);
} else {
    initTimelineClipWaveforms();
}

function initTimelineClipWaveforms() {
    drawAllClipWaveforms();

    // Observar nuevos clips agregados al timeline
    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            let shouldRedraw = false;
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('timeline-clip')) {
                            shouldRedraw = true;
                        } else if (node.querySelectorAll) {
                            const clips = node.querySelectorAll('.timeline-clip');
                            if (clips.length > 0) shouldRedraw = true;
                        }
                    }
                });
            });
            if (shouldRedraw) {
                setTimeout(drawAllClipWaveforms, 100);
            }
        });
        observer.observe(tracksContainer, { childList: true, subtree: true });
    }

    console.log('Ondas de clips del timeline inicializadas');
}

function drawAllClipWaveforms() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(function(clip) {
        const track = clip.closest('.track-track');
        if (!track) return;
        const trackId = track.id || '';
        if (!trackId.startsWith('audio-track') && !trackId.startsWith('video-track')) return;

        // No redibujar si ya tiene canvas
        if (clip.querySelector('.clip-waveform-canvas')) return;

        const clipWidth = parseInt(clip.style.width) || 100;
        const clipHeight = parseInt(clip.style.height) || 50;

        const canvas = document.createElement('canvas');
        canvas.className = 'clip-waveform-canvas';
        canvas.width = clipWidth;
        canvas.height = clipHeight;
        canvas.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;' +
            'pointer-events:none;opacity:0.7;';

        const ctx = canvas.getContext('2d');

        const seed = clip.dataset.filename
            ? clip.dataset.filename.split('').reduce(function(a, b) { return a + b.charCodeAt(0); }, 0)
            : Math.random() * 1000;

        const isAudio = trackId.startsWith('audio-track');
        const topColor = isAudio ? '#00ff88' : '#00e5ff';
        const midColor = isAudio ? '#00cc66' : '#00aaff';
        const bottomColor = isAudio ? '#007a33' : '#006699';

        const centerY = clipHeight / 2;

        // Fondo gradiente sutil
        const bgGradient = ctx.createLinearGradient(0, 0, 0, clipHeight);
        bgGradient.addColorStop(0, 'rgba(0,0,0,0)');
        bgGradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, clipWidth, clipHeight);

        // Dibujar onda con gradiente
        ctx.lineWidth = 1.5;

        // Línea superior (espejo)
        const gradientTop = ctx.createLinearGradient(0, 0, 0, centerY);
        gradientTop.addColorStop(0, topColor);
        gradientTop.addColorStop(1, midColor);

        // Línea inferior
        const gradientBottom = ctx.createLinearGradient(0, centerY, 0, clipHeight);
        gradientBottom.addColorStop(0, midColor);
        gradientBottom.addColorStop(1, bottomColor);

        // Generar puntos de la onda
        const points = [];
        for (let x = 0; x < clipWidth; x++) {
            const value = Math.sin((x + seed) * 0.3) * Math.sin((x + seed) * 0.07) * 0.4
                + Math.sin((x + seed) * 0.1) * 0.3
                + Math.sin((x + seed) * 0.5) * 0.15;
            points.push(centerY + value * centerY * 0.85);
        }

        // Dibujar onda superior (mirror up)
        ctx.strokeStyle = gradientTop;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < points.length; x++) {
            const mirrorY = centerY - (points[x] - centerY);
            ctx.lineTo(x, mirrorY);
        }
        ctx.stroke();

        // Dibujar onda inferior
        ctx.strokeStyle = gradientBottom;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < points.length; x++) {
            ctx.lineTo(x, points[x]);
        }
        ctx.stroke();

        // Línea central brillante
        ctx.strokeStyle = topColor + '60';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(clipWidth, centerY);
        ctx.stroke();

        clip.appendChild(canvas);
    });
}
