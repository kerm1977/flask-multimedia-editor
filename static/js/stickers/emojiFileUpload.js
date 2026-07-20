// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiFileUpload.js - Subir archivos de imagen (PNG/SVG) como emojis/stickers
//
// Archivo INDEPENDIENTE. No modifica emojis.js, stickers.js, emojiStickerPanel.js,
// emojiTrackManager.js, ni ningun otro archivo de la aplicacion.
//
// FUNCIONALIDAD:
//   - Agrega botones "Subir imagen" al panel de emojis/stickers
//   - Permite subir archivos PNG, SVG, JPG, GIF, WEBP
//   - Los archivos subidos se agregan como categoria "Personalizados"
//   - Se almacenan como data URLs en window.CUSTOM_EMOJI_LIST
//   - Doble clic en un emoji personalizado funciona igual que los nativos
//
// COMO FUNCIONA:
//   - Espera a que el panel #emoji-sticker-panel se cree
//   - Agrega una barra de botones en la parte inferior del panel
//   - Los archivos se leen con FileReader como data URLs
//   - Se agregan a window.CUSTOM_EMOJI_LIST con categoria "Personalizados"
//   - emojiStickerPanel.js renderiza los emojis de window.CUSTOM_EMOJI_LIST
//     junto con window.EMOJI_LIST (se mergean al renderizar)
//
// DEPENDENCIAS:
//   - Ninguna. Solo necesita que el panel exista.
//
// NO TOCAR:
//   - emojis.js, stickers.js: no se modifican
//   - emojiStickerPanel.js: no se modifica
//   - emojiTrackManager.js: no se modifica
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiFileUpload);
} else {
    initEmojiFileUpload();
}

// Lista global de emojis/stickers personalizados
window.CUSTOM_EMOJI_LIST = window.CUSTOM_EMOJI_LIST || [];

function initEmojiFileUpload() {
    // Observar cuando se crea el panel para agregar los botones
    observePanel();
    console.log('emojiFileUpload inicializado');
}

// ---------------------------------------------------------------------------
// observePanel()
// ---------------------------------------------------------------------------
// Observa el DOM para detectar cuando el panel #emoji-sticker-panel se crea
// y le agrega los botones de subida de archivos.
// ---------------------------------------------------------------------------
function observePanel() {
    // Polling cada 500ms para detectar el panel
    setInterval(function() {
        var panel = document.getElementById('emoji-sticker-panel');
        if (panel && !panel.querySelector('#emoji-upload-bar')) {
            addUploadBar(panel);
        }
    }, 500);
}

// ---------------------------------------------------------------------------
// addUploadBar(panel)
// ---------------------------------------------------------------------------
// Agrega una barra de botones para subir archivos al panel.
// ---------------------------------------------------------------------------
function addUploadBar(panel) {
    var bar = document.createElement('div');
    bar.id = 'emoji-upload-bar';
    bar.style.cssText =
        'display:flex; gap:8px; padding:8px 12px; border-top:1px solid #333;' +
        'align-items:center; justify-content:center;';

    // Boton: Subir como emoji
    var btnEmoji = document.createElement('button');
    btnEmoji.textContent = 'Subir Emoji';
    btnEmoji.style.cssText =
        'background:#0d6efd; color:white; border:none; border-radius:6px;' +
        'padding:6px 12px; cursor:pointer; font-size:12px;';
    btnEmoji.addEventListener('click', function() {
        openFileDialog(false);
    });

    // Boton: Subir como sticker
    var btnSticker = document.createElement('button');
    btnSticker.textContent = 'Subir Sticker';
    btnSticker.style.cssText =
        'background:#f5a623; color:white; border:none; border-radius:6px;' +
        'padding:6px 12px; cursor:pointer; font-size:12px;';
    btnSticker.addEventListener('click', function() {
        openFileDialog(true);
    });

    bar.appendChild(btnEmoji);
    bar.appendChild(btnSticker);

    // Insertar antes del hint (ultimo elemento del panel)
    var hint = panel.querySelector('div[style*="Doble clic"]');
    if (hint) {
        panel.insertBefore(bar, hint);
    } else {
        panel.appendChild(bar);
    }
}

// ---------------------------------------------------------------------------
// openFileDialog(isSticker)
// ---------------------------------------------------------------------------
// Abre el dialogo de seleccion de archivos y procesa las imagenes.
// ---------------------------------------------------------------------------
function openFileDialog(isSticker) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/svg+xml,image/jpeg,image/gif,image/webp';
    input.multiple = true;
    input.style.display = 'none';

    input.addEventListener('change', function(e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;

        for (var i = 0; i < files.length; i++) {
            processFile(files[i], isSticker);
        }

        // Remover el input del DOM
        input.remove();
    });

    document.body.appendChild(input);
    input.click();
}

// ---------------------------------------------------------------------------
// processFile(file, isSticker)
// ---------------------------------------------------------------------------
// Lee un archivo de imagen y lo agrega a window.CUSTOM_EMOJI_LIST.
// ---------------------------------------------------------------------------
function processFile(file, isSticker) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var dataUrl = e.target.result;
        var name = file.name.replace(/\.[^/.]+$/, ''); // sin extension

        var item = {
            e: '<img src="' + dataUrl + '" style="width:100%;height:100%;object-fit:contain;" alt="' + name + '">',
            n: name,
            c: 'Personalizados',
            isImage: true,
            dataUrl: dataUrl,
            isSticker: isSticker
        };

        window.CUSTOM_EMOJI_LIST.push(item);
        console.log('emojiFileUpload: agregado', isSticker ? 'sticker' : 'emoji', name);

        // Re-renderizar el panel si esta abierto
        renderCustomItems();
    };
    reader.readAsDataURL(file);
}

// ---------------------------------------------------------------------------
// renderCustomItems()
// ---------------------------------------------------------------------------
// Re-renderiza el grid del panel para incluir los items personalizados.
// Inserta los items personalizados directamente en el grid.
// ---------------------------------------------------------------------------
function renderCustomItems() {
    var grid = document.getElementById('emoji-sticker-grid');
    if (!grid) return;

    // Filtrar items personalizados por tab actual
    var customItems = window.CUSTOM_EMOJI_LIST.filter(function(item) {
        // En tab emojis mostrar los que no son stickers, en tab stickers los que si
        var tab = getCurrentTab();
        if (tab === 'emojis') return !item.isSticker;
        if (tab === 'stickers') return item.isSticker;
        return true;
    });

    customItems.forEach(function(item) {
        // Verificar si ya esta en el grid
        if (grid.querySelector('[data-custom-name="' + item.n + '"]')) return;

        var el = document.createElement('div');
        el.dataset.customName = item.n;
        el.title = item.n;
        el.innerHTML = item.e;
        el.style.cssText =
            'display:flex; align-items:center; justify-content:center;' +
            'width:48px; height:48px; cursor:pointer; padding:2px;' +
            'border-radius:6px; transition:background 0.15s; user-select:none;' +
            (item.isSticker ? 'filter:drop-shadow(2px 2px 0 white);' : '');

        el.addEventListener('mouseenter', function() {
            el.style.background = '#333';
        });
        el.addEventListener('mouseleave', function() {
            el.style.background = '';
        });
        el.addEventListener('dblclick', function() {
            // Llamar a addToPreview como hacen los emojis nativos
            if (typeof window.addEmojiToTrack === 'function') {
                // Para imagenes, pasar el HTML del img como emoji
                window.addEmojiToTrack(item.e, item.isSticker);
            }
        });

        grid.appendChild(el);
    });
}

// ---------------------------------------------------------------------------
// getCurrentTab()
// ---------------------------------------------------------------------------
// Lee el tab actual del panel (emojis o stickers).
// ---------------------------------------------------------------------------
function getCurrentTab() {
    var tabEmojis = document.getElementById('tab-emojis');
    if (tabEmojis) {
        var bg = tabEmojis.style.backgroundColor;
        if (bg && bg !== 'transparent') return 'emojis';
    }
    var tabStickers = document.getElementById('tab-stickers');
    if (tabStickers) {
        var bg2 = tabStickers.style.backgroundColor;
        if (bg2 && bg2 !== 'transparent') return 'stickers';
    }
    return 'emojis';
}
