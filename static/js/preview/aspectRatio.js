// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR SIN AUTORIZACIÓN ⚠️
// ============================================================================
// aspectRatio.js — Control de relación de aspecto del previsualizador
//
// Archivo principal. Lee las relaciones desde window.ASPECT_RATIOS,
// que es poblada por archivos independientes en /aspectRatios/.
//
// Si un archivo de aspecto falla al cargar, los demás siguen funcionando
// porque cada uno agrega su configuración independientemente a window.ASPECT_RATIOS.
//
// ────────────────────────────────────────────────────────────────────────────
// FUNCIONALIDAD:
// ────────────────────────────────────────────────────────────────────────────
//   - Click izquierdo en #btn-fit-screen o #btn-trim: cyclear relaciones
//   - Click derecho: menú contextual con todas las relaciones
//   - Aplica la relación al .video-preview-container redimensionándolo
//   - Tooltip al pasar el mouse: "Aspecto"
//   - Ambos botones (#btn-fit-screen y #btn-trim) están SINCRONIZADOS:
//     comparten currentAspectIndex y actualizan sus labels simultáneamente
//   - ResizeObserver en #video-preview-panel: detecta cambios de tamaño
//     (arrastre del resizer, resize de ventana) y re-aplica el aspecto
//   - El contenedor NUNCA se oculta detrás de la barra de controles:
//     calcula el tamaño que cabe en ancho Y alto disponible, manteniendo
//     siempre la proporción del aspecto seleccionado
//
// ────────────────────────────────────────────────────────────────────────────
// REDIMENSIONAMIENTO (cómo funciona):
// ────────────────────────────────────────────────────────────────────────────
//   1. previewResizer.js cambia la altura del PANEL (#video-preview-panel)
//      NO del contenedor directamente.
//   2. Este archivo tiene un ResizeObserver en #video-preview-panel.
//   3. Cuando el panel cambia de tamaño, el ResizeObserver dispara
//      applyAspectRatio(currentRatio) automáticamente.
//   4. applyAspectRatio calcula el espacio disponible real:
//      - Ancho disponible = panel.clientWidth - padding
//      - Alto disponible = panel.clientHeight - header - controles - padding - 8px
//   5. Calcula dimensiones manteniendo proporción:
//      - heightByWidth = availWidth * (h/w)
//      - widthByHeight = availHeight * (w/h)
//      - Usa el que quepa sin desbordar
//   6. El contenedor se ve más pequeño o más grande pero SIEMPRE completo
//   7. También re-aplica al redimensionar la ventana del navegador (window.resize)
//
// ────────────────────────────────────────────────────────────────────────────
// INTERACCIÓN CON previewResizer.js:
// ────────────────────────────────────────────────────────────────────────────
//   - previewResizer.js cambia altura de #video-preview-panel (NO del contenedor)
//   - ResizeObserver de este archivo detecta el cambio y re-aplica aspecto
//   - previewResizer.js NO debe setear .video-preview-container.style.height
//     directamente, porque pisaría el cálculo de proporción de este archivo
//   - Si previewResizer.js vuelve a setear la altura del contenedor directamente,
//     el aspecto se romperá al arrastrar el resizer
//
// ────────────────────────────────────────────────────────────────────────────
// IDs Y CLASES QUE USA (NO cambiar sin actualizar también el HTML):
// ────────────────────────────────────────────────────────────────────────────
//   - #btn-fit-screen: botón en la barra superior del previsualizador (HTML, línea ~208)
//     Icono: <i class="bi bi-aspect-ratio">
//     Tooltip: "Aspecto"
//   - #btn-trim: botón en la barra de herramientas del timeline (HTML, línea ~269)
//     Icono: <i class="bi bi-aspect-ratio">
//     Tooltip: "Aspecto"
//     ANTES mostraba alert "Funcionalidad en desarrollo" — AHORA controla aspecto
//   - .video-preview-container: contenedor del video (HTML, línea ~216)
//     Este archivo setea width, height, marginLeft, marginRight
//   - #video-preview-panel: panel padre del contenedor (HTML, línea ~204)
//     ResizeObserver observa este elemento para detectar cambios de tamaño
//   - .panel-header: header del panel (para calcular alto disponible)
//   - #preview-controls-host: barra de controles (para calcular alto disponible)
//   - #video-player: elemento <video> dentro del contenedor (HTML, línea ~217)
//   - #aspect-context-menu: menú contextual creado dinámicamente por showAspectMenu()
//
// ────────────────────────────────────────────────────────────────────────────
// DEPENDENCIAS (orden de carga crítico):
// ────────────────────────────────────────────────────────────────────────────
//   1. Los 12 archivos en /aspectRatios/ DEBEN cargarse ANTES que este archivo
//      Cada uno hace: window.ASPECT_RATIOS.push({ label, w, h })
//   2. Este archivo lee window.ASPECT_RATIOS y espera hasta que tenga datos
//   3. No depende de ningún otro archivo del editor (videoEditor.js, etc.)
//   4. previewResizer.js cambia el panel; este archivo observa y re-aplica
//
// ────────────────────────────────────────────────────────────────────────────
// ARCHIVOS DE ASPECTOS (cada uno independiente en /aspectRatios/):
// ────────────────────────────────────────────────────────────────────────────
//   - aspect_1x1.js    → 1:1   (Cuadrado)           w=1,  h=1
//   - aspect_2x1.js    → 2:1                        w=2,  h=1
//   - aspect_4x5.js    → 4:5   (Vertical)           w=4,  h=5
//   - aspect_9x16.js   → 9:16  (Stories / Reels)    w=9,  h=16
//   - aspect_16x9.js   → 16:9  (Widescreen/YouTube) w=16, h=9  ← POR DEFECTO
//   - aspect_4x3.js    → 4:3   (TV clásica)         w=4,  h=3
//   - aspect_3x4.js    → 3:4   (Vertical clásica)   w=3,  h=4
//   - aspect_3x2.js    → 3:2   (Fotografía)         w=3,  h=2
//   - aspect_2x3.js    → 2:3   (Vertical fotografía) w=2,  h=3
//   - aspect_1x2.js    → 1:2   (Vertical extremo)   w=1,  h=2
//   - aspect_5x4.js    → 5:4   (Monitores antiguos) w=5,  h=4
//   - aspect_21x9.js   → 21:9  (Cine ultrapanorámico) w=21, h=9
//
// ────────────────────────────────────────────────────────────────────────────
// ARCHIVOS QUE NO DEBEN VOLVER A TOCAR #btn-trim NI #btn-fit-screen:
// ────────────────────────────────────────────────────────────────────────────
//   - videoEditor.js: NO debe agregar #btn-trim a setupEditingTools() ni a toolNames
//     (Removido de la lista de alerts. Si se vuelve a agregar, el botón mostrará
//      un alert "Funcionalidad en desarrollo" en lugar de controlar el aspecto)
//   - Ningún otro archivo debe agregar event listeners a #btn-fit-screen o #btn-trim
//     Este archivo clona los botones para remover listeners previos antes de enlazar
//
// ────────────────────────────────────────────────────────────────────────────
// ARCHIVOS QUE NO DEBEN SETEAR .video-preview-container.style.height:
// ────────────────────────────────────────────────────────────────────────────
//   - previewResizer.js: debe cambiar #video-preview-panel.style.height, NO
//     .video-preview-container.style.height. Si lo hace, pisará el cálculo de
//     proporción y el aspecto se romperá al arrastrar.
//   - Cualquier otro archivo que necesite cambiar el tamaño del contenedor debe
//     llamar applyAspectRatio() en lugar de setear style.height directamente.
//
// ────────────────────────────────────────────────────────────────────────────
// VARIABLES GLOBALES:
// ────────────────────────────────────────────────────────────────────────────
//   - currentAspectIndex: índice actual en window.ASPECT_RATIOS
//     Por defecto: índice de 16:9 (buscado al inicializar)
//     Se comparte entre #btn-fit-screen y #btn-trim
//   - currentRatio: objeto { label, w, h } de la relación actual
//     Se guarda para re-aplicar al redimensionar (ResizeObserver y window.resize)
//   - aspectResizeObserver: instancia de ResizeObserver sobre #video-preview-panel
//     Detecta cambios de tamaño y dispara applyAspectRatio(currentRatio)
// ============================================================================

// ⚠️ NO RENOMBRAR esta variable. Es usada por ambos botones sincronizados.
var currentAspectIndex = 0; // Se ajusta a 16:9 después de cargar

// ⚠️ NO RENOMBRAR. Guarda la relación actual para re-aplicar al redimensionar.
// Es leída por el ResizeObserver y el handler de window.resize.
var currentRatio = null;

// ⚠️ NO RENOMBRAR. Es el ResizeObserver que detecta cambios de tamaño del panel.
// Se crea en initAspectRatio() y observa #video-preview-panel.
var aspectResizeObserver = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAspectRatio);
} else {
    initAspectRatio();
}

// ---------------------------------------------------------------------------
// initAspectRatio()
// ---------------------------------------------------------------------------
// Inicializa el control de aspecto. Enlaza DOS botones sincronizados:
//   1. #btn-fit-screen (barra superior del previsualizador)
//   2. #btn-trim (barra de herramientas del timeline, junto a tijeras)
//
// Ambos botones comparten currentAspectIndex y son idénticos en función.
// Si se cambia uno, el otro se actualiza automáticamente.
//
// Pasos:
//   1. Esperar a que #btn-fit-screen exista en el DOM (retry 100ms)
//   2. Esperar a que window.ASPECT_RATIOS tenga datos (retry 100ms)
//   3. Buscar índice de 16:9 (relación por defecto)
//   4. Clonar #btn-fit-screen para remover listeners previos
//   5. Agregar click (cyclear) + contextmenu (menú) a #btn-fit-screen
//   6. Clonar #btn-trim para remover listeners previos de videoEditor.js
//   7. Agregar click (cyclear) + contextmenu (menú) a #btn-trim
//   8. Aplicar relación inicial
//   9. Crear ResizeObserver en #video-preview-panel para re-aplicar al redimensionar
//  10. Registrar handler para window.resize
// ---------------------------------------------------------------------------
function initAspectRatio() {
    // ⚠️ #btn-fit-screen está en HTML línea ~208 (barra superior del previsualizador)
    var btn = document.getElementById('btn-fit-screen');
    if (!btn) {
        setTimeout(initAspectRatio, 100);
        return;
    }

    // ⚠️ Esperar a que los archivos /aspectRatios/*.js hayan poblado el array
    if (!window.ASPECT_RATIOS || window.ASPECT_RATIOS.length === 0) {
        setTimeout(initAspectRatio, 100);
        return;
    }

    // ⚠️ 16:9 es la relación por defecto. NO cambiar sin razón.
    for (var i = 0; i < window.ASPECT_RATIOS.length; i++) {
        if (window.ASPECT_RATIOS[i].label === '16:9') {
            currentAspectIndex = i;
            break;
        }
    }

    // === BOTÓN #btn-fit-screen (barra superior del previsualizador) ===
    // Tooltip: "Aspecto"
    btn.title = 'Aspecto';

    // ⚠️ Clonar para remover listeners previos que otros archivos hayan agregado
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Click izquierdo: cyclear relaciones (avanza al siguiente aspecto)
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        currentAspectIndex = (currentAspectIndex + 1) % window.ASPECT_RATIOS.length;
        applyAspectRatio(window.ASPECT_RATIOS[currentAspectIndex]);
    });

    // Click derecho: menú contextual con todas las relaciones
    newBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showAspectMenu(e.clientX, e.clientY, newBtn);
    });

    // === BOTÓN #btn-trim (barra de herramientas del timeline) ===
    // ⚠️ Este botón ANTES mostraba un alert "Funcionalidad en desarrollo"
    //    desde videoEditor.js. AHORA controla aspecto igual que #btn-fit-screen.
    //    videoEditor.js ya NO incluye 'btn-trim' en setupEditingTools() ni toolNames.
    //    Si se vuelve a agregar, el botón mostrará alert en lugar de controlar aspecto.
    var trimBtn = document.getElementById('btn-trim');
    if (trimBtn) {
        trimBtn.title = 'Aspecto';
        // Clonar para remover listeners previos de videoEditor.js (alert)
        var newTrimBtn = trimBtn.cloneNode(true);
        trimBtn.parentNode.replaceChild(newTrimBtn, trimBtn);

        // Click izquierdo: misma función que #btn-fit-screen (comparten currentAspectIndex)
        newTrimBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            currentAspectIndex = (currentAspectIndex + 1) % window.ASPECT_RATIOS.length;
            applyAspectRatio(window.ASPECT_RATIOS[currentAspectIndex]);
        });

        // Click derecho: mismo menú contextual que #btn-fit-screen
        newTrimBtn.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showAspectMenu(e.clientX, e.clientY, newTrimBtn);
        });
    }

    // Aplicar relación inicial (16:9 por defecto)
    applyAspectRatio(window.ASPECT_RATIOS[currentAspectIndex]);

    // ⚠️ ResizeObserver: detectar cambios de tamaño del panel del previsualizador
    // Cuando el usuario arrastra el resizer (previewResizer.js) o cambia el tamaño
    // de la ventana, re-aplicar el aspecto para que el contenedor se ajuste y
    // nunca se oculte detrás de la barra de controles.
    //
    // previewResizer.js cambia #video-preview-panel.style.height → ResizeObserver
    // detecta el cambio → llama applyAspectRatio(currentRatio) → contenedor se
    // redimensiona manteniendo la proporción del aspecto seleccionado.
    var panel = document.getElementById('video-preview-panel');
    if (panel && typeof ResizeObserver !== 'undefined') {
        aspectResizeObserver = new ResizeObserver(function() {
            if (currentRatio) {
                applyAspectRatio(currentRatio);
            }
        });
        aspectResizeObserver.observe(panel);
    }

    // ⚠️ También re-aplicar al redimensionar la ventana del navegador
    window.addEventListener('resize', function() {
        if (currentRatio) {
            applyAspectRatio(currentRatio);
        }
    });

    console.log('aspectRatio inicializado -', window.ASPECT_RATIOS.length, 'relaciones cargadas');
}

// ---------------------------------------------------------------------------
// applyAspectRatio(ratio)
// ---------------------------------------------------------------------------
// Redimensiona .video-preview-container según la relación seleccionada.
// Calcula el tamaño que cabe TANTO en el ancho disponible COMO en el alto
// disponible, manteniendo SIEMPRE la proporción del aspecto.
// El contenedor nunca se oculta detrás de la barra de controles.
//
// Parámetros:
//   - ratio: objeto { label, w, h } de window.ASPECT_RATIOS
//
// Elementos que modifica:
//   - .video-preview-container: width, height, marginLeft, marginRight
//   - #btn-fit-screen: innerHTML (icono + label), title (tooltip)
//   - #btn-trim: innerHTML (icono + label), title (tooltip)
//
// Cálculo:
//   1. Obtener espacio disponible del padre (#video-preview-panel):
//      - Ancho disponible = parent.clientWidth - padding
//      - Alto disponible = parent.clientHeight - header - controles - padding - resizer
//   2. Calcular height por ancho: heightW = availWidth * (h/w)
//   3. Calcular width por alto: widthH = availHeight * (w/h)
//   4. Si heightW > availHeight: usar widthH y heightW limitada (cabe por alto)
//      Si no: usar availWidth y heightW (cabe por ancho)
//   5. Centrar horizontalmente con margin auto
// ---------------------------------------------------------------------------
function applyAspectRatio(ratio) {
    if (!ratio) return;

    // ⚠️ Guardar la relación actual para re-aplicar al redimensionar
    currentRatio = ratio;

    // ⚠️ .video-preview-container está en HTML línea ~216
    var container = document.querySelector('.video-preview-container');
    if (!container) return;

    var parent = container.parentElement; // #video-preview-panel
    if (!parent) return;

    // === Calcular espacio disponible ===
    // Ancho disponible: ancho del panel menos padding (p-3 = 16px cada lado)
    var parentStyle = window.getComputedStyle(parent);
    var padLeft = parseFloat(parentStyle.paddingLeft) || 0;
    var padRight = parseFloat(parentStyle.paddingRight) || 0;
    var padTop = parseFloat(parentStyle.paddingTop) || 0;
    var padBottom = parseFloat(parentStyle.paddingBottom) || 0;
    var availWidth = parent.clientWidth - padLeft - padRight;

    // Alto disponible: alto del panel menos header, controles, padding
    // Header: .panel-header (tamaño aproximado 50px con border-bottom y margin)
    var header = parent.querySelector('.panel-header');
    var headerHeight = header ? header.offsetHeight : 0;
    // Controles: #preview-controls-host
    var controls = parent.querySelector('#preview-controls-host');
    var controlsHeight = controls ? controls.offsetHeight : 0;
    // Margen entre header y container (mb-3 = 16px)
    var headerMargin = header ? (parseFloat(window.getComputedStyle(header).marginBottom) || 0) : 0;

    var availHeight = parent.clientHeight - padTop - padBottom - headerHeight - headerMargin - controlsHeight;

    // ⚠️ Restar un margen de seguridad (8px) para evitar que se oculte
    availHeight = Math.max(availHeight - 8, 100);

    // === Calcular dimensiones manteniendo proporción ===
    // Height si usamos todo el ancho disponible
    var heightByWidth = (availWidth * ratio.h) / ratio.w;
    // Width si usamos todo el alto disponible
    var widthByHeight = (availHeight * ratio.w) / ratio.h;

    var finalWidth, finalHeight;

    if (heightByWidth <= availHeight) {
        // Cabe por ancho: usar todo el ancho
        finalWidth = availWidth;
        finalHeight = heightByWidth;
    } else {
        // No cabe por ancho: limitar por alto
        finalWidth = widthByHeight;
        finalHeight = availHeight;
    }

    // Aplicar dimensiones
    container.style.width = finalWidth + 'px';
    container.style.height = finalHeight + 'px';
    container.style.marginLeft = 'auto';
    container.style.marginRight = 'auto';

    // ⚠️ Actualizar label de AMBOS botones sincronizados
    // #btn-fit-screen: barra superior del previsualizador (HTML línea ~208)
    var btn = document.getElementById('btn-fit-screen');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-aspect-ratio"></i> ' + ratio.label;
        btn.title = 'Aspecto: ' + ratio.label;
    }
    // #btn-trim: barra de herramientas del timeline (HTML línea ~269)
    var trimBtn = document.getElementById('btn-trim');
    if (trimBtn) {
        trimBtn.innerHTML = '<i class="bi bi-aspect-ratio"></i> ' + ratio.label;
        trimBtn.title = 'Aspecto: ' + ratio.label;
    }

    console.log('aspectRatio: aplicado', ratio.label, '- ' + Math.round(finalWidth) + 'x' + Math.round(finalHeight));
}

// ---------------------------------------------------------------------------
// showAspectMenu(x, y, parentBtn)
// ---------------------------------------------------------------------------
// Crea un menú contextual flotante con todas las relaciones de aspecto.
// Se abre con click derecho en #btn-fit-screen o #btn-trim.
//
// Parámetros:
//   - x, y: coordenadas del cursor (e.clientX, e.clientY)
//   - parentBtn: botón que abrió el menú (no usado directamente, pero
//     se pasa por consistencia con otros menús del editor)
//
// Elemento creado:
//   - #aspect-context-menu: <div> flotante con z-index 99999
//     Se elimina al hacer click fuera o al seleccionar una opción
//
// Opciones del menú:
//   - Una entrada por cada relación en window.ASPECT_RATIOS
//   - Separador
//   - "Restablecer (16:9)" → vuelve a la relación por defecto
// ---------------------------------------------------------------------------
function showAspectMenu(x, y, parentBtn) {
    // Remover menú existente si hay
    var existing = document.getElementById('aspect-context-menu');
    if (existing) existing.remove();

    // ⚠️ Leer relaciones desde window.ASPECT_RATIOS (poblado por /aspectRatios/*.js)
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
