// ============================================================================
// Gestión completa de importación y exportación de archivos de audio.
// Archivo independiente: no modifica código blindado.
//
// Formatos soportados: MP3, WAV, AAC, AC3, WMA, OGG, FLAC, M4A
//
// Funcionalidad:
//   1. Botón "Importar Audio" dedicado en el editor de audio
//   2. Subir audio al servidor + DB (/library/upload)
//   3. Cargar audio en el reproductor del editor
//   4. Refrescar la pestaña de Audio en la biblioteca automáticamente
//   5. Exportar audio (convertir a MP3, AAC)
//   6. Intercepta también el upload general (Shift+A) para capturar audios
// ============================================================================

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'aac', 'ac3', 'wma', 'ogg', 'flac', 'm4a'];

// Inicializar inmediatamente y también en DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioImportExport);
} else {
    initAudioImportExport();
}

function initAudioImportExport() {
    // --- Botón dedicado "Importar Audio" ---
    const btnAudioUpload = document.getElementById('btn-audio-upload');
    const audioFileInput = document.getElementById('audio-file-input');

    if (btnAudioUpload && audioFileInput) {
        btnAudioUpload.addEventListener('click', function() {
            audioFileInput.click();
        });

        audioFileInput.addEventListener('change', function() {
            if (audioFileInput.files && audioFileInput.files.length > 0) {
                handleAudioImport(audioFileInput.files);
            }
            audioFileInput.value = '';
        });
    }

    // --- Botón "Refrescar Biblioteca" ---
    const btnAudioRefresh = document.getElementById('btn-audio-refresh');
    if (btnAudioRefresh) {
        btnAudioRefresh.addEventListener('click', function() {
            refreshAudioLibrary();
        });
    }

    // --- Intercept tab-audio click para recargar biblioteca ---
    const tabAudio = document.getElementById('tab-audio');
    if (tabAudio) {
        tabAudio.addEventListener('click', function() {
            setTimeout(refreshAudioLibrary, 100);
        });
    }

    // --- Intercept nav-audio click para recargar biblioteca ---
    const navAudio = document.getElementById('nav-audio');
    if (navAudio) {
        navAudio.addEventListener('click', function() {
            setTimeout(refreshAudioLibrary, 200);
        });
    }

    // --- Intercept nav-video click para recargar biblioteca ---
    const navVideo = document.getElementById('nav-video');
    if (navVideo) {
        navVideo.addEventListener('click', function() {
            setTimeout(function() {
                if (typeof loadLibraryFiles === 'function') {
                    loadLibraryFiles();
                }
            }, 200);
        });
    }

    // --- Intercept el input general #file-input para capturar audios ---
    // Usar capture=true para ejecutar ANTES que upload.js
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const files = Array.from(fileInput.files);
            const audioFiles = files.filter(isAudioFile);
            if (audioFiles.length > 0) {
                console.log('Bridge: detectados ' + audioFiles.length + ' archivos de audio');
                uploadAudioFilesToLibrary(audioFiles);
            }
        }, true);
    }

    // --- Intercept drag & drop en upload-zone ---
    const uploadZone = document.querySelector('.upload-zone');
    if (uploadZone) {
        uploadZone.addEventListener('drop', function(e) {
            const files = Array.from(e.dataTransfer.files);
            const audioFiles = files.filter(isAudioFile);
            if (audioFiles.length > 0) {
                console.log('Bridge drag: detectados ' + audioFiles.length + ' archivos de audio');
                uploadAudioFilesToLibrary(audioFiles);
            }
        }, true);
    }

    // --- Botones de exportación ---
    const btnConvertMp3 = document.getElementById('btn-convert-mp3');
    if (btnConvertMp3) {
        btnConvertMp3.addEventListener('click', function() {
            exportAudio('mp3');
        });
    }

    const btnConvertAac = document.getElementById('btn-convert-aac');
    if (btnConvertAac) {
        btnConvertAac.addEventListener('click', function() {
            exportAudio('aac');
        });
    }

    console.log('Sistema de importación/exportación de audio inicializado');
}

// ---------------------------------------------------------------------------
// Importar audio: subir al servidor + cargar en reproductor
// ---------------------------------------------------------------------------
async function handleAudioImport(fileList) {
    const files = Array.from(fileList);
    console.log('Importando ' + files.length + ' archivo(s) de audio...');

    // 1. Cargar cada archivo en el reproductor (local)
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isAudioFile(file)) {
            loadAudioInPlayer(file);
        }
    }

    // 2. Subir todos al servidor/biblioteca
    await uploadAudioFilesToLibrary(files);

    // 3. Refrescar la pestaña de audio en la biblioteca
    refreshAudioLibrary();
}

function loadAudioInPlayer(file) {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer) return;

    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    audioPlayer.load();
    console.log('Audio cargado en reproductor:', file.name);
}

// ---------------------------------------------------------------------------
// Subir archivos de audio a /library/upload
// ---------------------------------------------------------------------------
async function uploadAudioFilesToLibrary(files) {
    const formData = new FormData();
    let count = 0;

    for (let i = 0; i < files.length; i++) {
        if (isAudioFile(files[i])) {
            formData.append('files', files[i]);
            count++;
        }
    }

    if (count === 0) return;

    console.log('Subiendo ' + count + ' archivos de audio a biblioteca...');

    try {
        const response = await fetch('/library/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            console.log('Audio subido a biblioteca:', count, 'archivos');
            refreshAudioLibrary();
        } else {
            console.error('Error subiendo audio a biblioteca:', result.error);
        }
    } catch (error) {
        console.error('Error en subida de audio:', error);
    }
}

// ---------------------------------------------------------------------------
// Refrescar la pestaña de Audio en la biblioteca
// ---------------------------------------------------------------------------
function refreshAudioLibrary() {
    if (typeof loadLibraryFiles === 'function') {
        console.log('Refrescando biblioteca de audio...');
        loadLibraryFiles('audio');
    } else {
        console.warn('loadLibraryFiles no disponible');
    }
}

// ---------------------------------------------------------------------------
// Exportar audio desde el editor
// ---------------------------------------------------------------------------
async function exportAudio(targetFormat) {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer || !audioPlayer.src) {
        console.error('No hay audio cargado para exportar');
        return;
    }

    console.log('Exportando audio a formato:', targetFormat);

    // Buscar el archivo de audio en la biblioteca
    const libraryGrid = document.getElementById('library-files-grid');
    let sourcePath = null;

    if (libraryGrid) {
        const audioCards = libraryGrid.querySelectorAll('[data-file-type="audio"]');
        for (let i = 0; i < audioCards.length; i++) {
            if (audioPlayer.src.includes(audioCards[i].dataset.filename)) {
                sourcePath = audioCards[i].dataset.originalPath;
                break;
            }
        }
    }

    if (!sourcePath) {
        sourcePath = audioPlayer.src;
    }

    try {
        const formData = new FormData();
        formData.append('file_path', sourcePath);
        formData.append('target_format', targetFormat);

        const response = await fetch('/audio/convert', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'exported_audio.' + targetFormat;
            link.click();
            URL.revokeObjectURL(url);
            console.log('Audio exportado a', targetFormat);
        } else {
            console.error('Error en exportación de audio');
        }
    } catch (error) {
        console.error('Error exportando audio:', error);
    }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function isAudioFile(file) {
    if (!file || !file.name) return false;
    if (file.type && file.type.startsWith('audio/')) return true;
    const ext = file.name.split('.').pop().toLowerCase();
    return AUDIO_EXTENSIONS.includes(ext);
}

// Expose para otros módulos
window.importAudioToLibrary = uploadAudioFilesToLibrary;
window.loadAudioInEditor = loadAudioInPlayer;
window.exportAudio = exportAudio;
window.refreshAudioLibrary = refreshAudioLibrary;
