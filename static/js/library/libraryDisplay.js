async function loadLibraryFiles(filterType = '') {
    let url = '/library/files';
    const params = new URLSearchParams();
    
    if (filterType) params.append('type', filterType);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    console.log('Cargando archivos de biblioteca desde:', url);
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        console.log('Respuesta de biblioteca:', result);
        
        if (result.success) {
            displayLibraryFiles(result.files);
        } else {
            console.error('Error cargando archivos:', result.error);
        }
    } catch (error) {
        console.error('Error cargando archivos:', error);
    }
}

function displayLibraryFiles(files) {
    const grid = document.getElementById('library-files-grid');
    if (!grid) {
        console.error('No se encontró el grid de biblioteca');
        return;
    }
    
    console.log('Grid encontrado:', grid);
    console.log('Grid styles:', window.getComputedStyle(grid));
    
    grid.innerHTML = '';
    
    if (files.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-white-50 py-4">No hay archivos en la biblioteca</div>';
        return;
    }
    
    console.log(`Mostrando ${files.length} archivos en la biblioteca`);
    files.forEach((file, index) => {
        console.log(`Archivo ${index}:`, file);
        const card = createFileCard(file);
        grid.appendChild(card);
        console.log(`Card ${index} agregada al grid`);
    });
    
    console.log('Archivos agregados al grid. Grid children:', grid.children.length);
}

function createFileCard(file) {
    const card = document.createElement('div');
    card.style.width = '100%';
    card.style.minWidth = '120px';
    card.style.maxWidth = '200px';
    card.style.margin = '4px';
    card.style.padding = '8px';
    card.style.backgroundColor = '#2a2a2a';
    card.style.border = '1px solid #666';
    card.style.borderRadius = '4px';
    card.style.display = 'inline-block';
    card.style.verticalAlign = 'top';
    card.style.cursor = 'grab';
    card.dataset.fileId = file.id;
    card.dataset.filename = file.filename;
    card.dataset.fileType = file.file_type;
    card.dataset.originalPath = file.original_path;
    card.draggable = true;
    
    const statusBadge = getStatusBadge(file.conversion_status);
    const thumbnail = getThumbnail(file);
    
    card.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                <input type="checkbox" class="file-checkbox" 
                       data-file-id="${file.id}" ${selectedFiles.has(file.id) ? 'checked' : ''}>
                ${statusBadge}
            </div>
            <div style="height: 60px; border: 1px solid #444; border-radius: 4px; overflow: hidden; background: #1a1a1a; display: flex; align-items: center; justify-content: center;">
                ${thumbnail}
            </div>
            <div style="font-size: 10px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${file.filename}">
                ${file.filename}
            </div>
            <div style="font-size: 9px; color: #aaa;">
                ${formatFileSize(file.file_size)} • ${file.file_type.toUpperCase()}
            </div>
            ${file.conversion_status === 'converting' ? `
                <div style="height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; background: #0d6efd; width: ${file.conversion_progress}%"></div>
                </div>
                <div style="font-size: 9px; color: #aaa;">${file.conversion_progress.toFixed(1)}%</div>
            ` : ''}
        </div>
    `;
    
    // Drag events
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            fileId: file.id,
            filename: file.filename,
            fileType: file.file_type,
            originalPath: file.original_path
        }));
        card.style.opacity = '0.5';
    });
    
    card.addEventListener('dragend', () => {
        card.style.opacity = '1';
    });
    
    // Context menu event
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, file);
    });
    
    // Double click event to add to timeline
    card.addEventListener('dblclick', (e) => {
        e.preventDefault();
        addFileToTimelineByType(file);
    });
    
    // Checkbox event
    const checkbox = card.querySelector('.file-checkbox');
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectedFiles.add(file.id);
        } else {
            selectedFiles.delete(file.id);
        }
    });
    
    return card;
}

function getThumbnail(file) {
    if (file.file_type === 'image') {
        return `<img src="${file.original_path}" class="w-100 h-100 object-cover" alt="${file.filename}">`;
    } else if (file.file_type === 'video') {
        return `<div class="w-100 h-100 d-flex align-items-center justify-content-center">
            <i class="bi bi-camera-video fs-3 text-white-50"></i>
        </div>`;
    } else if (file.file_type === 'audio') {
        return `<div class="w-100 h-100 d-flex align-items-center justify-content-center">
            <i class="bi bi-music-note-beamed fs-3 text-white-50"></i>
        </div>`;
    }
    return `<div class="w-100 h-100 d-flex align-items-center justify-content-center">
        <i class="bi bi-file-earmark fs-3 text-white-50"></i>
    </div>`;
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-secondary">Pendiente</span>',
        'converting': '<span class="badge bg-warning">Convirtiendo</span>',
        'completed': '<span class="badge bg-success">Completado</span>',
        'failed': '<span class="badge bg-danger">Fallido</span>'
    };
    
    return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
