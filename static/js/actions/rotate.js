let isRotateMode = false;
let rotateSelectedElement = null;
let rotateCurrentRotation = 0;

document.addEventListener('DOMContentLoaded', function() {
    const rotateBtn = document.getElementById('btn-rotate');
    
    if (rotateBtn) {
        rotateBtn.addEventListener('click', activateRotateMode);
    }
});

function activateRotateMode() {
    isRotateMode = true;
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;

    canvas.style.cursor = 'alias';
    
    canvas.addEventListener('mousedown', startRotate);
    document.addEventListener('mousemove', doRotate);
    document.addEventListener('mouseup', endRotate);
    
    console.log('Modo de rotar activado (R)');
}

function startRotate(event) {
    if (!isRotateMode) return;
    
    rotateSelectedElement = event.target;
    if (!rotateSelectedElement.classList.contains('selected')) {
        rotateSelectedElement = null;
        return;
    }
    
    const currentTransform = rotateSelectedElement.style.transform || '';
    const match = currentTransform.match(/rotate\((\d+)deg\)/);
    rotateCurrentRotation = match ? parseInt(match[1]) : 0;
}

function doRotate(event) {
    if (!isRotateMode || !rotateSelectedElement) return;
    
    const canvas = document.getElementById('main-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const centerX = canvasRect.left + canvasRect.width / 2;
    const centerY = canvasRect.top + canvasRect.height / 2;
    
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    const degrees = (angle * 180 / Math.PI) + 90;
    
    rotateSelectedElement.style.transform = `rotate(${degrees}deg)`;
}

function endRotate() {
    rotateSelectedElement = null;
}

