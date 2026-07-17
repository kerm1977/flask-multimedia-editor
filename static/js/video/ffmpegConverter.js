async function convertVideoForBrowser(file) {
    console.log('Convirtiendo video para compatibilidad de navegador:', file.name);
    
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
            return null;
        }
        
        console.log('Video convertido exitosamente, creando blob...');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        console.log('URL del video convertida creada');
        return url;
    } catch (error) {
        console.error('Error al convertir video:', error);
        return null;
    }
}

async function isVideoCompatible(file) {
    const compatibleTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime'
    ];
    
    if (compatibleTypes.includes(file.type)) {
        return true;
    }
    
    const extension = file.name.split('.').pop().toLowerCase();
    const compatibleExtensions = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];
    
    return compatibleExtensions.includes(extension);
}

async function loadVideoWithFFmpeg(file) {
    console.log('Verificando compatibilidad del video:', file.name);
    
    const isCompatible = await isVideoCompatible(file);
    
    if (isCompatible) {
        console.log('Video compatible, cargando directamente');
        const url = URL.createObjectURL(file);
        return url;
    }
    
    console.log('Video no compatible, iniciando conversión con FFmpeg del servidor');
    const convertedUrl = await convertVideoForBrowser(file);
    
    if (convertedUrl) {
        console.log('Video convertido exitosamente');
        return convertedUrl;
    } else {
        console.error('Falló la conversión del video');
        return null;
    }
}
