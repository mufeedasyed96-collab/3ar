"""
Flask API for DXF validation
Can be used with Postman or any HTTP client
"""

from flask import Flask, request, jsonify
import os
from pathlib import Path
import json

try:
    from werkzeug.utils import secure_filename
    SECURE_FILENAME_AVAILABLE = True
except ImportError:
    SECURE_FILENAME_AVAILABLE = False
    # Fallback function if werkzeug is not available
    def secure_filename(filename):
        # Simple sanitization without werkzeug
        import re
        filename = re.sub(r'[^\w\s-]', '', filename)
        filename = re.sub(r'[-\s]+', '-', filename)
        return filename.strip('-_')

try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    print("Warning: flask-cors not installed. CORS will be disabled. Install with: pip install flask-cors")

from main_validator import SchemaValidator

app = Flask(__name__)
if CORS_AVAILABLE:
    CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = Path(__file__).parent / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'dxf'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB (increased from 100MB)

app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Handle 413 errors
@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors."""
    return jsonify({
        'error': f'File too large. Maximum file size is {MAX_FILE_SIZE / (1024*1024):.0f}MB.',
        'status': 'error'
    }), 413


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/validate', methods=['POST'])
def validate_dxf():
    """
    Validate DXF file.
    
    Accepts:
    - multipart/form-data with 'file' field (DXF file)
    - OR JSON with 'dxf_path' field (path to DXF file)
    
    Returns:
    - JSON with validation results
    """
    try:
        validator = SchemaValidator()
        
        # Check if file was uploaded
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({
                    'error': 'No file selected',
                    'status': 'error'
                }), 400
            
            if file and allowed_file(file.filename):
                # Check file size before saving
                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)  # Reset to beginning
                
                if file_size > MAX_FILE_SIZE:
                    return jsonify({
                        'error': f'File too large: {file_size / (1024*1024):.2f}MB. Maximum allowed: {MAX_FILE_SIZE / (1024*1024):.0f}MB',
                        'status': 'error'
                    }), 413
                
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                try:
                    file.save(filepath)
                except Exception as save_error:
                    return jsonify({
                        'error': f'Failed to save file: {str(save_error)}',
                        'status': 'error'
                    }), 500
                
                # Validate
                try:
                    result = validator.validate_from_dxf(filepath)
                    # Surface original upload name for frontend reference codes
                    result["file_name"] = file.filename
                except Exception as validation_error:
                    return jsonify({
                        'error': f'Validation failed: {str(validation_error)}',
                        'status': 'error'
                    }), 500
                finally:
                    # Clean up uploaded file (optional - comment out to keep files)
                    # os.remove(filepath)
                    pass
                
                return jsonify(result)
            else:
                return jsonify({
                    'error': 'Invalid file type. Only DXF files are allowed.',
                    'status': 'error'
                }), 400
        
        # Check if path was provided
        elif request.is_json:
            data = request.get_json()
            dxf_path = data.get('dxf_path')
            
            if not dxf_path:
                return jsonify({
                    'error': 'Either "file" (multipart) or "dxf_path" (JSON) must be provided',
                    'status': 'error'
                }), 400
            
            if not Path(dxf_path).exists():
                return jsonify({
                    'error': f'DXF file not found: {dxf_path}',
                    'status': 'error'
                }), 404
            
            # Validate
            result = validator.validate_from_dxf(dxf_path)
            result["file_name"] = Path(dxf_path).name
            return jsonify(result)
        
        else:
            return jsonify({
                'error': 'No file or path provided',
                'status': 'error'
            }), 400
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/validate-from-elements', methods=['POST'])
def validate_from_elements():
    """
    Validate from already extracted elements (JSON).
    
    Body (JSON):
    {
        "elements": [...],
        "metadata": {...}
    }
    
    Returns:
    - JSON with validation results
    """
    try:
        if not request.is_json:
            return jsonify({
                'error': 'Request must be JSON',
                'status': 'error'
            }), 400
        
        data = request.get_json()
        elements = data.get('elements', [])
        metadata = data.get('metadata', {})
        
        if not elements:
            return jsonify({
                'error': 'Elements array is required',
                'status': 'error'
            }), 400
        
        validator = SchemaValidator()
        result = validator.validate_schema(elements, metadata)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'DXF Validation API is running'
    })


@app.route('/', methods=['GET'])
def index():
    """API information."""
    return jsonify({
        'name': 'DXF Validation API',
        'version': '1.0.0',
        'endpoints': {
            'POST /api/validate': 'Validate DXF file (multipart/form-data with file, or JSON with dxf_path)',
            'POST /api/validate-from-elements': 'Validate from extracted elements (JSON)',
            'GET /api/health': 'Health check'
        }
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting DXF Validation API on port {port}")
    print(f"Maximum file size: {MAX_FILE_SIZE / (1024*1024):.0f}MB")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)

