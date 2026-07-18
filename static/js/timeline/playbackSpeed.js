// ============================================================================
// playbackSpeed.js — Control de velocidad de reproducción independiente
//
// Archivo independiente. Controla la velocidad del video-player y de todos
// los overlays de multiVideoPreview.js.
//
// Velocidades: 0.25, 0.50, 0.75, 1.0, 1.25, 1.50, 1.75, 2.0, 2.5, 3.0
//
// UI: Botón #btn-speed en la barra de controles del previsualizador.
//     Click cyclea velocidades. Click derecho abre menú con todas las opciones.
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlaybackSpeed);
} else {
    initPlaybackSpeed();
}

var SPEED_LEVELS = [0.25, 0.50, 0.75, 1.0, 1.25, 1.50, 1.75, 2.0, 2.5, 3.0];
var currentSpeedIndex = 3; // 1.0 por defecto

function initPlaybackSpeed() {
    // Esperar a que previewControls.js inyecte el botón
    var speedBtn = document.getElementById('btn-speed');
    if (!speedBtn) {
        setTimeout(initPlaybackSpeed, 100);
        return;
    }

    // Reemplazar el listener de videoEditor.js clonando el botón
    var newBtn = speedBtn.cloneNode(true);
    speedBtn.parentNode.replaceChild(newBtn, speedBtn);
    speedBtn = newBtn;

    // Click izquierdo: cyclear velocidades
    speedBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        currentSpeedIndex = (currentSpeedIndex + 1) % SPEED_LEVELS.length;
        applyPlaybackSpeed(SPEED_LEVELS[currentSpeedIndex]);
    });

    // Click derecho: mostrar menú de velocidades
    speedBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showSpeedMenu(e.clientX, e.clientY, speedBtn);
    });

    updateSpeedButtonLabel(speedBtn);
    console.log('playbackSpeed inicializado');
}

// ---------------------------------------------------------------------------
// Aplicar velocidad al video-player y a todos los overlays
// ---------------------------------------------------------------------------
function applyPlaybackSpeed(speed) {
    // Video-player original (track 1)
    var vp = document.getElementById('video-player');
    if (vp) {
        vp.playbackRate = speed;
    }

    // Overlays de tracks 2+ (multiVideoPreview.js)
    if (typeof overlayState !== 'undefined') {
        Object.keys(overlayState).forEach(function(trackId) {
            if (overlayState[trackId] && overlayState[trackId].videoEl) {
                overlayState[trackId].videoEl.playbackRate = speed;
            }
        });
    }

    // Actualizar label del botón
    var speedBtn = document.getElementById('btn-speed');
    if (speedBtn) {
        updateSpeedButtonLabel(speedBtn);
    }

    console.log('playbackSpeed: velocidad cambiada a', speed + 'x');
}

// ---------------------------------------------------------------------------
// Actualizar el texto del botón
// ---------------------------------------------------------------------------
function updateSpeedButtonLabel(btn) {
    var speed = SPEED_LEVELS[currentSpeedIndex];
    btn.innerHTML = '<i class="bi bi-speedometer2"></i> ' + speed + 'x';
}

// ---------------------------------------------------------------------------
// Menú contextual con todas las velocidades
// ---------------------------------------------------------------------------
function showSpeedMenu(x, y, parentBtn) {
    // Remover menú existente
    var existing = document.getElementById('speed-context-menu');
    if (existing) existing.remove();

    var menu = document.createElement('div');
    menu.id = 'speed-context-menu';
    menu.style.cssText =
        'position:fixed;z-index:10000;background:#1a202c;border:1px solid #4a5568;' +
        'border-radius:8px;padding:4px;box-shadow:0 8px 32px rgba(0,0,0,0.6);' +
        'min-width:100px;';

    SPEED_LEVELS.forEach(function(speed, idx) {
        var item = document.createElement('div');
        var isActive = (idx === currentSpeedIndex);
        item.style.cssText =
            'padding:6px 12px;cursor:pointer;border-radius:4px;font-size:13px;' +
            'color:' + (isActive ? '#007bff' : '#fff') + ';' +
            'background:' + (isActive ? 'rgba(0,123,255,0.15)' : 'transparent') + ';' +
            'display:flex;align-items:center;justify-content:space-between;gap:8px;';
        item.innerHTML = speed + 'x' + (isActive ? ' <i class="bi bi-check"></i>' : '');

        item.addEventListener('mouseenter', function() {
            if (!isActive) item.style.background = 'rgba(255,255,255,0.1)';
        });
        item.addEventListener('mouseleave', function() {
            if (!isActive) item.style.background = 'transparent';
        });
        item.addEventListener('click', function() {
            currentSpeedIndex = idx;
            applyPlaybackSpeed(speed);
            menu.remove();
        });

        menu.appendChild(item);
    });

    // Separador y opción "Normal"
    var sep = document.createElement('div');
    sep.style.cssText = 'height:1px;background:#4a5568;margin:4px 0;';
    menu.appendChild(sep);

    var resetItem = document.createElement('div');
    resetItem.style.cssText = 'padding:6px 12px;cursor:pointer;border-radius:4px;font-size:13px;color:#8899aa;';
    resetItem.textContent = 'Restablecer 1x';
    resetItem.addEventListener('click', function() {
        currentSpeedIndex = 3; // 1.0
        applyPlaybackSpeed(1.0);
        menu.remove();
    });
    menu.appendChild(resetItem);

    document.body.appendChild(menu);

    // Posicionar
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // Cerrar al hacer click fuera
    setTimeout(function() {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}
