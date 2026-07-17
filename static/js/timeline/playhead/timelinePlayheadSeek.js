// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Traduce posición de píxel dentro de un clip a tiempo real del video
// original, usando dataset.videoStartTime del clip. Solo debe llamarse al
// ENTRAR a un clip nuevo (ver checkPlayheadOverGap), nunca en cada frame.
// ============================================================================

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
