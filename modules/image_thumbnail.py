import os
from PIL import Image
from flask import request, jsonify

def create_thumbnail(request):
    data = request.get_json()
    
    if not data or 'filepath' not in data:
        return jsonify({'success': False, 'error': 'No filepath provided'})
    
    input_file = data['filepath']
    if not os.path.exists(input_file):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        img = Image.open(input_file)
        
        thumbnail_size = (200, 200)
        img.thumbnail(thumbnail_size)
        
        thumbnail_filename = f"thumb_{os.path.basename(input_file)}"
        thumbnail_path = os.path.join('static/uploads/imagenes', thumbnail_filename)
        
        img.save(thumbnail_path, 'JPEG')
        
        return jsonify({
            'success': True,
            'thumbnail_path': thumbnail_path
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })
