document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audio-player');
    const waveform = document.getElementById('waveform');
    
    if (!audioPlayer || !waveform) return;

    initAudioEditor(audioPlayer, waveform);
});

function initAudioEditor(audioPlayer, waveform) {
    audioPlayer.addEventListener('loadedmetadata', handleAudioLoaded);
    audioPlayer.addEventListener('timeupdate', handleAudioTimeUpdate);
    audioPlayer.addEventListener('play', handleAudioPlay);
    audioPlayer.addEventListener('pause', handleAudioPause);
    
    waveform.addEventListener('click', handleWaveformClick);
    
    console.log('Editor de audio inicializado');
}

function handleAudioLoaded(event) {
    const audio = event.target;
    console.log('Audio cargado:', audio.duration, 'segundos');
    drawWaveform();
}

function handleAudioTimeUpdate(event) {
    const audio = event.target;
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    
    updateWaveformPlayhead(currentTime, duration);
}

function handleAudioPlay(event) {
    console.log('Audio reproduciendo');
}

function handleAudioPause(event) {
    console.log('Audio pausado');
}

function handleWaveformClick(event) {
    const audioPlayer = document.getElementById('audio-player');
    const waveform = document.getElementById('waveform');
    
    if (!audioPlayer || !waveform) return;
    
    const rect = waveform.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / waveform.offsetWidth;
    
    if (audioPlayer.duration) {
        const newTime = percentage * audioPlayer.duration;
        audioPlayer.currentTime = newTime;
    }
}

function drawWaveform() {
    const waveform = document.getElementById('waveform');
    if (!waveform) return;
    
    waveform.innerHTML = '';
    
    const bars = 100;
    for (let i = 0; i < bars; i++) {
        const bar = document.createElement('div');
        bar.style.position = 'absolute';
        bar.style.left = (i / bars * 100) + '%';
        bar.style.bottom = '0';
        bar.style.width = '1%';
        bar.style.height = (Math.random() * 80 + 20) + '%';
        bar.style.backgroundColor = '#007bff';
        bar.style.opacity = '0.7';
        waveform.appendChild(bar);
    }
}

function updateWaveformPlayhead(currentTime, duration) {
    const waveform = document.getElementById('waveform');
    if (!waveform || duration === 0) return;
    
    let playhead = document.getElementById('audio-playhead');
    if (!playhead) {
        playhead = document.createElement('div');
        playhead.id = 'audio-playhead';
        playhead.style.position = 'absolute';
        playhead.style.top = '0';
        playhead.style.width = '2px';
        playhead.style.height = '100%';
        playhead.style.backgroundColor = '#ff0000';
        playhead.style.zIndex = '10';
        waveform.appendChild(playhead);
    }
    
    const percentage = (currentTime / duration) * 100;
    playhead.style.left = percentage + '%';
}

function loadAudio(file) {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer) return;
    
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    audioPlayer.load();
    
    console.log('Audio cargado:', file.name);
}

