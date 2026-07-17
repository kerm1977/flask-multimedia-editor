from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
from database import init_database

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1GB max

# Inicializar base de datos
init_database()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Cross-Origin-Embedder-Policy', 'require-corp')
    response.headers.add('Cross-Origin-Opener-Policy', 'same-origin')
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    from modules.upload import handle_upload
    return handle_upload(request)

@app.route('/video/proxy', methods=['POST'])
def create_video_proxy():
    from modules.video_proxy import create_proxy
    return create_proxy(request)

@app.route('/image/thumbnail', methods=['POST'])
def create_image_thumbnail():
    from modules.image_thumbnail import create_thumbnail
    return create_thumbnail(request)

@app.route('/audio/convert', methods=['POST'])
def convert_audio():
    from modules.audio_convert import convert
    return convert(request)

@app.route('/video/convert', methods=['POST'])
def convert_video():
    from modules.video_convert import convert
    return convert(request)

@app.route('/library/upload', methods=['POST'])
def library_upload():
    from modules.library import upload_to_library
    return upload_to_library(request)

@app.route('/library/files', methods=['GET'])
def library_files():
    from modules.library import get_library
    return get_library(request)

@app.route('/library/delete', methods=['DELETE'])
def library_delete():
    from modules.library import delete_from_library
    return delete_from_library(request)

@app.route('/library/convert', methods=['POST'])
def library_convert():
    from modules.library import start_conversion
    return start_conversion(request)

@app.route('/library/progress', methods=['GET'])
def library_progress():
    from modules.library import get_conversion_progress
    return get_conversion_progress(request)

@app.route('/library/settings', methods=['GET', 'POST'])
def library_settings():
    from modules.library import get_settings, update_settings
    
    if request.method == 'POST':
        return update_settings(request)
    else:
        return get_settings(request)

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'videos'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'imagenes'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'audio'), exist_ok=True)
    app.run(debug=True, port=5000)
