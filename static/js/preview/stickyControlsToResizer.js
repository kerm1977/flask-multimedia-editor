// ============================================================================
// BLINDADO / PROHIBIDO MODIFICAR SIN AUTORIZACION EXPLICITA
// ============================================================================
// stickyControlsToResizer.js - Pega la barra de controles al #preview-resizer
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica previewControls.js,
// previewResizer.js, index.html, ni ningun otro archivo.
//
// *** PROHIBIDO TOCAR ***
//   - NO cambiar la logica de mover #preview-controls-host
//   - NO cambiar la insercion antes de #preview-resizer
//   - NO cambiar los estilos inline aplicados
//   - TODO DEBE QUEDAR INTEGRO COMO ESTA
// ============================================================================
//
// FUNCIONALIDAD:
//   - Mueve #preview-controls-host fuera de #video-preview-panel y lo
//     inserta JUSTO antes de #preview-resizer en el DOM.
//   - Asi la barra de controles (play, progreso, volumen, tiempo) queda
//     pegada al resizer como si fueran una sola pieza.
//   - Al arrastrar el resizer, la barra de controles se mueve junto con el.
//
// NO TOCAR:
//   - previewControls.js: no se modifica
//   - previewResizer.js: no se modifica
//   - index.html: no se modifica
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initStickyControls, 600);
    });
} else {
    setTimeout(initStickyControls, 600);
}

function initStickyControls() {
    function tryInit() {
        var controlsHost = document.getElementById('preview-controls-host');
        var resizer = document.getElementById('preview-resizer');

        if (!controlsHost || !resizer) {
            setTimeout(tryInit, 300);
            return;
        }

        if (controlsHost.dataset.stickyInit === 'true') return;
        controlsHost.dataset.stickyInit = 'true';

        // Mover #preview-controls-host para que este JUSTO antes del #preview-resizer
        // Asi quedan pegados como una sola pieza
        resizer.parentNode.insertBefore(controlsHost, resizer);

        // Estilos: la barra de controles pegada al resizer
        controlsHost.style.cssText =
            'flex: 0 0 auto !important;' +
            'flex-shrink: 0 !important;' +
            'position: relative !important;' +
            'z-index: 100 !important;' +
            'width: 100% !important;' +
            'margin: 0 !important;' +
            'padding: 0 !important;';

        // La barra interna pegada al resizer sin margen
        var bar = controlsHost.querySelector('.video-controls-bar');
        if (bar) {
            bar.style.marginTop = '0';
            bar.style.marginBottom = '0';
            bar.style.borderRadius = '0 0 0 0';
            bar.style.boxShadow = '0 -2px 8px rgba(0,0,0,0.3)';
            bar.style.background = 'rgba(33, 37, 41, 0.98) !important';
        }

        // El resizer ahora es el "pie" de la barra de controles
        // Asegurar que no haya separacion entre ellos
        resizer.style.marginTop = '0';
        resizer.style.borderRadius = '0 0 3px 3px';

        console.log('stickyControlsToResizer: barra de controles pegada al resizer');
    }
    tryInit();
}
