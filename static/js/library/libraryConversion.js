function convertSingleFile(file) {
    try {
        fetch('/library/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_ids: [file.id]
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log(`Iniciada conversión de archivo ${file.filename}`);
                startProgressMonitoring();
                loadLibraryFiles();
            } else {
                alert('Error al iniciar conversión: ' + result.error);
            }
        })
        .catch(error => {
            console.error('Error iniciando conversión:', error);
            alert('Error al iniciar conversión: ' + error.message);
        });
    } catch (error) {
        console.error('Error iniciando conversión:', error);
        alert('Error al iniciar conversión: ' + error.message);
    }
}

function deleteSingleFile(file) {
    if (!confirm(`¿Eliminar el archivo "${file.filename}"?`)) {
        return;
    }
    
    try {
        fetch('/library/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_ids: [file.id] })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log(`Archivo eliminado: ${file.filename}`);
                loadLibraryFiles();
            } else {
                alert('Error al eliminar archivo: ' + result.error);
            }
        })
        .catch(error => {
            console.error('Error eliminando archivo:', error);
            alert('Error al eliminar archivo: ' + error.message);
        });
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        alert('Error al eliminar archivo: ' + error.message);
    }
}

function startProgressMonitoring() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(() => {
        loadLibraryFiles();
    }, 5000);
}
