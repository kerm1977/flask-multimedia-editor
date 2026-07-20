// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiToolbarScale.js - Botones + y - de la toolbar para escalar emojis
//
// Archivo TOTALMENTE INDEPENDIENTE. No depende de emojiScalePlusMinus.js,
// emojiScalePreserve.js, emojiTrackManager.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Crea dos botones (+ y -) en la barra de herramientas del timeline
//   - Al hacer clic en +, aumenta el tamano del emoji seleccionado
//   - Al hacer clic en -, disminuye el tamano del emoji seleccionado
//   - Funcion identica a las teclas + y - del teclado
//   - No depende de ninguna funcion de otros archivos
//
// COMO FUNCIONA:
//   - Busca la barra de herramientas (donde estan tijera, audio, mic, etc)
//   - Crea los botones con addEventListener directo
//   - Al hacer clic, busca el clip .emoji-clip.selected en el DOM
//   - Lee su overlay, modifica dataset.scale y style.transform
//
// NO TOCAR:
//   - Ningun archivo existente. Este archivo es completamente autonomo.
// ============================================================================

var EMOJI_TB_SCALE_MIN = 0.25;
var EMOJI_TB_SCALE_MAX = 20.0;
var EMOJI_TB_SCALE_STEP = 0.5;

function initEmojiToolbarScale() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startEmojiToolbarPolling);
    } else {
        startEmojiToolbarPolling();
    }
}

function startEmojiToolbarPolling() {
        // Buscar la barra de herramientas cada 500ms hasta encontrarla
        var attempts = 0;
        var interval = setInterval(function() {
            attempts++;
            if (attempts > 60) { // 30 segundos max
                clearInterval(interval);
                return;
            }

            // Buscar cualquier boton de la toolbar como referencia
            var refBtn = document.getElementById('btn-add-voiceover') ||
                         document.getElementById('btn-add-music') ||
                         document.getElementById('btn-add-sticker') ||
                         document.getElementById('btn-export') ||
                         document.getElementById('btn-add-text');

            if (!refBtn) return;

            var toolbar = refBtn.parentElement;
            if (!toolbar) return;

            // Si ya existen los botones, no crearlos de nuevo
            if (document.getElementById('btn-scale-emoji-up')) {
                clearInterval(interval);
                return;
            }

            clearInterval(interval);
            createEmojiToolbarButtons(toolbar);
        }, 500);
    }

    function createEmojiToolbarButtons(toolbar) {
        // Boton +
        var btnUp = document.createElement('button');
        btnUp.id = 'btn-scale-emoji-up';
        btnUp.className = 'btn btn-outline-light';
        btnUp.style.cssText = 'padding: 6px 10px;';
        btnUp.title = 'Aumentar emoji seleccionado';
        btnUp.innerHTML = '<i class="bi bi-zoom-in fs-5"></i>';

        // Asignar onclick directamente (mas robusto que addEventListener)
        btnUp.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scaleEmojiFromToolbar(1);
        });

        // Boton -
        var btnDown = document.createElement('button');
        btnDown.id = 'btn-scale-emoji-down';
        btnDown.className = 'btn btn-outline-light';
        btnDown.style.cssText = 'padding: 6px 10px;';
        btnDown.title = 'Disminuir emoji seleccionado';
        btnDown.innerHTML = '<i class="bi bi-zoom-out fs-5"></i>';

        btnDown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scaleEmojiFromToolbar(-1);
        });

        toolbar.appendChild(btnUp);
        toolbar.appendChild(btnDown);

        console.log('emojiToolbarScale: botones + y - creados en toolbar');
    }

function scaleEmojiFromToolbar(direction) {
        // Buscar el clip de emoji seleccionado de forma autonoma
        var clip = document.querySelector('.emoji-clip.selected');

        // Si no hay con .selected, buscar la variable global
        if (!clip && typeof selectedEmojiClip !== 'undefined') {
            clip = selectedEmojiClip;
        }

        if (!clip) {
            console.log('emojiToolbarScale: no hay emoji seleccionado');
            return;
        }

        var overlayId = clip.dataset.overlayId;
        if (!overlayId) {
            console.log('emojiToolbarScale: clip sin overlayId');
            return;
        }

        var overlay = document.getElementById(overlayId);
        if (!overlay) {
            console.log('emojiToolbarScale: overlay no encontrado:', overlayId);
            return;
        }

        // Escala actual
        var currentScale = parseFloat(overlay.dataset.scale) || 1;

        // Nueva escala
        var newScale = currentScale + (direction * EMOJI_TB_SCALE_STEP);
        if (newScale < EMOJI_TB_SCALE_MIN) newScale = EMOJI_TB_SCALE_MIN;
        if (newScale > EMOJI_TB_SCALE_MAX) newScale = EMOJI_TB_SCALE_MAX;

        // Aplicar
        overlay.dataset.scale = newScale;
        var rot = parseInt(overlay.dataset.rotation) || 0;
        overlay.style.transform = 'rotate(' + rot + 'deg) scale(' + newScale + ')';
        overlay.style.transformOrigin = 'center';

        // Guardar en clip
        clip.dataset.overlayScale = newScale;

        console.log('emojiToolbarScale: escala', direction > 0 ? '+' : '-', '=>', newScale);
    }

initEmojiToolbarScale();
