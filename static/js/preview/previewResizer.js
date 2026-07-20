// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR SIN AUTORIZACIÓN ⚠️
// ============================================================================
// previewResizer.js — Redimensionamiento vertical del previsualizador
//
// Permite arrastrar el borde inferior del previsualizador para cambiar su altura.
// El timeline se empuja hacia abajo automáticamente.
//
// Funciona insertando un divisor (resize handle) entre el panel de previsualización
// y el timeline. Al arrastrar, se ajusta la altura del PANEL.
//
// ────────────────────────────────────────────────────────────────────────────
// CÓMO FUNCIONA (flujo completo):
// ────────────────────────────────────────────────────────────────────────────
//   1. Este archivo crea un divisor (#preview-resizer) entre la fila superior
//      (preview + library) y el timeline.
//   2. Al arrastrar el divisor, cambia la altura de #video-preview-panel.
//   3. aspectRatio.js tiene un ResizeObserver en #video-preview-panel.
//   4. El ResizeObserver detecta el cambio de tamaño del panel.
//   5. Llama applyAspectRatio(currentRatio) que recalcula el tamaño del
//      .video-preview-container manteniendo la proporción del aspecto.
//   6. El contenedor se ve más pequeño o más grande pero SIEMPRE completo
//      y nunca se oculta detrás de la barra de controles.
//
// ────────────────────────────────────────────────────────────────────────────
// ⚠️ REGLA CRÍTICA:
// ────────────────────────────────────────────────────────────────────────────
//   Este archivo DEBE cambiar #video-preview-panel.style.height, NO
//   .video-preview-container.style.height directamente.
//   Si setea la altura del contenedor directamente, pisará el cálculo de
//   proporción de aspectRatio.js y el aspecto se romperá al arrastrar.
//
// ────────────────────────────────────────────────────────────────────────────
// IDs Y CLASES QUE USA:
// ────────────────────────────────────────────────────────────────────────────
//   - #video-preview-panel: panel del previsualizador (HTML, línea ~204)
//     Este archivo setea style.height y style.flex al arrastrar
//   - .video-preview-container: contenedor del video (HTML, línea ~216)
//     Solo se busca para verificar que existe. NO se modifica su altura aquí.
//   - #preview-resizer: divisor arrastrable creado dinámicamente por este archivo
//     Se inserta entre la fila superior y el timeline
//   - .d-flex.gap-3: contenedor de la fila superior (preview + library)
//     El resizer se inserta después de este elemento
//
// ────────────────────────────────────────────────────────────────────────────
// INTERACCIÓN CON aspectRatio.js:
// ────────────────────────────────────────────────────────────────────────────
//   - Este archivo cambia #video-preview-panel.style.height
//   - aspectRatio.js observa #video-preview-panel con ResizeObserver
//   - Al detectar el cambio, aspectRatio.js re-aplica el aspecto al contenedor
//   - NO hay conflicto: este archivo no toca el contenedor, solo el panel
//
// ────────────────────────────────────────────────────────────────────────────
// RANGOS:
// ────────────────────────────────────────────────────────────────────────────
//   - Altura mínima del panel: 200px
//   - Altura máxima del panel: 1200px
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
