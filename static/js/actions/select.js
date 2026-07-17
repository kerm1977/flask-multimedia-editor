document.addEventListener('DOMContentLoaded', function() {
    const selectBtn = document.getElementById('btn-select');
    
    if (selectBtn) {
        selectBtn.addEventListener('click', activateSelectMode);
    }
});

function activateSelectMode() {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;

    canvas.style.cursor = 'default';
    
    const elements = canvas.querySelectorAll('*');
    elements.forEach(el => {
        el.addEventListener('click', handleElementClick);
    });
    
    console.log('Modo de selección activado');
}

function handleElementClick(event) {
    event.stopPropagation();
    
    const element = event.target;
    
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    element.classList.add('selected');
    
    console.log('Elemento seleccionado:', element);
}

