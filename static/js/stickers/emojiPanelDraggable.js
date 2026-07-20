// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiPanelDraggable.js - Hace el panel de emojis/stickers arrastrable
//
// Archivo INDEPENDIENTE. No modifica emojiStickerPanel.js, emojis.js,
// stickers.js, emojiTrackManager.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Hace que el panel #emoji-sticker-panel se pueda mover arrastrando
//     desde su header (barra superior con titulo "Emojis y Stickers")
//   - El panel se puede desplazar por toda la ventana del navegador
//   - Mantiene el panel dentro de los limites visibles (no se sale de pantalla)
//   - Funciona con mouse y touch
//
// COMO FUNCIONA:
//   - Observa cuando el panel #emoji-sticker-panel aparece en el DOM
//   - Agrega cursor:move al header y event listeners de mousedown/touchstart
//   - Al arrastrar, actualiza left/top del panel (cambia de position:fixed
//     con transform a position:fixed con left/top directos)
//
// DEPENDENCIAS:
//   - Ninguna. Solo necesita que el panel exista.
//
// NO TOCAR:
//   - emojiStickerPanel.js: no se modifica
//   - emojis.js, stickers.js: no se modifican
//   - emojiTrackManager.js: no se modifica
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiPanelDraggable);
} else {
    initEmojiPanelDraggable();
}

function initEmojiPanelDraggable() {
    // Observar cuando el panel se crea en el DOM
    setInterval(function() {
        var panel = document.getElementById('emoji-sticker-panel');
        if (panel && panel.dataset.draggableInitialized !== 'true') {
            makeDraggable(panel);
        }
    }, 300);

    console.log('emojiPanelDraggable inicializado');
}

// ---------------------------------------------------------------------------
// makeDraggable(panel)
// ---------------------------------------------------------------------------
// Hace que el panel sea arrastrable desde su header.
// ---------------------------------------------------------------------------
function makeDraggable(panel) {
    panel.dataset.draggableInitialized = 'true';

    // El header es el primer div hijo del panel
    var header = panel.querySelector('div');
    if (!header) return;

    // Cambiar cursor del header para indicar que se puede arrastrar
    header.style.cursor = 'move';
    header.style.userSelect = 'none';

    var isDragging = false;
    var startX, startY;
    var panelStartX, panelStartY;

    // ---------------------------------------------------------------------------
    // Al presionar mouse/touch en el header, iniciar arrastre
    // ---------------------------------------------------------------------------
    function onStart(clientX, clientY) {
        isDragging = true;

        // Obtener posicion actual del panel
        var rect = panel.getBoundingClientRect();

        // Cambiar de transform:translate(-50%,-50%) a left/top directos
        // para que el arrastre funcione correctamente
        panel.style.transform = 'none';
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';

        startX = clientX;
        startY = clientY;
        panelStartX = rect.left;
        panelStartY = rect.top;
    }

    // ---------------------------------------------------------------------------
    // Al mover mouse/touch, actualizar posicion del panel
    // ---------------------------------------------------------------------------
    function onMove(clientX, clientY) {
        if (!isDragging) return;

        var dx = clientX - startX;
        var dy = clientY - startY;

        var newLeft = panelStartX + dx;
        var newTop = panelStartY + dy;

        // Mantener el panel dentro de los limites de la ventana
        var panelWidth = panel.offsetWidth;
        var panelHeight = panel.offsetHeight;
        var maxX = window.innerWidth - panelWidth;
        var maxY = window.innerHeight - panelHeight;

        // Permitir que parte del panel salga pero mantener al menos 50px visible
        newLeft = Math.max(-panelWidth + 100, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));

        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
    }

    // ---------------------------------------------------------------------------
    // Al soltar mouse/touch, terminar arrastre
    // ---------------------------------------------------------------------------
    function onEnd() {
        isDragging = false;
    }

    // --- Mouse events ---
    header.addEventListener('mousedown', function(e) {
        // No iniciar arrastre si se hace clic en el boton de cerrar
        if (e.target.id === 'emoji-panel-close' || e.target.closest('#emoji-panel-close')) return;
        onStart(e.clientX, e.clientY);
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        onMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', onEnd);

    // --- Touch events ---
    header.addEventListener('touchstart', function(e) {
        if (e.target.id === 'emoji-panel-close' || e.target.closest('#emoji-panel-close')) return;
        var touch = e.touches[0];
        onStart(touch.clientX, touch.clientY);
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var touch = e.touches[0];
        onMove(touch.clientX, touch.clientY);
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', onEnd);
}
