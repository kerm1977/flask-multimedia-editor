import os
import subprocess
from flask import request, jsonify

def convert(request):
    data = request.get_json()
    
    if not data or 'format' not in data or 'source' not in data:
        return jsonify({'success': False, 'error': 'Missing format or source'})
    
    target_format = data['format'].lower()
    source = data['source']
    
    if target_format not in ['mp3', 'aac']:
        return jsonify({'success': False, 'error': 'Unsupported format'})
    
    try:
        if source.startswith('blob:'):
            return jsonify({
                'success': False,
                'error': 'Cannot convert blob URLs directly. Upload file first.'
            })
        
        input_file = source.replace('static/uploads/audio/', '')
        input_path = os.path.join('static/uploads/audio', input_file)
        
        if not os.path.exists(input_path):
            return jsonify({'success': False, 'error': 'Source file not found'})
        
        output_filename = f"converted_{os.path.splitext(input_file)[0]}.{target_format}"
        output_path = os.path.join('static/uploads/audio', output_filename)
        
        codec = 'libmp3lame' if target_format == 'mp3' else 'aac'
        
        command = [
            'ffmpeg',
            '-i', input_path,
            '-c:a', codec,
            '-b:a', '192k',
            '-y',
            output_path
        ]
        
        subprocess.run(command, check=True, capture_output=True)
        
        return jsonify({
            'success': True,
            'file': output_path
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
