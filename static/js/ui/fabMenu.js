document.addEventListener('DOMContentLoaded', function() {
    const resetLayoutBtn = document.getElementById('btn-reset-layout');
    const clearCacheBtn = document.getElementById('btn-clear-cache');
    const exportSettingsBtn = document.getElementById('btn-export-settings');
    const toggleConsoleBtn = document.getElementById('btn-toggle-console');
    const aboutBtn = document.getElementById('btn-about');

    if (resetLayoutBtn) {
        resetLayoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetLayout();
        });
    }

    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearCache();
        });
    }

    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportSettings();
        });
    }

    if (toggleConsoleBtn) {
        toggleConsoleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleConsole();
        });
    }

    if (aboutBtn) {
        aboutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAbout();
        });
    }
});

function resetLayout() {
    const panels = document.querySelectorAll('.draggable-panel');
    
    panels.forEach(panel => {
        const panelId = panel.id;
        
        localStorage.removeItem(`panel_${panelId}_left`);
        localStorage.removeItem(`panel_${panelId}_top`);
        
        panel.style.position = '';
        panel.style.left = '';
        panel.style.top = '';
        panel.style.zIndex = '';
    });
    
    console.log('Layout reseteado');
    alert('Layout reseteado correctamente');
}

function clearCache() {
    localStorage.clear();
    console.log('Caché limpiada');
    alert('Caché limpiada correctamente');
}

function exportSettings() {
    const settings = {};
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        settings[key] = localStorage.getItem(key);
    }
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'editor-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Configuración exportada');
}

function showAbout() {
    const aboutInfo = `
Editor Integral de Medios
Versión 1.0.0

Un editor modular de video, foto y audio
desarrollado con Flask y JavaScript.

Características:
- Editor de video con timeline multi-track
- Editor de foto con capas
- Editor de audio con waveform
- Paneles arrastrables
- Atajos de teclado
    `;
    
    alert(aboutInfo);
}
