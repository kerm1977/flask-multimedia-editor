document.addEventListener('DOMContentLoaded', function() {
    const convertMp3Btn = document.getElementById('btn-convert-mp3');
    const convertAacBtn = document.getElementById('btn-convert-aac');
    
    if (convertMp3Btn) {
        convertMp3Btn.addEventListener('click', convertToMp3);
    }
    
    if (convertAacBtn) {
        convertAacBtn.addEventListener('click', convertToAac);
    }
});

function convertToMp3() {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer || !audioPlayer.src) {
        alert('No hay audio cargado para convertir');
        return;
    }
    
    console.log('Iniciando conversión a MP3...');
    
    fetch('/audio/convert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            format: 'mp3',
            source: audioPlayer.src
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Conversión a MP3 completada');
            console.log('Archivo convertido:', data.file);
        } else {
            alert('Error en la conversión: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    });
}

function convertToAac() {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer || !audioPlayer.src) {
        alert('No hay audio cargado para convertir');
        return;
    }
    
    console.log('Iniciando conversión a AAC...');
    
    fetch('/audio/convert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            format: 'aac',
            source: audioPlayer.src
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Conversión a AAC completada');
            console.log('Archivo convertido:', data.file);
        } else {
            alert('Error en la conversión: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    });
}

