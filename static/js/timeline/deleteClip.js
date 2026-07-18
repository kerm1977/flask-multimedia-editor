// ============================================================================
// deleteClip.js — Eliminar clip seleccionado
//
// Archivo independiente. Enlaza el botón #btn-delete de la barra de
// herramientas con la función blindada deleteSelectedClip().
//
// Funciona igual que la tecla D (que ya está en timelinePlayheadInit.js).
// Ambos llaman a deleteSelectedClip() que reemplaza el clip por un gap.
//
// Requisitos:
//   - Debe haber un clip seleccionado (.timeline-clip.selected)
//   - El clip no debe ser un gap
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeleteClip);
} else {
    initDeleteClip();
}

function initDeleteClip() {
    var deleteBtn = document.getElementById('btn-delete');
    if (!deleteBtn) {
        setTimeout(initDeleteClip, 100);
        return;
    }

    // Clonar para remover listeners previos de videoEditor.js (que muestra alert)
    var newBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);

    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteClipAction();
    });

    console.log('deleteClip inicializado (botón #btn-delete)');
}

// ---------------------------------------------------------------------------
// Eliminar el clip seleccionado usando la función blindada
// ---------------------------------------------------------------------------
function deleteClipAction() {
    var selectedClip = document.querySelector('.timeline-clip.selected');

    if (!selectedClip) {
        console.log('deleteClip: no hay clip seleccionado');
        return;
    }

    if (selectedClip.dataset.isGap === 'true') {
        console.log('deleteClip: no se puede eliminar un gap');
        return;
    }

    // Llamar la función blindada
    if (typeof deleteSelectedClip === 'function') {
        deleteSelectedClip();
        console.log('deleteClip: clip eliminado');
    } else {
        console.error('deleteClip: deleteSelectedClip no está definida');
    }
}
