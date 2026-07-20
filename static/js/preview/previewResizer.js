// ============================================================================
// previewResizer.js — Redimensionamiento vertical del previsualizador
//
// Permite arrastrar el borde inferior del previsualizador para cambiar su altura.
// El timeline se empuja hacia abajo automáticamente.
//
// Funciona insertando un divisor (resize handle) entre el panel de previsualización
// y el timeline. Al arrastrar, se ajusta la altura del .video-preview-container.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreviewResizer);
} else {
    initPreviewResizer();
}

function initPreviewResizer() {
    var previewPanel = document.getElementById('video-preview-panel');
    if (!previewPanel) {
        console.error('previewResizer: no se encontró #video-preview-panel');
        return;
    }

    // Buscar el contenedor de video dentro del panel
    var videoContainer = previewPanel.querySelector('.video-preview-container');
    if (!videoContainer) {
        console.error('previewResizer: no se encontró .video-preview-container');
        return;
    }

    // Crear el divisor arrastrable
    var resizer = document.createElement('div');
    resizer.id = 'preview-resizer';
    resizer.style.cssText =
        'height: 6px; cursor: ns-resize; background: #4a5568; ' +
        'border-radius: 3px; margin: 4px 0; flex-shrink: 0; ' +
        'transition: background 0.2s; position: relative; z-index: 10;';
    resizer.innerHTML =
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'width:40px;height:2px;background:#8899aa;border-radius:1px;"></div>';

    // Insertar el resizer después del panel de previsualización completo
    // Buscar el contenedor padre (el div.d-flex que contiene preview + library)
    var topRow = previewPanel.closest('.d-flex.gap-3');
    if (!topRow) {
        // Fallback: insertar después del panel
        previewPanel.parentNode.insertBefore(resizer, previewPanel.nextSibling);
    } else {
        // Insertar el resizer después de toda la fila superior (preview + library)
        topRow.parentNode.insertBefore(resizer, topRow.nextSibling);
    }

    // Variables de arrastre
    // ⚠️ El resizer cambia la altura del PANEL (#video-preview-panel), no del
    // contenedor. aspectRatio.js tiene un ResizeObserver que detecta el cambio
    // y re-aplica la proporción del aspecto al contenedor automáticamente.
    var isDragging = false;
    var startY = 0;
    var startHeight = 0;

    resizer.addEventListener('mousedown', function(e) {
        isDragging = true;
        startY = e.clientY;
        // ⚠️ Medir la altura del panel, no del contenedor
        startHeight = previewPanel.offsetHeight;
        resizer.style.background = '#007bff';
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var deltaY = e.clientY - startY;
        // ⚠️ Cambiar la altura del panel. El ResizeObserver de aspectRatio.js
        // detectará el cambio y re-aplicará el aspecto al contenedor.
        var newHeight = Math.max(200, Math.min(1200, startHeight + deltaY));
        previewPanel.style.height = newHeight + 'px';
        previewPanel.style.flex = 'none';
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            resizer.style.background = '#4a5568';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    // Touch support
    resizer.addEventListener('touchstart', function(e) {
        isDragging = true;
        startY = e.touches[0].clientY;
        // ⚠️ Medir la altura del panel, no del contenedor
        startHeight = previewPanel.offsetHeight;
        resizer.style.background = '#007bff';
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var deltaY = e.touches[0].clientY - startY;
        // ⚠️ Cambiar la altura del panel. El ResizeObserver de aspectRatio.js
        // detectará el cambio y re-aplicará el aspecto al contenedor.
        var newHeight = Math.max(200, Math.min(1200, startHeight + deltaY));
        previewPanel.style.height = newHeight + 'px';
        previewPanel.style.flex = 'none';
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (isDragging) {
            isDragging = false;
            resizer.style.background = '#4a5568';
        }
    });

    console.log('previewResizer inicializado');
}
