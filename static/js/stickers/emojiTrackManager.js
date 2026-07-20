// ============================================================================
console.log('emojiTrackManager.js: archivo cargado');
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiTrackManager.js - Gestion del track de emojis/stickers en el timeline

// === VARIABLES GLOBALES (declaradas primero para que esten disponibles) ===
var EMOJI_TRACK_ID = 'emoji-track';
var EMOJI_CLIP_CLASS = 'emoji-clip';
var EMOJI_OVERLAY_CLASS = 'emoji-overlay';
var EMOJI_DEFAULT_DURATION = 5;
var PIXELS_PER_SECOND = 10;
var selectedEmojiClip = null;
var allEmojiClips = [];
//
// Archivo INDEPENDIENTE. No modifica emojis.js, stickers.js, ni ningun otro
// archivo de la aplicacion. Solo expone window.addEmojiToTrack() para que
// emojiStickerPanel.js lo llame al hacer doble clic.
//
// FUNCIONALIDAD:
//   - Crea dinamicamente un track "emoji-track" en el timeline al agregar
//     el primer emoji
//   - Cada emoji se agrega como clip en el track con duracion de 5 segundos
//   - Cada emoji tambien se muestra como overlay en el previsualizador
//   - Los overlays se muestran/ocultan segun la posicion del playhead
//   - Atajos de teclado cuando un clip de emoji esta seleccionado:
//       R = Rotar el overlay
//       S = Escalar el overlay (mas grande / mas pequeno)
//       G = Mover el clip en el timeline (arrastrar)
//       D = Borrar el clip seleccionado
//       A = Seleccionar todos los clips de emoji
//       X = Dividir el clip en dos en la posicion del playhead
//   - Extender duracion: arrastrar borde derecho del clip con el mouse
//
// IDs Y CLASES QUE USA:
//   - #emoji-track: track del timeline (creado dinamicamente)
//   - .emoji-clip: clips de emoji en el track
//   - .emoji-overlay: overlays en el previsualizador
//   - .video-preview-container: contenedor donde se muestran los overlays
//   - .tracks-container: contenedor de tracks del timeline
//
// DEPENDENCIAS:
//   - Ninguna. Lee window.EMOJI_LIST y window.STICKER_LIST solo para nombres.
//   - emojiStickerPanel.js llama window.addEmojiToTrack(emoji, isSticker)
//
// NO TOCAR:
//   - emojis.js: no se modifica ni se lee directamente
//   - stickers.js: no se modifica ni se lee directamente
//   - emojiStickerPanel.js: solo se cambia addToPreview() para llamar a window.addEmojiToTrack
//   - Ningun archivo del timeline (clipDragMove.js, splitClip.js, etc.)
// ============================================================================

// === DEFINIR window.addEmojiToTrack LO ANTES POSIBLE ===
// Esto asegura que emojiStickerPanel.js pueda llamarla incluso si el
// codigo de inicializacion falla.
window.addEmojiToTrack = function(emoji, isSticker) {
    // Crear el track si no existe
    var track = document.getElementById(EMOJI_TRACK_ID);
    if (!track) {
        track = createEmojiTrack();
        if (!track) {
            console.error('emojiTrackManager: no se pudo crear el track');
            return;
        }
    }

    // Calcular posicion del nuevo clip (despues del ultimo clip)
    var pos = getEndOfLastEmojiClip(track);

    // Crear el clip en el timeline
    var clip = createEmojiClip(emoji, isSticker, pos);
    track.appendChild(clip);
    allEmojiClips.push(clip);

    // Crear el overlay en el previsualizador
    createEmojiOverlay(emoji, isSticker, clip);

    // Seleccionar el clip recien creado
    selectEmojiClip(clip);

    console.log('emojiTrackManager: emoji agregado al track', emoji);
};

console.log('emojiTrackManager.js: window.addEmojiToTrack definido');

// === INICIALIZACION (envuelta en try/catch para no romper la app) ===
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEmojiTrackManager);
    } else {
        initEmojiTrackManager();
    }
} catch(e) {
    console.error('emojiTrackManager: error en inicializacion:', e);
}

function initEmojiTrackManager() {
    document.addEventListener('keydown', handleEmojiKeyboard);
    observePlayhead();
    createUnifiedPlayheadLine();
    console.log('emojiTrackManager inicializado');
}

// ---------------------------------------------------------------------------
// createUnifiedPlayheadLine()
// ---------------------------------------------------------------------------
// Crea una linea roja visual que se extiende sobre TODOS los tracks,
// sincronizada con el playhead principal (#timeline-playhead).
// No reemplaza el playhead real (que sigue en video-track).
// Solo es una linea visual que da la ilusion de un playhead unificado.
// ---------------------------------------------------------------------------
function createUnifiedPlayheadLine() {
    // Esperar a que el playhead principal exista
    function tryCreate() {
        var mainPlayhead = document.getElementById('timeline-playhead');
        if (!mainPlayhead) {
            setTimeout(tryCreate, 200);
            return;
        }

        var tracksContainer = document.querySelector('.tracks-container');
        if (!tracksContainer) {
            setTimeout(tryCreate, 200);
            return;
        }

        // Crear linea unificada
        var line = document.getElementById('unified-playhead-line');
        if (!line) {
            line = document.createElement('div');
            line.id = 'unified-playhead-line';
            line.style.cssText =
                'position:absolute;top:0;width:2px;height:100%;' +
                'background-color:#ff0000;box-shadow:0 0 4px #ff0000;' +
                'z-index:998;pointer-events:none;left:0px;';
            tracksContainer.style.position = 'relative';
            tracksContainer.appendChild(line);
        }

        // Sincronizar la linea con el playhead principal en cada frame
        function syncLine() {
            if (!mainPlayhead || !mainPlayhead.parentElement) {
                mainPlayhead = document.getElementById('timeline-playhead');
            }
            if (mainPlayhead && mainPlayhead.parentElement) {
                // Calcular posicion relativa al tracks-container
                var mainRect = mainPlayhead.getBoundingClientRect();
                var containerRect = tracksContainer.getBoundingClientRect();
                // El centro del playhead (linea roja a 9px del left del playhead)
                var centerX = mainRect.left + 9 - containerRect.left;
                line.style.left = centerX + 'px';
            }
            requestAnimationFrame(syncLine);
        }
        requestAnimationFrame(syncLine);
    }
    tryCreate();
}

// ---------------------------------------------------------------------------
// createEmojiTrack()
// ---------------------------------------------------------------------------
// Crea el track "Emojis" dinamicamente en el timeline.
// Se inserta despues del ultimo track existente.
// ---------------------------------------------------------------------------
function createEmojiTrack() {
    var tracksContainer = document.querySelector('.tracks-container');
    if (!tracksContainer) {
        console.error('emojiTrackManager: no se encontro .tracks-container');
        return null;
    }

    // Crear la fila del track con la MISMA estructura que video-track y audio-track:
    // [numBadge 20px] [controls-btns 28px] [label 80px] [track flex-grow-1]
    // Esto asegura alineacion vertical perfecta con los otros tracks.
    var row = document.createElement('div');
    row.className = 'track-row d-flex align-items-center gap-2';
    row.id = 'emoji-track-row';

    // 1. Number badge (20px) - igual que timelineMultiTracks.js
    var numBadge = document.createElement('span');
    numBadge.className = 'track-number-badge';
    numBadge.textContent = 'E';
    numBadge.style.cssText =
        'display:flex;align-items:center;justify-content:center;' +
        'width:20px;height:60px;flex-shrink:0;' +
        'font-size:13px;font-weight:bold;color:#f5a623;' +
        'background:transparent;border:none;';

    // 2. Controls container (28px) - igual que trackControls.js
    // Solo boton de ocultar (no mute, los emojis no tienen audio).
    // El ancho debe ser igual al de los otros tracks para alinear.
    var btnContainer = document.createElement('div');
    btnContainer.className = 'track-controls-btns';
    btnContainer.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'gap:4px;flex-shrink:0;width:28px;';

    // Boton ocultar (espaciador superior para alinear con mute de otros tracks)
    var spacerTop = document.createElement('div');
    spacerTop.style.cssText = 'width:26px;height:26px;flex-shrink:0;';

    var hideBtn = document.createElement('button');
    hideBtn.className = 'btn btn-sm track-hide-btn';
    hideBtn.style.cssText =
        'padding:2px;width:26px;height:26px;border:none;background:transparent;' +
        'color:#8899aa;font-size:16px;line-height:1;';
    hideBtn.innerHTML = '<i class="bi bi-eye"></i>';
    hideBtn.title = 'Ocultar/Mostrar emojis';
    hideBtn.dataset.trackId = EMOJI_TRACK_ID;
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
        var clips = track.querySelectorAll('.' + EMOJI_CLIP_CLASS);
        clips.forEach(function(clip) {
            if (newHidden) {
                clip.style.opacity = '0.2';
                clip.style.filter = 'grayscale(100%)';
            } else {
                clip.style.opacity = '';
                clip.style.filter = '';
            }
        });
        console.log('emojiTrackManager: hide toggle', newHidden);
    });

    btnContainer.appendChild(spacerTop);
    btnContainer.appendChild(hideBtn);

    // 2b. Espaciador de 50px para alinear con el vol-slider-wrap de los otros tracks
    // Los tracks de video y audio tienen un slider de volumen de 50px aqui.
    // El track de emojis no necesita volumen, pero necesita el espacio para alinear.
    var volSpacer = document.createElement('div');
    volSpacer.className = 'vol-slider-wrap';
    volSpacer.style.cssText =
        'display:flex;flex-direction:column;align-items:center;' +
        'flex-shrink:0;width:50px;height:60px;gap:2px;justify-content:center;';

    // 3. Label del track (80px) - igual que los tracks originales
    var label = document.createElement('div');
    label.className = 'track-label bg-dark rounded p-2 text-center';
    label.style.width = '80px';
    label.style.border = '1px solid #f5a623';
    label.innerHTML = '<i class="bi bi-emoji-smile" style="color:#f5a623;"></i><small class="d-block" style="color:#f5a623;">Emojis</small>';

    // Boton de eliminar track (igual que timelineMultiTracks.js para tracks extra)
    var removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-outline-danger w-100 mt-1';
    removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
    removeBtn.style.fontSize = '10px';
    removeBtn.style.padding = '1px 4px';
    removeBtn.title = 'Eliminar track de emojis';
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeEmojiTrack();
    });
    label.appendChild(removeBtn);

    // 4. Track element (flex-grow-1) - igual que los tracks originales
    var track = document.createElement('div');
    track.className = 'track-track flex-grow-1 bg-dark rounded p-2 position-relative';
    track.style.height = '60px';
    track.style.border = '1px solid #f5a623';
    track.id = EMOJI_TRACK_ID;

    // Ensamblar la fila en el mismo orden que los tracks originales:
    // [numBadge 20px] [controls-btns 28px] [vol-slider-wrap 50px] [label 80px] [track]
    row.appendChild(numBadge);
    row.appendChild(btnContainer);
    row.appendChild(volSpacer);
    row.appendChild(label);
    row.appendChild(track);
    tracksContainer.appendChild(row);

    console.log('emojiTrackManager: track de emojis creado');
    return track;
}

// ---------------------------------------------------------------------------
// removeEmojiTrack()
// ---------------------------------------------------------------------------
function removeEmojiTrack() {
    // Remover todos los overlays
    var overlays = document.querySelectorAll('.' + EMOJI_OVERLAY_CLASS);
    overlays.forEach(function(o) { o.remove(); });

    // Limpiar array de clips
    allEmojiClips = [];
    selectedEmojiClip = null;

    // Remover la fila del track
    var row = document.getElementById('emoji-track-row');
    if (row) row.remove();

    console.log('emojiTrackManager: track de emojis eliminado');
}

// ---------------------------------------------------------------------------
// createEmojiClip(emoji, isSticker, position)
// ---------------------------------------------------------------------------
// Crea un clip de emoji en el timeline.
// ---------------------------------------------------------------------------
function createEmojiClip(emoji, isSticker, position) {
    var clipWidth = EMOJI_DEFAULT_DURATION * PIXELS_PER_SECOND;

    var clip = document.createElement('div');
    clip.className = 'timeline-clip ' + EMOJI_CLIP_CLASS;
    clip.style.cssText =
        'position:absolute; left:' + position + 'px; top:5px;' +
        'height:50px; width:' + clipWidth + 'px;' +
        'background:linear-gradient(135deg,#f5a623 0%,#e8950d 100%);' +
        'border:1px solid #f5a623; border-radius:4px;' +
        'padding:4px; color:white; font-size:14px;' +
        'overflow:hidden; cursor:move; display:flex;' +
        'align-items:center; justify-content:center;';
    clip.textContent = emoji;
    clip.dataset.emoji = emoji;
    clip.dataset.isSticker = isSticker ? 'true' : 'false';
    clip.dataset.duration = EMOJI_DEFAULT_DURATION;
    clip.dataset.startTime = position / PIXELS_PER_SECOND;

    // Click para seleccionar
    clip.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        selectEmojiClip(clip);
    });

    // Arrastrar el clip (mover en el timeline)
    enableClipDrag(clip);

    // Extender duracion arrastrando borde derecho
    enableClipResize(clip);

    // Context menu para eliminar
    clip.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        deleteEmojiClip(clip);
    });

    return clip;
}

// ---------------------------------------------------------------------------
// selectEmojiClip(clip)
// ---------------------------------------------------------------------------
function selectEmojiClip(clip) {
    // Deseleccionar todos
    allEmojiClips.forEach(function(c) {
        c.style.border = '1px solid #f5a623';
        c.classList.remove('selected');
    });

    // Seleccionar este
    clip.style.border = '2px solid #fff';
    clip.classList.add('selected');
    selectedEmojiClip = clip;

    // Mostrar el overlay correspondiente
    showOverlayForClip(clip);
}

// ---------------------------------------------------------------------------
// createEmojiOverlay(emoji, isSticker, clip)
// ---------------------------------------------------------------------------
// Crea un overlay del emoji en el previsualizador.
// El overlay se muestra/oculta segun la posicion del playhead.
// ---------------------------------------------------------------------------
function createEmojiOverlay(emoji, isSticker, clip) {
    var container = document.querySelector('.video-preview-container');
    if (!container) return;

    var overlay = document.createElement('div');
    overlay.className = EMOJI_OVERLAY_CLASS;
    overlay.textContent = emoji;
    overlay.style.cssText =
        'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);' +
        'font-size:' + (isSticker ? '60px' : '40px') + ';' +
        'cursor:move; user-select:none; z-index:100; display:none;' +
        (isSticker ? 'filter:drop-shadow(3px 3px 0 white);' : '');
    overlay.dataset.clipId = '';
    overlay.dataset.rotation = '0';
    overlay.dataset.scale = '1';

    // Generar ID unico para el overlay
    var overlayId = 'emoji-overlay-' + Date.now();
    overlay.id = overlayId;
    clip.dataset.overlayId = overlayId;

    container.appendChild(overlay);

    // Hacer el overlay arrastrable en el previsualizador
    enableOverlayDrag(overlay, clip);
}

// ---------------------------------------------------------------------------
// enableOverlayDrag(overlay, clip)
// ---------------------------------------------------------------------------
// Permite arrastrar el overlay dentro del previsualizador.
// ---------------------------------------------------------------------------
function enableOverlayDrag(overlay, clip) {
    var isDragging = false;
    var startX, startY, origX, origY;

    overlay.addEventListener('mousedown', function(e) {
        if (e.target !== overlay) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = overlay.offsetLeft;
        origY = overlay.offsetTop;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        overlay.style.left = (origX + dx) + 'px';
        overlay.style.top = (origY + dy) + 'px';
        overlay.style.transform = 'none';

        // Guardar posicion en el clip
        clip.dataset.overlayX = (origX + dx) + 'px';
        clip.dataset.overlayY = (origY + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Touch
    overlay.addEventListener('touchstart', function(e) {
        if (e.target !== overlay) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        origX = overlay.offsetLeft;
        origY = overlay.offsetTop;
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        overlay.style.left = (origX + dx) + 'px';
        overlay.style.top = (origY + dy) + 'px';
        overlay.style.transform = 'none';
        clip.dataset.overlayX = (origX + dx) + 'px';
        clip.dataset.overlayY = (origY + dy) + 'px';
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        isDragging = false;
    });
}

// ---------------------------------------------------------------------------
// enableClipDrag(clip)
// ---------------------------------------------------------------------------
// Permite arrastrar el clip dentro del track (mover en el tiempo).
// ---------------------------------------------------------------------------
function enableClipDrag(clip) {
    if (clip.dataset.dragEnabled === 'true') return;
    clip.dataset.dragEnabled = 'true';

    var isDragging = false;
    var startX, startLeft;

    clip.addEventListener('mousedown', function(e) {
        // No arrastrar si se esta resizeando
        if (e.offsetX > clip.offsetWidth - 8) return;
        isDragging = true;
        startX = e.clientX;
        startLeft = parseInt(clip.style.left) || 0;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var newLeft = Math.max(0, startLeft + dx);
        clip.style.left = newLeft + 'px';
        clip.dataset.startTime = newLeft / PIXELS_PER_SECOND;
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// ---------------------------------------------------------------------------
// enableClipResize(clip)
// ---------------------------------------------------------------------------
// Permite extender la duracion del clip arrastrando su borde derecho.
// ---------------------------------------------------------------------------
function enableClipResize(clip) {
    if (clip.dataset.resizeEnabled === 'true') return;
    clip.dataset.resizeEnabled = 'true';

    var isResizing = false;
    var startX, startWidth;

    clip.addEventListener('mousedown', function(e) {
        // Solo resize si se hace clic en los ultimos 8px del borde derecho
        if (e.offsetX < clip.offsetWidth - 8) return;
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(clip.style.width) || 50;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        var dx = e.clientX - startX;
        var newWidth = Math.max(30, startWidth + dx);
        clip.style.width = newWidth + 'px';
        clip.dataset.duration = newWidth / PIXELS_PER_SECOND;
    });

    document.addEventListener('mouseup', function() {
        isResizing = false;
    });
}

// ---------------------------------------------------------------------------
// handleEmojiKeyboard(e)
// ---------------------------------------------------------------------------
// Maneja los atajos de teclado para clips de emoji seleccionados.
//   R = Rotar
//   S = Escalar
//   G = Mover (inicia arrastre del clip)
//   D = Borrar
//   A = Seleccionar todos
//   X = Dividir
// ---------------------------------------------------------------------------
function handleEmojiKeyboard(e) {
    // Solo procesar si hay un clip de emoji seleccionado o si es A
    var key = e.key.toLowerCase();

    if (key === 'a') {
        // Seleccionar todos los clips de emoji
        e.preventDefault();
        selectAllEmojiClips();
        return;
    }

    if (!selectedEmojiClip) return;

    switch (key) {
        case 'r':
            e.preventDefault();
            rotateOverlay(selectedEmojiClip);
            break;
        case 's':
            e.preventDefault();
            scaleOverlay(selectedEmojiClip);
            break;
        case 'g':
            e.preventDefault();
            // G ya maneja el arrastre via mousedown, aqui solo enfocamos
            console.log('G: arrastra el clip para moverlo');
            break;
        case 'd':
            e.preventDefault();
            deleteEmojiClip(selectedEmojiClip);
            break;
        case 'x':
            e.preventDefault();
            splitEmojiClip(selectedEmojiClip);
            break;
    }
}

// ---------------------------------------------------------------------------
// rotateOverlay(clip)
// ---------------------------------------------------------------------------
// Rota el overlay 15 grados cada vez que se presiona R.
// ---------------------------------------------------------------------------
function rotateOverlay(clip) {
    var overlayId = clip.dataset.overlayId;
    if (!overlayId) return;
    var overlay = document.getElementById(overlayId);
    if (!overlay) return;

    var currentRot = parseInt(overlay.dataset.rotation) || 0;
    currentRot += 15;
    overlay.dataset.rotation = currentRot;

    var scale = parseFloat(overlay.dataset.scale) || 1;
    var x = overlay.style.left || '50%';
    var y = overlay.style.top || '50%';
    overlay.style.transform = 'rotate(' + currentRot + 'deg) scale(' + scale + ')';
    overlay.style.transformOrigin = 'center';

    clip.dataset.overlayRotation = currentRot;
    console.log('R: rotado a', currentRot, 'grados');
}

// ---------------------------------------------------------------------------
// scaleOverlay(clip)
// ---------------------------------------------------------------------------
// Escala el overlay. S alterna entre mas grande y mas pequeno.
// ---------------------------------------------------------------------------
function scaleOverlay(clip) {
    var overlayId = clip.dataset.overlayId;
    if (!overlayId) return;
    var overlay = document.getElementById(overlayId);
    if (!overlay) return;

    var currentScale = parseFloat(overlay.dataset.scale) || 1;
    // Ciclo: 1 -> 1.25 -> 1.5 -> 2 -> 0.75 -> 0.5 -> 1
    var scales = [1, 1.25, 1.5, 2, 0.75, 0.5];
    var idx = scales.indexOf(currentScale);
    if (idx === -1 || idx >= scales.length - 1) {
        currentScale = scales[0];
    } else {
        currentScale = scales[idx + 1];
    }
    overlay.dataset.scale = currentScale;

    var rot = parseInt(overlay.dataset.rotation) || 0;
    overlay.style.transform = 'rotate(' + rot + 'deg) scale(' + currentScale + ')';
    overlay.style.transformOrigin = 'center';

    clip.dataset.overlayScale = currentScale;
    console.log('S: escalado a', currentScale);
}

// ---------------------------------------------------------------------------
// deleteEmojiClip(clip)
// ---------------------------------------------------------------------------
function deleteEmojiClip(clip) {
    // Remover overlay
    var overlayId = clip.dataset.overlayId;
    if (overlayId) {
        var overlay = document.getElementById(overlayId);
        if (overlay) overlay.remove();
    }

    // Remover clip del array
    var idx = allEmojiClips.indexOf(clip);
    if (idx !== -1) allEmojiClips.splice(idx, 1);

    // Deseleccionar
    if (selectedEmojiClip === clip) selectedEmojiClip = null;

    // Remover clip del DOM
    clip.remove();

    console.log('D: clip de emoji eliminado');
}

// ---------------------------------------------------------------------------
// selectAllEmojiClips()
// ---------------------------------------------------------------------------
function selectAllEmojiClips() {
    allEmojiClips.forEach(function(c) {
        c.style.border = '2px solid #fff';
        c.classList.add('selected');
    });
    if (allEmojiClips.length > 0) {
        selectedEmojiClip = allEmojiClips[0];
    }
    console.log('A: seleccionados', allEmojiClips.length, 'clips de emoji');
}

// ---------------------------------------------------------------------------
// splitEmojiClip(clip)
// ---------------------------------------------------------------------------
// Divide el clip en dos en la posicion actual del playhead.
// ---------------------------------------------------------------------------
function splitEmojiClip(clip) {
    var playhead = document.getElementById('timeline-playhead');
    if (!playhead) {
        console.log('X: no se encontro el playhead');
        return;
    }

    var track = document.getElementById(EMOJI_TRACK_ID);
    if (!track) return;

    // Posicion del playhead relativa al track
    // Restar el padding del track (p-2 = 8px) porque los clips se posicionan
    // relativo al padding box, no al border box.
    var trackRect = track.getBoundingClientRect();
    var playheadRect = playhead.getBoundingClientRect();
    var trackPadding = parseInt(getComputedStyle(track).paddingLeft) || 0;
    var playheadX = playheadRect.left - trackRect.left - trackPadding;

    var clipLeft = parseInt(clip.style.left) || 0;
    var clipWidth = parseInt(clip.style.width) || 50;

    // El playhead debe estar dentro del clip
    if (playheadX < clipLeft || playheadX > clipLeft + clipWidth) {
        console.log('X: el playhead no esta sobre este clip');
        return;
    }

    // Calcular division
    var leftWidth = playheadX - clipLeft;
    var rightWidth = clipWidth - leftWidth;

    // Reducir el clip original a la parte izquierda
    clip.style.width = leftWidth + 'px';
    clip.dataset.duration = leftWidth / PIXELS_PER_SECOND;

    // Crear el clip derecho
    var emoji = clip.dataset.emoji;
    var isSticker = clip.dataset.isSticker === 'true';
    var rightClip = createEmojiClip(emoji, isSticker, playheadX);
    rightClip.style.width = rightWidth + 'px';
    rightClip.dataset.duration = rightWidth / PIXELS_PER_SECOND;

    // Copiar posicion del overlay
    rightClip.dataset.overlayX = clip.dataset.overlayX || '50%';
    rightClip.dataset.overlayY = clip.dataset.overlayY || '50%';
    rightClip.dataset.overlayRotation = clip.dataset.overlayRotation || '0';
    rightClip.dataset.overlayScale = clip.dataset.overlayScale || '1';

    track.appendChild(rightClip);
    allEmojiClips.push(rightClip);

    // Crear overlay para el nuevo clip
    createEmojiOverlay(emoji, isSticker, rightClip);

    // Aplicar posicion/transform guardados al nuevo overlay
    var newOverlayId = rightClip.dataset.overlayId;
    if (newOverlayId) {
        var newOverlay = document.getElementById(newOverlayId);
        if (newOverlay) {
            if (rightClip.dataset.overlayX) {
                newOverlay.style.left = rightClip.dataset.overlayX;
                newOverlay.style.top = rightClip.dataset.overlayY;
                newOverlay.style.transform = 'none';
            }
            var rot = parseInt(rightClip.dataset.overlayRotation) || 0;
            var scale = parseFloat(rightClip.dataset.overlayScale) || 1;
            if (rot || scale !== 1) {
                newOverlay.style.transform = 'rotate(' + rot + 'deg) scale(' + scale + ')';
                newOverlay.dataset.rotation = rot;
                newOverlay.dataset.scale = scale;
            }
        }
    }

    selectEmojiClip(rightClip);
    console.log('X: clip dividido en', leftWidth, 'y', rightWidth, 'px');
}

// ---------------------------------------------------------------------------
// getEndOfLastEmojiClip(track)
// ---------------------------------------------------------------------------
function getEndOfLastEmojiClip(track) {
    var clips = track.querySelectorAll('.' + EMOJI_CLIP_CLASS);
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
// showOverlayForClip(clip)
// ---------------------------------------------------------------------------
// BLINDADO: NO muestra el overlay aqui. El overlay solo se muestra cuando
// el playhead esta sobre el clip (controlado por observePlayhead).
// Esta funcion solo selecciona visualmente el clip en el timeline.
// ---------------------------------------------------------------------------
function showOverlayForClip(clip) {
    // No forzar display aqui. observePlayhead() controla la visibilidad.
}

// ---------------------------------------------------------------------------
// observePlayhead()
// ---------------------------------------------------------------------------
// Observa la posicion del playhead para mostrar/ocultar overlays segun
// la posicion temporal de cada clip.
// ---------------------------------------------------------------------------
function observePlayhead() {
    // Verificar periodicamente la posicion del playhead
    setInterval(function() {
        if (allEmojiClips.length === 0) return;

        var playhead = document.getElementById('timeline-playhead');
        if (!playhead) return;

        // El playhead tiene width 20px y la linea roja esta a 9px del left.
        // La posicion real del playhead en pantalla es:
        var playheadRect = playhead.getBoundingClientRect();
        var playheadCenterX = playheadRect.left + 9;

        allEmojiClips.forEach(function(clip) {
            var overlayId = clip.dataset.overlayId;
            if (!overlayId) return;
            var overlay = document.getElementById(overlayId);
            if (!overlay) return;

            // Comparar posiciones reales en pantalla directamente
            var clipRect = clip.getBoundingClientRect();

            // Mostrar overlay si el centro del playhead esta sobre el clip
            if (playheadCenterX >= clipRect.left && playheadCenterX <= clipRect.right) {
                overlay.style.display = '';
                // Restaurar posicion guardada
                if (clip.dataset.overlayX) {
                    overlay.style.left = clip.dataset.overlayX;
                    overlay.style.top = clip.dataset.overlayY;
                }
            } else {
                overlay.style.display = 'none';
            }
        });
    }, 50);
}
