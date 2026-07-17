document.addEventListener('DOMContentLoaded', function() {
    initTimelineUndoRedo();
});

const timelineUndoStack = [];
const timelineRedoStack = [];
const MAX_TIMELINE_UNDO_STEPS = 50;

function initTimelineUndoRedo() {
    console.log('Inicializando sistema undo/redo para timeline...');
    
    // Control+Z for undo
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            performTimelineUndo();
        }
        
        // Control+Shift+Z or Control+Y for redo
        // NOTE: e.key becomes 'Z' (uppercase) when Shift is held, so compare
        // case-insensitively here.
        const keyLower = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (e.shiftKey && keyLower === 'z' || keyLower === 'y')) {
            e.preventDefault();
            performTimelineRedo();
        }
    });
    
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
    const videoTrack = document.getElementById('video-track');
    const audioTrack = document.getElementById('audio-track');
    const effectsTrack = document.getElementById('effects-track');
    
    if (!videoTrack || !audioTrack || !effectsTrack) return;
    
    const state = {
        videoTrack: getVideoTrackHtmlWithoutPlayhead(videoTrack),
        audioTrack: audioTrack.innerHTML,
        effectsTrack: effectsTrack.innerHTML,
        timestamp: Date.now()
    };
    
    if (timelineUndoStack.length >= MAX_TIMELINE_UNDO_STEPS) {
        timelineUndoStack.shift();
    }
    
    timelineUndoStack.push(state);
    // Clear redo stack when new action is performed
    timelineRedoStack.length = 0;
    
    console.log('Estado de timeline guardado. Undo stack size:', timelineUndoStack.length);
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
    
    const videoTrack = document.getElementById('video-track');
    const audioTrack = document.getElementById('audio-track');
    const effectsTrack = document.getElementById('effects-track');
    
    const currentState = {
        videoTrack: getVideoTrackHtmlWithoutPlayhead(videoTrack),
        audioTrack: audioTrack.innerHTML,
        effectsTrack: effectsTrack.innerHTML,
        timestamp: Date.now()
    };
    
    // Save current state to redo stack
    timelineRedoStack.push(currentState);
    
    const previousState = timelineUndoStack.pop();
    
    if (videoTrack) restoreVideoTrackHtml(videoTrack, previousState.videoTrack);
    if (audioTrack) audioTrack.innerHTML = previousState.audioTrack;
    if (effectsTrack) effectsTrack.innerHTML = previousState.effectsTrack;
    
    console.log('Acción de timeline deshecha. Undo stack size:', timelineUndoStack.length);
    console.log('Redo stack size:', timelineRedoStack.length);
}

function performTimelineRedo() {
    if (timelineRedoStack.length === 0) {
        console.log('No hay acciones para rehacer en timeline');
        return;
    }
    
    const videoTrack = document.getElementById('video-track');
    const audioTrack = document.getElementById('audio-track');
    const effectsTrack = document.getElementById('effects-track');
    
    const nextState = timelineRedoStack.pop();
    
    const currentState = {
        videoTrack: getVideoTrackHtmlWithoutPlayhead(videoTrack),
        audioTrack: audioTrack.innerHTML,
        effectsTrack: effectsTrack.innerHTML,
        timestamp: Date.now()
    };
    
    // Save current state back to undo stack
    timelineUndoStack.push(currentState);
    
    if (videoTrack) restoreVideoTrackHtml(videoTrack, nextState.videoTrack);
    if (audioTrack) audioTrack.innerHTML = nextState.audioTrack;
    if (effectsTrack) effectsTrack.innerHTML = nextState.effectsTrack;
    
    console.log('Acción de timeline rehicha. Redo stack size:', timelineRedoStack.length);
    console.log('Undo stack size:', timelineUndoStack.length);
}

// Auto-save state when clips are added or removed
const originalAddClip = addClipToTimeline;
if (typeof originalAddClip === 'function') {
    window.addClipToTimeline = function(fileData, track) {
        saveTimelineState();
        return originalAddClip(fileData, track);
    };
}
