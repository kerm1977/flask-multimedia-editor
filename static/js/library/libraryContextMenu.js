function initContextMenu() {
    let contextMenu = document.getElementById('context-menu');
    
    if (!contextMenu) {
        contextMenu = document.createElement('div');
        contextMenu.id = 'context-menu';
        contextMenu.className = 'context-menu';
        contextMenu.style.display = 'none';
        contextMenu.style.position = 'fixed';
        contextMenu.style.background = '#2a2a2a';
        contextMenu.style.border = '1px solid #666';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.padding = '4px 0';
        contextMenu.style.minWidth = '150px';
        contextMenu.style.zIndex = '9999';
        contextMenu.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        
        const convertItem = document.createElement('div');
        convertItem.id = 'ctx-convert';
        convertItem.className = 'context-menu-item';
        convertItem.style.padding = '8px 16px';
        convertItem.style.cursor = 'pointer';
        convertItem.style.color = 'white';
        convertItem.style.fontSize = '13px';
        convertItem.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Convertir';
        
        const deleteItem = document.createElement('div');
        deleteItem.id = 'ctx-delete';
        deleteItem.className = 'context-menu-item';
        deleteItem.style.padding = '8px 16px';
        deleteItem.style.cursor = 'pointer';
        deleteItem.style.color = 'white';
        deleteItem.style.fontSize = '13px';
        deleteItem.innerHTML = '<i class="bi bi-trash me-2"></i>Eliminar';
        
        contextMenu.appendChild(convertItem);
        contextMenu.appendChild(deleteItem);
        document.body.appendChild(contextMenu);
    }
    
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });
    
    document.getElementById('ctx-convert')?.addEventListener('click', () => {
        if (contextMenuTargetFile) {
            convertSingleFile(contextMenuTargetFile);
        }
        contextMenu.style.display = 'none';
    });
    
    document.getElementById('ctx-delete')?.addEventListener('click', () => {
        if (contextMenuTargetFile) {
            deleteSingleFile(contextMenuTargetFile);
        }
        contextMenu.style.display = 'none';
    });
    
    const menuItems = contextMenu.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#3a3a3a';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = '';
        });
    });
}

function showContextMenu(e, file) {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) {
        console.error('No se encontró el menú contextual');
        return;
    }
    
    contextMenuTargetFile = file;
    
    const x = e.clientX;
    const y = e.clientY;
    
    const menuWidth = 150;
    const menuHeight = 80;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let finalX = x;
    let finalY = y;
    
    if (x + menuWidth > windowWidth) {
        finalX = windowWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > windowHeight) {
        finalY = windowHeight - menuHeight - 10;
    }
    
    contextMenu.style.left = finalX + 'px';
    contextMenu.style.top = finalY + 'px';
    contextMenu.style.display = 'block';
    contextMenu.style.zIndex = '9999';
    
    console.log('Menú contextual mostrado para:', file.filename);
}
