// ============================================================================
// aspectRatio.js — Control de relación de aspecto del previsualizador
//
// Archivo principal. Lee las relaciones desde window.ASPECT_RATIOS,
// que es poblada por archivos independientes en /aspectRatios/.
//
// Si un archivo de aspecto falla al cargar, los demás siguen funcionando
// porque cada uno agrega su configuración independientemente a window.ASPECT_RATIOS.
//
// Funcionalidad:
//   - Click izquierdo: cyclear relaciones de aspecto
//   - Click derecho: menú contextual con todas las relaciones
//   - Aplica la relación al .video-preview-container redimensionándolo
//   - Tooltip al pasar el mouse: "Aspecto"
//
// IDs y clases que usa:
//   - #btn-fit-screen: botón en la barra superior del previsualizador (HTML)
//   - .video-preview-container: contenedor del video (HTML)
//   - #video-player: elemento <video> dentro del contenedor
//
// Dependencias:
//   - window.ASPECT_RATIOS: array poblado por archivos en /aspectRatios/
//   - Los archivos en /aspectRatios/ deben cargarse ANTES que este archivo
//
// Archivos de aspectos (cada uno independiente):
//   - aspect_1x1.js    → 1:1   (Cuadrado)
//   - aspect_2x1.js    → 2:1
//   - aspect_4x5.js    → 4:5   (Vertical)
//   - aspect_9x16.js   → 9:16  (Stories / Reels)
//   - aspect_16x9.js   → 16:9  (Widescreen / YouTube)
//   - aspect_4x3.js    → 4:3   (TV clásica)
//   - aspect_3x4.js    → 3:4   (Vertical clásica)
//   - aspect_3x2.js    → 3:2   (Fotografía)
//   - aspect_2x3.js    → 2:3   (Vertical fotografía)
//   - aspect_1x2.js    → 1:2   (Vertical extremo)
//   - aspect_5x4.js    → 5:4   (Monitores antiguos)
//   - aspect_21x9.js   → 21:9  (Cine ultrapanorámico)
// ============================================================================

var currentAspectIndex = 0; // Se ajusta a 16:9 después de cargar

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

    // Verificar que window.ASPECT_RATIOS tenga datos
    if (!window.ASPECT_RATIOS || window.ASPECT_RATIOS.length === 0) {
        setTimeout(initAspectRatio, 100);
        return;
    }

    // Buscar índice de 16:9 (relación por defecto)
    for (var i = 0; i < window.ASPECT_RATIOS.length; i++) {
        if (window.ASPECT_RATIOS[i].label === '16:9') {
            currentAspectIndex = i;
            break;
        }
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
        currentAspectIndex = (currentAspectIndex + 1) % window.ASPECT_RATIOS.length;
        applyAspectRatio(window.ASPECT_RATIOS[currentAspectIndex]);
    });

    // Click derecho: menú contextual
    newBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showAspectMenu(e.clientX, e.clientY, newBtn);
    });

    // Aplicar relación inicial
    applyAspectRatio(window.ASPECT_RATIOS[currentAspectIndex]);

    console.log('aspectRatio inicializado -', window.ASPECT_RATIOS.length, 'relaciones cargadas');
}

// ---------------------------------------------------------------------------
// Aplicar relación de aspecto al contenedor del previsualizador
// ---------------------------------------------------------------------------
function applyAspectRatio(ratio) {
    if (!ratio) return;

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

    var ratios = window.ASPECT_RATIOS || [];
    if (ratios.length === 0) return;

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

    ratios.forEach(function(ratio, i) {
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
        for (var i = 0; i < ratios.length; i++) {
            if (ratios[i].label === '16:9') {
                currentAspectIndex = i;
                applyAspectRatio(ratios[i]);
                break;
            }
        }
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
