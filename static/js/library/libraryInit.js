document.addEventListener('DOMContentLoaded', function() {
    initLibraryManager();
});

let selectedFiles = new Set();
let progressInterval = null;
let contextMenuTargetFile = null;

function initLibraryManager() {
    console.log('Inicializando gestor de biblioteca...');
    
    // Event listeners
    const uploadBtn = document.getElementById('btn-library-upload');
    const fileInput = document.getElementById('library-file-input');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleLibraryFileSelect);
    }
    
    // Tab filtering
    const tabs = document.querySelectorAll('#library-tabs .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.type;
            loadLibraryFiles(type);
        });
    });
    
    // Settings button
    document.getElementById('btn-settings')?.addEventListener('click', showSettingsDialog);
    
    // Context menu
    initContextMenu();
    
    // Timeline drop zones
    initTimelineDropZones();
    
    // Load initial files
    loadLibraryFiles();
}
