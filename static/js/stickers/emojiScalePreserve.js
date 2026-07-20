// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiScalePreserve.js - Preserva escala y rotacion al mover el overlay
//
// Archivo INDEPENDIENTE. No modifica emojiTrackManager.js, emojis.js,
// stickers.js, emojiStickerPanel.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   1. Preserva la escala y rotacion del overlay cuando se arrastra en la
//      vista previa. emojiTrackManager.js pone transform='none' al mover,
//      lo que resetea escala y rotacion. Este archivo restaura el transform
//      despues de cada movimiento.
//   2. Aumenta el step de escalado de + y - (de 0.25 a 0.5).
//   3. Agrega botones + y - en la barra de herramientas que hacen lo mismo
//      que las teclas + y - del teclado.
//
// COMO FUNCIONA:
//   - Observa los overlays (.emoji-overlay) con MutationObserver
//   - Cuando detecta que transform cambia a 'none', restaura la escala
//     y rotacion guardadas en dataset.scale y dataset.rotation
//   - Sobrescribe SCALE_STEP de emojiScalePlusMinus.js
//   - Crea botones + y - en la barra de herramientas
//
// DEPENDENCIAS:
//   - emojiTrackManager.js: usa selectedEmojiClip y estructura del overlay
//   - emojiScalePlusMinus.js: usa scaleSelected() para los botones
//
// NO TOCAR:
//   - emojiTrackManager.js: no se modifica
//   - emojiScalePlusMinus.js: no se modifica (solo se aumenta el step)
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiScalePreserve);
} else {
    initEmojiScalePreserve();
}

function initEmojiScalePreserve() {
    // 1. Observar overlays para preservar transform
    observeOverlays();

    // 2. Aumentar el step de escalado sobrescribiendo la variable
    if (typeof SCALE_STEP !== 'undefined') {
        SCALE_STEP = 0.5;
    }

    // 3. Botones + y - en toolbar ahora los crea emojiToolbarScale.js (archivo independiente)

    console.log('emojiScalePreserve inicializado');
}

// ---------------------------------------------------------------------------
// observeOverlays()
// ---------------------------------------------------------------------------
// Observa todos los overlays .emoji-overlay y restaura el transform
// cuando emojiTrackManager.js lo resetea a 'none' al mover.
// ---------------------------------------------------------------------------
function observeOverlays() {
    // Observar overlays existentes y nuevos
    function checkOverlays() {
        var overlays = document.querySelectorAll('.emoji-overlay');
        overlays.forEach(function(overlay) {
            if (overlay.dataset.preserveObserved === 'true') return;
            overlay.dataset.preserveObserved = 'true';

            // MutationObserver para detectar cambios en style.transform
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(m) {
                    if (m.attributeName === 'style') {
                        var currentTransform = overlay.style.transform;
                        // Si el transform fue reseteado a 'none' o vacio
                        // pero hay escala/rotacion guardada, restaurar
                        if (currentTransform === 'none' || currentTransform === '') {
                            var scale = parseFloat(overlay.dataset.scale) || 1;
                            var rot = parseInt(overlay.dataset.rotation) || 0;
                            if (scale !== 1 || rot !== 0) {
                                overlay.style.transform =
                                    'rotate(' + rot + 'deg) scale(' + scale + ')';
                                overlay.style.transformOrigin = 'center';
                            }
                        }
                    }
                });
            });
            observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
        });
    }

    // Verificar periodicamente por nuevos overlays
    setInterval(checkOverlays, 500);
    checkOverlays();
}

// ---------------------------------------------------------------------------
// createToolbarScaleButtons()
// ---------------------------------------------------------------------------
// Crea botones + y - en la barra de herramientas que escalan el emoji
// seleccionado, igual que las teclas + y - del teclado.
// ---------------------------------------------------------------------------
function createToolbarScaleButtons() {
    function tryCreate() {
        // Buscar cualquier boton que sepamos que esta en la barra de herramientas
        // btn-add-voiceover es el ultimo boton antes de export
        var refBtn = document.getElementById('btn-add-voiceover') ||
                     document.getElementById('btn-add-music') ||
                     document.getElementById('btn-add-sticker') ||
                     document.getElementById('btn-export');

        if (!refBtn) {
            console.log('emojiScalePreserve: esperando botones de toolbar...');
            setTimeout(tryCreate, 500);
            return;
        }

        // El contenedor es el parent directo
        var toolbar = refBtn.parentElement;
        if (!toolbar) {
            setTimeout(tryCreate, 500);
            return;
        }

        // Verificar si ya existen los botones
        if (document.getElementById('btn-emoji-scale-up')) {
            console.log('emojiScalePreserve: botones ya existen');
            return;
        }

        console.log('emojiScalePreserve: toolbar encontrada, creando botones. refBtn:', refBtn.id);

        // Boton +
        var btnUp = document.createElement('button');
        btnUp.id = 'btn-emoji-scale-up';
        btnUp.className = 'btn btn-outline-light';
        btnUp.style.cssText = 'padding: 6px 10px;';
        btnUp.title = 'Aumentar tamano del emoji seleccionado';
        btnUp.innerHTML = '<i class="bi bi-plus-lg fs-5"></i>';
        btnUp.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('emojiScalePreserve: boton + clickeado');
            scaleFromToolbar(1);
        });

        // Boton -
        var btnDown = document.createElement('button');
        btnDown.id = 'btn-emoji-scale-down';
        btnDown.className = 'btn btn-outline-light';
        btnDown.style.cssText = 'padding: 6px 10px;';
        btnDown.title = 'Disminuir tamano del emoji seleccionado';
        btnDown.innerHTML = '<i class="bi bi-dash-lg fs-5"></i>';
        btnDown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('emojiScalePreserve: boton - clickeado');
            scaleFromToolbar(-1);
        });

        // Insertar al final de la barra (despues del ultimo boton)
        toolbar.appendChild(btnUp);
        toolbar.appendChild(btnDown);

        console.log('emojiScalePreserve: botones + y - agregados a toolbar');
    }
    tryCreate();
}

// ---------------------------------------------------------------------------
// scaleFromToolbar(direction)
// ---------------------------------------------------------------------------
// Escala el emoji seleccionado desde los botones de la toolbar.
// Funcion independiente que no depende de emojiScalePlusMinus.js.
// Hace exactamente lo mismo que las teclas + y - del teclado.
//   direction = 1: aumentar
//   direction = -1: disminuir
// ---------------------------------------------------------------------------
function scaleFromToolbar(direction) {
    // Leer selectedEmojiClip de emojiTrackManager.js
    var clip = (typeof selectedEmojiClip !== 'undefined') ? selectedEmojiClip : null;
    if (!clip) {
        // Tambien buscar cualquier clip con clase .selected
        clip = document.querySelector('.emoji-clip.selected');
    }
    if (!clip) {
        console.log('emojiScalePreserve: no hay clip seleccionado');
        return;
    }

    var overlayId = clip.dataset.overlayId;
    if (!overlayId) {
        console.log('emojiScalePreserve: el clip no tiene overlay');
        return;
    }

    var overlay = document.getElementById(overlayId);
    if (!overlay) {
        console.log('emojiScalePreserve: no se encontro el overlay', overlayId);
        return;
    }

    // Obtener escala actual
    var currentScale = parseFloat(overlay.dataset.scale) || 1;

    // Usar el mismo step que emojiScalePlusMinus.js (0.5)
    var step = 0.5;
    if (typeof SCALE_STEP !== 'undefined') {
        step = SCALE_STEP;
    }

    var newScale = currentScale + (direction * step);

    // Limitar entre min y max
    var minScale = 0.25;
    var maxScale = 20.0;
    if (typeof SCALE_MIN !== 'undefined') minScale = SCALE_MIN;
    if (typeof SCALE_MAX !== 'undefined') maxScale = SCALE_MAX;

    if (newScale < minScale) newScale = minScale;
    if (newScale > maxScale) newScale = maxScale;

    // Aplicar nueva escala
    overlay.dataset.scale = newScale;

    // Mantener la rotacion existente
    var rot = parseInt(overlay.dataset.rotation) || 0;
    overlay.style.transform = 'rotate(' + rot + 'deg) scale(' + newScale + ')';
    overlay.style.transformOrigin = 'center';

    // Guardar en el clip
    clip.dataset.overlayScale = newScale;

    console.log('emojiScalePreserve: escala', direction > 0 ? 'aumentada' : 'disminuida', 'a', newScale);
}
