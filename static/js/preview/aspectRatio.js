// ============================================================================
// aspectRatio.js — Control de relación de aspecto del previsualizador
//
// Archivo independiente. Controla el botón #btn-fit-screen (icono bi-aspect-ratio).
//
// Funcionalidad:
//   - Click izquierdo: cyclear relaciones de aspecto
//   - Click derecho: menú contextual con todas las relaciones
//   - Aplica la relación al .video-preview-container redimensionándolo
//   - Tooltip al pasar el mouse: "Aspecto"
//
// Relaciones soportadas:
//   1:1, 2:1, 4:5, 9:16, 16:9, 4:3, 3:4, 3:2, 2:3, 1:2, 5:4, 21:9
//
// IDs y clases que usa:
//   - #btn-fit-screen: botón en la barra superior del previsualizador (HTML)
//   - .video-preview-container: contenedor del video (HTML)
//   - #video-player: elemento <video> dentro del contenedor
//
// Dependencias:
//   - Ninguna (archivo independiente)
// ============================================================================

var ASPECT_RATIOS = [
    { label: '1:1',   w: 1,  h: 1  },
    { label: '2:1',   w: 2,  h: 1  },
    { label: '4:5',   w: 4,  h: 5  },
    { label: '9:16',  w: 9,  h: 16 },
    { label: '16:9',  w: 16, h: 9  },
    { label: '4:3',   w: 4,  h: 3  },
    { label: '3:4',   w: 3,  h: 4  },
    { label: '3:2',   w: 3,  h: 2  },
    { label: '2:3',   w: 2,  h: 3  },
    { label: '1:2',   w: 1,  h: 2  },
    { label: '5:4',   w: 5,  h: 4  },
    { label: '21:9',  w: 21, h: 9  }
];

var currentAspectIndex = 4; // 16:9 por defecto

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAspectRatio);
} else {
    initAspectRatio();
}

// ---------------------------------------------------------------------------
// Inicializar: enlazar botón #btn-fit-screen
// ---------------------------------------------------------------------------
function initAspectRatio() {
    var btn = document.getElementById('btn-fit-screen');
    if (!btn) {
        setTimeout(initAspectRatio, 100);
        return;
    }

    // Tooltip
    btn.title = 'Aspecto';

    // Clonar para remover listeners previos
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Click izquierdo: cyclear relaciones
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        currentAspectIndex = (currentAspectIndex + 1) % ASPECT_RATIOS.length;
        applyAspectRatio(ASPECT_RATIOS[currentAspectIndex]);
    });

    // Click derecho: menú contextual
    newBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showAspectMenu(e.clientX, e.clientY, newBtn);
    });

    // Aplicar relación inicial (16:9)
    applyAspectRatio(ASPECT_RATIOS[currentAspectIndex]);

    console.log('aspectRatio inicializado (botón #btn-fit-screen)');
}

// ---------------------------------------------------------------------------
// Aplicar relación de aspecto al contenedor del previsualizador
// ---------------------------------------------------------------------------
function applyAspectRatio(ratio) {
    var container = document.querySelector('.video-preview-container');
    if (!container) return;

    var parent = container.parentElement;
    if (!parent) return;

    // Obtener ancho disponible del padre
    var parentWidth = parent.clientWidth;

    // Calcular altura basada en la relación
    var height = (parentWidth * ratio.h) / ratio.w;

    // Limitar altura para no desbordar (max 70% del viewport)
    var maxHeight = window.innerHeight * 0.7;
    if (height > maxHeight) {
        height = maxHeight;
        var width = (height * ratio.w) / ratio.h;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
    } else {
        container.style.width = '100%';
        container.style.height = height + 'px';
        container.style.marginLeft = '';
        container.style.marginRight = '';
    }

    // Actualizar label del botón
    var btn = document.getElementById('btn-fit-screen');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-aspect-ratio"></i> ' + ratio.label;
        btn.title = 'Aspecto: ' + ratio.label;
    }

    console.log('aspectRatio: aplicado', ratio.label);
}

// ---------------------------------------------------------------------------
// Menú contextual con todas las relaciones de aspecto
// ---------------------------------------------------------------------------
function showAspectMenu(x, y, parentBtn) {
    // Remover menú existente
    var existing = document.getElementById('aspect-context-menu');
    if (existing) existing.remove();

    var menu = document.createElement('div');
    menu.id = 'aspect-context-menu';
    menu.style.cssText =
        'position:fixed;z-index:99999;background:#2a2a2a;border:1px solid #555;' +
        'border-radius:8px;padding:4px;min-width:120px;box-shadow:0 4px 12px rgba(0,0,0,0.5);' +
        'left:' + x + 'px;top:' + y + 'px;';

    // Título
    var title = document.createElement('div');
    title.style.cssText = 'color:#aaa;font-size:12px;padding:4px 12px;border-bottom:1px solid #444;margin-bottom:4px;';
    title.textContent = 'Relación de aspecto';
    menu.appendChild(title);

    ASPECT_RATIOS.forEach(function(ratio, i) {
        var item = document.createElement('div');
        item.style.cssText =
            'padding:6px 12px;cursor:pointer;border-radius:4px;color:#fff;font-size:14px;' +
            (i === currentAspectIndex ? 'background:#0d6efd;' : '');
        item.textContent = ratio.label;
        item.addEventListener('mouseenter', function() {
            if (i !== currentAspectIndex) item.style.background = '#3a3a3a';
        });
        item.addEventListener('mouseleave', function() {
            if (i !== currentAspectIndex) item.style.background = '';
        });
        item.addEventListener('click', function() {
            currentAspectIndex = i;
            applyAspectRatio(ratio);
            menu.remove();
        });
        menu.appendChild(item);
    });

    // Separador
    var sep = document.createElement('div');
    sep.style.cssText = 'height:1px;background:#444;margin:4px 0;';
    menu.appendChild(sep);

    // Opción reset (16:9)
    var reset = document.createElement('div');
    reset.style.cssText = 'padding:6px 12px;cursor:pointer;border-radius:4px;color:#aaa;font-size:13px;';
    reset.textContent = 'Restablecer (16:9)';
    reset.addEventListener('mouseenter', function() { reset.style.background = '#3a3a3a'; });
    reset.addEventListener('mouseleave', function() { reset.style.background = ''; });
    reset.addEventListener('click', function() {
        currentAspectIndex = 4; // 16:9
        applyAspectRatio(ASPECT_RATIOS[currentAspectIndex]);
        menu.remove();
    });
    menu.appendChild(reset);

    document.body.appendChild(menu);

    // Cerrar al hacer click fuera
    setTimeout(function() {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}
