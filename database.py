import sqlite3
import os
from datetime import datetime

DATABASE_PATH = 'media_library.db'

def init_database():
    """Inicializa la base de datos con las tablas necesarias"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Tabla de archivos multimedia
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS media_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            duration REAL,
            width INTEGER,
            height INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            converted_path TEXT,
            conversion_status TEXT DEFAULT 'pending',
            conversion_progress REAL DEFAULT 0,
            auto_convert BOOLEAN DEFAULT 0,
            target_format TEXT
        )
    ''')
    
    # Tabla de configuración de conversión
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversion_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_format TEXT NOT NULL,
            target_format TEXT NOT NULL,
            auto_convert BOOLEAN DEFAULT 1,
            video_codec TEXT DEFAULT 'libx264',
            audio_codec TEXT DEFAULT 'mp3',
            video_quality TEXT DEFAULT '18',
            audio_bitrate TEXT DEFAULT '192k'
        )
    ''')
    
    # Tabla de colas de conversión
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversion_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            progress REAL DEFAULT 0,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            error_message TEXT,
            FOREIGN KEY (file_id) REFERENCES media_files (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Base de datos inicializada exitosamente")

def get_connection():
    """Obtiene una conexión a la base de datos"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def add_media_file(filename, original_path, file_type, file_size, duration=None, width=None, height=None):
    """Agrega un archivo multimedia a la base de datos"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO media_files (filename, original_path, file_type, file_size, duration, width, height)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (filename, original_path, file_type, file_size, duration, width, height))
    
    conn.commit()
    file_id = cursor.lastrowid
    conn.close()
    return file_id

def get_media_files(file_type=None, status=None):
    """Obtiene archivos multimedia de la base de datos"""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM media_files WHERE 1=1'
    params = []
    
    if file_type:
        query += ' AND file_type = ?'
        params.append(file_type)
    
    if status:
        query += ' AND conversion_status = ?'
        params.append(status)
    
    query += ' ORDER BY upload_date DESC'
    
    cursor.execute(query, params)
    files = cursor.fetchall()
    conn.close()
    
    return [dict(file) for file in files]

def update_conversion_status(file_id, status, progress=None, converted_path=None, error_message=None):
    """Actualiza el estado de conversión de un archivo"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if progress is not None:
        cursor.execute('''
            UPDATE media_files SET conversion_status = ?, conversion_progress = ?, converted_path = ?
            WHERE id = ?
        ''', (status, progress, converted_path, file_id))
    else:
        cursor.execute('''
            UPDATE media_files SET conversion_status = ?, converted_path = ?
            WHERE id = ?
        ''', (status, converted_path, file_id))
    
    conn.commit()
    conn.close()

def delete_media_file(file_id):
    """Elimina un archivo multimedia de la base de datos"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Obtener información del archivo para eliminar físicamente
    cursor.execute('SELECT original_path, converted_path FROM media_files WHERE id = ?', (file_id,))
    file_info = cursor.fetchone()
    
    if file_info:
        # Eliminar archivos físicos
        if file_info['original_path'] and os.path.exists(file_info['original_path']):
            os.remove(file_info['original_path'])
        if file_info['converted_path'] and os.path.exists(file_info['converted_path']):
            os.remove(file_info['converted_path'])
    
    # Eliminar de la base de datos
    cursor.execute('DELETE FROM media_files WHERE id = ?', (file_id,))
    cursor.execute('DELETE FROM conversion_queue WHERE file_id = ?', (file_id,))
    
    conn.commit()
    conn.close()

def get_conversion_settings():
    """Obtiene la configuración de conversión"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM conversion_settings')
    settings = cursor.fetchall()
    conn.close()
    
    return [dict(setting) for setting in settings]

def update_conversion_setting(source_format, target_format, auto_convert, video_codec, audio_codec, video_quality, audio_bitrate):
    """Actualiza o crea una configuración de conversión"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO conversion_settings 
        (source_format, target_format, auto_convert, video_codec, audio_codec, video_quality, audio_bitrate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (source_format, target_format, auto_convert, video_codec, audio_codec, video_quality, audio_bitrate))
    
    conn.commit()
    conn.close()

def add_to_conversion_queue(file_id):
    """Agrega un archivo a la cola de conversión"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO conversion_queue (file_id, status, started_at)
        VALUES (?, 'pending', ?)
    ''', (file_id, datetime.now()))
    
    conn.commit()
    queue_id = cursor.lastrowid
    conn.close()
    return queue_id

def update_queue_progress(queue_id, progress, status=None):
    """Actualiza el progreso de un trabajo en la cola"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if status:
        cursor.execute('''
            UPDATE conversion_queue SET progress = ?, status = ?
            WHERE id = ?
        ''', (progress, status, queue_id))
    else:
        cursor.execute('''
            UPDATE conversion_queue SET progress = ?
            WHERE id = ?
        ''', (progress, queue_id))
    
    conn.commit()
    conn.close()

def get_pending_conversions():
    """Obtiene conversiones pendientes"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT cq.*, mf.filename, mf.original_path, mf.target_format
        FROM conversion_queue cq
        JOIN media_files mf ON cq.file_id = mf.id
        WHERE cq.status = 'pending'
        ORDER BY cq.started_at ASC
    ''')
    
    pending = cursor.fetchall()
    conn.close()
    
    return [dict(item) for item in pending]
