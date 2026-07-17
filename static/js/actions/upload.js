document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('btn-upload');
    const uploadList = document.getElementById('upload-list');
    const uploadZone = document.querySelector('.upload-zone');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    if (uploadZone) {
        initDragAndDrop(uploadZone);
    }

    function initDragAndDrop(zone) {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('click', () => fileInput.click());
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        processFiles(files);
    }

    function handleFileSelect() {
        const files = fileInput.files;
        processFiles(files);
    }

    function processFiles(files) {
        if (files.length === 0) {
            alert('Por favor selecciona al menos un archivo');
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileType = getFileType(file);
            
            displayUploadedFile(file, fileType);
            
            if (fileType === 'video') {
                loadVideoToEditor(file);
            } else if (fileType === 'audio') {
                loadAudioToEditor(file);
            } else if (fileType === 'image') {
                loadImageToEditor(file);
            }
        }

        fileInput.value = '';
    }

    function getFileType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'unknown';
    }

    function displayUploadedFile(file, type) {
        const item = document.createElement('div');
        item.className = 'upload-item';
        
        const icon = getTypeIcon(type);
        item.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <i class="bi ${getBootstrapIcon(type)} fs-4"></i>
                <div>
                    <div class="fw-bold">${file.name}</div>
                    <small class="text-white-50">${formatFileSize(file.size)}</small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">
                <i class="bi bi-trash"></i>
            </button>
        `;
        
        uploadList.appendChild(item);
    }

    function getBootstrapIcon(type) {
        switch(type) {
            case 'image': return 'bi-image';
            case 'video': return 'bi-camera-video';
            case 'audio': return 'bi-music-note-beamed';
            default: return 'bi-file-earmark';
        }
    }

    function getTypeIcon(type) {
        switch(type) {
            case 'image': return '📷';
            case 'video': return '🎬';
            case 'audio': return '🎵';
            default: return '📄';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function loadVideoToEditor(file) {
        console.log('Intentando cargar video:', file.name);
        
        const videoPlayer = document.getElementById('video-player');
        if (!videoPlayer) {
            console.error('Elemento video-player no encontrado');
            return;
        }
        
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'mkv') {
            console.log('Archivo MKV detectado, iniciando conversión a MP4...');
            await convertMKVtoMP4(file);
        } else {
            console.log('Video player encontrado, cargando directamente...');
            
            try {
                const url = URL.createObjectURL(file);
                videoPlayer.src = url;
                videoPlayer.load();
                
                console.log('Video cargado en player, agregando al timeline...');
                addClipToTimeline(0, file.size / 1000000, file.name);
                
                console.log('Cambiando a sección de video...');
                switchToVideoSection();
                
                console.log('Video cargado completamente en editor:', file.name);
            } catch (error) {
                console.error('Error al cargar video:', error);
            }
        }
    }

    async function convertMKVtoMP4(file) {
        console.log('Iniciando conversión de MKV a MP4 con alta calidad...');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            console.log('Enviando archivo al servidor para conversión...');
            const response = await fetch('/video/convert', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error en conversión del servidor:', errorData);
                alert('Error al convertir video: ' + errorData.error);
                return;
            }
            
            console.log('Video convertido exitosamente, cargando en player...');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const videoPlayer = document.getElementById('video-player');
            videoPlayer.src = url;
            videoPlayer.load();
            
            console.log('Video convertido cargado en player, agregando al timeline...');
            addClipToTimeline(0, file.size / 1000000, file.name.replace('.mkv', '.mp4'));
            
            console.log('Cambiando a sección de video...');
            switchToVideoSection();
            
            console.log('Video convertido y cargado completamente en editor');
        } catch (error) {
            console.error('Error al convertir video:', error);
            alert('Error al convertir video: ' + error.message);
        }
    }

    function loadAudioToEditor(file) {
        const audioPlayer = document.getElementById('audio-player');
        if (!audioPlayer) return;
        
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        audioPlayer.load();
        
        console.log('Audio cargado en editor:', file.name);
    }

    function loadImageToEditor(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.position = 'absolute';
            img.style.left = '50px';
            img.style.top = '50px';
            img.style.maxWidth = '300px';
            img.classList.add('canvas-element');
            
            const canvas = document.getElementById('main-canvas');
            if (canvas) {
                canvas.appendChild(img);
                updateLayersPanel();
            }
        };
        reader.readAsDataURL(file);
        
        console.log('Imagen cargada en editor:', file.name);
    }

    function addClipToTimeline(startTime, duration, name) {
        console.log('Agregando clip al timeline:', name);
        
        const videoTrack = document.getElementById('video-track');
        if (!videoTrack) {
            console.error('Elemento video-track no encontrado');
            return;
        }
        
        console.log('Video track encontrado, creando clip...');
        const clip = document.createElement('div');
        clip.className = 'timeline-clip';
        clip.textContent = name;
        
        const trackWidth = videoTrack.offsetWidth;
        const percentage = (startTime / 10) * 100;
        const widthPercentage = Math.min((duration / 10) * 100, 100 - percentage);
        
        clip.style.left = percentage + '%';
        clip.style.width = widthPercentage + '%';
        
        videoTrack.appendChild(clip);
        
        console.log('Clip agregado al timeline con éxito');
    }

    function updateLayersPanel() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;
        
        const elements = canvas.querySelectorAll('.canvas-element');
        const layersPanel = document.getElementById('layers-panel');
        if (!layersPanel) return;
        
        layersPanel.innerHTML = '';
        
        elements.forEach((el, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.textContent = `Capa ${index + 1}`;
            layerItem.addEventListener('click', () => {
                document.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
                el.classList.add('selected');
                document.querySelectorAll('.layer-item').forEach(l => l.classList.remove('selected'));
                layerItem.classList.add('selected');
            });
            layersPanel.appendChild(layerItem);
        });
    }

    function switchToVideoSection() {
        const navVideo = document.getElementById('nav-video');
        const videoSection = document.getElementById('video-section');
        
        if (navVideo && videoSection) {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.add('d-none');
            });
            videoSection.classList.remove('d-none');
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            navVideo.classList.add('active');
        }
    }
});
