// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiMultiTrack.js - Pistas multiples de emojis con auto-creacion y auto-eliminacion
//
// Archivo INDEPENDIENTE. No modifica emojiTrackManager.js, emojis.js, stickers.js,
// emojiStickerPanel.js, emojiClipResize.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   1. Sobrescribe window.addEmojiToTrack para crear una pista nueva por cada
//      emoji, o reutilizar una pista vacia si existe.
//   2. Permite arrastrar clips de emoji entre pistas de emoji.
//   3. Elimina automaticamente pistas de emoji que quedan vacias.
//
// COMO FUNCIONA:
//   - Sobrescribe window.addEmojiToTrack despues de que emojiTrackManager.js
//     la define. La nueva version busca pistas vacias primero, si no hay
//     crea una nueva con ID incremental (emoji-track-1, emoji-track-2, etc.)
//   - Usa la funcion createEmojiClip de emojiTrackManager.js para crear clips
//   - Agrega drag-and-drop entre pistas detectando el track destino
//   - Despues de mover un clip, verifica si el track origen quedo vacio
//     y lo elimina
//
// DEPENDENCIAS:
//   - emojiTrackManager.js: usa createEmojiClip, createEmojiOverlay,
//     selectEmojiClip, allEmojiClips, EMOJI_CLIP_CLASS, EMOJI_DEFAULT_DURATION,
//     PIXELS_PER_SECOND
//
// NO TOCAR:
//   - emojiTrackManager.js: no se modifica (solo se sobrescribe window.addEmojiToTrack)
//   - emojis.js, stickers.js: no se modifican
//   - emojiStickerPanel.js: no se modifica
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiMultiTrack);
} else {
    initEmojiMultiTrack();
}

// Contador de pistas de emoji creadas
var emojiTrackCounter = 0;

function initEmojiMultiTrack() {
    // Esperar a que emojiTrackManager.js defina window.addEmojiToTrack
    function tryOverride() {
        if (typeof window.addEmojiToTrack !== 'function') {
            setTimeout(tryOverride, 100);
            return;
        }

        // Guardar referencia a funciones de emojiTrackManager.js
        var origAddEmojiToTrack = window.addEmojiToTrack;

        // Sobrescribir window.addEmojiToTrack con la nueva logica
        window.addEmojiToTrack = function(emoji, isSticker) {
            // Buscar una pista de emoji vacia existente
            var track = findEmptyEmojiTrack();

            // Si no hay pista vacia, crear una nueva
            if (!track) {
                track = createNewEmojiTrack();
                if (!track) {
                    console.error('emojiMultiTrack: no se pudo crear el track');
                    return;
                }
            }

            // Calcular posicion del nuevo clip (despues del ultimo clip)
            var pos = getEndOfLastEmojiClipInTrack(track);

            // Usar createEmojiClip de emojiTrackManager.js
            if (typeof createEmojiClip === 'function') {
                var clip = createEmojiClip(emoji, isSticker, pos);
                track.appendChild(clip);

                // Agregar a allEmojiClips si existe
                if (typeof allEmojiClips !== 'undefined') {
                    allEmojiClips.push(clip);
                }

                // Crear el overlay
                if (typeof createEmojiOverlay === 'function') {
                    createEmojiOverlay(emoji, isSticker, clip);
                }

                // Seleccionar el clip
                if (typeof selectEmojiClip === 'function') {
                    selectEmojiClip(clip);
                }

                // Habilitar drag entre pistas
                enableCrossTrackDrag(clip);

                console.log('emojiMultiTrack: emoji agregado al track', track.id);
            }
        };

        console.log('emojiMultiTrack inicializado - window.addEmojiToTrack sobrescrito');
    }
    tryOverride();
}

// ---------------------------------------------------------------------------
// findEmptyEmojiTrack()
// ---------------------------------------------------------------------------
// Busca una pista de emoji que no tenga clips. Retorna el elemento track
// o null si no hay pistas vacias.
// ---------------------------------------------------------------------------
function findEmptyEmojiTrack() {
    var tracks = document.querySelectorAll('[id^="emoji-track"]');
    for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        // Solo considerar tracks reales (no el row)
        if (!track.classList.contains('track-track')) continue;
        var clips = track.querySelectorAll('.emoji-clip');
        if (clips.length === 0) {
            return track;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// createNewEmojiTrack()
// ---------------------------------------------------------------------------
// Crea una nueva pista de emoji con ID incremental.
// Usa la misma estructura que createEmojiTrack de emojiTrackManager.js
// pero con un ID unico.
// ---------------------------------------------------------------------------
function createNewEmojiTrack() {
    emojiTrackCounter++;
    var trackId = 'emoji-track-' + emojiTrackCounter;

    var tracksContainer = document.querySelector('.tracks-container');
    if (!tracksContainer) {
        console.error('emojiMultiTrack: no se encontro .tracks-container');
        return null;
    }

    var row = document.createElement('div');
    row.className = 'track-row d-flex align-items-center gap-2';
    row.id = 'emoji-track-row-' + emojiTrackCounter;

    // 1. Number badge (20px)
    var numBadge = document.createElement('span');
    numBadge.className = 'track-number-badge';
    numBadge.textContent = 'E' + emojiTrackCounter;
    numBadge.style.cssText =
        'display:flex;align-items:center;justify-content:center;' +
        'width:20px;height:60px;flex-shrink:0;' +
        'font-size:13px;font-weight:bold;color:#f5a623;' +
        'background:transparent;border:none;';

    // 2. Controls container (28px) - solo boton ocultar
    var btnContainer = document.createElement('div');
    btnContainer.className = 'track-controls-btns';
    btnContainer.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'gap:4px;flex-shrink:0;width:28px;';

    var spacerTop = document.createElement('div');
    spacerTop.style.cssText = 'width:26px;height:26px;flex-shrink:0;';

    var hideBtn = document.createElement('button');
    hideBtn.className = 'btn btn-sm track-hide-btn';
    hideBtn.style.cssText =
        'padding:2px;width:26px;height:26px;border:none;background:transparent;' +
        'color:#8899aa;font-size:16px;line-height:1;';
    hideBtn.innerHTML = '<i class="bi bi-eye"></i>';
    hideBtn.title = 'Ocultar/Mostrar emojis';
    hideBtn.dataset.trackId = trackId;
    hideBtn.dataset.hidden = 'false';

    hideBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var isHidden = hideBtn.dataset.hidden === 'true';
        var newHidden = !isHidden;
        hideBtn.dataset.hidden = newHidden ? 'true' : 'false';
        hideBtn.innerHTML = newHidden
            ? '<i class="bi bi-eye-slash" style="color:#e53e3e;"></i>'
            : '<i class="bi bi-eye"></i>';
        var clips = track.querySelectorAll('.emoji-clip');
        clips.forEach(function(clip) {
            if (newHidden) {
                clip.style.opacity = '0.2';
                clip.style.filter = 'grayscale(100%)';
            } else {
                clip.style.opacity = '';
                clip.style.filter = '';
            }
        });
    });

    btnContainer.appendChild(spacerTop);
    btnContainer.appendChild(hideBtn);

    // 2b. Espaciador de 50px para alinear con vol-slider-wrap
    var volSpacer = document.createElement('div');
    volSpacer.className = 'vol-slider-wrap';
    volSpacer.style.cssText =
        'display:flex;flex-direction:column;align-items:center;' +
        'flex-shrink:0;width:50px;height:60px;gap:2px;justify-content:center;';

    // 3. Label del track (80px)
    var label = document.createElement('div');
    label.className = 'track-label bg-dark rounded p-2 text-center';
    label.style.width = '80px';
    label.style.border = '1px solid #f5a623';
    label.innerHTML = '<i class="bi bi-emoji-smile" style="color:#f5a623;"></i><small class="d-block" style="color:#f5a623;">E' + emojiTrackCounter + '</small>';

    // Boton de eliminar track
    var removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-outline-danger w-100 mt-1';
    removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
    removeBtn.style.fontSize = '10px';
    removeBtn.style.padding = '1px 4px';
    removeBtn.title = 'Eliminar track de emoji';
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeEmojiTrackById(trackId);
    });
    label.appendChild(removeBtn);

    // 4. Track element
    var track = document.createElement('div');
    track.className = 'track-track flex-grow-1 bg-dark rounded p-2 position-relative';
    track.style.height = '60px';
    track.style.border = '1px solid #f5a623';
    track.id = trackId;

    // Ensamblar la fila
    row.appendChild(numBadge);
    row.appendChild(btnContainer);
    row.appendChild(volSpacer);
    row.appendChild(label);
    row.appendChild(track);
    tracksContainer.appendChild(row);

    console.log('emojiMultiTrack: track creado', trackId);
    return track;
}

// ---------------------------------------------------------------------------
// getEndOfLastEmojiClipInTrack(track)
// ---------------------------------------------------------------------------
// Calcula la posicion donde deberia ir el siguiente clip en el track.
// ---------------------------------------------------------------------------
function getEndOfLastEmojiClipInTrack(track) {
    var clips = track.querySelectorAll('.emoji-clip');
    var maxRight = 10;
    clips.forEach(function(c) {
        var left = parseInt(c.style.left) || 0;
        var width = parseInt(c.style.width) || 50;
        var right = left + width;
        if (right > maxRight) maxRight = right;
    });
    return maxRight + 2;
}

// ---------------------------------------------------------------------------
// removeEmojiTrackById(trackId)
// ---------------------------------------------------------------------------
// Elimina una pista de emoji por su ID, incluyendo su row.
// ---------------------------------------------------------------------------
function removeEmojiTrackById(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return;

    // Eliminar los clips de allEmojiClips
    if (typeof allEmojiClips !== 'undefined') {
        var clips = track.querySelectorAll('.emoji-clip');
        clips.forEach(function(clip) {
            var idx = allEmojiClips.indexOf(clip);
            if (idx !== -1) {
                allEmojiClips.splice(idx, 1);
            }
            // Eliminar overlay correspondiente
            if (clip.dataset.overlayId) {
                var overlay = document.getElementById(clip.dataset.overlayId);
                if (overlay) overlay.remove();
            }
        });
    }

    // Eliminar el row completo
    var row = track.closest('.track-row');
    if (row) {
        row.remove();
    } else {
        track.remove();
    }

    console.log('emojiMultiTrack: track eliminado', trackId);
}

// ---------------------------------------------------------------------------
// enableCrossTrackDrag(clip)
// ---------------------------------------------------------------------------
// Permite arrastrar un clip de emoji de una pista a otra pista de emoji.
// ---------------------------------------------------------------------------
function enableCrossTrackDrag(clip) {
    if (clip.dataset.crossTrackDragEnabled === 'true') return;
    clip.dataset.crossTrackDragEnabled = 'true';

    var isDragging = false;
    var dragStarted = false;
    var startX, startY;
    var origLeft, origTop;
    var origTrack = null;
    var ghostEl = null;

    clip.addEventListener('mousedown', function(e) {
        // No iniciar si se hace clic en un handle
        if (e.target.classList.contains('emoji-clip-handle')) return;
        if (e.target.closest('.emoji-clip-handle')) return;

        isDragging = true;
        dragStarted = false;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = parseInt(clip.style.left) || 0;
        origTrack = clip.closest('.track-track');
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        var dx = e.clientX - startX;
        var dy = e.clientY - startY;

        // Solo iniciar drag si se mueve mas de 5px (evitar clicks accidentales)
        if (!dragStarted && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            dragStarted = true;
            // Crear elemento fantasma para visualizar el arrastre
            ghostEl = document.createElement('div');
            ghostEl.style.cssText =
                'position:fixed; pointer-events:none; z-index:99999;' +
                'opacity:0.7; font-size:24px; display:flex;' +
                'align-items:center; justify-content:center;' +
                'width:50px; height:50px; background:rgba(245,166,35,0.3);' +
                'border:2px solid #f5a623; border-radius:4px;';
            ghostEl.innerHTML = clip.innerHTML;
            document.body.appendChild(ghostEl);
            clip.style.opacity = '0.3';
        }

        if (dragStarted && ghostEl) {
            ghostEl.style.left = (e.clientX - 25) + 'px';
            ghostEl.style.top = (e.clientY - 25) + 'px';
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;

        if (dragStarted && ghostEl) {
            ghostEl.remove();
            ghostEl = null;
            clip.style.opacity = '';

            // Detectar sobre que track se solto el clip
            var targetTrack = getTrackAtPoint(e.clientX, e.clientY);

            if (targetTrack && targetTrack !== origTrack &&
                targetTrack.id && targetTrack.id.indexOf('emoji-track') === 0) {
                // Mover el clip al track destino
                var targetRect = targetTrack.getBoundingClientRect();
                var newLeft = e.clientX - targetRect.left;

                // Ajustar al padding del track
                var padding = parseInt(getComputedStyle(targetTrack).paddingLeft) || 0;
                newLeft -= padding;

                // Mantener dentro de los limites del track
                newLeft = Math.max(0, newLeft);

                // Mover el clip al nuevo track
                targetTrack.appendChild(clip);
                clip.style.left = newLeft + 'px';
                clip.style.top = '5px';

                console.log('emojiMultiTrack: clip movido de', origTrack.id, 'a', targetTrack.id);

                // Verificar si el track origen quedo vacio
                if (origTrack) {
                    checkAndRemoveEmptyTrack(origTrack);
                }
            }
        }

        dragStarted = false;
    });

    // Touch support
    clip.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('emoji-clip-handle')) return;
        if (e.target.closest('.emoji-clip-handle')) return;
        isDragging = true;
        dragStarted = false;
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        origLeft = parseInt(clip.style.left) || 0;
        origTrack = clip.closest('.track-track');
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var touch = e.touches[0];
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;

        if (!dragStarted && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            dragStarted = true;
            ghostEl = document.createElement('div');
            ghostEl.style.cssText =
                'position:fixed; pointer-events:none; z-index:99999;' +
                'opacity:0.7; font-size:24px; display:flex;' +
                'align-items:center; justify-content:center;' +
                'width:50px; height:50px; background:rgba(245,166,35,0.3);' +
                'border:2px solid #f5a623; border-radius:4px;';
            ghostEl.innerHTML = clip.innerHTML;
            document.body.appendChild(ghostEl);
            clip.style.opacity = '0.3';
        }

        if (dragStarted && ghostEl) {
            ghostEl.style.left = (touch.clientX - 25) + 'px';
            ghostEl.style.top = (touch.clientY - 25) + 'px';
        }
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;

        if (dragStarted && ghostEl) {
            ghostEl.remove();
            ghostEl = null;
            clip.style.opacity = '';

            var touch = e.changedTouches[0];
            var targetTrack = getTrackAtPoint(touch.clientX, touch.clientY);

            if (targetTrack && targetTrack !== origTrack &&
                targetTrack.id && targetTrack.id.indexOf('emoji-track') === 0) {
                var targetRect = targetTrack.getBoundingClientRect();
                var newLeft = touch.clientX - targetRect.left;
                var padding = parseInt(getComputedStyle(targetTrack).paddingLeft) || 0;
                newLeft -= padding;
                newLeft = Math.max(0, newLeft);

                targetTrack.appendChild(clip);
                clip.style.left = newLeft + 'px';
                clip.style.top = '5px';

                console.log('emojiMultiTrack: clip movido (touch) de', origTrack.id, 'a', targetTrack.id);

                if (origTrack) {
                    checkAndRemoveEmptyTrack(origTrack);
                }
            }
        }

        dragStarted = false;
    });
}

// ---------------------------------------------------------------------------
// getTrackAtPoint(x, y)
// ---------------------------------------------------------------------------
// Retorna el elemento .track-track que se encuentra bajo las coordenadas x, y.
// ---------------------------------------------------------------------------
function getTrackAtPoint(x, y) {
    // Ocultar temporalmente el clip fantasma para que elementFromPoint no lo detecte
    var elements = document.elementsFromPoint(x, y);
    for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        if (el.classList && el.classList.contains('track-track')) {
            return el;
        }
        // Tambien buscar el track padre
        var parent = el.closest ? el.closest('.track-track') : null;
        if (parent) return parent;
    }
    return null;
}

// ---------------------------------------------------------------------------
// checkAndRemoveEmptyTrack(track)
// ---------------------------------------------------------------------------
// Verifica si un track de emoji no tiene clips y lo elimina si esta vacio.
// ---------------------------------------------------------------------------
function checkAndRemoveEmptyTrack(track) {
    if (!track) return;
    if (!track.id || track.id.indexOf('emoji-track') !== 0) return;

    var clips = track.querySelectorAll('.emoji-clip');
    if (clips.length === 0) {
        // El track esta vacio, eliminarlo
        removeEmojiTrackById(track.id);
        console.log('emojiMultiTrack: track vacio eliminado automaticamente', track.id);
    }
}
