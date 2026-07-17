document.addEventListener('DOMContentLoaded', function() {
    initDraggablePanels();
});

function initDraggablePanels() {
    const panels = document.querySelectorAll('.draggable-panel');
    
    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        if (!header) return;
        
        // Add collapse button to header
        addCollapseButton(panel, header);
        
        // Add resize handle
        addResizeHandle(panel);
        
        header.style.cursor = 'grab';
        
        header.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('bi-grip-vertical')) {
                startDrag(e, panel);
            }
        });
    });
    
    const resetBtn = document.getElementById('btn-reset-layout');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetLayout);
    }
    
    console.log('Paneles arrastrables inicializados');
}

function addCollapseButton(panel, header) {
    // Check if collapse button already exists
    if (header.querySelector('.collapse-btn')) return;
    
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn btn btn-sm btn-outline-light ms-2';
    collapseBtn.innerHTML = '<i class="bi bi-dash"></i>';
    collapseBtn.style.padding = '2px 6px';
    collapseBtn.style.fontSize = '12px';
    
    collapseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        togglePanelCollapse(panel, collapseBtn);
    });
    
    header.appendChild(collapseBtn);
}

function togglePanelCollapse(panel, btn) {
    const content = panel.querySelector('.panel-content') || panel.children[1];
    if (!content) return;
    
    const isCollapsed = panel.dataset.collapsed === 'true';
    
    if (isCollapsed) {
        content.style.display = '';
        panel.dataset.collapsed = 'false';
        btn.innerHTML = '<i class="bi bi-dash"></i>';
    } else {
        content.style.display = 'none';
        panel.dataset.collapsed = 'true';
        btn.innerHTML = '<i class="bi bi-plus"></i>';
    }
    
    savePanelState(panel);
}

function addResizeHandle(panel) {
    // Check if resize handle already exists
    if (panel.querySelector('.resize-handle')) return;
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '15px';
    resizeHandle.style.height = '15px';
    resizeHandle.style.cursor = 'se-resize';
    resizeHandle.style.background = 'linear-gradient(135deg, transparent 50%, #666 50%)';
    resizeHandle.style.borderRadius = '0 0 4px 0';
    
    resizeHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        startResize(e, panel);
    });
    
    panel.style.position = 'relative';
    panel.appendChild(resizeHandle);
}

function startResize(e, panel) {
    const startX = e.clientX;
    const startY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    
    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newWidth = Math.max(200, startWidth + deltaX);
        const newHeight = Math.max(150, startHeight + deltaY);
        
        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';
    }
    
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        savePanelState(panel);
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startDrag(e, panel) {
    e.preventDefault();
    
    const header = panel.querySelector('.panel-header');
    header.style.cursor = 'grabbing';
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;
    
    const parent = panel.parentElement;
    const parentRect = parent.getBoundingClientRect();
    
    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;
        
        newLeft = Math.max(0, Math.min(newLeft, parentRect.width - rect.width));
        newTop = Math.max(0, Math.min(newTop, parentRect.height - rect.height));
        
        panel.style.position = 'absolute';
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        panel.style.zIndex = '1000';
    }
    
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        header.style.cursor = 'grab';
        panel.style.zIndex = '';
        
        savePanelState(panel);
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function savePanelState(panel) {
    const panelId = panel.id;
    const state = {
        left: panel.style.left,
        top: panel.style.top,
        width: panel.style.width,
        height: panel.style.height,
        collapsed: panel.dataset.collapsed
    };
    
    localStorage.setItem(`panel_${panelId}_state`, JSON.stringify(state));
}

function loadPanelStates() {
    const panels = document.querySelectorAll('.draggable-panel');
    
    panels.forEach(panel => {
        const panelId = panel.id;
        const stateStr = localStorage.getItem(`panel_${panelId}_state`);
        
        if (stateStr) {
            try {
                const state = JSON.parse(stateStr);
                
                if (state.left && state.top) {
                    panel.style.position = 'absolute';
                    panel.style.left = state.left;
                    panel.style.top = state.top;
                }
                
                if (state.width) panel.style.width = state.width;
                if (state.height) panel.style.height = state.height;
                
                if (state.collapsed === 'true') {
                    const content = panel.querySelector('.panel-content') || panel.children[1];
                    if (content) {
                        content.style.display = 'none';
                        panel.dataset.collapsed = 'true';
                        const collapseBtn = panel.querySelector('.collapse-btn');
                        if (collapseBtn) {
                            collapseBtn.innerHTML = '<i class="bi bi-plus"></i>';
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading panel state:', error);
            }
        }
    });
}

function resetLayout() {
    const panels = document.querySelectorAll('.draggable-panel');
    
    panels.forEach(panel => {
        const panelId = panel.id;
        
        localStorage.removeItem(`panel_${panelId}_state`);
        localStorage.removeItem(`panel_${panelId}_left`);
        localStorage.removeItem(`panel_${panelId}_top`);
        
        panel.style.position = '';
        panel.style.left = '';
        panel.style.top = '';
        panel.style.width = '';
        panel.style.height = '';
        panel.style.zIndex = '';
        panel.dataset.collapsed = 'false';
        
        // Reset content display
        const content = panel.querySelector('.panel-content') || panel.children[1];
        if (content) {
            content.style.display = '';
        }
        
        // Reset collapse button
        const collapseBtn = panel.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.innerHTML = '<i class="bi bi-dash"></i>';
        }
    });
    
    console.log('Layout reseteado');
}

document.addEventListener('DOMContentLoaded', loadPanelStates);
