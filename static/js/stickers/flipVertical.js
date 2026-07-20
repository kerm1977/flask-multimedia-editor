// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// flipVertical.js - Boton de flip vertical para elementos seleccionados
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica mirrorFlip.js,
// emojiTrackManager.js, videoEditor.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Crea un boton con icono de flip vertical en la barra de herramientas
//   - Al hacer clic, hace flip vertical del elemento seleccionado:
//     * Emoji seleccionado (.emoji-clip.selected): flip de su overlay
//     * Clip de video seleccionado (.timeline-clip.selected): flip del video
//   - Alterna entre normal y flip vertical (cada clic invierte)
//   - Preserva rotacion, escala y flip horizontal existentes
//
// NO TOCAR:
//   - Ningun archivo existente. Este archivo es completamente autonomo.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlipVertical);
} else {
    initFlipVertical();
}

function initFlipVertical() {
    var attempts = 0;
    var interval = setInterval(function() {
        attempts++;
        if (attempts > 60) {
            clearInterval(interval);
            return;
        }

        var refBtn = document.getElementById('btn-mirror-flip') ||
                     document.getElementById('btn-export') ||
                     document.getElementById('btn-add-voiceover');

        if (!refBtn) return;

        var toolbar = refBtn.parentElement;
        if (!toolbar) return;

        if (document.getElementById('btn-flip-vertical')) {
            clearInterval(interval);
            return;
        }

        clearInterval(interval);
        createFlipVerticalButton(toolbar, refBtn);
    }, 500);
}

function createFlipVerticalButton(toolbar, refBtn) {
    var btn = document.createElement('button');
    btn.id = 'btn-flip-vertical';
    btn.className = 'btn btn-outline-light';
    btn.style.cssText = 'padding: 6px 10px;';
    btn.title = 'Flip vertical del elemento seleccionado';
    btn.innerHTML = '<i class="bi bi-symmetry-vertical fs-5"></i>';

    btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        doFlipVertical();
    };

    // Insertar despues del boton de flip horizontal si existe
    if (refBtn && refBtn.id === 'btn-mirror-flip' && refBtn.nextSibling) {
        toolbar.insertBefore(btn, refBtn.nextSibling);
    } else {
        toolbar.appendChild(btn);
    }

    console.log('flipVertical: boton creado en toolbar');
}

function doFlipVertical() {
    // 1. Emoji seleccionado
    var emojiClip = document.querySelector('.emoji-clip.selected');
    if (emojiClip) {
        flipEmojiVertical(emojiClip);
        return;
    }

    // 2. Clip de video seleccionado
    var videoClip = document.querySelector('.timeline-clip.selected');
    if (videoClip) {
        flipVideoVertical();
        return;
    }

    console.log('flipVertical: no hay elemento seleccionado');
}

function flipEmojiVertical(clip) {
    var overlayId = clip.dataset.overlayId;
    if (!overlayId) return;
    var overlay = document.getElementById(overlayId);
    if (!overlay) return;

    var flippedV = overlay.dataset.flippedV === 'true';
    var newFlippedV = !flippedV;
    overlay.dataset.flippedV = newFlippedV ? 'true' : 'false';

    // Preservar rotacion, escala y flip horizontal
    var rot = parseInt(overlay.dataset.rotation) || 0;
    var scale = parseFloat(overlay.dataset.scale) || 1;
    var flippedH = overlay.dataset.flipped === 'true';
    var scaleX = flippedH ? -scale : scale;
    var scaleY = newFlippedV ? -scale : scale;

    overlay.style.transform = 'rotate(' + rot + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
    overlay.style.transformOrigin = 'center';

    console.log('flipVertical: emoji', newFlippedV ? 'volteado V' : 'restaurado V');
}

function flipVideoVertical() {
    var video = document.getElementById('video-player');
    if (!video) return;

    var flippedV = video.dataset.flippedV === 'true';
    var newFlippedV = !flippedV;
    video.dataset.flippedV = newFlippedV ? 'true' : 'false';

    var rot = parseInt(video.dataset.rotation) || 0;
    var flippedH = video.dataset.flipped === 'true';
    var scaleX = flippedH ? -1 : 1;
    var scaleY = newFlippedV ? -1 : 1;

    video.style.transform = 'rotate(' + rot + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
    video.style.transformOrigin = 'center';

    console.log('flipVertical: video', newFlippedV ? 'volteado V' : 'restaurado V');
}
