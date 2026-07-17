function handleLibraryFileSelect() {
    const fileInput = document.getElementById('library-file-input');
    const files = fileInput.files;
    
    if (files.length > 0) {
        uploadLibraryFiles(files);
    }
    
    fileInput.value = '';
}

async function uploadLibraryFiles(files) {
    console.log(`Subiendo ${files.length} archivos a la biblioteca...`);
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        const response = await fetch('/library/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`Archivos subidos exitosamente: ${result.uploaded_files.length}`);
            setTimeout(() => loadLibraryFiles(), 500);
        } else {
            console.error('Error subiendo archivos:', result.error);
            alert('Error al subir archivos: ' + result.error);
        }
    } catch (error) {
        console.error('Error en subida:', error);
        alert('Error al subir archivos: ' + error.message);
    }
}
