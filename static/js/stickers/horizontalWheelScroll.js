// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// horizontalWheelScroll.js - Scroll horizontal con rueda del mouse
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica responsiveLayout.css,
// index.html, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Convierte el scroll vertical de la rueda del mouse en scroll horizontal
//   - Cuando la ventana es pequena y el contenido es mas ancho que la ventana,
//     girar la rueda del mouse mueve el contenido hacia la derecha/izquierda
//   - Oculta la barra de scroll horizontal para que no se vea fea
//   - Solo activo cuando el ancho de ventana es menor al contenido
//   - No interfiere con el scroll vertical normal de elementos internos
//     (biblioteca, timeline, etc.)
//
// NO TOCAR:
//   - Cualquier archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHorizontalWheelScroll);
} else {
    initHorizontalWheelScroll();
}

function initHorizontalWheelScroll() {
    // Ocultar scrollbar horizontal pero permitir scroll
    var style = document.createElement('style');
    style.id = 'horizontal-wheel-scroll-style';
    style.textContent =
        'html { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }' +
        'html::-webkit-scrollbar { display: none; }' +
        'body { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }' +
        'body::-webkit-scrollbar { display: none; }';
    document.head.appendChild(style);

    // Convertir scroll vertical de la rueda en scroll horizontal
    // Solo cuando el target no es un elemento con scroll vertical propio
    document.addEventListener('wheel', function(e) {
        // Si el elemento objetivo tiene su propio scroll vertical, no interferir
        var target = e.target;
        var scrollableParent = target.closest('[style*="overflow-y"], [style*="overflow: auto"], .library-files-grid, #library-files-grid, .timeline-container, #timeline-panel');

        // Verificar si el elemento o sus padres tienen scroll vertical activo
        var hasVerticalScroll = false;
        var el = target;
        while (el && el !== document.body) {
            if (el.scrollHeight > el.clientHeight && 
                (getComputedStyle(el).overflowY === 'auto' || getComputedStyle(el).overflowY === 'scroll')) {
                hasVerticalScroll = true;
                break;
            }
            el = el.parentElement;
        }

        // Si hay scroll vertical en el elemento, no interferir
        if (hasVerticalScroll) return;

        // Si la pagina tiene scroll horizontal disponible
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
            e.preventDefault();
            // deltaY positivo = scroll abajo = mover a la derecha
            // deltaY negativo = scroll arriba = mover a la izquierda
            window.scrollBy({
                left: e.deltaY,
                behavior: 'auto'
            });
        }
    }, { passive: false });

    console.log('horizontalWheelScroll: inicializado');
}
