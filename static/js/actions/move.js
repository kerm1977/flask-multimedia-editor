let isMoveMode = false;
let moveSelectedElement = null;
let moveOffsetX, moveOffsetY;

document.addEventListener('DOMContentLoaded', function() {
    const moveBtn = document.getElementById('btn-move');
    
    if (moveBtn) {
        moveBtn.addEventListener('click', activateMoveMode);
    }
});

function activateMoveMode() {
    isMoveMode = true;
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;

    canvas.style.cursor = 'move';
    
    canvas.addEventListener('mousedown', startMove);
    document.addEventListener('mousemove', doMove);
    document.addEventListener('mouseup', endMove);
    
    console.log('Modo de mover activado (G)');
}

function startMove(event) {
    if (!isMoveMode) return;
    
    moveSelectedElement = event.target;
    if (!moveSelectedElement.classList.contains('selected')) {
        moveSelectedElement = null;
        return;
    }
    
    const rect = moveSelectedElement.getBoundingClientRect();
    moveOffsetX = event.clientX - rect.left;
    moveOffsetY = event.clientY - rect.top;
}

function doMove(event) {
    if (!isMoveMode || !moveSelectedElement) return;
    
    const canvas = document.getElementById('main-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const x = event.clientX - canvasRect.left - moveOffsetX;
    const y = event.clientY - canvasRect.top - moveOffsetY;
    
    moveSelectedElement.style.left = x + 'px';
    moveSelectedElement.style.top = y + 'px';
}

function endMove() {
    moveSelectedElement = null;
}

