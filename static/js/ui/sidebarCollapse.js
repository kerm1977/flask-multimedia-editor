// ============================================================================
// Sidebar colapsable: se contrae por defecto y se expande al pasar el mouse
// por el borde izquierdo de la pantalla. Archivo independiente, no modifica
// código blindado.
//
// Funcionamiento:
//   - Al cargar, el sidebar se contrae a 8px de ancho.
//   - Cuando el mouse entra al sidebar (o a una franja de 12px desde el borde
//     izquierdo), se expande a 200px con transición suave.
//   - Cuando el mouse sale, se vuelve a contraer.
//   - El contenido del sidebar se oculta/visible con opacity para que la
//     transición sea limpia.
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initSidebarCollapse();
});

const SIDEBAR_COLLAPSED_WIDTH = '8px';
const SIDEBAR_EXPANDED_WIDTH = '200px';
const SIDEBAR_HOVER_ZONE = 12; // px desde borde izquierdo

function initSidebarCollapse() {
    const sidebar = document.getElementById('sidebar-panel');
    if (!sidebar) {
        console.log('No se encontró sidebar-panel');
        return;
    }

    // Colapsar por defecto
    sidebar.style.width = SIDEBAR_COLLAPSED_WIDTH;
    sidebar.style.minWidth = SIDEBAR_COLLAPSED_WIDTH;
    sidebar.style.maxWidth = SIDEBAR_EXPANDED_WIDTH;
    sidebar.style.overflow = 'hidden';
    sidebar.style.transition = 'width 0.25s ease, min-width 0.25s ease';
    sidebar.style.position = 'relative';
    sidebar.style.zIndex = '1050';

    // Envolver el contenido en un contenedor con overflow hidden
    const innerContent = sidebar.querySelector('.p-3');
    if (!innerContent) return;

    innerContent.style.transition = 'opacity 0.2s ease';
    innerContent.style.opacity = '0';
    innerContent.style.pointerEvents = 'none';
    innerContent.style.whiteSpace = 'nowrap';

    let isExpanded = false;

    // Crear zona hover invisible que detecta el mouse en el borde izquierdo
    const hoverZone = document.createElement('div');
    hoverZone.id = 'sidebar-hover-zone';
    hoverZone.style.cssText =
        'position:fixed;top:0;left:0;width:' + SIDEBAR_HOVER_ZONE + 'px;' +
        'height:100%;z-index:1049;cursor:pointer;';
    document.body.appendChild(hoverZone);

    // Expandir al entrar al sidebar o zona hover
    function expandSidebar() {
        if (isExpanded) return;
        isExpanded = true;
        sidebar.style.width = SIDEBAR_EXPANDED_WIDTH;
        sidebar.style.minWidth = '180px';
        innerContent.style.opacity = '1';
        innerContent.style.pointerEvents = 'auto';
    }

    // Contraer al salir
    function collapseSidebar() {
        if (!isExpanded) return;
        isExpanded = false;
        sidebar.style.width = SIDEBAR_COLLAPSED_WIDTH;
        sidebar.style.minWidth = SIDEBAR_COLLAPSED_WIDTH;
        innerContent.style.opacity = '0';
        innerContent.style.pointerEvents = 'none';
    }

    // Mouse entra a la zona hover o al sidebar → expandir
    hoverZone.addEventListener('mouseenter', expandSidebar);
    sidebar.addEventListener('mouseenter', expandSidebar);

    // Mouse sale del sidebar → contraer
    sidebar.addEventListener('mouseleave', collapseSidebar);

    // Mouse sale de la zona hover sin entrar al sidebar → contraer
    hoverZone.addEventListener('mouseleave', function() {
        if (!isExpanded) return;
        // Solo contraer si el mouse realmente no está sobre el sidebar
        setTimeout(function() {
            const stillHover = sidebar.matches(':hover');
            if (!stillHover) collapseSidebar();
        }, 50);
    });

    // Asegurar que al hacer click en items del sidebar no se contraiga
    const navItems = sidebar.querySelectorAll('.nav-link');
    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            // Mantener expandido brevemente tras click
            setTimeout(collapseSidebar, 300);
        });
    });

    console.log('Sidebar colapsable inicializado');
}
