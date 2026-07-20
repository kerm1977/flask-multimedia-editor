// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// emojiStickerPanel.js - Panel de seleccion de emojis y stickers
//
// Archivo INDEPENDIENTE. Solo controla el boton #btn-add-sticker.
// Lee window.EMOJI_LIST y window.STICKER_LIST de archivos independientes.
// Si emojis.js o stickers.js fallan, el panel sigue abriendo con lo que haya.
//
// FUNCIONALIDAD:
//   - Click en #btn-add-sticker: abre panel con dos pestanas (Emojis / Stickers)
//   - Doble click en un emoji/sticker: lo agrega al previsualizador
//   - El elemento agregado es arrastrable y posicionable
//   - Categorias con filtros
//
// IDs QUE USA:
//   - #btn-add-sticker: boton en la barra de herramientas (HTML linea ~297)
//   - .video-preview-container: contenedor donde se agregan los elementos
//   - #emoji-sticker-panel: panel creado dinamicamente por este archivo
//
// DEPENDENCIAS:
//   - emojis.js: pobla window.EMOJI_LIST (debe cargarse antes)
//   - stickers.js: pobla window.STICKER_LIST (debe cargarse antes)
//   - Ninguna otra dependencia
//
// ARCHIVOS QUE NO DEBEN TOCAR #btn-add-sticker:
//   - videoEditor.js: NO debe agregar btn-add-sticker a setupEditingTools()
//     (Removido de la lista de alerts)
// ============================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiStickerPanel);
} else {
    initEmojiStickerPanel();
}

function initEmojiStickerPanel() {
    var btn = document.getElementById('btn-add-sticker');
    if (!btn) {
        setTimeout(initEmojiStickerPanel, 100);
        return;
    }

    // Clonar para remover listeners previos de videoEditor.js
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
    });

    console.log('emojiStickerPanel inicializado');
}

var panelVisible = false;
var currentTab = 'emojis';
var currentCategory = 'all';

function togglePanel() {
    var panel = document.getElementById('emoji-sticker-panel');
    if (panel) {
        if (panelVisible) {
            panel.remove();
            panelVisible = false;
        } else {
            createPanel();
            panelVisible = true;
        }
    } else {
        createPanel();
        panelVisible = true;
    }
}

function createPanel() {
    var panel = document.createElement('div');
    panel.id = 'emoji-sticker-panel';
    panel.style.cssText =
        'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);' +
        'width:500px; max-width:90vw; max-height:80vh; background:#1a1a2e;' +
        'border:2px solid #4a5568; border-radius:12px; z-index:10000;' +
        'display:flex; flex-direction:column; box-shadow:0 8px 32px rgba(0,0,0,0.5);' +
        'font-family:sans-serif;';

    // Header
    var header = document.createElement('div');
    header.style.cssText =
        'display:flex; align-items:center; justify-content:space-between;' +
        'padding:12px 16px; border-bottom:1px solid #4a5568;';
    header.innerHTML =
        '<h5 style="margin:0; color:#fff; font-size:16px;">Emojis y Stickers</h5>' +
        '<button id="emoji-panel-close" style="background:none; border:none; color:#fff;' +
        'font-size:20px; cursor:pointer;">&times;</button>';
    panel.appendChild(header);

    // Tabs
    var tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex; gap:4px; padding:8px 12px; border-bottom:1px solid #333;';
    var tabEmojis = document.createElement('button');
    tabEmojis.id = 'tab-emojis';
    tabEmojis.textContent = 'Emojis';
    tabEmojis.style.cssText = tabStyle(true);
    var tabStickers = document.createElement('button');
    tabStickers.id = 'tab-stickers';
    tabStickers.textContent = 'Stickers';
    tabStickers.style.cssText = tabStyle(false);
    tabs.appendChild(tabEmojis);
    tabs.appendChild(tabStickers);
    panel.appendChild(tabs);

    // Category filter
    var catRow = document.createElement('div');
    catRow.id = 'category-row';
    catRow.style.cssText = 'display:flex; gap:4px; padding:6px 12px; flex-wrap:wrap; border-bottom:1px solid #333;';
    panel.appendChild(catRow);

    // Grid
    var grid = document.createElement('div');
    grid.id = 'emoji-sticker-grid';
    grid.style.cssText =
        'flex:1; overflow-y:auto; padding:12px; display:grid;' +
        'grid-template-columns:repeat(auto-fill, minmax(48px, 1fr));' +
        'gap:4px; max-height:400px;';
    panel.appendChild(grid);

    // Hint
    var hint = document.createElement('div');
    hint.style.cssText = 'padding:8px 12px; border-top:1px solid #333; color:#8899aa; font-size:12px; text-align:center;';
    hint.textContent = 'Doble clic para agregar al previsualizador';
    panel.appendChild(hint);

    document.body.appendChild(panel);

    // Close button
    document.getElementById('emoji-panel-close').addEventListener('click', function() {
        panel.remove();
        panelVisible = false;
    });

    // Tab events
    tabEmojis.addEventListener('click', function() {
        currentTab = 'emojis';
        tabEmojis.style.cssText = tabStyle(true);
        tabStickers.style.cssText = tabStyle(false);
        renderCategories();
        renderGrid();
    });
    tabStickers.addEventListener('click', function() {
        currentTab = 'stickers';
        tabEmojis.style.cssText = tabStyle(false);
        tabStickers.style.cssText = tabStyle(true);
        renderCategories();
        renderGrid();
    });

    // Initial render
    renderCategories();
    renderGrid();
}

function tabStyle(active) {
    var base = 'flex:1; padding:8px 12px; border:none; border-radius:6px; cursor:pointer; font-size:14px;';
    if (active) {
        return base + 'background:#007bff; color:#fff;';
    }
    return base + 'background:#333; color:#aaa;';
}

function renderCategories() {
    var catRow = document.getElementById('category-row');
    if (!catRow) return;
    catRow.innerHTML = '';

    var list = currentTab === 'emojis' ? (window.EMOJI_LIST || []) : (window.STICKER_LIST || []);
    var cats = {};
    list.forEach(function(item) {
        if (!cats[item.c]) cats[item.c] = true;
    });
    var categories = Object.keys(cats);

    // "Todos" button
    var allBtn = document.createElement('button');
    allBtn.textContent = 'Todos';
    allBtn.style.cssText = catStyle(currentCategory === 'all');
    allBtn.addEventListener('click', function() {
        currentCategory = 'all';
        renderCategories();
        renderGrid();
    });
    catRow.appendChild(allBtn);

    categories.forEach(function(cat) {
        var btn = document.createElement('button');
        btn.textContent = cat;
        btn.style.cssText = catStyle(currentCategory === cat);
        btn.addEventListener('click', function() {
            currentCategory = cat;
            renderCategories();
            renderGrid();
        });
        catRow.appendChild(btn);
    });
}

function catStyle(active) {
    var base = 'padding:4px 10px; border:1px solid #4a5568; border-radius:12px; cursor:pointer; font-size:12px;';
    if (active) {
        return base + 'background:#007bff; color:#fff;';
    }
    return base + 'background:#222; color:#aaa;';
}

function renderGrid() {
    var grid = document.getElementById('emoji-sticker-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var list = currentTab === 'emojis' ? (window.EMOJI_LIST || []) : (window.STICKER_LIST || []);
    var filtered = currentCategory === 'all' ? list : list.filter(function(item) {
        return item.c === currentCategory;
    });

    var isSticker = currentTab === 'stickers';

    filtered.forEach(function(item) {
        var el = document.createElement('div');
        el.textContent = item.e;
        el.title = item.n;
        el.style.cssText =
            'display:flex; align-items:center; justify-content:center;' +
            'font-size:' + (isSticker ? '32px' : '24px') + ';' +
            'cursor:pointer; padding:4px; border-radius:6px; transition:background 0.15s;' +
            'user-select:none;' + (isSticker ? 'filter:drop-shadow(2px 2px 0 white);' : '');
        el.addEventListener('mouseenter', function() {
            el.style.background = '#333';
        });
        el.addEventListener('mouseleave', function() {
            el.style.background = '';
        });
        el.addEventListener('dblclick', function() {
            addToPreview(item.e, isSticker);
        });
        grid.appendChild(el);
    });
}

function addToPreview(emoji, isSticker) {
    var container = document.querySelector('.video-preview-container');
    if (!container) {
        console.error('emojiStickerPanel: no se encontro .video-preview-container');
        return;
    }

    var el = document.createElement('div');
    el.textContent = emoji;
    el.style.cssText =
        'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);' +
        'font-size:' + (isSticker ? '60px' : '40px') + ';' +
        'cursor:move; user-select:none; z-index:100;' +
        (isSticker ? 'filter:drop-shadow(3px 3px 0 white);' : '');
    el.dataset.sticker = isSticker ? 'true' : 'false';

    container.appendChild(el);
    makeDraggable(el);

    console.log('emojiStickerPanel: agregado', isSticker ? 'sticker' : 'emoji', emoji);
}

function makeDraggable(el) {
    var isDragging = false;
    var startX, startY, origX, origY;

    el.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = el.offsetLeft;
        origY = el.offsetTop;
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        el.style.left = (origX + dx) + 'px';
        el.style.top = (origY + dy) + 'px';
        el.style.transform = 'none';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Touch
    el.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        origX = el.offsetLeft;
        origY = el.offsetTop;
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        el.style.left = (origX + dx) + 'px';
        el.style.top = (origY + dy) + 'px';
        el.style.transform = 'none';
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function() {
        isDragging = false;
    });
}
