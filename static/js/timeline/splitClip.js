// ============================================================================
// splitClip.js — Dividir clip en el punto del playhead
//
// Archivo independiente. No duplica funcionalidad de timelinePlayheadCut.js
// (código blindado). Este archivo enlaza el botón #btn-split y la tecla X
// con la función blindada cutSelectedClipAtPlayhead().
//
// Funciona SOLO sobre el clip seleccionado (.timeline-clip.selected).
// Si no hay clip seleccionado, no hace nada.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplitClip);
} else {
    initSplitClip();
}

function initSplitClip() {
    // Enlazar botón Dividir
    var splitBtn = document.getElementById('btn-split');
    if (splitBtn) {
        // Remover listeners previos de videoEditor.js (que solo muestra alert)
        var newBtn = splitBtn.cloneNode(true);
        splitBtn.parentNode.replaceChild(newBtn, splitBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            splitClipAtPlayhead();
        });
        console.log('splitClip: botón #btn-split enlazado');
    }

    // Enlazar tecla X
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey) {
            if (e.target.matches('input, textarea')) return;
            e.preventDefault();
            splitClipAtPlayhead();
        }
    });

    console.log('splitClip inicializado (botón + tecla X)');
}

// ---------------------------------------------------------------------------
// Dividir el clip seleccionado en la posición del playhead
// Delega en la función blindada cutSelectedClipAtPlayhead() si existe
// ---------------------------------------------------------------------------
function splitClipAtPlayhead() {
    var selectedClip = document.querySelector('.timeline-clip.selected');

    if (!selectedClip) {
        console.log('splitClip: no hay clip seleccionado');
        return;
    }

    // No dividir si es un gap
    if (selectedClip.dataset.isGap === 'true') {
        console.log('splitClip: no se puede dividir un gap');
        return;
    }

    // Verificar que el playhead esté dentro del clip
    var playhead = document.getElementById('timeline-playhead');
    if (!playhead) {
        console.error('splitClip: no se encontró el playhead');
        return;
    }

    var playheadPos = playhead.offsetLeft + 9;
    var clipLeft = parseInt(selectedClip.style.left) || 0;
    var clipWidth = parseInt(selectedClip.style.width) || 100;
    var clipRight = clipLeft + clipWidth;

    if (playheadPos <= clipLeft || playheadPos >= clipRight) {
        console.log('splitClip: el playhead no está dentro del clip seleccionado');
        return;
    }

    // Usar la función blindada si existe
    if (typeof cutSelectedClipAtPlayhead === 'function') {
        cutSelectedClipAtPlayhead();
        console.log('splitClip: clip dividido en posición', playheadPos);
    } else {
        console.error('splitClip: cutSelectedClipAtPlayhead no está definida');
    }
}
