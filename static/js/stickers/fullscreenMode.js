// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// fullscreenMode.js - Pantalla completa del area de vista previa
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica index.html, videoEditor.js,
// emojiTrackManager.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Al hacer clic en #btn-fullscreen, el area de vista previa completa
//     (video + overlays de emojis) se expande a pantalla completa
//   - Usa la Fullscreen API nativa del navegador
//   - Si ya esta en pantalla completa, sale al hacer clic de nuevo
//   - Tambien sale con la tecla Escape (comportamiento nativo del navegador)
//   - El video y los overlays se redimensionan automaticamente porque
//     usan w-100 h-100 y position:absolute relativos al contenedor
//
// NO TOCAR:
//   - index.html: no se modifica
//   - Cualquier otro archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFullscreenMode);
} else {
    initFullscreenMode();
}

function initFullscreenMode() {
    function tryInit() {
        var btn = document.getElementById('btn-fullscreen');
        if (!btn) {
            setTimeout(tryInit, 300);
            return;
        }

        // Evitar duplicar el listener
        if (btn.dataset.fullscreenInit === 'true') return;
        btn.dataset.fullscreenInit = 'true';

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleFullscreen();
        });

        // Doble clic en el contenedor de video tambien activa pantalla completa
        var container = document.querySelector('.video-preview-container');
        if (container) {
            container.addEventListener('dblclick', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleFullscreen();
            });
        }

        // Actualizar icono del boton segun estado de pantalla completa
        document.addEventListener('fullscreenchange', updateFullscreenIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);

        console.log('fullscreenMode: inicializado');
    }
    tryInit();
}

function toggleFullscreen() {
    // El elemento a poner en pantalla completa es el contenedor de vista previa
    // que incluye el video y los overlays de emojis
    var target = document.querySelector('.video-preview-container') ||
                 document.getElementById('video-preview-panel');

    if (!target) {
        console.log('fullscreenMode: contenedor no encontrado');
        return;
    }

    // Si ya estamos en pantalla completa, salir
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        return;
    }

    // Entrar en pantalla completa
    if (target.requestFullscreen) {
        target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
    } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
    } else {
        // Fallback: si el navegador no soporta Fullscreen API, usar estilo CSS
        cssFullscreenFallback(target);
    }
}

// ---------------------------------------------------------------------------
// updateFullscreenIcon()
// ---------------------------------------------------------------------------
// Cambia el icono del boton segun si estamos o no en pantalla completa.
// ---------------------------------------------------------------------------
function updateFullscreenIcon() {
    var btn = document.getElementById('btn-fullscreen');
    if (!btn) return;

    var icon = btn.querySelector('i');
    if (!icon) return;

    if (document.fullscreenElement || document.webkitFullscreenElement) {
        icon.className = 'bi bi-fullscreen-exit fs-5';
    } else {
        icon.className = 'bi bi-fullscreen fs-5';
    }
}

// ---------------------------------------------------------------------------
// cssFullscreenFallback(target)
// ---------------------------------------------------------------------------
// Fallback con CSS si el navegador no soporta Fullscreen API.
// ---------------------------------------------------------------------------
function cssFullscreenFallback(target) {
    if (target.dataset.cssFullscreen === 'true') {
        // Salir
        target.dataset.cssFullscreen = 'false';
        target.style.cssText = target.dataset.originalCss || '';
        document.body.style.overflow = '';
        return;
    }

    // Guardar estilo original
    target.dataset.originalCss = target.style.cssText;
    target.dataset.cssFullscreen = 'true';

    // Aplicar estilo de pantalla completa
    target.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
        'z-index:99999;background:#000;border-radius:0;';

    document.body.style.overflow = 'hidden';
}
