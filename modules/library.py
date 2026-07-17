import os
from werkzeug.utils import secure_filename
from flask import request, jsonify, send_file
from database import (
    add_media_file, get_media_files, update_conversion_status, 
    delete_media_file, get_conversion_settings, update_conversion_setting,
    add_to_conversion_queue, update_queue_progress, get_pending_conversions
)
import subprocess
import threading
import time

ALLOWED_EXTENSIONS = {
    'video': {'mkv', 'avi', 'wmv', 'flv', 'mov', 'mp4', 'webm', 'm4v', 'mpeg', 'mpg'},
    'audio': {'mp3', 'wav', 'aac', 'ac3', 'wma', 'ogg', 'flac', 'm4a'},
    'image': {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'}
}

def get_file_type(filename):
    """Determina el tipo de archivo basado en la extensión"""
    extension = filename.split('.').pop().lower()
    
    if extension in ALLOWED_EXTENSIONS['video']:
        return 'video'
    elif extension in ALLOWED_EXTENSIONS['audio']:
        return 'audio'
    elif extension in ALLOWED_EXTENSIONS['image']:
        return 'image'
    else:
        return 'unknown'

def get_media_info(file_path):
    """Obtiene información del archivo multimedia usando FFprobe"""
    try:
        filename = os.path.basename(file_path)
        extension = filename.split('.').pop().lower() if '.' in filename else ''
        is_audio = extension in ALLOWED_EXTENSIONS['audio']

        if is_audio:
            command = [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-show_entries', 'stream=duration',
                '-of', 'json',
                file_path
            ]
        else:
            command = [
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,duration',
                '-of', 'json',
                file_path
            ]

        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            import json
            info = json.loads(result.stdout)

            if is_audio:
                duration = None
                if info.get('format') and info['format'].get('duration'):
                    duration = float(info['format']['duration'])
                elif info.get('streams'):
                    for stream in info['streams']:
                        if stream.get('duration'):
                            duration = float(stream['duration'])
                            break
                return {'width': None, 'height': None, 'duration': duration}
            else:
                if info.get('streams'):
                    stream = info['streams'][0]
                    return {
                        'width': stream.get('width'),
                        'height': stream.get('height'),
                        'duration': stream.get('duration')
                    }
    except Exception as e:
        print(f"Error obteniendo info del archivo: {e}")

    return {'width': None, 'height': None, 'duration': None}

def upload_to_library(request):
    """Sube archivos a la biblioteca multimedia"""
    if 'files' not in request.files:
        return jsonify({'success': False, 'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    uploaded_files = []
    
    for file in files:
        if file.filename == '':
            continue
        
        file_type = get_file_type(file.filename)
        if file_type == 'unknown':
            continue
        
        try:
            # Crear directorio si no existe
            type_dir = os.path.join('static/uploads/library', file_type)
            os.makedirs(type_dir, exist_ok=True)
            
            # Guardar archivo
            filename = secure_filename(file.filename)
            file_path = os.path.join(type_dir, filename)
            file.save(file_path)
            
            # Obtener información del archivo
            media_info = get_media_info(file_path)
            
            # Agregar a base de datos
            file_id = add_media_file(
                filename=filename,
                original_path=file_path,
                file_type=file_type,
                file_size=os.path.getsize(file_path),
                duration=media_info.get('duration'),
                width=media_info.get('width'),
                height=media_info.get('height')
            )
            
            uploaded_files.append({
                'id': file_id,
                'filename': filename,
                'file_type': file_type,
                'file_size': os.path.getsize(file_path)
            })
            
        except Exception as e:
            print(f"Error subiendo archivo {file.filename}: {e}")
    
    return jsonify({
        'success': True,
        'uploaded_files': uploaded_files
    })

def get_library(request):
    """Obtiene todos los archivos de la biblioteca"""
    file_type = request.args.get('type')
    status = request.args.get('status')
    
    files = get_media_files(file_type=file_type, status=status)
    
    return jsonify({
        'success': True,
        'files': files
    })

def delete_from_library(request):
    """Elimina archivos de la biblioteca"""
    data = request.get_json()
    file_ids = data.get('file_ids', [])
    
    deleted_count = 0
    for file_id in file_ids:
        try:
            delete_media_file(file_id)
            deleted_count += 1
        except Exception as e:
            print(f"Error eliminando archivo {file_id}: {e}")
    
    return jsonify({
        'success': True,
        'deleted_count': deleted_count
    })

def start_conversion(request):
    """Inicia la conversión de archivos seleccionados"""
    data = request.get_json()
    file_ids = data.get('file_ids', [])
    target_format = data.get('target_format', 'mp4')
    
    queue_ids = []
    for file_id in file_ids:
        try:
            queue_id = add_to_conversion_queue(file_id)
            queue_ids.append(queue_id)
        except Exception as e:
            print(f"Error agregando archivo {file_id} a cola: {e}")
    
    # Iniciar hilo de procesamiento
    if queue_ids:
        thread = threading.Thread(target=process_conversion_queue)
        thread.daemon = True
        thread.start()
    
    return jsonify({
        'success': True,
        'queue_ids': queue_ids
    })

def process_conversion_queue():
    """Procesa la cola de conversión en segundo plano"""
    while True:
        pending = get_pending_conversions()
        
        if not pending:
            time.sleep(1)
            continue
        
        for item in pending:
            try:
                file_id = item['file_id']
                queue_id = item['id']
                original_path = item['original_path']
                target_format = item.get('target_format', 'mp4')
                
                # Actualizar estado a procesando
                update_queue_progress(queue_id, 0, 'processing')
                update_conversion_status(file_id, 'converting', 0)
                
                # Convertir archivo
                converted_path = convert_file(original_path, target_format, queue_id)
                
                if converted_path:
                    # Actualizar estado a completado
                    update_queue_progress(queue_id, 100, 'completed')
                    update_conversion_status(file_id, 'completed', 100, converted_path)
                else:
                    # Actualizar estado a error
                    update_queue_progress(queue_id, 0, 'failed')
                    update_conversion_status(file_id, 'failed', error_message='Conversion failed')
                    
            except Exception as e:
                print(f"Error procesando conversión: {e}")
                update_queue_progress(item['id'], 0, 'failed')
                update_conversion_status(item['file_id'], 'failed', error_message=str(e))

def convert_file(input_path, target_format, queue_id):
    """Convierte un archivo usando FFmpeg con actualización de progreso"""
    try:
        output_path = input_path.rsplit('.', 1)[0] + f'_converted.{target_format}'
        
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
        
        # Ejecutar FFmpeg y capturar progreso
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        duration = None
        for line in process.stdout:
            # Parsear duración
            if 'Duration:' in line and duration is None:
                try:
                    time_str = line.split('Duration:')[1].split(',')[0].strip()
                    h, m, s = time_str.split(':')
                    duration = float(h) * 3600 + float(m) * 60 + float(s)
                except:
                    pass
            
            # Parsear tiempo actual
            if 'time=' in line and duration:
                try:
                    time_str = line.split('time=')[1].split(' ')[0]
                    h, m, s = time_str.split(':')
                    current_time = float(h) * 3600 + float(m) * 60 + float(s)
                    progress = (current_time / duration) * 100
                    
                    update_queue_progress(queue_id, progress)
                    update_conversion_status(
                        int(line.split('file_id=')[1]) if 'file_id=' in line else 0,
                        'converting',
                        progress
                    )
                except:
                    pass
        
        process.wait()
        
        if process.returncode == 0:
            return output_path
        else:
            return None
            
    except Exception as e:
        print(f"Error en conversión: {e}")
        return None

def get_conversion_progress(request):
    """Obtiene el progreso de conversión actual"""
    file_id = request.args.get('file_id')
    
    if file_id:
        files = get_media_files()
        for file in files:
            if file['id'] == int(file_id):
                return jsonify({
                    'success': True,
                    'status': file['conversion_status'],
                    'progress': file['conversion_progress']
                })
    
    return jsonify({'success': False, 'error': 'File not found'})

def update_settings(request):
    """Actualiza la configuración de conversión"""
    data = request.get_json()
    
    try:
        update_conversion_setting(
            source_format=data.get('source_format'),
            target_format=data.get('target_format'),
            auto_convert=data.get('auto_convert', True),
            video_codec=data.get('video_codec', 'libx264'),
            audio_codec=data.get('audio_codec', 'aac'),
            video_quality=data.get('video_quality', '18'),
            audio_bitrate=data.get('audio_bitrate', '192k')
        )
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def get_settings(request):
    """Obtiene la configuración de conversión"""
    settings = get_conversion_settings()
    
    return jsonify({
        'success': True,
        'settings': settings
    })
