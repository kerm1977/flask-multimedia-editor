document.addEventListener('DOMContentLoaded', function() {
    const copyBtn = document.getElementById('btn-copy');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copySelection);
    }
});

function copySelection() {
    const selectedElement = getSelectedElement();
    
    if (!selectedElement) {
        alert('No hay elemento seleccionado para copiar');
        return;
    }

    clipboard = selectedElement.cloneNode(true);
    
    console.log('Elemento copiado al portapapeles');
}

function getSelectedElement() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return null;
    
    return canvas.querySelector('.selected');
}

