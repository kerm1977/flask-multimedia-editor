// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// toolbarReorganize.js - Reorganiza los botones de la toolbar en grupos
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica index.html, videoEditor.js,
// ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Reorganiza los botones de la barra de herramientas en 3 grupos
//     separados por lineas verticales:
//     1. TRANSFORMACION: dividir, aspecto, eliminar, rotar izq, rotar der,
//        escalar +, escalar -, mirror, flip vertical
//     2. MEDIA: texto, stickers/emojis, musica, voz
//     3. OTROS: velocidad, volumen, filtros, transiciones, exportar
//   - Mueve los botones existentes (no los recrea, preserva event listeners)
//   - Agrega separadores visuales (linea vertical) entre grupos
//
// NO TOCAR:
//   - index.html: no se modifica
//   - Cualquier otro archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToolbarReorganize);
} else {
    initToolbarReorganize();
}

function initToolbarReorganize() {
    // Esperar a que todos los botones existan en el DOM
    function tryReorganize() {
        var toolbar = document.querySelector('#timeline-panel .panel-header .d-flex.flex-wrap.gap-2');
        if (!toolbar) {
            // Buscar por el contenedor que tiene los botones
            var btnSplit = document.getElementById('btn-split');
            if (!btnSplit) {
                setTimeout(tryReorganize, 300);
                return;
            }
            toolbar = btnSplit.parentElement;
        }

        if (!toolbar) {
            setTimeout(tryReorganize, 300);
            return;
        }

        if (toolbar.dataset.reorganized === 'true') return;

        // Esperar a que los botones dinamicos (rotacion, escala, mirror, flip) se creen
        var hasRotateLeft = document.getElementById('btn-rotate-left');
        var hasScaleUp = document.getElementById('btn-scale-emoji-up');
        var hasMirror = document.getElementById('btn-mirror-flip');
        var hasFlipV = document.getElementById('btn-flip-vertical');

        if (!hasRotateLeft || !hasScaleUp || !hasMirror || !hasFlipV) {
            setTimeout(tryReorganize, 300);
            return;
        }

        reorganizeToolbar(toolbar);
    }
    tryReorganize();
}

function reorganizeToolbar(toolbar) {
    toolbar.dataset.reorganized = 'true';

    // Definir los grupos en orden
    var groups = {
        transform: [
            'btn-split',
            'btn-trim',
            'btn-rotate-left',
            'btn-rotate-right',
            'btn-scale-emoji-up',
            'btn-scale-emoji-down',
            'btn-mirror-flip',
            'btn-flip-vertical'
        ],
        media: [
            'btn-add-text',
            'btn-add-sticker',
            'btn-add-music',
            'btn-add-voiceover'
        ],
        others: [
            'btn-speed-control',
            'btn-volume-control',
            'btn-add-filter',
            'btn-add-transition',
            'btn-export'
        ]
    };

    // Crear contenedor nuevo con grupos y separadores
    var newContainer = document.createElement('div');
    newContainer.className = 'd-flex flex-wrap align-items-center';
    newContainer.style.gap = '0';

    // Funcion para crear un separador vertical
    function createSeparator() {
        var sep = document.createElement('div');
        sep.style.cssText =
            'width:1px; height:28px; background:#4a5568; margin:0 8px; flex-shrink:0;';
        return sep;
    }

    // Funcion para crear un grupo
    function createGroup(buttonIds, groupName) {
        var group = document.createElement('div');
        group.className = 'd-flex align-items-center';
        group.style.gap = '4px';
        group.dataset.groupName = groupName;

        buttonIds.forEach(function(id) {
            var btn = document.getElementById(id);
            if (btn) {
                group.appendChild(btn);
            }
        });

        return group;
    }

    // Grupo 1: Transformacion
    var g1 = createGroup(groups.transform, 'transform');
    newContainer.appendChild(g1);

    // Separador
    newContainer.appendChild(createSeparator());

    // Grupo 2: Media
    var g2 = createGroup(groups.media, 'media');
    newContainer.appendChild(g2);

    // Separador
    newContainer.appendChild(createSeparator());

    // Grupo 3: Otros
    var g3 = createGroup(groups.others, 'others');
    newContainer.appendChild(g3);

    // Separador con mas espacio antes del boton de eliminar
    var sepDanger = document.createElement('div');
    sepDanger.style.cssText =
        'width:1px; height:28px; background:#4a5568; margin:0 20px 0 16px; flex-shrink:0;';
    newContainer.appendChild(sepDanger);

    // Grupo 4: Eliminar (boton critico al final)
    var g4 = document.createElement('div');
    g4.className = 'd-flex align-items-center';
    g4.style.gap = '4px';
    g4.dataset.groupName = 'danger';

    var btnDelete = document.getElementById('btn-delete');
    if (btnDelete) {
        // Estilo rojizo para indicar accion critica
        btnDelete.classList.remove('btn-outline-light');
        btnDelete.classList.add('btn-outline-danger');
        btnDelete.style.cssText =
            'padding: 6px 10px; background-color: rgba(220,53,69,0.25); border-color: rgba(220,53,69,0.6);';
        g4.appendChild(btnDelete);
    }
    newContainer.appendChild(g4);

    // Reemplazar el contenedor original
    toolbar.parentNode.replaceChild(newContainer, toolbar);

    console.log('toolbarReorganize: botones reorganizados en 3 grupos');
}
