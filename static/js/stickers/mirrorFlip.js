// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// mirrorFlip.js - Boton de espejo (flip) para elementos seleccionados
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica emojiTrackManager.js,
// videoEditor.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Crea un boton con icono de espejo en la barra de herramientas
//   - Al hacer clic, hace flip horizontal del elemento seleccionado:
//     * Si hay un emoji seleccionado (.emoji-clip.selected), hace flip
//       de su overlay (.emoji-overlay)
//     * Si hay un clip de video seleccionado (.timeline-clip.selected),
//       hace flip del video (#video-player)
//   - Alterna entre normal y espejo (cada clic invierte)
//   - Preserva rotacion y escala existentes
//
// NO TOCAR:
//   - Ningun archivo existente. Este archivo es completamente autonomo.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMirrorFlip);
} else {
    initMirrorFlip();
}

function initMirrorFlip() {
    var attempts = 0;
    var interval = setInterval(function() {
        attempts++;
        if (attempts > 60) {
            clearInterval(interval);
            return;
        }

        var refBtn = document.getElementById('btn-add-voiceover') ||
                     document.getElementById('btn-add-music') ||
                     document.getElementById('btn-add-sticker') ||
                     document.getElementById('btn-export') ||
                     document.getElementById('btn-add-text');

        if (!refBtn) return;

        var toolbar = refBtn.parentElement;
        if (!toolbar) return;

        if (document.getElementById('btn-mirror-flip')) {
            clearInterval(interval);
            return;
        }

        clearInterval(interval);
        createMirrorButton(toolbar);
    }, 500);
}

function createMirrorButton(toolbar) {
    var btn = document.createElement('button');
    btn.id = 'btn-mirror-flip';
    btn.className = 'btn btn-outline-light';
    btn.style.cssText = 'padding: 6px 10px;';
    btn.title = 'Espejo (flip horizontal) del elemento seleccionado';
    btn.innerHTML = '<i class="bi bi-symmetry-horizontal fs-5"></i>';

    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        doMirrorFlip();
    });

    toolbar.appendChild(btn);
    console.log('mirrorFlip: boton de espejo creado en toolbar');
}

function doMirrorFlip() {
    // 1. Intentar emoji seleccionado
    var emojiClip = document.querySelector('.emoji-clip.selected');
    if (emojiClip) {
        flipEmoji(emojiClip);
        return;
    }

    // 2. Intentar clip de video seleccionado
    var videoClip = document.querySelector('.timeline-clip.selected');
    if (videoClip) {
        flipVideo();
        return;
    }

    console.log('mirrorFlip: no hay elemento seleccionado');
}

// ---------------------------------------------------------------------------
// flipEmoji(clip)
// ---------------------------------------------------------------------------
// Hace flip horizontal del overlay de un emoji, preservando rotacion y escala.
// ---------------------------------------------------------------------------
function flipEmoji(clip) {
    var overlayId = clip.dataset.overlayId;
    if (!overlayId) {
        console.log('mirrorFlip: emoji sin overlayId');
        return;
    }

    var overlay = document.getElementById(overlayId);
    if (!overlay) {
        console.log('mirrorFlip: overlay no encontrado:', overlayId);
        return;
    }

    // Leer estado actual
    var flipped = overlay.dataset.flipped === 'true';
    var newFlipped = !flipped;
    overlay.dataset.flipped = newFlipped ? 'true' : 'false';

    // Construir transform completo preservando rotacion y escala
    var rot = parseInt(overlay.dataset.rotation) || 0;
    var scale = parseFloat(overlay.dataset.scale) || 1;
    var scaleX = newFlipped ? -scale : scale;

    overlay.style.transform = 'rotate(' + rot + 'deg) scaleX(' + scaleX + ') scaleY(' + scale + ')';
    overlay.style.transformOrigin = 'center';

    console.log('mirrorFlip: emoji', newFlipped ? 'volteado' : 'restaurado');
}

// ---------------------------------------------------------------------------
// flipVideo()
// ---------------------------------------------------------------------------
// Hace flip horizontal del video de previsualizacion.
// ---------------------------------------------------------------------------
function flipVideo() {
    var video = document.getElementById('video-player');
    if (!video) {
        console.log('mirrorFlip: video-player no encontrado');
        return;
    }

    var flipped = video.dataset.flipped === 'true';
    var newFlipped = !flipped;
    video.dataset.flipped = newFlipped ? 'true' : 'false';

    if (newFlipped) {
        video.style.transform = 'scaleX(-1)';
    } else {
        video.style.transform = '';
    }

    console.log('mirrorFlip: video', newFlipped ? 'volteado' : 'restaurado');
}
