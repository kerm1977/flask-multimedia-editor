document.addEventListener('DOMContentLoaded', function() {
    initTimelineUndoRedo();
});

const timelineUndoStack = [];
const timelineRedoStack = [];
const MAX_TIMELINE_UNDO_STEPS = 50;

function initTimelineUndoRedo() {
    console.log('Inicializando sistema undo/redo para timeline...');

    // Control+Z for undo, Control+Shift+Z or Control+Y for redo
    document.addEventListener('keydown', function(e) {
        const keyLower = e.key.toLowerCase();

        if ((e.ctrlKey || e.metaKey) && keyLower === 'z' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            performTimelineUndo();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && keyLower === 'z') || keyLower === 'y')) {
            e.preventDefault();
            e.stopPropagation();
            performTimelineRedo();
            return;
        }
    }, true); // capture=true para ejecutar antes que keyboardShortcuts.js

    console.log('Sistema undo/redo para timeline inicializado');
}

// ----------------------------------------------------------------------------
// BLINDADO / NO MODIFICAR: El elemento #timeline-playhead vive DENTRO de
// #video-track, pero NUNCA debe guardarse ni restaurarse como parte del
// innerHTML del undo/redo, porque eso destruye el nodo real y rompe sus
// event listeners de arrastre (definidos en timelinePlayhead.js). Estas dos
// funciones excluyen/preservan el playhead en cada snapshot y restauración.
// ----------------------------------------------------------------------------
function getVideoTrackHtmlWithoutPlayhead(videoTrack) {
    const clone = videoTrack.cloneNode(true);
    const playheadInClone = clone.querySelector('#timeline-playhead');
    if (playheadInClone) {
        playheadInClone.remove();
    }
    return clone.innerHTML;
}

function saveTimelineState() {
    // Guardar TODAS las pistas, no solo las 3 originales
    const allTracks = document.querySelectorAll('.tracks-container .track-track[id]');
    const trackStates = {};

    allTracks.forEach(function(track) {
        const id = track.id;
        if (!id) return;

        if (id === 'video-track') {
            trackStates[id] = getVideoTrackHtmlWithoutPlayhead(track);
        } else {
            trackStates[id] = track.innerHTML;
        }
    });

    const state = {
        tracks: trackStates,
        timestamp: Date.now()
    };

    if (timelineUndoStack.length >= MAX_TIMELINE_UNDO_STEPS) {
        timelineUndoStack.shift();
    }

    timelineUndoStack.push(state);
    timelineRedoStack.length = 0;

    console.log('Estado de timeline guardado (todas las pistas). Undo stack:', timelineUndoStack.length);
}

function restoreVideoTrackHtml(videoTrack, html) {
    // Detach the live playhead node so it survives the innerHTML swap intact
    const playhead = document.getElementById('timeline-playhead');
    if (playhead && playhead.parentElement === videoTrack) {
        videoTrack.removeChild(playhead);
    }
    
    videoTrack.innerHTML = html;
    
    // Re-append the same playhead node (keeps its event listeners working)
    if (playhead) {
        videoTrack.appendChild(playhead);
    }
}

function performTimelineUndo() {
    if (timelineUndoStack.length === 0) {
        console.log('No hay acciones para deshacer en timeline');
        return;
    }

    // Guardar estado actual para redo
    const allTracks = document.querySelectorAll('.tracks-container .track-track[id]');
    const currentStates = {};
    allTracks.forEach(function(track) {
        const id = track.id;
        if (!id) return;
        if (id === 'video-track') {
            currentStates[id] = getVideoTrackHtmlWithoutPlayhead(track);
        } else {
            currentStates[id] = track.innerHTML;
        }
    });
    timelineRedoStack.push({ tracks: currentStates, timestamp: Date.now() });

    const previousState = timelineUndoStack.pop();
    restoreAllTrackStates(previousState.tracks);

    if (typeof syncMultiVideoTracks === 'function') {
        setTimeout(syncMultiVideoTracks, 50);
    }

    console.log('Undo realizado. Stack:', timelineUndoStack.length, 'Redo:', timelineRedoStack.length);
}

function performTimelineRedo() {
    if (timelineRedoStack.length === 0) {
        console.log('No hay acciones para rehacer en timeline');
        return;
    }

    // Guardar estado actual para undo
    const allTracks = document.querySelectorAll('.tracks-container .track-track[id]');
    const currentStates = {};
    allTracks.forEach(function(track) {
        const id = track.id;
        if (!id) return;
        if (id === 'video-track') {
            currentStates[id] = getVideoTrackHtmlWithoutPlayhead(track);
        } else {
            currentStates[id] = track.innerHTML;
        }
    });
    timelineUndoStack.push({ tracks: currentStates, timestamp: Date.now() });

    const nextState = timelineRedoStack.pop();
    restoreAllTrackStates(nextState.tracks);

    if (typeof syncMultiVideoTracks === 'function') {
        setTimeout(syncMultiVideoTracks, 50);
    }

    console.log('Redo realizado. Stack:', timelineUndoStack.length, 'Redo:', timelineRedoStack.length);
}

// ---------------------------------------------------------------------------
// Restaurar todas las pistas desde un estado guardado
// ---------------------------------------------------------------------------
function restoreAllTrackStates(trackStates) {
    Object.keys(trackStates).forEach(function(id) {
        const track = document.getElementById(id);
        if (!track) return;

        if (id === 'video-track') {
            restoreVideoTrackHtml(track, trackStates[id]);
        } else {
            track.innerHTML = trackStates[id];
        }
    });
}

// Auto-save state when clips are added or removed
const originalAddClip = typeof addClipToTimeline === 'function' ? addClipToTimeline : null;
if (originalAddClip) {
    window.addClipToTimeline = function(fileData, track) {
        saveTimelineState();
        return originalAddClip(fileData, track);
    };
}
