let clipboard = null;

document.addEventListener('DOMContentLoaded', function() {
    const cutBtn = document.getElementById('btn-cut');
    
    if (cutBtn) {
        cutBtn.addEventListener('click', cutSelection);
    }
});

function cutSelection() {
    const selectedElement = getSelectedElement();
    
    if (!selectedElement) {
        alert('No hay elemento seleccionado para cortar');
        return;
    }

    clipboard = selectedElement.cloneNode(true);
    selectedElement.remove();
    
    console.log('Elemento cortado al portapapeles');
}

function getSelectedElement() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return null;
    
    return canvas.querySelector('.selected');
}

