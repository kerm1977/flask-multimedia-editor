// ============================================================================
// ⚠️  BLINDADO / NO MODIFICAR SIN AUTORIZACIÓN ⚠️
// ============================================================================
// globalMute.js — Mute global de todas las pistas
//
// Archivo INDEPENDIENTE. No toca ni modifica trackMute.js ni ningún otro archivo.
// Solo controla el botón #btn-volume-control de la barra de herramientas.
//
// ────────────────────────────────────────────────────────────────────────────
// FUNCIONALIDAD:
// ────────────────────────────────────────────────────────────────────────────
//   - Click en #btn-volume-control: silencia/desilencia TODAS las pistas
//   - Es INDEPENDIENTE de los botones de mute individuales de cada track
//   - Al ACTIVAR: todas las pistas se silencian + iconos de tracks muestran mute
//   - Al DESACTIVAR: las pistas vuelven a su estado individual
//
// ────────────────────────────────────────────────────────────────────────────
// SINCRONIZACIÓN CON TRACKS INDIVIDUALES:
// ────────────────────────────────────────────────────────────────────────────
//   1. Al activar mute global:
//      - muteAllTracks() setea TODOS los .track-mute-btn a data-muted=true
//      - Los iconos de cada track cambian a bi-volume-mute rojo
//      - El #btn-volume del previsualizador también se sincroniza
//      - El loop enforce muted=true en todos los elementos cada frame
//
//   2. Al desmutear un track individual mientras el global está activo:
//      - El loop (globalMuteEnforceLoop) detecta que un .track-mute-btn
//        tiene data-muted=false
//      - AUTOMÁTICAMENTE desactiva el mute global (globalMuted = false)
//      - El botón #btn-volume-control vuelve a bi-volume-up
//      - Ese track suena (trackMute.js lo reproduce)
//      - Los demás tracks quedan muteados (su data-muted sigue en true)
//
//   3. Al desactivar mute global (click en botón):
//      - NO cambia el estado individual de los tracks
//      - Cada track mantiene el data-muted que tenía
//      - trackMute.js toma el control del mute individual normalmente
//
// ────────────────────────────────────────────────────────────────────────────
// IDs Y CLASES QUE USA (NO cambiar sin actualizar también el HTML):
// ────────────────────────────────────────────────────────────────────────────
//   - #btn-volume-control: botón en la barra de herramientas del timeline
//     (HTML, entre #btn-speed-control y #btn-add-text, línea ~290)
//     Icono: <i class="bi bi-volume-up">
//     Al mutear: icono cambia a <i class="bi bi-volume-mute"> color rojo #e53e3e
//     Tooltip: "Mute global" / "Desmutear todo"
//     dataset: globalMuted = "true" / "false"
//
//   - .track-mute-btn: botones de mute individuales de cada track
//     Creados por trackControls.js
//     Este archivo los lee/modifica para sincronizar el estado global
//     dataset: muted = "true" / "false" (compartido con trackMute.js)
//
//   - #btn-volume: icono de mute del previsualizador (es un <i>)
//     Creado por previewControls.js
//     Este archivo lo sincroniza al activar mute global
//     dataset: muted = "true" / "false" (compartido con trackMute.js)
//
//   - #video-player: elemento <video> del track 1 (HTML)
//   - overlayState: variable global de multiVideoPreview.js (tracks 2+)
//   - .track-track[id^="audio-track"]: pistas de audio
//   - window.setTrackMuted(): función de audioPlaybackSync.js
//
// ────────────────────────────────────────────────────────────────────────────
// DEPENDENCIAS:
// ────────────────────────────────────────────────────────────────────────────
//   - Ninguna directa. No importa ni llama funciones de trackMute.js.
//   - Usa su propia variable globalMuted (no compartida)
//   - El loop requestAnimationFrame enforce el mute global cada frame
//   - Lee overlayState de multiVideoPreview.js (typeof check para seguridad)
//   - Llama window.setTrackMuted de audioPlaybackSync.js (typeof check)
//
// ────────────────────────────────────────────────────────────────────────────
// ARCHIVOS QUE NO DEBEN TOCAR #btn-volume-control:
// ────────────────────────────────────────────────────────────────────────────
//   - videoEditor.js: NO debe agregar #btn-volume-control a setupEditingTools()
//     ni a toolNames. (Removido. Si se vuelve a agregar, mostrará alert)
//   - trackMute.js: NO controla este botón. Solo controla #btn-volume y
//     .track-mute-btn individuales.
//   - Ningún otro archivo debe agregar event listeners a #btn-volume-control.
//     Este archivo usa event delegation en document para capturar el click.
//
// ────────────────────────────────────────────────────────────────────────────
// INTERACCIÓN CON trackMute.js:
// ────────────────────────────────────────────────────────────────────────────
//   - trackMute.js controla el mute INDIVIDUAL de cada track (.track-mute-btn)
//   - globalMute.js controla el mute GLOBAL (#btn-volume-control)
//   - Ambos leen/escriben data-muted en .track-mute-btn (compartido)
//   - Cuando globalMute activa, setea todos los data-muted=true
//   - Cuando el usuario desmutea un track (vía trackMute.js), el loop de
//     globalMute detecta el cambio y desactiva el global automáticamente
//   - NO hay conflicto porque globalMute solo escribe cuando globalMuted=true
//
// ────────────────────────────────────────────────────────────────────────────
// VARIABLE GLOBAL:
// ────────────────────────────────────────────────────────────────────────────
//   - globalMuted: boolean. true = todas las pistas silenciadas
//     Independiente del estado de mute individual de cada track.
//     Se desactiva automáticamente cuando un track es desmuteado individualmente.
// ============================================================================

// ⚠️ NO RENOMBRAR. Es la variable de estado del mute global.
// ⚠️ NO inicializar en true. Debe empezar en false (sin mute global).
var globalMuted = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalMute);
} else {
    initGlobalMute();
}

// ---------------------------------------------------------------------------
// initGlobalMute()
// ---------------------------------------------------------------------------
// Inicializa el mute global. Enlaza #btn-volume-control con event delegation.
// Usa event delegation en document para no perder el listener si otro script
// clona o reemplaza el botón.
//
// Pasos:
//   1. Registrar event delegation en document para clicks en #btn-volume-control
//   2. Inicializar dataset.globalMuted = 'false' y tooltip del botón
//   3. Iniciar loop globalMuteEnforceLoop con requestAnimationFrame
// ---------------------------------------------------------------------------
function initGlobalMute() {
    // ⚠️ Event delegation: captura clicks en #btn-volume-control desde document
    // Esto sobrevive a clonaciones/reemplazos del botón por otros scripts
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('#btn-volume-control');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            toggleGlobalMute();
        }
    });

    // Inicializar dataset e icono del botón
    var btn = document.getElementById('btn-volume-control');
    if (btn) {
        btn.dataset.globalMuted = 'false';
        btn.title = 'Mute global';
    }

    // Iniciar loop de enforcement (corre cada frame)
    requestAnimationFrame(globalMuteEnforceLoop);

    console.log('globalMute inicializado (botón #btn-volume-control)');
}

// ---------------------------------------------------------------------------
// toggleGlobalMute()
// ---------------------------------------------------------------------------
// Alterna el mute global entre true y false.
//
// Al ACTIVAR (globalMuted = true):
//   - Setea TODOS los .track-mute-btn a data-muted=true
//   - Actualiza los iconos de cada track para mostrar mute
//   - El botón #btn-volume-control muestra icono de mute
//
// Al DESACTIVAR (globalMuted = false):
//   - Setea TODOS los .track-mute-btn a data-muted=false
//   - Actualiza los iconos de cada track para mostrar volumen normal
//   - El botón #btn-volume-control muestra icono de volumen normal
// ---------------------------------------------------------------------------
function toggleGlobalMute() {
    globalMuted = !globalMuted;
    updateGlobalMuteButton(globalMuted);

    if (globalMuted) {
        // Mute TODOS los tracks individualmente para que sus iconos reflejen el mute
        muteAllTracks();
    } else {
        // Desmute TODOS los tracks individualmente para que sus iconos reflejen volumen
        unmuteAllTracks();
    }

    console.log('globalMute:', globalMuted ? 'TODAS las pistas silenciadas' : 'mute global desactivado');
}

// ---------------------------------------------------------------------------
// muteAllTracks()
// ---------------------------------------------------------------------------
// Setea data-muted=true en TODOS los .track-mute-btn y actualiza sus iconos.
// Esto hace que los iconos de cada track muestren el estado de mute.
//
// También sincroniza el #btn-volume del previsualizador (icono de track 1).
//
// Elementos que modifica:
//   - .track-mute-btn (todos): dataset.muted = 'true', innerHTML = icono mute
//   - #btn-volume: dataset.muted = 'true', className = 'bi bi-volume-mute'
//
// ⚠️ Esta función es llamada SOLO desde toggleGlobalMute() cuando se activa.
//    No debe llamarse desde ningún otro lugar.
// ---------------------------------------------------------------------------
function muteAllTracks() {
    // Mutear todos los botones de track individuales
    var muteBtns = document.querySelectorAll('.track-mute-btn');
    muteBtns.forEach(function(btn) {
        btn.dataset.muted = 'true';
        btn.innerHTML = '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>';
    });

    // Sincronizar el #btn-volume del previsualizador (es un <i>, no un <button>)
    // ⚠️ #btn-volume es un <i> creado por previewControls.js
    //    Cambiar className directamente (no innerHTML) porque es un icono
    var volBtn = document.getElementById('btn-volume');
    if (volBtn) {
        volBtn.dataset.muted = 'true';
        volBtn.className = 'bi bi-volume-mute';
        if (volBtn.style) volBtn.style.color = '#e53e3e';
    }

    console.log('globalMute: todos los tracks muteados');
}

// ---------------------------------------------------------------------------
// unmuteAllTracks()
// ---------------------------------------------------------------------------
// Setea data-muted=false en TODOS los .track-mute-btn y actualiza sus iconos.
// Esto hace que los iconos de cada track muestren volumen normal.
//
// También sincroniza el #btn-volume del previsualizador (icono de track 1).
//
// Elementos que modifica:
//   - .track-mute-btn (todos): dataset.muted = 'false', innerHTML = icono volumen
//   - #btn-volume: dataset.muted = 'false', className = 'bi bi-volume-up'
//
// ⚠️ Esta función es llamada SOLO desde toggleGlobalMute() cuando se desactiva.
//    No debe llamarse desde ningún otro lugar.
// ---------------------------------------------------------------------------
function unmuteAllTracks() {
    // Desmutear todos los botones de track individuales
    var muteBtns = document.querySelectorAll('.track-mute-btn');
    muteBtns.forEach(function(btn) {
        btn.dataset.muted = 'false';
        btn.innerHTML = '<i class="bi bi-volume-up"></i>';
    });

    // Sincronizar el #btn-volume del previsualizador (es un <i>, no un <button>)
    var volBtn = document.getElementById('btn-volume');
    if (volBtn) {
        volBtn.dataset.muted = 'false';
        volBtn.className = 'bi bi-volume-up';
        if (volBtn.style) volBtn.style.color = '';
    }

    console.log('globalMute: todos los tracks desmuteados');
}

// ---------------------------------------------------------------------------
// updateGlobalMuteButton(isMuted)
// ---------------------------------------------------------------------------
// Actualiza el icono y tooltip del botón #btn-volume-control.
//
// Parámetros:
//   - isMuted: boolean. true = mostrar icono de mute, false = icono normal
//
// Elementos que modifica:
//   - #btn-volume-control: innerHTML (icono), title (tooltip), dataset.globalMuted
//
// ⚠️ Llamada desde:
//   - toggleGlobalMute(): al activar/desactivar manualmente
//   - globalMuteEnforceLoop(): al desactivar automáticamente cuando un track
//     es desmuteado individualmente
// ---------------------------------------------------------------------------
function updateGlobalMuteButton(isMuted) {
    var btn = document.getElementById('btn-volume-control');
    if (!btn) return;
    btn.dataset.globalMuted = isMuted ? 'true' : 'false';
    btn.innerHTML = isMuted
        ? '<i class="bi bi-volume-mute" style="color:#e53e3e;"></i>'
        : '<i class="bi bi-volume-up"></i>';
    btn.title = isMuted ? 'Desmutear todo' : 'Mute global';
}

// ---------------------------------------------------------------------------
// globalMuteEnforceLoop()
// ---------------------------------------------------------------------------
// Loop con requestAnimationFrame. Corre cada frame (60fps).
//
// Tiene DOS funciones principales:
//
//   1. DETECCIÓN DE DESMUTEO INDIVIDUAL:
//      Si globalMuted es true pero algún .track-mute-btn tiene data-muted=false,
//      significa que el usuario desmuteó un track individual.
//      → Desactiva el mute global automáticamente (globalMuted = false)
//      → Actualiza el icono del botón #btn-volume-control
//      → Ese track sonará (trackMute.js lo maneja con su data-muted=false)
//      → Los demás tracks quedan muteados (su data-muted sigue en true)
//
//   2. ENFORCE DE MUTE:
//      Si globalMuted es true y todos los tracks están muteados:
//      → Fuerza muted=true en #video-player (track 1)
//      → Fuerza muted=true en overlayState[trackId].videoEl (tracks 2+)
//      → Fuerza setTrackMuted(track.id, true) en pistas de audio
//      Esto es necesario porque otros loops (trackMute.js, código blindado)
//      pueden setear muted=false en clips, sobrescribiendo el mute global.
//
// Cuando globalMuted es false, el loop NO hace nada. Los otros archivos
// (trackMute.js, multiVideoPreview.js) controlan el mute individual.
// ---------------------------------------------------------------------------
function globalMuteEnforceLoop() {
    try {
        if (globalMuted) {
            // === 1. Detectar si algún track fue desmuteado individualmente ===
            // Recorrer todos los .track-mute-btn y buscar alguno con data-muted=false
            var muteBtns = document.querySelectorAll('.track-mute-btn');
            var anyUnmuted = false;
            muteBtns.forEach(function(btn) {
                if (btn.dataset.muted === 'false') {
                    anyUnmuted = true;
                }
            });

            if (anyUnmuted) {
                // ⚠️ Un track fue desmuteado individualmente.
                // Desactivar el mute global automáticamente.
                // Ese track sonará, los demás quedan muteados.
                globalMuted = false;
                updateGlobalMuteButton(false);
                console.log('globalMute: desactivado porque un track fue desmuteado individualmente');
            } else {
                // === 2. Enforce mute en todos los elementos ===
                // Track 1 (video-track) → #video-player (HTML, id="video-player")
                var vp = document.getElementById('video-player');
                if (vp) {
                    vp.muted = true;
                }

                // Tracks 2+ (video-track-2, etc.) → overlays
                // ⚠️ overlayState es variable global de multiVideoPreview.js
                if (typeof overlayState !== 'undefined') {
                    Object.keys(overlayState).forEach(function(trackId) {
                        if (overlayState[trackId] && overlayState[trackId].videoEl) {
                            overlayState[trackId].videoEl.muted = true;
                        }
                    });
                }

                // Audio tracks → silenciar
                // ⚠️ window.setTrackMuted es función de audioPlaybackSync.js
                var audioTracks = document.querySelectorAll('.track-track[id^="audio-track"]');
                audioTracks.forEach(function(track) {
                    if (typeof window.setTrackMuted === 'function') {
                        window.setTrackMuted(track.id, true);
                    }
                });
            }
        }
    } catch (err) {
        // Silenciar errores para no romper el loop
    }

    requestAnimationFrame(globalMuteEnforceLoop);
}
