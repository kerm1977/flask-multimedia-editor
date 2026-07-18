// ============================================================================
// Gestión de pistas adicionales (hasta 5 por tipo: Video, Audio, Imágenes,
// Efectos). Archivo totalmente independiente: no modifica timelinePlayhead.js
// ni ningún otro archivo blindado.
//
// Dos formas de agregar pistas:
//   1. Botón "+" visible al lado de cada grupo de pistas.
//   2. Menú contextual (click derecho) sobre el área de pistas.
//
// Cada pista nueva recibe un ID único: video-track-2, audio-track-3, etc.
// Las pistas nuevas son funcionales para drag & drop de clips porque usan
// la misma estructura DOM (track-row > track-label + track-track) y la
// misma clase .timeline-clip que el resto del sistema.
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initTimelineMultiTracks();
});

const MAX_TRACKS_PER_TYPE = 3;
const TRACK_TYPES = {
    video:   { icon: 'bi-camera-video', label: 'Video',    baseId: 'video-track' },
    audio:   { icon: 'bi-music-note',   label: 'Audio',    baseId: 'audio-track' }
};

// Track counters per type (start at 1 since the original track is #1)
const trackCounters = { video: 1, audio: 1 };

function initTimelineMultiTracks() {
    relabelOriginalTracks();
    addPlusButtons();
    initContextMenu();
    console.log('Sistema de pistas múltiples inicializado');
}

// ---------------------------------------------------------------------------
// Relabel original tracks: icon + number only (no redundant text)
// ---------------------------------------------------------------------------
function relabelOriginalTracks() {
    Object.keys(TRACK_TYPES).forEach(type => {
        const config = TRACK_TYPES[type];
        const track = document.getElementById(config.baseId);
        if (!track) return;

        const row = track.closest('.track-row');
        if (!row) return;

        const label = row.querySelector('.track-label');
        if (!label) return;

        // Remove the <small> with the text label from inside track-label
        const small = label.querySelector('small');
        if (small) {
            small.remove();
        }

        // Create a separate number badge to the LEFT of the track-label
        const numBadge = document.createElement('span');
        numBadge.className = 'track-number-badge';
        numBadge.textContent = '1';
        numBadge.style.cssText =
            'display:flex;align-items:center;justify-content:center;' +
            'width:20px;height:60px;flex-shrink:0;' +
            'font-size:13px;font-weight:bold;color:#8899aa;' +
            'background:transparent;border:none;';

        // Insert the number badge before the track-label in the row
        row.insertBefore(numBadge, label);
    });
}

// ---------------------------------------------------------------------------
// Botones "+" para agregar pistas
// ---------------------------------------------------------------------------
function addPlusButtons() {
    const tracksContainer = document.querySelector('.tracks-container');
    if (!tracksContainer) return;

    // Insert a "+" button row after each existing track type group
    Object.keys(TRACK_TYPES).forEach(type => {
        const config = TRACK_TYPES[type];
        const existingTrack = document.getElementById(config.baseId);
        if (!existingTrack) return;

        const trackRow = existingTrack.closest('.track-row');
        if (!trackRow) return;

        // Create "+" button in the track-label area
        const trackLabel = trackRow.querySelector('.track-label');
        if (!trackLabel) return;

        const plusBtn = document.createElement('button');
        plusBtn.className = 'btn btn-sm btn-outline-light w-100 mt-1 add-track-btn';
        plusBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
        plusBtn.style.fontSize = '10px';
        plusBtn.style.padding = '1px 4px';
        plusBtn.title = 'Agregar pista de ' + config.label;
        plusBtn.dataset.trackType = type;

        plusBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addTrackOfType(type);
        });

        trackLabel.appendChild(plusBtn);
    });
}

// ---------------------------------------------------------------------------
// Menú contextual (click derecho sobre tracks-container)
// ---------------------------------------------------------------------------
function initContextMenu() {
    const tracksContainer = document.querySelector('.tracks-container');
    if (!tracksContainer) return;

    tracksContainer.addEventListener('contextmenu', function(e) {
        // Only show custom menu if right-clicking on empty area (not on a clip)
        if (e.target.closest('.timeline-clip')) return;

        e.preventDefault();
        showTrackContextMenu(e.clientX, e.clientY);
    });

    // Close menu on any left click elsewhere
    document.addEventListener('click', function() {
        removeTrackContextMenu();
    });
}

function showTrackContextMenu(x, y) {
    removeTrackContextMenu();

    const menu = document.createElement('div');
    menu.id = 'track-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.zIndex = '10000';
    menu.style.background = '#1a202c';
    menu.style.border = '1px solid #4a5568';
    menu.style.borderRadius = '6px';
    menu.style.padding = '4px 0';
    menu.style.minWidth = '160px';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

    const header = document.createElement('div');
    header.textContent = 'Agregar pista';
    header.style.padding = '6px 14px';
    header.style.fontSize = '11px';
    header.style.color = '#8899aa';
    header.style.borderBottom = '1px solid #333';
    header.style.marginBottom = '4px';
    menu.appendChild(header);

    Object.keys(TRACK_TYPES).forEach(type => {
        const config = TRACK_TYPES[type];
        const remaining = MAX_TRACKS_PER_TYPE - trackCounters[type];
        const disabled = remaining <= 0;

        const item = document.createElement('div');
        item.style.padding = '6px 14px';
        item.style.cursor = disabled ? 'default' : 'pointer';
        item.style.color = disabled ? '#555' : '#fff';
        item.style.fontSize = '13px';
        item.innerHTML = '<i class="bi ' + config.icon + ' me-2"></i>' + config.label +
                         (disabled ? ' (máx)' : ' <span class="text-white-50 small">(' + remaining + ' restantes)</span>');

        if (!disabled) {
            item.addEventListener('mouseenter', function() {
                item.style.background = '#2d3748';
            });
            item.addEventListener('mouseleave', function() {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                addTrackOfType(type);
                removeTrackContextMenu();
            });
        }

        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Adjust position if menu overflows viewport
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
}

function removeTrackContextMenu() {
    const existing = document.getElementById('track-context-menu');
    if (existing) existing.remove();
}

// ---------------------------------------------------------------------------
// Creación de pistas nuevas
// ---------------------------------------------------------------------------
function addTrackOfType(type) {
    const config = TRACK_TYPES[type];
    if (!config) return;

    if (trackCounters[type] >= MAX_TRACKS_PER_TYPE) {
        console.log('Máximo de ' + MAX_TRACKS_PER_TYPE + ' pistas de ' + config.label + ' alcanzado');
        return;
    }

    trackCounters[type]++;
    const newTrackId = config.baseId + '-' + trackCounters[type];

    const tracksContainer = document.querySelector('.tracks-container');
    if (!tracksContainer) return;

    // Find the last track-row of this type to insert after it
    const allRows = Array.from(tracksContainer.querySelectorAll('.track-row'));
    let insertAfter = null;

    // Find the last row whose track ID starts with this type's baseId
    for (let i = allRows.length - 1; i >= 0; i--) {
        const trackEl = allRows[i].querySelector('.track-track');
        if (trackEl && trackEl.id && trackEl.id.startsWith(config.baseId)) {
            insertAfter = allRows[i];
            break;
        }
    }

    // Build the new track row
    const newRow = document.createElement('div');
    newRow.className = 'track-row d-flex align-items-center gap-2';

    // Number badge to the LEFT of the track-label (outside it)
    const numBadge = document.createElement('span');
    numBadge.className = 'track-number-badge';
    numBadge.textContent = trackCounters[type];
    numBadge.style.cssText =
        'display:flex;align-items:center;justify-content:center;' +
        'width:20px;height:60px;flex-shrink:0;' +
        'font-size:13px;font-weight:bold;color:#8899aa;' +
        'background:transparent;border:none;';

    const label = document.createElement('div');
    label.className = 'track-label bg-dark rounded p-2 text-center';
    label.style.width = '80px';
    label.innerHTML =
        '<i class="bi ' + config.icon + '"></i>';

    // Add a remove button for extra tracks (not the original)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-outline-danger w-100 mt-1';
    removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
    removeBtn.style.fontSize = '10px';
    removeBtn.style.padding = '1px 4px';
    removeBtn.title = 'Eliminar esta pista';
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeTrack(newRow, newTrackId, type);
    });
    label.appendChild(removeBtn);

    const track = document.createElement('div');
    track.className = 'track-track flex-grow-1 bg-dark rounded p-2 position-relative';
    track.style.height = '60px';
    track.id = newTrackId;

    newRow.appendChild(numBadge);
    newRow.appendChild(label);
    newRow.appendChild(track);

    if (insertAfter && insertAfter.nextSibling) {
        tracksContainer.insertBefore(newRow, insertAfter.nextSibling);
    } else if (insertAfter) {
        tracksContainer.appendChild(newRow);
    } else {
        tracksContainer.appendChild(newRow);
    }

    // Enable drag & drop on the new track (same as initTimelineDropZones)
    enableDragDropOnTrack(track);

    // Enable click-to-select-all on the new track label (timelineSelectTrackByLabel.js)
    enableLabelClickSelect(track);

    console.log('Pista agregada:', newTrackId, '(' + config.label + ' ' + trackCounters[type] + '/' + MAX_TRACKS_PER_TYPE + ')');
}

function removeTrack(row, trackId, type) {
    const config = TRACK_TYPES[type];
    if (!config) return;

    const track = row.querySelector('.track-track');
    if (!track) return;

    const clips = track.querySelectorAll('.timeline-clip');
    const clipCount = clips.length;

    showDeleteTrackModal(config, trackId, clipCount, function() {
        if (clipCount > 0 && typeof saveTimelineState === 'function') {
            saveTimelineState();
        }
        row.remove();
        // Decrementar el contador para permitir crear pistas nuevas
        if (typeof trackCounters !== 'undefined' && trackCounters[type] > 1) {
            trackCounters[type]--;
        }
        console.log('Pista eliminada:', trackId, 'Contador ahora:', trackCounters[type]);
    });
}

// ---------------------------------------------------------------------------
// Modal de confirmación para eliminar pista completa
// ---------------------------------------------------------------------------
function showDeleteTrackModal(config, trackId, clipCount, onConfirm) {
    // Remove any existing modal
    const existing = document.getElementById('delete-track-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'delete-track-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.zIndex = '10001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const dialog = document.createElement('div');
    dialog.style.background = '#1a202c';
    dialog.style.border = '1px solid #4a5568';
    dialog.style.borderRadius = '10px';
    dialog.style.padding = '24px';
    dialog.style.maxWidth = '380px';
    dialog.style.width = '90%';
    dialog.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6)';
    dialog.style.color = '#fff';

    const icon = document.createElement('div');
    icon.style.textAlign = 'center';
    icon.style.marginBottom = '16px';
    icon.innerHTML = '<i class="bi ' + config.icon + '" style="font-size: 32px; color: #e53e3e;"></i>';
    dialog.appendChild(icon);

    const title = document.createElement('h6');
    title.style.textAlign = 'center';
    title.style.marginBottom = '12px';
    title.style.fontWeight = 'bold';
    title.textContent = 'Eliminar pista';
    dialog.appendChild(title);

    const msg = document.createElement('p');
    msg.style.textAlign = 'center';
    msg.style.fontSize = '14px';
    msg.style.color = '#cbd5e0';
    msg.style.marginBottom = '20px';
    msg.innerHTML =
        '¿Seguro que deseas eliminar esta pista? <br>' +
        '<strong style="color:#e53e3e;">Se perderá todo su contenido</strong>' +
        (clipCount > 0 ? ' (' + clipCount + ' clip' + (clipCount > 1 ? 's' : '') + ')' : '') +
        '.';
    dialog.appendChild(msg);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '12px';
    btnRow.style.justifyContent = 'center';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-outline-light';
    cancelBtn.style.fontSize = '13px';
    cancelBtn.style.padding = '6px 20px';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', function() {
        modal.remove();
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-danger';
    confirmBtn.style.fontSize = '13px';
    confirmBtn.style.padding = '6px 20px';
    confirmBtn.innerHTML = '<i class="bi bi-trash me-1"></i>Eliminar';
    confirmBtn.addEventListener('click', function() {
        modal.remove();
        onConfirm();
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    dialog.appendChild(btnRow);
    modal.appendChild(dialog);

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });

    // Close on Escape
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') modal.remove();
    });

    document.body.appendChild(modal);
    cancelBtn.focus();
}

// ---------------------------------------------------------------------------
// Integración con sistemas existentes (sin modificarlos)
// ---------------------------------------------------------------------------
function enableDragDropOnTrack(track) {
    track.addEventListener('dragover', function(e) {
        e.preventDefault();
        track.style.backgroundColor = '#3a3a3a';
    });

    track.addEventListener('dragleave', function() {
        track.style.backgroundColor = '';
    });

    track.addEventListener('drop', function(e) {
        e.preventDefault();
        track.style.backgroundColor = '';

        try {
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);
            if (typeof addClipToTimeline === 'function') {
                addClipToTimeline(data, track);
            }
        } catch (error) {
            console.error('Error al procesar drop en pista nueva:', error);
        }
    });
}

function enableLabelClickSelect(track) {
    if (typeof selectAllClipsInTrack !== 'function') return;

    const row = track.closest('.track-row');
    if (!row) return;

    const label = row.querySelector('.track-label');
    if (!label) return;

    label.style.cursor = 'pointer';
    label.addEventListener('click', function(e) {
        if (e.target.closest('button')) return; // Don't trigger on button clicks
        e.preventDefault();
        e.stopPropagation();
        selectAllClipsInTrack(track);
    });
}
