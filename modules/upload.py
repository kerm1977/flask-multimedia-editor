import os
from flask import request, jsonify
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'aac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_upload(request):
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_type = get_file_type(filename)
        
        upload_folder = f'static/uploads/{file_type}'
        os.makedirs(upload_folder, exist_ok=True)
        
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'type': file_type
        })
    
    return jsonify({'success': False, 'error': 'File type not allowed'})

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in {'png', 'jpg', 'jpeg', 'gif'}:
        return 'imagenes'
    elif ext in {'mp4', 'avi', 'mov'}:
        return 'videos'
    elif ext in {'mp3', 'wav', 'aac'}:
        return 'audio'
    return 'unknown'
