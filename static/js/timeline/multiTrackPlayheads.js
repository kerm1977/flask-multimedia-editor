// ============================================================================
// Playheads visuales sincronizados para cada pista del timeline.
// Archivo independiente: no modifica código blindado.
//
// Todas las pistas muestran un playhead visual que sigue al playhead
// principal (rojo) del video-track. No tienen reproducción independiente.
// Un solo playhead controla todo, como funcionaba antes.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSyncedPlayheads);
} else {
    initSyncedPlayheads();
}

function initSyncedPlayheads() {
    setTimeout(setupSyncedPlayheads, 500);
    console.log('Playheads sincronizados inicializados');
}

function setupSyncedPlayheads() {
    const mainPlayhead = document.getElementById('timeline-playhead');
    if (!mainPlayhead) {
        setTimeout(setupSyncedPlayheads, 500);
        return;
    }

    const allTracks = document.querySelectorAll('.track-track[id]');
    allTracks.forEach(function(track) {
        const trackId = track.id || '';
        if (!trackId || trackId === 'video-track') return;
        if (track.querySelector('.synced-playhead')) return;
        createSyncedPlayhead(track, trackId);
    });

    requestAnimationFrame(syncPlayheads);

    const tracksContainer = document.querySelector('.tracks-container');
    if (tracksContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('track-row')) {
                        setTimeout(function() {
                            const track = node.querySelector('.track-track[id]');
                            if (track && track.id !== 'video-track' && !track.querySelector('.synced-playhead')) {
                                createSyncedPlayhead(track, track.id);
                            }
                        }, 50);
                    }
                });
            });
        });
        observer.observe(tracksContainer, { childList: true });
    }
}

function createSyncedPlayhead(track, trackId) {
    const isAudio = trackId.startsWith('audio-track');
    const isImage = trackId.startsWith('image-track');
    const color = isAudio ? '#00ff88' : isImage ? '#ffaa00' : '#ff00ff';

    const playhead = document.createElement('div');
    playhead.className = 'synced-playhead';
    playhead.dataset.trackId = trackId;
    playhead.style.cssText =
        'position:absolute;left:0px;top:0;width:20px;height:100%;' +
        'background-color:transparent;z-index:999;pointer-events:none;';

    const line = document.createElement('div');
    line.style.cssText =
        'position:absolute;left:9px;top:0;width:2px;height:100%;' +
        'background-color:' + color + ';box-shadow:0 0 4px ' + color + ';';
    playhead.appendChild(line);

    const handle = document.createElement('div');
    handle.style.cssText =
        'position:absolute;top:-15px;left:0;width:20px;height:20px;' +
        'background-color:' + color + ';border-radius:50%;opacity:0.8;' +
        'border:2px solid #fff;';
    playhead.appendChild(handle);

    track.appendChild(playhead);
}

function syncPlayheads() {
    const mainPlayhead = document.getElementById('timeline-playhead');
    if (mainPlayhead) {
        const left = mainPlayhead.style.left;
        document.querySelectorAll('.synced-playhead').forEach(function(ph) {
            ph.style.left = left;
        });
    }
    requestAnimationFrame(syncPlayheads);
}
