// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR ⚠️
// Elimina todos los gaps (tecla W) y re-posiciona los clips restantes sin
// espacios entre ellos.
// ============================================================================

function removeGapsAndJoinClips() {
    const videoTrack = document.getElementById('video-track');
    if (!videoTrack) {
        console.log('No se encontró el track de video');
        return;
    }

    // Save state for undo
    if (typeof saveTimelineState === 'function') {
        saveTimelineState();
    }

    // Get all clips (including gaps)
    const allClips = Array.from(videoTrack.querySelectorAll('.timeline-clip'));

    // Filter out gaps and get regular clips
    const regularClips = allClips.filter(clip => clip.dataset.isGap !== 'true');

    // Remove all clips from track
    allClips.forEach(clip => clip.remove());

    // Reposition regular clips without gaps
    let currentPosition = 10; // Start position
    regularClips.forEach(clip => {
        clip.style.left = currentPosition + 'px';
        videoTrack.appendChild(clip);
        currentPosition += parseInt(clip.style.width) + 2; // Add small gap between clips
    });

    // Recalculate video duration based on remaining clips
    recalculateVideoDuration(regularClips);

    console.log('Gaps eliminados y clips unidos');
}
