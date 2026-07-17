const undoStack = [];
const MAX_UNDO_STEPS = 50;

document.addEventListener('DOMContentLoaded', function() {
    const undoBtn = document.getElementById('btn-undo');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', performUndo);
    }
});

function saveState() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;
    
    const state = canvas.innerHTML;
    
    if (undoStack.length >= MAX_UNDO_STEPS) {
        undoStack.shift();
    }
    
    undoStack.push(state);
    console.log('Estado guardado. Stack size:', undoStack.length);
}

function performUndo() {
    if (undoStack.length === 0) {
        console.log('No hay acciones para deshacer (canvas)');
        return;
    }
    
    const previousState = undoStack.pop();
    const canvas = document.getElementById('main-canvas');
    
    if (canvas) {
        canvas.innerHTML = previousState;
        console.log('Acción deshecha. Stack size:', undoStack.length);
    }
}

