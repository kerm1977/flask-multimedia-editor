// ============================================================================
// BLINDADO / PROHIBIDO MODIFICAR SIN AUTORIZACION EXPLICITA
// ============================================================================
// libraryCollapse.js - Biblioteca colapsable como overlay flotante
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica sidebarCollapse.js,
// index.html, videoEditor.js, ni ningun otro archivo.
//
// *** PROHIBIDO TOCAR ***
//   - NO cambiar la logica de ocultar/mostrar la biblioteca
//   - NO cambiar la posicion (position:absolute, overlay flotante)
//   - NO cambiar la superposicion sobre la vista previa
//   - NO cambiar el auto-colapso por mouseleave
//   - NO cambiar el ancho (LIB_EXPANDED_WIDTH = 335px)
//   - NO cambiar el boton toggle (solo visible cuando colapsada)
//   - NO mover el boton dentro de la biblioteca
//   - TODO DEBE QUEDAR INTEGRO COMO ESTA
// ============================================================================
//
// FUNCIONALIDAD:
//   - La biblioteca (#library-panel) es SIEMPRE un overlay flotante
//     (position:absolute) que sale desde el lado izquierdo por ENCIMA
//     de la vista previa.
//   - La vista previa (#video-preview-panel) NUNCA se mueve ni cambia
//     de tamano. Siempre ocupa TODO el ancho disponible.
//   - Al expandir: la biblioteca aparece por encima de la vista previa
//     desde la izquierda con animacion suave.
//   - Al colapsar: la biblioteca se oculta hacia la izquierda.
//   - AUTO-COLAPSO: cuando el mouse sale completamente de la biblioteca,
//     se colapsa automaticamente.
//   - NO interfiere con el sidebar del editor (sidebarCollapse.js).
//
// ESTADOS:
//   - Expandida: position:absolute, left:0, width:335px, opacity:1, zIndex:1051
//     Boton: en body, opacity:0, NO visible
//   - Colapsada: position:absolute, left:-335px, width:335px, opacity:0
//     Boton: position:fixed, left:0, opacity:1, en body (visible)
//
// NO TOCAR:
//   - sidebarCollapse.js: no se modifica
//   - index.html: no se modifica
//   - Cualquier otro archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initLibraryCollapse, 500);
    });
} else {
    setTimeout(initLibraryCollapse, 500);
}

var LIB_EXPANDED_WIDTH = 335;
var _libExpanded = true;

function initLibraryCollapse() {
    function tryInit() {
        var library = document.getElementById('library-panel');
        var videoPreview = document.getElementById('video-preview-panel');
        var topRow = document.querySelector('#video-section > .d-flex.gap-3');

        if (!library || !videoPreview) {
            setTimeout(tryInit, 300);
            return;
        }

        if (library.dataset.libCollapseInit === 'true') return;
        library.dataset.libCollapseInit = 'true';

        // 0. NEUTRALIZAR draggablePanels.js: remover clase draggable-panel
        //    y botones de colapso/resize que le agregaron, para que no interfiera
        library.classList.remove('draggable-panel');
        var oldCollapseBtn = library.querySelector('.collapse-btn');
        if (oldCollapseBtn) oldCollapseBtn.remove();
        var oldResizeHandle = library.querySelector('.resize-handle');
        if (oldResizeHandle) oldResizeHandle.remove();
        // Remover cursor grab del header
        var libHeader = library.querySelector('.panel-header');
        if (libHeader) {
            libHeader.style.cursor = 'default';
            // Remover listeners de drag clonando el header
            var newHeader = libHeader.cloneNode(true);
            libHeader.parentNode.replaceChild(newHeader, libHeader);
        }

        // 1. Asegurar que el contenedor superior tenga position:relative
        //    para que el overlay de la biblioteca se posicione dentro de el
        if (topRow) {
            topRow.style.position = 'relative';
        }

        // 2. La biblioteca es SIEMPRE un overlay flotante (position:absolute)
        //    NUNCA esta en el flujo flex. La vista previa ocupa TODO el ancho.
        library.style.cssText =
            'position: absolute !important;' +
            'left: 0 !important;' +
            'top: 0 !important;' +
            'width: ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'min-width: ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'max-width: ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'height: 100% !important;' +
            'z-index: 1051 !important;' +
            'opacity: 1;' +
            'overflow: hidden;' +
            'transition: left 0.3s ease, opacity 0.3s ease;' +
            'flex: 0 0 auto !important;' +
            'box-shadow: 4px 0 15px rgba(0,0,0,0.5);';

        // 3. La vista previa SIEMPRE ocupa TODO el ancho, nunca se mueve
        videoPreview.style.flex = '1 1 100%';
        videoPreview.style.flexGrow = '1';
        videoPreview.style.flexShrink = '1';
        videoPreview.style.flexBasis = '100%';
        videoPreview.style.minWidth = '0';
        videoPreview.style.maxWidth = '100%';
        videoPreview.style.marginLeft = '0';

        // 4. Envolver el contenido original en un contenedor
        var innerWrapper = document.createElement('div');
        innerWrapper.id = 'library-inner-wrapper';
        innerWrapper.style.cssText =
            'width: ' + LIB_EXPANDED_WIDTH + 'px;' +
            'height: 100%;' +
            'display: flex;' +
            'flex-direction: column;';

        while (library.firstChild) {
            innerWrapper.appendChild(library.firstChild);
        }

        // 5. Crear boton toggle (flecha) - SOLO visible cuando esta colapsada
        var toggleBtn = document.createElement('button');
        toggleBtn.id = 'library-toggle-btn';
        toggleBtn.style.cssText =
            'position: fixed;' +
            'top: 50%;' +
            'left: 0;' +
            'transform: translateY(-50%);' +
            'background: rgba(33,37,41,0.95);' +
            'border: 1px solid #555;' +
            'border-left: none;' +
            'border-radius: 0 4px 4px 0;' +
            'color: white;' +
            'padding: 8px 4px;' +
            'cursor: pointer;' +
            'z-index: 1052;' +
            'font-size: 14px;' +
            'width: 50px;' +
            'height: 60px;' +
            'display: flex;' +
            'align-items: center;' +
            'justify-content: center;' +
            'opacity: 0;' +
            'pointer-events: none;' +
            'transition: opacity 0.3s ease;';
        toggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
        toggleBtn.title = 'Expandir biblioteca';

        toggleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleLibrary();
        };

        // Ensamblar: el boton va al body, NO dentro de la biblioteca
        library.appendChild(innerWrapper);
        document.body.appendChild(toggleBtn);

        // 6. Auto-colapsar cuando el mouse sale completamente de la biblioteca
        library.addEventListener('mouseleave', function() {
            if (_libExpanded) {
                toggleLibrary();
            }
        });

        _libExpanded = true;
        console.log('libraryCollapse: biblioteca como overlay flotante inicializada');

        window.toggleLibraryPanel = toggleLibrary;
    }
    tryInit();
}

function toggleLibrary() {
    var library = document.getElementById('library-panel');
    var toggleBtn = document.getElementById('library-toggle-btn');
    if (!library) return;

    if (_libExpanded) {
        // Colapsar: biblioteca se desliza hacia la izquierda y desaparece
        _libExpanded = false;
        library.style.left = '-' + LIB_EXPANDED_WIDTH + 'px';
        library.style.opacity = '0';
        library.style.pointerEvents = 'none';

        // Mostrar boton en el borde izquierdo para re-expandir
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
            toggleBtn.style.opacity = '1';
            toggleBtn.style.pointerEvents = 'auto';
        }
        console.log('libraryCollapse: biblioteca colapsada (overlay oculto)');
    } else {
        // Expandir: biblioteca se desliza desde la izquierda por encima
        _libExpanded = true;
        library.style.left = '0';
        library.style.opacity = '1';
        library.style.pointerEvents = 'auto';

        // Ocultar boton: no se necesita cuando esta expandida
        // Se auto-colapsa al sacar el mouse (mouseleave)
        if (toggleBtn) {
            toggleBtn.style.opacity = '0';
            toggleBtn.style.pointerEvents = 'none';
        }
        console.log('libraryCollapse: biblioteca expandida (overlay visible)');
    }
}
