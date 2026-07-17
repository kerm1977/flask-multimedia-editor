import os
import subprocess
from flask import request, jsonify

def create_proxy(request):
    data = request.get_json()
    
    if not data or 'filepath' not in data:
        return jsonify({'success': False, 'error': 'No filepath provided'})
    
    input_file = data['filepath']
    if not os.path.exists(input_file):
        return jsonify({'success': False, 'error': 'File not found'})
    
    proxy_filename = f"proxy_{os.path.basename(input_file)}"
    proxy_path = os.path.join('static/uploads/videos', proxy_filename)
    
    try:
        command = [
            'ffmpeg',
            '-i', input_file,
            '-vf', 'scale=640:360',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '28',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-y',
            proxy_path
        ]
        
        subprocess.run(command, check=True, capture_output=True)
        
        return jsonify({
            'success': True,
            'proxy_path': proxy_path
        })
    
    except subprocess.CalledProcessError as e:
        return jsonify({
            'success': False,
            'error': f'FFmpeg error: {e.stderr.decode()}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })
