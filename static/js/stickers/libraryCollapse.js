// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// libraryCollapse.js - Biblioteca colapsable en el lado izquierdo
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica sidebarCollapse.js,
// index.html, videoEditor.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Mueve la biblioteca (#library-panel) al lado izquierdo, despues del
//     sidebar del editor (#sidebar-panel)
//   - La biblioteca es colapsable: se contrae hacia la izquierda con un boton
//   - Un boton toggle (flecha) permite colapsar/expandir
//   - NO interfiere con el sidebar del editor (sidebarCollapse.js)
//   - Cuando esta colapsada, sale del flujo (position:absolute, opacity:0,
//     width:0) para que la vista previa ocupe TODO el ancho
//   - El boton toggle se mueve al body al colapsar para no heredar opacity:0
//     y queda visible con position:fixed en el borde izquierdo
//   - Cuando esta expandida, ocupa 250px en el flujo flex
//   - La vista previa se expande/comprime automaticamente segun el estado
//
// ESTADOS:
//   - Expandida: position:relative, flex:0 0 250px, opacity:1
//     Boton: position:absolute, right:0, chevron-left, dentro de library
//   - Colapsada: position:absolute, width:0, opacity:0
//     Boton: position:fixed, left:0, chevron-right, en body (visible)
//
// NO TOCAR:
//   - sidebarCollapse.js: no se modifica
//   - index.html: no se modifica
//   - Cualquier otro archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLibraryCollapse);
} else {
    initLibraryCollapse();
}

var LIB_EXPANDED_WIDTH = 250;
var LIB_COLLAPSED_WIDTH = 30;
var _libExpanded = true;

function initLibraryCollapse() {
    function tryInit() {
        var library = document.getElementById('library-panel');
        var sidebar = document.getElementById('sidebar-panel');
        var videoPreview = document.getElementById('video-preview-panel');
        var topRow = document.querySelector('#video-section > .d-flex.gap-3');

        if (!library || !videoPreview) {
            setTimeout(tryInit, 300);
            return;
        }

        if (library.dataset.libCollapseInit === 'true') return;
        library.dataset.libCollapseInit = 'true';

        // 1. Reorganizar el DOM: poner la biblioteca antes que la vista previa
        if (topRow) {
            topRow.insertBefore(library, videoPreview);
            // Necesario para que position:absolute de la biblioteca colapsada
            // se posicione relativo a este contenedor
            topRow.style.position = 'relative';
        }

        // 2. Estilizar la biblioteca como panel lateral izquierdo colapsable
        //     Usar position:relative cuando expandida, position:absolute cuando colapsada
        //     para que la vista previa ocupe TODO el ancho al colapsar
        library.style.cssText =
            'flex: 0 0 ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'min-width: ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'max-width: ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'width: ' + LIB_EXPANDED_WIDTH + 'px !important;' +
            'height: 100% !important;' +
            'transition: width 0.25s ease, max-width 0.25s ease, flex-basis 0.25s ease, opacity 0.25s ease;' +
            'overflow: hidden;' +
            'position: relative;' +
            'flex-shrink: 0;';

        // 2b. Forzar la vista previa a ocupar todo el espacio restante
        videoPreview.style.flex = '1 1 auto';
        videoPreview.style.minWidth = '200px';
        videoPreview.style.flexGrow = '1';
        videoPreview.style.flexShrink = '1';
        videoPreview.style.flexBasis = 'auto';
        videoPreview.style.transition = 'flex 0.25s ease, flex-basis 0.25s ease, margin-left 0.25s ease';

        // 3. Envolver el contenido original en un contenedor
        var innerWrapper = document.createElement('div');
        innerWrapper.id = 'library-inner-wrapper';
        innerWrapper.style.cssText =
            'width: ' + LIB_EXPANDED_WIDTH + 'px;' +
            'height: 100%;' +
            'transition: opacity 0.2s ease;' +
            'display: flex;' +
            'flex-direction: column;';

        // Mover todos los hijos de library al innerWrapper
        while (library.firstChild) {
            innerWrapper.appendChild(library.firstChild);
        }

        // 4. Crear boton toggle (flecha)
        var toggleBtn = document.createElement('button');
        toggleBtn.id = 'library-toggle-btn';
        toggleBtn.style.cssText =
            'position: absolute;' +
            'top: 50%;' +
            'right: 0;' +
            'transform: translateY(-50%);' +
            'background: rgba(0,0,0,0.5);' +
            'border: 1px solid #555;' +
            'border-right: none;' +
            'border-radius: 4px 0 0 4px;' +
            'color: white;' +
            'padding: 8px 4px;' +
            'cursor: pointer;' +
            'z-index: 10;' +
            'font-size: 14px;' +
            'width: 50px;' +
            'height: 60px;' +
            'display: flex;' +
            'align-items: center;' +
            'justify-content: center;';
        toggleBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
        toggleBtn.title = 'Colapsar/Expandir biblioteca';

        toggleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleLibrary();
        };

        // Ensamblar
        library.appendChild(innerWrapper);
        library.appendChild(toggleBtn);

        _libExpanded = true;
        console.log('libraryCollapse: biblioteca movida al lado izquierdo, colapsable');

        // Exponer funcion global por si se necesita
        window.toggleLibraryPanel = toggleLibrary;
    }
    tryInit();
}

function toggleLibrary() {
    var library = document.getElementById('library-panel');
    var innerWrapper = document.getElementById('library-inner-wrapper');
    var toggleBtn = document.getElementById('library-toggle-btn');
    if (!library || !innerWrapper) return;

    var videoPreview = document.getElementById('video-preview-panel');

    if (_libExpanded) {
        // Colapsar: biblioteca sale del flujo (position:absolute), 
        // vista previa se expande a TODO el ancho moviendose a la izquierda
        _libExpanded = false;
        library.style.position = 'absolute';
        library.style.left = '0';
        library.style.top = '0';
        library.style.zIndex = '1051';
        library.style.flex = '0 0 0 !important';
        library.style.maxWidth = '0 !important';
        library.style.width = '0 !important';
        library.style.minWidth = '0 !important';
        library.style.opacity = '0';
        library.style.pointerEvents = 'none';
        innerWrapper.style.opacity = '0';
        innerWrapper.style.pointerEvents = 'none';
        // Mover el boton fuera de la biblioteca para que no herede opacity:0
        if (toggleBtn && toggleBtn.parentNode === library) {
            document.body.appendChild(toggleBtn);
        }
        // Vista previa ocupa TODO el ancho
        if (videoPreview) {
            videoPreview.style.flex = '1 1 100%';
            videoPreview.style.flexGrow = '1';
            videoPreview.style.flexBasis = '100%';
            videoPreview.style.marginLeft = '0';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
            // Mostrar boton flotante para re-expandir
            toggleBtn.style.position = 'fixed';
            toggleBtn.style.left = '0';
            toggleBtn.style.top = '50%';
            toggleBtn.style.right = 'auto';
            toggleBtn.style.transform = 'translateY(-50%)';
            toggleBtn.style.borderRadius = '0 4px 4px 0';
            toggleBtn.style.borderRight = '1px solid #555';
            toggleBtn.style.borderLeft = 'none';
            toggleBtn.style.zIndex = '1052';
            toggleBtn.style.opacity = '1';
            toggleBtn.style.pointerEvents = 'auto';
            toggleBtn.style.background = 'rgba(33,37,41,0.9)';
        }
        console.log('libraryCollapse: biblioteca colapsada, vista previa expandida a la izquierda');
    } else {
        // Expandir: biblioteca vuelve al flujo, vista previa se ajusta
        _libExpanded = true;
        library.style.position = 'relative';
        library.style.left = 'auto';
        library.style.top = 'auto';
        library.style.zIndex = 'auto';
        library.style.flex = '0 0 ' + LIB_EXPANDED_WIDTH + 'px !important';
        library.style.maxWidth = LIB_EXPANDED_WIDTH + 'px !important';
        library.style.width = LIB_EXPANDED_WIDTH + 'px !important';
        library.style.minWidth = LIB_EXPANDED_WIDTH + 'px !important';
        library.style.opacity = '1';
        library.style.pointerEvents = 'auto';
        innerWrapper.style.opacity = '1';
        innerWrapper.style.pointerEvents = 'auto';
        // Devolver el boton dentro de la biblioteca
        if (toggleBtn && toggleBtn.parentNode !== library) {
            library.appendChild(toggleBtn);
        }
        if (videoPreview) {
            videoPreview.style.flex = '1 1 auto';
            videoPreview.style.flexGrow = '1';
            videoPreview.style.flexBasis = 'auto';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
            toggleBtn.style.position = 'absolute';
            toggleBtn.style.left = 'auto';
            toggleBtn.style.right = '0';
            toggleBtn.style.top = '50%';
            toggleBtn.style.transform = 'translateY(-50%)';
            toggleBtn.style.borderRadius = '4px 0 0 4px';
            toggleBtn.style.borderRight = 'none';
            toggleBtn.style.borderLeft = '1px solid #555';
            toggleBtn.style.zIndex = '10';
            toggleBtn.style.background = 'rgba(0,0,0,0.5)';
        }
        console.log('libraryCollapse: biblioteca expandida');
    }
}
