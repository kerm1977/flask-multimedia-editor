import os
import subprocess
from werkzeug.utils import secure_filename
from flask import request, jsonify, send_file

ALLOWED_EXTENSIONS = {'mkv', 'avi', 'wmv', 'flv', 'mov', 'mp4', 'webm', 'm4v'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert(request):
    print("Iniciando conversión de video...")
    
    if 'file' not in request.files:
        print("Error: No file provided")
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    print(f"Archivo recibido: {file.filename}, tamaño: {file.content_length}")
    
    if file.filename == '':
        print("Error: No file selected")
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        print(f"Error: File type not allowed: {file.filename}")
        return jsonify({'success': False, 'error': 'File type not allowed'}), 400
    
    try:
        # Guardar archivo original
        filename = secure_filename(file.filename)
        input_path = os.path.join('static/uploads/videos', filename)
        print(f"Guardando archivo en: {input_path}")
        file.save(input_path)
        print(f"Archivo guardado exitosamente")
        
        # Generar nombre de archivo de salida
        output_filename = f"converted_{filename.rsplit('.', 1)[0]}.mp4"
        output_path = os.path.join('static/uploads/videos', output_filename)
        print(f"Archivo de salida: {output_path}")
        
        # Convertir usando FFmpeg con alta calidad
        command = [
            'ffmpeg',
            '-i', input_path,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '18',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-y',
            output_path
        ]
        
        print(f"Ejecutando comando FFmpeg: {' '.join(command)}")
        process = subprocess.run(command, capture_output=True, text=True)
        
        print(f"FFmpeg return code: {process.returncode}")
        print(f"FFmpeg stdout: {process.stdout}")
        print(f"FFmpeg stderr: {process.stderr}")
        
        if process.returncode != 0:
            return jsonify({
                'success': False, 
                'error': 'FFmpeg conversion failed',
                'details': process.stderr
            }), 500
        
        # Enviar archivo convertido
        print("Enviando archivo convertido...")
        return send_file(output_path, as_attachment=False, mimetype='video/mp4')
        
    except Exception as e:
        print(f"Excepción durante conversión: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
