// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiClipResize.js - Manipuladores laterales para clips de emoji
//
// Archivo INDEPENDIENTE. No modifica emojiTrackManager.js, emojis.js,
// stickers.js, ni ningun otro archivo de la aplicacion.
//
// FUNCIONALIDAD:
//   - Agrega manipuladores (handles) visuales en los bordes izquierdo y
//     derecho de cada clip de emoji (.emoji-clip) en el timeline.
//   - Arrastrar el handle izquierdo cambia el inicio del clip (mueve el
//     inicio sin cambiar el final, ajustando duracion).
//   - Arrastrar el handle derecho cambia la duracion del clip (extiende
//     o reduce el final sin mover el inicio).
//   - Los handles solo aparecen cuando el clip esta seleccionado.
//
// DEPENDENCIAS:
//   - Solo lee clips con clase .emoji-clip creados por emojiTrackManager.js
//   - No modifica nada de emojiTrackManager.js
//
// NO TOCAR:
//   - emojiTrackManager.js: no se modifica
//   - emojis.js, stickers.js: no se modifican
//   - Ningun archivo del timeline existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiClipResize);
} else {
    initEmojiClipResize();
}

var PIXELS_PER_SECOND = 10;
var MIN_CLIP_WIDTH = 20;

function initEmojiClipResize() {
    // Polling: buscar clips de emoji sin handles cada 500ms
    // Mas simple y confiable que MutationObserver
    setInterval(function() {
        var clips = document.querySelectorAll('.emoji-clip');
        clips.forEach(function(clip) {
            if (clip.dataset.resizeHandlesAdded !== 'true') {
                addResizeHandles(clip);
            }
        });
    }, 500);

    console.log('emojiClipResize inicializado');
}

// ---------------------------------------------------------------------------
// addResizeHandles(clip)
// ---------------------------------------------------------------------------
// Agrega handles izquierdo y derecho al clip.
// ---------------------------------------------------------------------------
function addResizeHandles(clip) {
    if (clip.dataset.resizeHandlesAdded === 'true') return;
    clip.dataset.resizeHandlesAdded = 'true';

    // Handle izquierdo (cambiar inicio)
    var leftHandle = document.createElement('div');
    leftHandle.className = 'emoji-clip-handle emoji-clip-handle-left';
    leftHandle.style.cssText =
        'position:absolute; left:-2px; top:0; width:6px; height:100%;' +
        'cursor:ew-resize; background:rgba(255,255,255,0.4);' +
        'border-radius:2px 0 0 2px; z-index:10; display:none;';
    clip.appendChild(leftHandle);

    // Handle derecho (cambiar duracion/fin)
    var rightHandle = document.createElement('div');
    rightHandle.className = 'emoji-clip-handle emoji-clip-handle-right';
    rightHandle.style.cssText =
        'position:absolute; right:-2px; top:0; width:6px; height:100%;' +
        'cursor:ew-resize; background:rgba(255,255,255,0.4);' +
        'border-radius:0 2px 2px 0; z-index:10; display:none;';
    clip.appendChild(rightHandle);

    // Mostrar/ocultar handles cuando el clip se selecciona/deselecciona
    // Usar MutationObserver para detectar cambios en la clase 'selected'
    var classObserver = new MutationObserver(function() {
        if (clip.classList.contains('selected')) {
            leftHandle.style.display = '';
            rightHandle.style.display = '';
        } else {
            leftHandle.style.display = 'none';
            rightHandle.style.display = 'none';
        }
    });
    classObserver.observe(clip, { attributes: true, attributeFilter: ['class'] });

    // Habilitar arrastre de handles
    enableHandleDrag(leftHandle, clip, 'left');
    enableHandleDrag(rightHandle, clip, 'right');
}

// ---------------------------------------------------------------------------
// enableHandleDrag(handle, clip, side)
// ---------------------------------------------------------------------------
// Permite arrastrar un handle para cambiar el inicio o fin del clip.
//   side = 'left': cambia el inicio (mueve left + ajusta width)
//   side = 'right': cambia la duracion (ajusta width)
// ---------------------------------------------------------------------------
function enableHandleDrag(handle, clip, side) {
    var isDragging = false;
    var startX, startLeft, startWidth;

    handle.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startLeft = parseInt(clip.style.left) || 0;
        startWidth = parseInt(clip.style.width) || 50;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;

        if (side === 'right') {
            // Handle derecho: cambiar width (duracion)
            var newWidth = Math.max(MIN_CLIP_WIDTH, startWidth + dx);
            clip.style.width = newWidth + 'px';
            clip.dataset.duration = newWidth / PIXELS_PER_SECOND;
        } else {
            // Handle izquierdo: cambiar left y width simultaneamente
            // Mantener el borde derecho fijo
            var rightEdge = startLeft + startWidth;
            var newLeft = Math.max(0, startLeft + dx);
            var newWidth = rightEdge - newLeft;
            if (newWidth < MIN_CLIP_WIDTH) {
                newWidth = MIN_CLIP_WIDTH;
                newLeft = rightEdge - MIN_CLIP_WIDTH;
            }
            clip.style.left = newLeft + 'px';
            clip.style.width = newWidth + 'px';
            clip.dataset.startTime = newLeft / PIXELS_PER_SECOND;
            clip.dataset.duration = newWidth / PIXELS_PER_SECOND;
        }
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            console.log('emojiClipResize: clip redimensionado, duracion=' +
                (parseInt(clip.style.width) / PIXELS_PER_SECOND) + 's');
        }
    });

    // Touch support
    handle.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startLeft = parseInt(clip.style.left) || 0;
        startWidth = parseInt(clip.style.width) || 50;
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var dx = e.touches[0].clientX - startX;

        if (side === 'right') {
            var newWidth = Math.max(MIN_CLIP_WIDTH, startWidth + dx);
            clip.style.width = newWidth + 'px';
            clip.dataset.duration = newWidth / PIXELS_PER_SECOND;
        } else {
            var rightEdge = startLeft + startWidth;
            var newLeft = Math.max(0, startLeft + dx);
            var newWidth = rightEdge - newLeft;
            if (newWidth < MIN_CLIP_WIDTH) {
                newWidth = MIN_CLIP_WIDTH;
                newLeft = rightEdge - MIN_CLIP_WIDTH;
            }
            clip.style.left = newLeft + 'px';
            clip.style.width = newWidth + 'px';
            clip.dataset.startTime = newLeft / PIXELS_PER_SECOND;
            clip.dataset.duration = newWidth / PIXELS_PER_SECOND;
        }
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (isDragging) {
            isDragging = false;
            console.log('emojiClipResize: clip redimensionado (touch)');
        }
    });
}
