// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiJsonImportExport.js - Importar y exportar emojis como JSON
//
// Archivo INDEPENDIENTE. No modifica emojis.js, stickers.js, emojiStickerPanel.js,
// emojiTrackManager.js, emojiFileUpload.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Exportar: descarga un archivo JSON con todos los emojis, stickers y
//     emojis personalizados (window.EMOJI_LIST, window.STICKER_LIST,
//     window.CUSTOM_EMOJI_LIST)
//   - Importar: lee un archivo JSON y agrega los emojis a
//     window.CUSTOM_EMOJI_LIST para que aparezcan en el panel
//   - Agrega botones "Exportar JSON" e "Importar JSON" al panel
//
// FORMATO JSON:
//   {
//     "emojis": [...],
//     "stickers": [...],
//     "custom": [...]
//   }
//
// COMO FUNCIONA:
//   - Espera a que el panel #emoji-sticker-panel se cree
//   - Agrega botones en la barra inferior del panel
//   - Exportar: crea un Blob y lo descarga como emoji-set.json
//   - Importar: lee el JSON con FileReader y agrega los items a
//     window.CUSTOM_EMOJI_LIST
//
// DEPENDENCIAS:
//   - Ninguna. Solo necesita que el panel exista y que window.CUSTOM_EMOJI_LIST
//     exista (la crea emojiFileUpload.js si no existe).
//
// NO TOCAR:
//   - emojis.js, stickers.js: no se modifican
//   - emojiStickerPanel.js: no se modifica
//   - emojiTrackManager.js: no se modifica
//   - emojiFileUpload.js: no se modifica
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiJsonImportExport);
} else {
    initEmojiJsonImportExport();
}

function initEmojiJsonImportExport() {
    // Observar cuando se crea el panel para agregar los botones
    observePanel();
    console.log('emojiJsonImportExport inicializado');
}

// ---------------------------------------------------------------------------
// observePanel()
// ---------------------------------------------------------------------------
// Observa el DOM para detectar cuando el panel se crea y le agrega los botones.
// ---------------------------------------------------------------------------
function observePanel() {
    setInterval(function() {
        var panel = document.getElementById('emoji-sticker-panel');
        if (panel && !panel.querySelector('#emoji-json-bar')) {
            addJsonBar(panel);
        }
    }, 500);
}

// ---------------------------------------------------------------------------
// addJsonBar(panel)
// ---------------------------------------------------------------------------
// Agrega botones de exportar e importar JSON al panel.
// ---------------------------------------------------------------------------
function addJsonBar(panel) {
    var bar = document.createElement('div');
    bar.id = 'emoji-json-bar';
    bar.style.cssText =
        'display:flex; gap:8px; padding:8px 12px; border-top:1px solid #333;' +
        'align-items:center; justify-content:center;';

    // Boton: Exportar JSON
    var btnExport = document.createElement('button');
    btnExport.textContent = 'Exportar JSON';
    btnExport.style.cssText =
        'background:#198754; color:white; border:none; border-radius:6px;' +
        'padding:6px 12px; cursor:pointer; font-size:12px;';
    btnExport.addEventListener('click', function() {
        exportEmojiJson();
    });

    // Boton: Importar JSON
    var btnImport = document.createElement('button');
    btnImport.textContent = 'Importar JSON';
    btnImport.style.cssText =
        'background:#6c757d; color:white; border:none; border-radius:6px;' +
        'padding:6px 12px; cursor:pointer; font-size:12px;';
    btnImport.addEventListener('click', function() {
        importEmojiJson();
    });

    bar.appendChild(btnExport);
    bar.appendChild(btnImport);

    // Insertar antes del hint o despues de la upload bar
    var uploadBar = panel.querySelector('#emoji-upload-bar');
    var hint = panel.querySelector('div[style*="Doble clic"]');
    if (uploadBar && uploadBar.nextSibling) {
        panel.insertBefore(bar, uploadBar.nextSibling);
    } else if (hint) {
        panel.insertBefore(bar, hint);
    } else {
        panel.appendChild(bar);
    }
}

// ---------------------------------------------------------------------------
// exportEmojiJson()
// ---------------------------------------------------------------------------
// Exporta todos los emojis, stickers y personalizados como un archivo JSON.
// ---------------------------------------------------------------------------
function exportEmojiJson() {
    var data = {
        emojis: window.EMOJI_LIST || [],
        stickers: window.STICKER_LIST || [],
        custom: window.CUSTOM_EMOJI_LIST || [],
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'emoji-set-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    console.log('emojiJsonImportExport: exportados',
        data.emojis.length, 'emojis,',
        data.stickers.length, 'stickers,',
        data.custom.length, 'personalizados');
}

// ---------------------------------------------------------------------------
// importEmojiJson()
// ---------------------------------------------------------------------------
// Abre un dialogo para seleccionar un JSON y lo importa.
// ---------------------------------------------------------------------------
function importEmojiJson() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var data = JSON.parse(ev.target.result);

                // Asegurar que CUSTOM_EMOJI_LIST existe
                if (!window.CUSTOM_EMOJI_LIST) {
                    window.CUSTOM_EMOJI_LIST = [];
                }

                // Importar emojis personalizados del JSON
                if (data.custom && Array.isArray(data.custom)) {
                    data.custom.forEach(function(item) {
                        // Evitar duplicados por nombre
                        var exists = window.CUSTOM_EMOJI_LIST.some(function(existing) {
                            return existing.n === item.n;
                        });
                        if (!exists) {
                            window.CUSTOM_EMOJI_LIST.push(item);
                        }
                    });
                }

                // Si el JSON tiene emojis nativos y queremos reemplazarlos,
                // los agregamos tambien como personalizados (no sobrescribimos
                // window.EMOJI_LIST para no romper emojis.js)
                if (data.emojis && Array.isArray(data.emojis)) {
                    data.emojis.forEach(function(item) {
                        if (item.isImage) {
                            var exists = window.CUSTOM_EMOJI_LIST.some(function(existing) {
                                return existing.n === item.n;
                            });
                            if (!exists) {
                                window.CUSTOM_EMOJI_LIST.push(item);
                            }
                        }
                    });
                }

                if (data.stickers && Array.isArray(data.stickers)) {
                    data.stickers.forEach(function(item) {
                        if (item.isImage) {
                            var exists = window.CUSTOM_EMOJI_LIST.some(function(existing) {
                                return existing.n === item.n;
                            });
                            if (!exists) {
                                window.CUSTOM_EMOJI_LIST.push(item);
                            }
                        }
                    });
                }

                console.log('emojiJsonImportExport: importados',
                    window.CUSTOM_EMOJI_LIST.length, 'items personalizados');

                // Re-renderizar el panel
                if (typeof renderCustomItems === 'function') {
                    renderCustomItems();
                }

                alert('JSON importado: ' + window.CUSTOM_EMOJI_LIST.length + ' items personalizados');

            } catch (err) {
                console.error('emojiJsonImportExport: error al importar JSON:', err);
                alert('Error al importar JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
        input.remove();
    });

    document.body.appendChild(input);
    input.click();
}
