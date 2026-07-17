let isScaleMode = false;
let scaleSelectedElement = null;
let scaleStartX, scaleStartY, scaleStartWidth, scaleStartHeight;

document.addEventListener('DOMContentLoaded', function() {
    const scaleBtn = document.getElementById('btn-scale');
    
    if (scaleBtn) {
        scaleBtn.addEventListener('click', activateScaleMode);
    }
});

function activateScaleMode() {
    isScaleMode = true;
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;

    canvas.style.cursor = 'nwse-resize';
    
    canvas.addEventListener('mousedown', startScale);
    document.addEventListener('mousemove', doScale);
    document.addEventListener('mouseup', endScale);
    
    console.log('Modo de escalar activado (S)');
}

function startScale(event) {
    if (!isScaleMode) return;
    
    scaleSelectedElement = event.target;
    if (!scaleSelectedElement.classList.contains('selected')) {
        scaleSelectedElement = null;
        return;
    }
    
    scaleStartX = event.clientX;
    scaleStartY = event.clientY;
    scaleStartWidth = scaleSelectedElement.offsetWidth;
    scaleStartHeight = scaleSelectedElement.offsetHeight;
}

function doScale(event) {
    if (!isScaleMode || !scaleSelectedElement) return;
    
    const deltaX = event.clientX - scaleStartX;
    const deltaY = event.clientY - scaleStartY;
    
    const newWidth = Math.max(20, scaleStartWidth + deltaX);
    const newHeight = Math.max(20, scaleStartHeight + deltaY);
    
    scaleSelectedElement.style.width = newWidth + 'px';
    scaleSelectedElement.style.height = newHeight + 'px';
}

function endScale() {
    scaleSelectedElement = null;
}

