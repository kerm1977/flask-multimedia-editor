// ============================================================================
// BLINDADO / NO MODIFICAR SIN AUTORIZACION
// fullscreenControls.js - Controles de pantalla completa
//
// Archivo TOTALMENTE INDEPENDIENTE. No modifica fullscreenMode.js,
// emojiTrackManager.js, videoEditor.js, ni ningun otro archivo.
//
// FUNCIONALIDAD:
//   - Cuando esta en pantalla completa, muestra una barra de desplazamiento
//     para mover el video hacia adelante/atras (como VLC)
//   - La barra aparece al mover el mouse y se oculta tras 3 segundos
//     de inactividad (junto con el cursor)
//   - Scroll arriba/abajo: sube/baja el volumen del video
//   - Botón de captura de pantalla (camara): guarda un PNG del frame actual
//     en la carpeta de descargas del dispositivo
//   - Botón de play/pause en la barra
//
// NO TOCAR:
//   - fullscreenMode.js: no se modifica
//   - Cualquier otro archivo existente
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFullscreenControls);
} else {
    initFullscreenControls();
}

var _fsHideTimer = null;
var _fsBar = null;

function initFullscreenControls() {
    // Escuchar cambios de pantalla completa para activar/desactivar controles
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    console.log('fullscreenControls: inicializado');
}

function onFullscreenChange() {
    var isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFullscreen) {
        activateFullscreenControls();
    } else {
        deactivateFullscreenControls();
    }
}

// ---------------------------------------------------------------------------
// activateFullscreenControls()
// ---------------------------------------------------------------------------
// Activa los controles cuando entra en pantalla completa
// ---------------------------------------------------------------------------
function activateFullscreenControls() {
    var container = document.fullscreenElement || document.webkitFullscreenElement;
    if (!container) return;

    // Crear barra de controles
    _fsBar = document.createElement('div');
    _fsBar.id = 'fs-controls-bar';
    _fsBar.style.cssText =
        'position:absolute;bottom:0;left:0;right:0;' +
        'padding:12px 20px;background:linear-gradient(transparent,rgba(0,0,0,0.85));' +
        'display:flex;align-items:center;gap:12px;z-index:999999;' +
        'transition:opacity 0.4s ease;opacity:1;';

    // Boton play/pause
    var btnPlay = document.createElement('button');
    btnPlay.id = 'fs-btn-play';
    btnPlay.style.cssText =
        'background:none;border:none;color:white;font-size:22px;' +
        'cursor:pointer;padding:4px 8px;';
    btnPlay.innerHTML = '<i class="bi bi-pause-fill"></i>';
    btnPlay.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var video = document.getElementById('video-player');
        if (!video) return;
        if (video.paused) {
            video.play();
            btnPlay.innerHTML = '<i class="bi bi-pause-fill"></i>';
        } else {
            video.pause();
            btnPlay.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
    };

    // Tiempo actual / duracion
    var timeLabel = document.createElement('span');
    timeLabel.id = 'fs-time-label';
    timeLabel.style.cssText = 'color:white;font-size:13px;min-width:90px;text-align:center;';
    timeLabel.textContent = '0:00 / 0:00';

    // Barra de desplazamiento (seek)
    var seekBar = document.createElement('input');
    seekBar.type = 'range';
    seekBar.id = 'fs-seek-bar';
    seekBar.min = '0';
    seekBar.max = '100';
    seekBar.value = '0';
    seekBar.style.cssText =
        'flex-grow:1;height:6px;-webkit-appearance:none;appearance:none;' +
        'background:#555;border-radius:3px;cursor:pointer;outline:none;';
    // Estilo del thumb
    seekBar.classList.add('fs-seek-bar');

    seekBar.oninput = function(e) {
        e.stopPropagation();
        var video = document.getElementById('video-player');
        if (!video || !video.duration) return;
        var pct = parseFloat(seekBar.value) / 100;
        video.currentTime = video.duration * pct;
    };

    // Boton captura de pantalla (camara)
    var btnCapture = document.createElement('button');
    btnCapture.id = 'fs-btn-capture';
    btnCapture.style.cssText =
        'background:none;border:none;color:white;font-size:20px;' +
        'cursor:pointer;padding:4px 8px;';
    btnCapture.innerHTML = '<i class="bi bi-camera"></i>';
    btnCapture.title = 'Capturar pantalla (PNG)';
    btnCapture.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        captureScreenshot();
    };

    // Ensamblar barra
    _fsBar.appendChild(btnPlay);
    _fsBar.appendChild(timeLabel);
    _fsBar.appendChild(seekBar);
    _fsBar.appendChild(btnCapture);

    container.appendChild(_fsBar);

    // Agregar estilos para el thumb del seek bar
    if (!document.getElementById('fs-seek-styles')) {
        var style = document.createElement('style');
        style.id = 'fs-seek-styles';
        style.textContent =
            '.fs-seek-bar::-webkit-slider-thumb {' +
            '  -webkit-appearance:none;appearance:none;' +
            '  width:14px;height:14px;border-radius:50%;' +
            '  background:#fff;cursor:pointer;' +
            '}' +
            '.fs-seek-bar::-moz-range-thumb {' +
            '  width:14px;height:14px;border-radius:50%;' +
            '  background:#fff;cursor:pointer;border:none;' +
            '}';
        document.head.appendChild(style);
    }

    // Eventos del mouse: mostrar barra al mover, ocultar tras inactividad
    container.addEventListener('mousemove', onMouseMoveFullscreen);
    container.addEventListener('mouseenter', onMouseMoveFullscreen);

    // Scroll para volumen
    container.addEventListener('wheel', onWheelVolume, { passive: false });

    // Actualizar seek bar y tiempo
    var video = document.getElementById('video-player');
    if (video) {
        video.addEventListener('timeupdate', updateSeekBar);
    }

    // Iniciar timer de ocultar
    resetHideTimer();
}

// ---------------------------------------------------------------------------
// deactivateFullscreenControls()
// ---------------------------------------------------------------------------
// Limpia los controles al salir de pantalla completa
// ---------------------------------------------------------------------------
function deactivateFullscreenControls() {
    var container = document.fullscreenElement || document.webkitFullscreenElement;
    // Si container existe (salida), remover listeners
    // Si no existe (ya salio), buscar el contenedor de vista previa
    if (!container) {
        container = document.querySelector('.video-preview-container');
    }

    if (container) {
        container.removeEventListener('mousemove', onMouseMoveFullscreen);
        container.removeEventListener('mouseenter', onMouseMoveFullscreen);
        container.removeEventListener('wheel', onWheelVolume);
    }

    if (_fsHideTimer) {
        clearTimeout(_fsHideTimer);
        _fsHideTimer = null;
    }

    if (_fsBar) {
        _fsBar.remove();
        _fsBar = null;
    }

    // Restaurar cursor
    if (container) {
        container.style.cursor = '';
    }

    // Remover listener de timeupdate
    var video = document.getElementById('video-player');
    if (video) {
        video.removeEventListener('timeupdate', updateSeekBar);
    }
}

// ---------------------------------------------------------------------------
// onMouseMoveFullscreen()
// ---------------------------------------------------------------------------
// Muestra la barra y el cursor al mover el mouse, reinicia timer de ocultar
// ---------------------------------------------------------------------------
function onMouseMoveFullscreen() {
    if (!_fsBar) return;

    _fsBar.style.opacity = '1';

    var container = document.fullscreenElement || document.webkitFullscreenElement;
    if (container) {
        container.style.cursor = '';
    }

    resetHideTimer();
}

// ---------------------------------------------------------------------------
// resetHideTimer()
// ---------------------------------------------------------------------------
// Tras 3 segundos de inactividad, oculta la barra y el cursor
// ---------------------------------------------------------------------------
function resetHideTimer() {
    if (_fsHideTimer) {
        clearTimeout(_fsHideTimer);
    }

    _fsHideTimer = setTimeout(function() {
        if (_fsBar) {
            _fsBar.style.opacity = '0';
        }
        var container = document.fullscreenElement || document.webkitFullscreenElement;
        if (container) {
            container.style.cursor = 'none';
        }
    }, 3000);
}

// ---------------------------------------------------------------------------
// onWheelVolume(e)
// ---------------------------------------------------------------------------
// Scroll arriba = subir volumen, scroll abajo = bajar volumen
// ---------------------------------------------------------------------------
function onWheelVolume(e) {
    e.preventDefault();
    e.stopPropagation();

    var video = document.getElementById('video-player');
    if (!video) return;

    var delta = e.deltaY < 0 ? 0.1 : -0.1;
    var newVol = video.volume + delta;
    if (newVol < 0) newVol = 0;
    if (newVol > 1) newVol = 1;

    video.volume = newVol;

    // Mostrar indicador de volumen temporal
    showVolumeIndicator(newVol);
}

// ---------------------------------------------------------------------------
// showVolumeIndicator(volume)
// ---------------------------------------------------------------------------
// Muestra un indicador temporal del nivel de volumen
// ---------------------------------------------------------------------------
function showVolumeIndicator(volume) {
    var container = document.fullscreenElement || document.webkitFullscreenElement;
    if (!container) return;

    var existing = document.getElementById('fs-vol-indicator');
    if (existing) existing.remove();

    var indicator = document.createElement('div');
    indicator.id = 'fs-vol-indicator';
    indicator.style.cssText =
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:rgba(0,0,0,0.7);color:white;padding:10px 20px;' +
        'border-radius:8px;font-size:16px;z-index:999999;pointer-events:none;';
    var pct = Math.round(volume * 100);
    indicator.innerHTML =
        '<i class="bi bi-volume-up"></i> ' + pct + '%';

    container.appendChild(indicator);

    setTimeout(function() {
        if (indicator.parentNode) indicator.remove();
    }, 800);
}

// ---------------------------------------------------------------------------
// updateSeekBar()
// ---------------------------------------------------------------------------
// Actualiza la posicion del seek bar y el tiempo mostrado
// ---------------------------------------------------------------------------
function updateSeekBar() {
    var video = document.getElementById('video-player');
    if (!video) return;

    var seekBar = document.getElementById('fs-seek-bar');
    var timeLabel = document.getElementById('fs-time-label');

    if (seekBar && video.duration) {
        var pct = (video.currentTime / video.duration) * 100;
        seekBar.value = pct;
    }

    if (timeLabel) {
        timeLabel.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
    }
}

// ---------------------------------------------------------------------------
// formatTime(seconds)
// ---------------------------------------------------------------------------
// Formatea segundos a M:SS
// ---------------------------------------------------------------------------
function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

// ---------------------------------------------------------------------------
// captureScreenshot()
// ---------------------------------------------------------------------------
// Captura el frame actual del video y lo descarga como PNG
// ---------------------------------------------------------------------------
function captureScreenshot() {
    var video = document.getElementById('video-player');
    if (!video || !video.videoWidth) {
        console.log('fullscreenControls: no hay video para capturar');
        return;
    }

    // Crear canvas con las dimensiones del video
    var canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var ctx = canvas.getContext('2d');

    // Dibujar el frame actual del video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Tambien dibujar los overlays de emojis que esten visibles
    var container = document.querySelector('.video-preview-container');
    if (container) {
        var overlays = container.querySelectorAll('.emoji-overlay');
        overlays.forEach(function(overlay) {
            if (overlay.style.display === 'none') return;

            var rect = overlay.getBoundingClientRect();
            var containerRect = container.getBoundingClientRect();

            // Calcular posicion relativa al contenedor
            var relX = rect.left - containerRect.left;
            var relY = rect.top - containerRect.top;

            // Escalar al tamano del canvas
            var scaleX = canvas.width / containerRect.width;
            var scaleY = canvas.height / containerRect.height;

            // Si el overlay es una imagen
            var img = overlay.querySelector('img') || overlay;
            if (img.tagName === 'IMG' && img.complete) {
                // Aplicar transformaciones (rotacion, escala, flip)
                ctx.save();
                var cx = (relX + rect.width / 2) * scaleX;
                var cy = (relY + rect.height / 2) * scaleY;
                ctx.translate(cx, cy);

                // Rotacion
                var rot = parseFloat(overlay.dataset.rotation) || 0;
                if (rot) ctx.rotate(rot * Math.PI / 180);

                // Escala y flip
                var scale = parseFloat(overlay.dataset.scale) || 1;
                var flippedH = overlay.dataset.flipped === 'true' ? -1 : 1;
                var flippedV = overlay.dataset.flippedV === 'true' ? -1 : 1;
                ctx.scale(scale * flippedH * scaleX, scale * flippedV * scaleY);

                var w = rect.width;
                var h = rect.height;
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
                ctx.restore();
            }
        });
    }

    // Convertir a PNG y descargar
    canvas.toBlob(function(blob) {
        if (!blob) {
            console.log('fullscreenControls: error al crear PNG');
            return;
        }

        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = 'captura_' + timestamp + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Mostrar confirmacion
        showCaptureFlash();

        console.log('fullscreenControls: captura guardada como PNG');
    }, 'image/png');
}

// ---------------------------------------------------------------------------
// showCaptureFlash()
// ---------------------------------------------------------------------------
// Muestra un flash blanco breve al capturar (efecto de camara)
// ---------------------------------------------------------------------------
function showCaptureFlash() {
    var container = document.fullscreenElement || document.webkitFullscreenElement;
    if (!container) container = document.querySelector('.video-preview-container');
    if (!container) return;

    var flash = document.createElement('div');
    flash.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'background:white;z-index:999999;pointer-events:none;' +
        'opacity:0.6;transition:opacity 0.3s ease;';
    container.appendChild(flash);

    setTimeout(function() {
        flash.style.opacity = '0';
        setTimeout(function() {
            if (flash.parentNode) flash.remove();
        }, 300);
    }, 100);
}
