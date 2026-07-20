// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// rotateButtons.js - Botones de rotacion izquierda/derecha en la toolbar
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica emojiTrackManager.js,
// videoEditor.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Crea dos botones (rotar izquierda y rotar derecha) en la barra de
//     herramientas, junto a los botones de zoom (lupa +/-)
//   - Al hacer clic, rota 15 grados el elemento seleccionado:
//     * Si hay un emoji seleccionado (.emoji-clip.selected), rota su overlay
//     * Si hay un clip de video seleccionado (.timeline-clip.selected),
//       rota el video (#video-player)
//   - Preserva escala y flip existentes
//   - Rotacion acumulativa: cada clic suma/resta 15 grados
//
// NO TOCAR:
//   - Ningun archivo existente. Este archivo es completamente autonomo.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotateButtons);
} else {
    initRotateButtons();
}

var ROTATE_STEP = 15;

function initRotateButtons() {
    var attempts = 0;
    var interval = setInterval(function() {
        attempts++;
        if (attempts > 60) {
            clearInterval(interval);
            console.log('rotateButtons: timeout, no se encontro toolbar');
            return;
        }

        // Buscar el boton de export como referencia (esta al final de la toolbar)
        var refBtn = document.getElementById('btn-export') ||
                     document.getElementById('btn-add-voiceover') ||
                     document.getElementById('btn-add-music') ||
                     document.getElementById('btn-add-sticker') ||
                     document.getElementById('btn-add-text');

        if (!refBtn) {
            console.log('rotateButtons: esperando toolbar... intento', attempts);
            return;
        }

        var toolbar = refBtn.parentElement;
        if (!toolbar) return;

        if (document.getElementById('btn-rotate-left')) {
            clearInterval(interval);
            return;
        }

        clearInterval(interval);
        createRotateButtons(toolbar, refBtn);
    }, 500);
}

function createRotateButtons(toolbar, refBtn) {
    // Boton rotar izquierda (contrarreloj)
    var btnLeft = document.createElement('button');
    btnLeft.id = 'btn-rotate-left';
    btnLeft.className = 'btn btn-outline-light';
    btnLeft.style.cssText = 'padding: 6px 10px;';
    btnLeft.title = 'Rotar izquierda (elemento seleccionado)';
    btnLeft.innerHTML = '<i class="bi bi-arrow-counterclockwise fs-5"></i>';

    btnLeft.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        rotateLeft();
    };

    // Boton rotar derecha (reloj)
    var btnRight = document.createElement('button');
    btnRight.id = 'btn-rotate-right';
    btnRight.className = 'btn btn-outline-light';
    btnRight.style.cssText = 'padding: 6px 10px;';
    btnRight.title = 'Rotar derecha (elemento seleccionado)';
    btnRight.innerHTML = '<i class="bi bi-arrow-clockwise fs-5"></i>';

    btnRight.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        rotateRight();
    };

    // Insertar antes del boton de referencia (btn-export normalmente)
    if (refBtn && refBtn.parentNode === toolbar) {
        toolbar.insertBefore(btnLeft, refBtn);
        toolbar.insertBefore(btnRight, refBtn);
    } else {
        toolbar.appendChild(btnLeft);
        toolbar.appendChild(btnRight);
    }

    console.log('rotateButtons: botones de rotacion creados en toolbar');
}

// ---------------------------------------------------------------------------
// rotateLeft() - Funcion independiente para rotar izquierda (-15 grados)
// ---------------------------------------------------------------------------
function rotateLeft() {
    console.log('rotateButtons: rotateLeft llamado');

    var emojiClip = document.querySelector('.emoji-clip.selected');
    if (!emojiClip && typeof selectedEmojiClip !== 'undefined') {
        emojiClip = selectedEmojiClip;
    }
    if (emojiClip) {
        var overlayId = emojiClip.dataset.overlayId;
        if (overlayId) {
            var overlay = document.getElementById(overlayId);
            if (overlay) {
                var rot = parseInt(overlay.dataset.rotation) || 0;
                var newRot = rot - 15;
                overlay.dataset.rotation = newRot;
                var scale = parseFloat(overlay.dataset.scale) || 1;
                var flippedH = overlay.dataset.flipped === 'true';
                var flippedV = overlay.dataset.flippedV === 'true';
                var scaleX = flippedH ? -scale : scale;
                var scaleY = flippedV ? -scale : scale;
                overlay.style.transform = 'rotate(' + newRot + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
                overlay.style.transformOrigin = 'center';
                console.log('rotateButtons: emoji rotado izquierda a', newRot);
                return;
            }
        }
    }

    var videoClip = document.querySelector('.timeline-clip.selected');
    if (videoClip) {
        var video = document.getElementById('video-player');
        if (video) {
            var rot = parseInt(video.dataset.rotation) || 0;
            var newRot = rot - 15;
            video.dataset.rotation = newRot;
            var flippedH = video.dataset.flipped === 'true';
            var flippedV = video.dataset.flippedV === 'true';
            var scaleX = flippedH ? -1 : 1;
            var scaleY = flippedV ? -1 : 1;
            video.style.transform = 'rotate(' + newRot + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
            video.style.transformOrigin = 'center';
            console.log('rotateButtons: video rotado izquierda a', newRot);
            return;
        }
    }

    console.log('rotateButtons: rotateLeft - no hay elemento seleccionado');
}

// ---------------------------------------------------------------------------
// rotateRight() - Funcion independiente para rotar derecha (+15 grados)
// ---------------------------------------------------------------------------
function rotateRight() {
    console.log('rotateButtons: rotateRight llamado');

    var emojiClip = document.querySelector('.emoji-clip.selected');
    if (!emojiClip && typeof selectedEmojiClip !== 'undefined') {
        emojiClip = selectedEmojiClip;
    }
    if (emojiClip) {
        var overlayId = emojiClip.dataset.overlayId;
        if (overlayId) {
            var overlay = document.getElementById(overlayId);
            if (overlay) {
                var rot = parseInt(overlay.dataset.rotation) || 0;
                var newRot = rot + 15;
                overlay.dataset.rotation = newRot;
                var scale = parseFloat(overlay.dataset.scale) || 1;
                var flippedH = overlay.dataset.flipped === 'true';
                var flippedV = overlay.dataset.flippedV === 'true';
                var scaleX = flippedH ? -scale : scale;
                var scaleY = flippedV ? -scale : scale;
                overlay.style.transform = 'rotate(' + newRot + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
                overlay.style.transformOrigin = 'center';
                console.log('rotateButtons: emoji rotado derecha a', newRot);
                return;
            }
        }
    }

    var videoClip = document.querySelector('.timeline-clip.selected');
    if (videoClip) {
        var video = document.getElementById('video-player');
        if (video) {
            var rot = parseInt(video.dataset.rotation) || 0;
            var newRot = rot + 15;
            video.dataset.rotation = newRot;
            var flippedH = video.dataset.flipped === 'true';
            var flippedV = video.dataset.flippedV === 'true';
            var scaleX = flippedH ? -1 : 1;
            var scaleY = flippedV ? -1 : 1;
            video.style.transform = 'rotate(' + newRot + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
            video.style.transformOrigin = 'center';
            console.log('rotateButtons: video rotado derecha a', newRot);
            return;
        }
    }

    console.log('rotateButtons: rotateRight - no hay elemento seleccionado');
}
