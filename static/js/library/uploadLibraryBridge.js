// ============================================================================
// Puente entre el upload de la sección "Subir Archivos" y la biblioteca.
// Archivo independiente: no modifica upload.js ni libraryUpload.js.
//
// Problema: upload.js carga archivos directamente en el reproductor pero no
// los sube a la biblioteca (servidor + DB). Por eso la pestaña de Audio
// aparece vacía aunque el audio se haya cargado en el editor.
//
// Solución: interceptar el cambio del input #file-input y enviar también
// los archivos a /library/upload, para que aparezcan en la biblioteca
// filtrados por tipo (video, audio, image).
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initUploadLibraryBridge();
});

function initUploadLibraryBridge() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput) {
        console.log('No se encontró #file-input para puente de biblioteca');
        return;
    }

    // CRITICAL: Use capture phase (true) so our listener runs BEFORE upload.js.
    // upload.js clears fileInput.value='' inside its change handler, which
    // empties the FileList. If we use bubble phase (default), files are gone.
    // We must also copy File objects to an array since FileList is live.
    fileInput.addEventListener('change', function() {
        const files = Array.from(fileInput.files);
        if (files.length === 0) return;

        // Upload to library after a small delay so upload.js processes first
        setTimeout(function() {
            uploadToLibraryBridge(files);
        }, 200);
    }, true); // capture=true runs before upload.js's bubble-phase listener

    // Also intercept drag & drop on the upload zone (capture phase)
    const uploadZone = document.querySelector('.upload-zone');
    if (uploadZone) {
        uploadZone.addEventListener('drop', function(e) {
            const files = Array.from(e.dataTransfer.files);
            if (files.length === 0) return;

            setTimeout(function() {
                uploadToLibraryBridge(files);
            }, 200);
        }, true);
    }

    console.log('Puente upload-biblioteca inicializado');
}

async function uploadToLibraryBridge(files) {
    const formData = new FormData();
    let hasValidFiles = false;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = getFileTypeForLibrary(file);
        if (fileType !== 'unknown') {
            formData.append('files', file);
            hasValidFiles = true;
        }
    }

    if (!hasValidFiles) return;

    console.log('Puente: subiendo archivos a biblioteca...');

    try {
        const response = await fetch('/library/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            console.log('Puente: archivos subidos a biblioteca:', result.uploaded_files.length);

            // Refresh the library grid if visible
            if (typeof loadLibraryFiles === 'function') {
                const activeTab = document.querySelector('#library-tabs .nav-link.active');
                const filterType = activeTab ? activeTab.dataset.type : '';
                loadLibraryFiles(filterType);
            }
        } else {
            console.error('Puente: error subiendo a biblioteca:', result.error);
        }
    } catch (error) {
        console.error('Puente: error en subida a biblioteca:', error);
    }
}

function getFileTypeForLibrary(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'unknown';
}
