document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;

    initCanvas(canvas);
});

function initCanvas(canvas) {
    canvas.style.position = 'relative';
    canvas.style.overflow = 'hidden';
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    
    console.log('Canvas inicializado');
}

function handleCanvasClick(event) {
    if (event.target === event.currentTarget) {
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event) {
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            loadImageToCanvas(file);
        }
    }
}

function loadImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.position = 'absolute';
        img.style.left = '50px';
        img.style.top = '50px';
        img.style.maxWidth = '300px';
        img.classList.add('canvas-element');
        
        const canvas = document.getElementById('main-canvas');
        canvas.appendChild(img);
        
        updateLayersPanel();
    };
    reader.readAsDataURL(file);
}

function updateLayersPanel() {
    const canvas = document.getElementById('main-canvas');
    const elements = canvas.querySelectorAll('.canvas-element');
    
    const layersPanel = document.getElementById('layers-panel');
    if (!layersPanel) return;
    
    layersPanel.innerHTML = '';
    
    elements.forEach((el, index) => {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.textContent = `Capa ${index + 1}`;
        layerItem.addEventListener('click', () => {
            document.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            document.querySelectorAll('.layer-item').forEach(l => l.classList.remove('selected'));
            layerItem.classList.add('selected');
        });
        layersPanel.appendChild(layerItem);
    });
}

