const redoStack = [];
const MAX_REDO_STEPS = 50;

document.addEventListener('DOMContentLoaded', function() {
    const redoBtn = document.getElementById('btn-redo');
    
    if (redoBtn) {
        redoBtn.addEventListener('click', performRedo);
    }
});

function saveRedoState() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;
    
    const state = canvas.innerHTML;
    
    if (redoStack.length >= MAX_REDO_STEPS) {
        redoStack.shift();
    }
    
    redoStack.push(state);
    console.log('Estado de rehacer guardado. Stack size:', redoStack.length);
}

function performRedo() {
    if (redoStack.length === 0) {
        console.log('No hay acciones para rehacer (canvas)');
        return;
    }
    
    const nextState = redoStack.pop();
    const canvas = document.getElementById('main-canvas');
    
    if (canvas) {
        canvas.innerHTML = nextState;
        console.log('Acción rehcha. Stack size:', redoStack.length);
    }
}

