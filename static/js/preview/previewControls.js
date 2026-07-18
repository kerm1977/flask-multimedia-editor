// ============================================================================
// previewControls.js — Controles del previsualizador (play, tiempo, volume, speed)
//
// Genera la barra de controles debajo del previsualizador de forma dinámica.
// No duplica HTML: el contenedor #preview-controls-host está vacío en index.html
// y este archivo inyecta los controles ahí.
//
// Controles:
//   - Play/Pause (btn-play-pause)
//   - Barra de progreso (video-progress / video-progress-bar)
//   - Tiempo actual / duración (video-current-time / video-duration)
//   - Volume (btn-volume)
//   - Speed (btn-speed)
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreviewControls);
} else {
    initPreviewControls();
}

function initPreviewControls() {
    var host = document.getElementById('preview-controls-host');
    if (!host) {
        console.error('previewControls: no se encontró #preview-controls-host');
        return;
    }

    // Construir la barra de controles
    var bar = document.createElement('div');
    bar.className = 'video-controls-bar d-flex align-items-center justify-content-center gap-3 px-3 py-2 bg-gradient-secondary rounded mt-2';

    bar.innerHTML =
        '<button class="btn btn-primary rounded-circle d-flex justify-content-center align-items-center" id="btn-play-pause" style="width: 42px; height: 42px; padding: 0;">' +
            '<i class="bi bi-play-fill fs-5" style="line-height: 1;"></i>' +
        '</button>' +
        '<div class="flex-grow-1" style="max-width: 400px;">' +
            '<div class="progress" style="height: 6px; cursor: pointer;" id="video-progress">' +
                '<div class="progress-bar bg-primary" id="video-progress-bar" style="width: 0%;"></div>' +
            '</div>' +
            '<div class="d-flex justify-content-between mt-1">' +
                '<small class="text-white-50" id="video-current-time">00:00</small>' +
                '<small class="text-white-50" id="video-duration">00:00</small>' +
            '</div>' +
        '</div>' +
        '<button class="btn btn-sm btn-outline-light" id="btn-volume">' +
            '<i class="bi bi-volume-up"></i>' +
        '</button>' +
        '<button class="btn btn-sm btn-outline-light" id="btn-speed">' +
            '<i class="bi bi-speedometer2"></i> 1x' +
        '</button>';

    host.appendChild(bar);
    console.log('previewControls inicializado');
}
