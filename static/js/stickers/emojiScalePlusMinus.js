// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiScalePlusMinus.js - Escalar con teclas + y - en lugar de S
//
// Archivo INDEPENDIENTE. No modifica emojiTrackManager.js, emojis.js,
// stickers.js, emojiStickerPanel.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Tecla "+" (mas): aumenta el tamano del overlay del emoji seleccionado
//   - Tecla "-" (menos): disminuye el tamano del overlay del emoji seleccionado
//   - Reemplaza la funcionalidad de la tecla "S" (escalar)
//   - Funciona con cualquier clip de emoji seleccionado en el timeline
//   - El escalado es progresivo: cada presion aumenta/disminuye 0.25
//   - Escala minima: 0.25, maxima: 5.0
//
// COMO FUNCIONA:
//   - Agrega un listener de keydown que detecta "+" y "-"
//   - Lee la variable selectedEmojiClip de emojiTrackManager.js
//   - Modifica el overlay correspondiente (dataset.scale y style.transform)
//   - Usa capture: true para interceptar antes que handleEmojiKeyboard
//
// DEPENDENCIAS:
//   - emojiTrackManager.js: usa selectedEmojiClip y la estructura del overlay
//
// NO TOCAR:
//   - emojiTrackManager.js: no se modifica (la tecla S sigue funcionando,
//     pero + y - son independientes y mas precisos)
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiScalePlusMinus);
} else {
    initEmojiScalePlusMinus();
}

// Escala minima y maxima
var SCALE_MIN = 0.25;
var SCALE_MAX = 20.0;
var SCALE_STEP = 0.5;

function initEmojiScalePlusMinus() {
    // Usar capture: true para interceptar antes que handleEmojiKeyboard
    document.addEventListener('keydown', handleScaleKeys, true);
    console.log('emojiScalePlusMinus inicializado: + y - para escalar');
}

// ---------------------------------------------------------------------------
// handleScaleKeys(e)
// ---------------------------------------------------------------------------
// Detecta las teclas + y - y escala el overlay del clip seleccionado.
// ---------------------------------------------------------------------------
function handleScaleKeys(e) {
    // No procesar si el foco esta en un input o textarea
    if (e.target.matches('input, textarea')) return;

    var key = e.key;

    // Detectar + (puede ser "+" o "=" en teclado sin numpad con Shift)
    if (key === '+' || key === '=' || key === 'Add') {
        e.preventDefault();
        e.stopPropagation();
        scaleSelected(1);
        return;
    }

    // Detectar -
    if (key === '-' || key === '_' || key === 'Subtract') {
        e.preventDefault();
        e.stopPropagation();
        scaleSelected(-1);
        return;
    }
}

// ---------------------------------------------------------------------------
// scaleSelected(direction)
// ---------------------------------------------------------------------------
// Escala el overlay del clip seleccionado.
//   direction = 1: aumentar
//   direction = -1: disminuir
// ---------------------------------------------------------------------------
function scaleSelected(direction) {
    // Leer selectedEmojiClip de emojiTrackManager.js
    var clip = (typeof selectedEmojiClip !== 'undefined') ? selectedEmojiClip : null;
    if (!clip) {
        console.log('emojiScale: no hay clip seleccionado');
        return;
    }

    var overlayId = clip.dataset.overlayId;
    if (!overlayId) {
        console.log('emojiScale: el clip no tiene overlay');
        return;
    }

    var overlay = document.getElementById(overlayId);
    if (!overlay) {
        console.log('emojiScale: no se encontro el overlay', overlayId);
        return;
    }

    // Obtener escala actual
    var currentScale = parseFloat(overlay.dataset.scale) || 1;

    // Calcular nueva escala
    var newScale = currentScale + (direction * SCALE_STEP);

    // Limitar entre min y max
    if (newScale < SCALE_MIN) newScale = SCALE_MIN;
    if (newScale > SCALE_MAX) newScale = SCALE_MAX;

    // Aplicar nueva escala
    overlay.dataset.scale = newScale;

    // Mantener la rotacion existente
    var rot = parseInt(overlay.dataset.rotation) || 0;
    overlay.style.transform = 'rotate(' + rot + 'deg) scale(' + newScale + ')';
    overlay.style.transformOrigin = 'center';

    // Guardar en el clip
    clip.dataset.overlayScale = newScale;

    console.log('emojiScale: escala', direction > 0 ? 'aumentada' : 'disminuida', 'a', newScale);
}
