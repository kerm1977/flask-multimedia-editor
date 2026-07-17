function showSettingsDialog() {
    console.log('Mostrando diálogo de configuración de conversión...');
    
    // Check if dialog already exists
    let dialog = document.getElementById('conversion-settings-dialog');
    
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'conversion-settings-dialog';
        dialog.className = 'modal fade';
        dialog.setAttribute('tabindex', '-1');
        dialog.setAttribute('aria-hidden', 'true');
        
        dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content" style="background: #2a2a2a; border: 1px solid #666; color: white;">
                    <div class="modal-header border-bottom border-secondary">
                        <h5 class="modal-title">Configuración de Conversión</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Formato de salida</label>
                            <select class="form-select bg-dark text-white border-secondary" id="target-format">
                                <option value="mp4">MP4</option>
                                <option value="webm">WebM</option>
                                <option value="avi">AVI</option>
                                <option value="mov">MOV</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Calidad de video</label>
                            <select class="form-select bg-dark text-white border-secondary" id="video-quality">
                                <option value="high">Alta</option>
                                <option value="medium">Media</option>
                                <option value="low">Baja</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Bitrate de audio (kbps)</label>
                            <input type="number" class="form-control bg-dark text-white border-secondary" id="audio-bitrate" value="128">
                        </div>
                    </div>
                    <div class="modal-footer border-top border-secondary">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="save-settings">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listener for save button
        document.getElementById('save-settings').addEventListener('click', saveConversionSettings);
    }
    
    const modal = new bootstrap.Modal(dialog);
    modal.show();
}

function saveConversionSettings() {
    const targetFormat = document.getElementById('target-format').value;
    const videoQuality = document.getElementById('video-quality').value;
    const audioBitrate = document.getElementById('audio-bitrate').value;
    
    const settings = {
        target_format: targetFormat,
        video_quality: videoQuality,
        audio_bitrate: audioBitrate
    };
    
    // Save to localStorage
    localStorage.setItem('conversion_settings', JSON.stringify(settings));
    
    console.log('Configuración guardada:', settings);
    
    // Close modal
    const dialog = document.getElementById('conversion-settings-dialog');
    const modal = bootstrap.Modal.getInstance(dialog);
    modal.hide();
    
    alert('Configuración guardada exitosamente');
}
