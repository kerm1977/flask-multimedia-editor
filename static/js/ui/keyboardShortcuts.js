document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
});

function handleKeyboardShortcuts(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        
        if (event.shiftKey) {
            performRedo();
            console.log('Atajo: Ctrl+Shift+Z (Rehacer)');
        } else {
            performUndo();
            console.log('Atajo: Ctrl+Z (Deshacer)');
        }
    }
    
    if (event.ctrlKey && event.key === 'c') {
        event.preventDefault();
        copySelection();
        console.log('Atajo: Ctrl+C (Copiar)');
    }
    
    if (event.ctrlKey && event.key === 'x') {
        event.preventDefault();
        cutSelection();
        console.log('Atajo: Ctrl+X (Cortar)');
    }
    
    if (event.ctrlKey && event.key === 'v') {
        event.preventDefault();
        pasteFromClipboard();
        console.log('Atajo: Ctrl+V (Pegar)');
    }
    
    if (event.shiftKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        openFileSelector();
        console.log('Atajo: Shift+A (Abrir selector de archivos)');
    }
    
    if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
        switch(event.key.toLowerCase()) {
            case 'g':
                activateMoveMode();
                console.log('Atajo: G (Mover)');
                break;
            case 's':
                activateScaleMode();
                console.log('Atajo: S (Escalar)');
                break;
            case 'r':
                activateRotateMode();
                console.log('Atajo: R (Rotar)');
                break;
        }
    }
}

function performUndo() {
    if (typeof performTimelineUndo === 'function') {
        performTimelineUndo();
    } else {
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) undoBtn.click();
    }
}

function performRedo() {
    if (typeof performTimelineRedo === 'function') {
        performTimelineRedo();
    } else {
        const redoBtn = document.getElementById('btn-redo');
        if (redoBtn) redoBtn.click();
    }
}

function copySelection() {
    const copyBtn = document.getElementById('btn-copy');
    if (copyBtn) {
        copyBtn.click();
    }
}

function cutSelection() {
    const cutBtn = document.getElementById('btn-cut');
    if (cutBtn) {
        cutBtn.click();
    }
}

function pasteFromClipboard() {
    const pasteBtn = document.getElementById('btn-paste');
    if (pasteBtn) {
        pasteBtn.click();
    }
}

function activateMoveMode() {
    const moveBtn = document.getElementById('btn-move');
    if (moveBtn) {
        moveBtn.click();
    }
}

function activateScaleMode() {
    const scaleBtn = document.getElementById('btn-scale');
    if (scaleBtn) {
        scaleBtn.click();
    }
}

function activateRotateMode() {
    const rotateBtn = document.getElementById('btn-rotate');
    if (rotateBtn) {
        rotateBtn.click();
    }
}

function openFileSelector() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.click();
    }
}

console.log('Atajos de teclado inicializados');
