# Editor Integral de Medios

Editor de video, fotografía y música desarrollado con Flask y JavaScript.

## Arquitectura del Sistema

La aplicación sigue una arquitectura modular extrema donde cada función está en un archivo independiente. Ningún archivo supera las 200 líneas de código.

### Estructura de Directorios

```
editor-medios/
├── app.py                      # Archivo madre Flask
├── requirements.txt            # Dependencias Python
├── modules/                    # Módulos backend
│   ├── __init__.py
│   ├── upload.py              # Manejo de subida de archivos
│   ├── video_proxy.py         # Generación de proxies de video
│   ├── image_thumbnail.py     # Generación de miniaturas
│   └── audio_convert.py       # Conversión de audio
├── static/
│   ├── css/
│   │   └── styles.css         # Estilos Bootstrap personalizados
│   ├── js/
│   │   ├── actions/           # Funciones de edición
│   │   │   ├── upload.js      # Subida de archivos
│   │   │   ├── cut.js         # Cortar (Ctrl+X)
│   │   │   ├── paste.js       # Pegar (Ctrl+V)
│   │   │   ├── select.js      # Seleccionar
│   │   │   ├── move.js        # Mover (G)
│   │   │   ├── scale.js       # Escalar (S)
│   │   │   ├── rotate.js      # Rotar (R)
│   │   │   ├── copy.js        # Copiar (Ctrl+C)
│   │   │   ├── undo.js        # Deshacer (Ctrl+Z)
│   │   │   └── redo.js        # Rehacer (Ctrl+Shift+Z)
│   │   ├── canvas/            # Canvas y capas
│   │   │   ├── canvas.js      # Canvas principal
│   │   │   └── layers.js      # Panel de capas
│   │   ├── video/             # Editor de video
│   │   │   ├── videoPlayer.js # Reproductor de video
│   │   │   └── timeline.js    # Timeline de video
│   │   ├── audio/             # Editor de audio
│   │   │   ├── audioEditor.js # Editor de audio
│   │   │   └── audioConvert.js# Conversión de audio
│   │   └── ui/                # Interfaz de usuario
│   │       ├── navigation.js # Navegación/sidebar
│   │       └── keyboardShortcuts.js # Atajos de teclado
│   └── uploads/               # Archivos subidos
│       ├── videos/
│       ├── imagenes/
│       └── audio/
└── templates/
    └── index.html             # HTML principal
```

## Requisitos Tecnológicos

### Backend
- Python 3.8+
- Flask
- Pillow (procesamiento de imágenes)
- FFmpeg (procesamiento de video y audio)
- Pydub (manipulación de audio)
- NumPy y SciPy (procesamiento de señales)
- Librosa (extracción de características musicales)

### Frontend
- HTML5
- JavaScript nativo
- Bootstrap 5.3.0

## Instalación

1. Clonar el repositorio:
```bash
cd /home/pmint/CascadeProjects/editor-medios
```

2. Instalar dependencias Python:
```bash
pip install -r requirements.txt
```

3. Asegurarse de tener FFmpeg instalado en el sistema.

## Ejecución

```bash
python app.py
```

La aplicación estará disponible en `http://localhost:5000`

## Atajos de Teclado

- **G**: Activar modo mover
- **S**: Activar modo escalar
- **R**: Activar modo rotar
- **Ctrl+Z**: Deshacer
- **Ctrl+Shift+Z**: Rehacer
- **Ctrl+C**: Copiar
- **Ctrl+X**: Cortar
- **Ctrl+V**: Pegar

## Módulos del Sistema

### 1. Subida y Gestión
- Carga de archivos
- Generación de proxies de video optimizados con FFmpeg
- Generación de miniaturas para imágenes

### 2. Editor de Fotografía
- Canvas principal con soporte de capas
- Panel de capas para gestión de orden y selección
- Transformaciones: mover, escalar, rotar

### 3. Editor de Video
- Reproductor integrado
- Timeline para gestión de clips
- Transformaciones básicas aplicables

### 4. Editor de Audio
- Reproductor de audio
- Visualización de waveform
- Conversión de formatos (MP3, AAC)
- Manipulación de volumen y desvanecimientos

## Características Principales

- **Arquitectura Modular**: Cada función en archivo independiente
- **Bootstrap**: Diseño consistente sin CSS suelto
- **Atajos de Teclado**: Configurables y extensibles
- **Gestión de Capas**: Sistema completo de capas para fotografía
- **Timeline**: Interfaz visual para edición de video
- **Conversión de Audio**: Soporte para MP3 y AAC
- **Proxies de Video**: Optimización para previsualización fluida

## Notas de Desarrollo

- Todos los archivos JavaScript respetan el límite de 200 líneas
- Cada módulo Python tiene una responsabilidad única
- La interfaz utiliza exclusivamente Bootstrap y Flexbox
- Los estilos personalizados están centralizados en `styles.css`
