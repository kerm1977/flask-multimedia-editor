document.addEventListener('DOMContentLoaded', function() {
    const pasteBtn = document.getElementById('btn-paste');
    
    if (pasteBtn) {
        pasteBtn.addEventListener('click', pasteFromClipboard);
    }
});

function pasteFromClipboard() {
    if (!clipboard) {
        alert('No hay contenido en el portapapeles');
        return;
    }

    const canvas = document.getElementById('main-canvas');
    if (!canvas) {
        alert('Canvas no encontrado');
        return;
    }

    const pastedElement = clipboard.cloneNode(true);
    pastedElement.style.position = 'absolute';
    pastedElement.style.left = '50px';
    pastedElement.style.top = '50px';
    
    canvas.appendChild(pastedElement);
    
    console.log('Elemento pegado desde el portapapeles');
}

