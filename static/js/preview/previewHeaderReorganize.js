// ============================================================================
// BLINDADO / PROHIBIDO MODIFICAR SIN AUTORIZACION EXPLICITA
// ============================================================================
// previewHeaderReorganize.js - Reorganiza el header de la vista previa
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica index.html, previewControls.js,
// ni ningun otro archivo.
//
// *** PROHIBIDO TOCAR ***
//   - NO cambiar el centrado del tiempo (position: absolute, left: 50%)
//   - NO cambiar la raya vertical separadora
//   - NO cambiar el orden: titulo | tiempo centrado | separador | botones
//   - NO cambiar el padding del panel (padding: 0)
//   - NO cambiar el margin del header (margin: 0)
//   - NO cambiar el padding-top del header (padding-top: 0)
//   - NO cambiar la eliminacion del collapse-btn
//   - NO cambiar la eliminacion de la clase p-3 y mb-3
//   - TODO DEBE QUEDAR INTEGRO COMO ESTA
// ============================================================================
//
// FUNCIONALIDAD:
//   - Elimina el padding del panel (clase p-3 de Bootstrap) y el margen
//     del header (clase mb-3) para que el header quede pegado al borde
//     superior del panel.
//   - Mueve el tiempo de reproduccion (current time / duration) al CENTRO
//     del header de la vista previa.
//   - Al lado derecho, despues de una raya vertical separadora, coloca
//     los botones de aspecto (#btn-fit-screen) y pantalla completa
//     (#btn-fullscreen).
//   - El tiempo se actualiza en tiempo real desde el video.
//   - Elimina el collapse-btn del header.
//
// NO TOCAR:
//   - index.html: no se modifica
//   - previewControls.js: no se modifica
//   - Cualquier otro archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initPreviewHeaderReorganize, 700);
    });
} else {
    setTimeout(initPreviewHeaderReorganize, 700);
}

function initPreviewHeaderReorganize() {
    function tryInit() {
        var panel = document.getElementById('video-preview-panel');
        if (!panel) {
            setTimeout(tryInit, 300);
            return;
        }

        var header = panel.querySelector('.panel-header');
        if (!header) {
            setTimeout(tryInit, 300);
            return;
        }

        if (header.dataset.reorganizeInit === 'true') return;
        header.dataset.reorganizeInit = 'true';

        // 0. Eliminar el padding del panel (clase p-3 de Bootstrap) para que
        //    el header quede pegado al borde superior del panel
        panel.classList.remove('p-3');
        panel.style.padding = '0';
        panel.style.paddingLeft = '8px';
        panel.style.paddingRight = '8px';
        panel.style.paddingBottom = '8px';

        // Forzar el header pegado al borde superior: sin margen ni padding superior
        header.classList.remove('mb-3');
        header.style.marginTop = '0';
        header.style.marginBottom = '4px';
        header.style.paddingTop = '0';

        // Buscar los elementos existentes del header
        var title = header.querySelector('h6');
        var btnFitScreen = header.querySelector('#btn-fit-screen');
        var btnFullscreen = header.querySelector('#btn-fullscreen');
        var collapseBtn = header.querySelector('.collapse-btn');

        // Buscar el video para obtener el tiempo de reproduccion
        var video = document.getElementById('video-player');

        // Crear el elemento de tiempo centrado
        var timeDisplay = document.createElement('span');
        timeDisplay.id = 'preview-header-time';
        timeDisplay.style.cssText =
            'position: absolute;' +
            'left: 50%;' +
            'transform: translateX(-50%);' +
            'color: #fff;' +
            'font-size: 14px;' +
            'font-weight: 600;' +
            'font-variant-numeric: tabular-nums;' +
            'white-space: nowrap;' +
            'user-select: none;';
        timeDisplay.textContent = '00:00 / 00:00';

        // Crear la raya vertical separadora
        var separator = document.createElement('div');
        separator.style.cssText =
            'width: 1px;' +
            'height: 24px;' +
            'background: #555;' +
            'margin: 0 8px;';

        // Limpiar el header y reconstruirlo
        // Guardar el titulo
        var titleClone = title.cloneNode(true);

        // Limpiar todo el contenido del header
        while (header.firstChild) {
            header.removeChild(header.firstChild);
        }

        // Reconstruir: titulo a la izquierda
        header.appendChild(titleClone);

        // Tiempo centrado (absolute)
        header.appendChild(timeDisplay);

        // Contenedor derecho: separador + botones
        var rightContainer = document.createElement('div');
        rightContainer.className = 'd-flex align-items-center ms-auto';

        rightContainer.appendChild(separator);

        if (btnFitScreen) rightContainer.appendChild(btnFitScreen);
        if (btnFullscreen) rightContainer.appendChild(btnFullscreen);

        header.appendChild(rightContainer);

        // El header necesita position:relative para el tiempo centrado absolute
        header.style.position = 'relative';

        // Eliminar el collapse-btn si existia (no se necesita)
        if (collapseBtn) {
            collapseBtn.remove();
        }

        // Actualizar el tiempo en tiempo real
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0) return '00:00';
            var mins = Math.floor(seconds / 60);
            var secs = Math.floor(seconds % 60);
            return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        if (video) {
            video.addEventListener('timeupdate', function() {
                var current = formatTime(video.currentTime);
                var duration = formatTime(video.duration);
                timeDisplay.textContent = current + ' / ' + duration;
            });

            video.addEventListener('loadedmetadata', function() {
                var current = formatTime(video.currentTime);
                var duration = formatTime(video.duration);
                timeDisplay.textContent = current + ' / ' + duration;
            });
        }

        // Tambien escuchar cambios desde previewControls (video-current-time)
        var previewCurrentTime = document.getElementById('video-current-time');
        var previewDuration = document.getElementById('video-duration');
        if (previewCurrentTime) {
            var observer = new MutationObserver(function() {
                var current = previewCurrentTime.textContent || '00:00';
                var duration = previewDuration ? previewDuration.textContent : '00:00';
                timeDisplay.textContent = current + ' / ' + duration;
            });
            observer.observe(previewCurrentTime, { childList: true, characterData: true, subtree: true });
        }
        if (previewDuration) {
            var observer2 = new MutationObserver(function() {
                var current = previewCurrentTime ? previewCurrentTime.textContent : '00:00';
                var duration = previewDuration.textContent || '00:00';
                timeDisplay.textContent = current + ' / ' + duration;
            });
            observer2.observe(previewDuration, { childList: true, characterData: true, subtree: true });
        }

        console.log('previewHeaderReorganize: header reorganizado con tiempo centrado');
    }
    tryInit();
}
