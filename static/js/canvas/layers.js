document.addEventListener('DOMContentLoaded', function() {
    const layersPanel = document.getElementById('layers-panel');
    if (!layersPanel) return;

    initLayersPanel();
});

function initLayersPanel() {
    const layersPanel = document.getElementById('layers-panel');
    
    layersPanel.addEventListener('click', handleLayerClick);
    
    console.log('Panel de capas inicializado');
}

function handleLayerClick(event) {
    const layerItem = event.target.closest('.layer-item');
    if (!layerItem) return;
    
    const layerIndex = Array.from(layerItem.parentNode.children).indexOf(layerItem);
    selectLayerByIndex(layerIndex);
}

function selectLayerByIndex(index) {
    const canvas = document.getElementById('main-canvas');
    const elements = canvas.querySelectorAll('.canvas-element');
    
    if (index >= 0 && index < elements.length) {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        elements[index].classList.add('selected');
        
        const layerItems = document.querySelectorAll('.layer-item');
        layerItems.forEach(item => item.classList.remove('selected'));
        layerItems[index].classList.add('selected');
    }
}

function moveLayerUp(index) {
    const canvas = document.getElementById('main-canvas');
    const elements = canvas.querySelectorAll('.canvas-element');
    
    if (index > 0 && index < elements.length) {
        const currentElement = elements[index];
        const previousElement = elements[index - 1];
        
        canvas.insertBefore(currentElement, previousElement);
        updateLayersPanel();
    }
}

function moveLayerDown(index) {
    const canvas = document.getElementById('main-canvas');
    const elements = canvas.querySelectorAll('.canvas-element');
    
    if (index >= 0 && index < elements.length - 1) {
        const currentElement = elements[index];
        const nextElement = elements[index + 1];
        
        canvas.insertBefore(nextElement, currentElement);
        updateLayersPanel();
    }
}

function deleteLayer(index) {
    const canvas = document.getElementById('main-canvas');
    const elements = canvas.querySelectorAll('.canvas-element');
    
    if (index >= 0 && index < elements.length) {
        elements[index].remove();
        updateLayersPanel();
    }
}

