// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Núcleo del corte real. Decide si el playhead está sobre un clip real o un
// gap, y controla el <video> en consecuencia:
//   - Gap: pausa + mute + oculta (corte literal, no solo pausa visual).
//   - Clip nuevo: seek exacto al segmento (seekVideoToClipSegment).
//   - Mismo clip: no re-sincroniza (evita jitter), deja avance nativo.
// No agregar aquí lógica que fuerce videoPlayer.currentTime en cada frame.
// ============================================================================

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
