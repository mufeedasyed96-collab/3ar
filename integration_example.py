"""
Integration Example: Python → Node.js Data Flow
Demonstrates complete workflow from DWG to validation result
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# Store original stdout/stderr for subprocess compatibility
_original_stdout = sys.stdout
_original_stderr = sys.stderr

def safe_print(*args, **kwargs):
    """Print with safe encoding, avoiding Unicode issues on Windows."""
    try:
        # Convert all args to strings, handling encoding issues
        safe_args = []
        for arg in args:
            if isinstance(arg, str):
                # Replace problematic Unicode characters on Windows
                if sys.platform == 'win32':
                    try:
                        # Try to encode to check if it's safe
                        arg.encode('cp1252')
                        safe_args.append(arg)
                    except UnicodeEncodeError:
                        # Replace problematic characters
                        safe_args.append(arg.encode('ascii', errors='replace').decode('ascii'))
                else:
                    safe_args.append(arg)
            else:
                safe_args.append(str(arg))
        
        # Use original stdout to avoid subprocess conflicts
        message = ' '.join(safe_args)
        _original_stdout.write(message + '\n')
        _original_stdout.flush()
    except Exception as e:
        # Ultimate fallback
        try:
            _original_stdout.write(' '.join(str(a) for a in args) + '\n')
            _original_stdout.flush()
        except Exception:
            pass

# Add python directory to path
sys.path.insert(0, str(Path(__file__).parent / "python"))

# Import configuration
try:
    from config import ODA_PATH, CONVERTED_DIR, NODE_EXE
except ImportError:
    # Fallback if config.py doesn't exist
    ODA_PATH = None
    CONVERTED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "converted"))
    NODE_EXE = "node"
    os.makedirs(CONVERTED_DIR, exist_ok=True)

from dwg_converter import DWGConverter
from dxf_extractor import DXFExtractor


def run_full_validation(dwg_file: str, oda_path: str = None, node_path: str = None, output_dir: str = None):
    """
    Complete workflow: DWG → DXF → JSON → Validation
    
    Args:
        dwg_file: Path to input DWG file
        oda_path: Path to ODA File Converter executable (uses config if None)
        node_path: Path to Node.js executable (uses config if None)
        output_dir: Output directory for converted files (uses CONVERTED_DIR if None)
    
    Returns:
        Path to validation result JSON file
    """
    # Use config defaults if not provided
    if oda_path is None:
        oda_path = ODA_PATH
    if node_path is None:
        node_path = NODE_EXE
    if output_dir is None:
        output_dir = CONVERTED_DIR
    
    if oda_path is None:
        raise ValueError("ODA_PATH must be provided either in config.py or as parameter")
    
    safe_print("=" * 60)
    safe_print("Architectural Schema Validation Pipeline")
    safe_print("=" * 60)
    safe_print(f"ODA Path: {oda_path}")
    safe_print(f"Output Dir: {output_dir}")
    safe_print(f"Node Path: {node_path}")
    
    dwg_path = Path(dwg_file)
    work_dir = Path(output_dir)
    work_dir.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Convert DWG to DXF
    safe_print("\n[Step 1] Converting DWG to DXF...")
    try:
        converter = DWGConverter(oda_path)
        dxf_file = converter.convert(dwg_file, str(work_dir))
        safe_print(f"[OK] DXF file created: {dxf_file}")
    except Exception as e:
        error_msg = f"[ERROR] Conversion failed: {e}"
        safe_print(error_msg)
        # Also write to stderr for API error capture
        try:
            _original_stderr.write(error_msg + "\n")
            _original_stderr.flush()
        except Exception:
            pass
        raise
    
    # Step 2: Extract elements from DXF
    safe_print("\n[Step 2] Extracting architectural elements from DXF...")
    try:
        extractor = DXFExtractor()
        json_file = extractor.extract_to_json(dxf_file)
        safe_print(f"[OK] Elements extracted: {json_file}")
        # Suppress detailed element output - only errors are shown
    except Exception as e:
        error_msg = f"[ERROR] Extraction failed: {e}"
        safe_print(error_msg)
        try:
            _original_stderr.write(error_msg + "\n")
            _original_stderr.flush()
        except Exception:
            pass
        raise
    
    # Step 3: Validate with Node.js
    safe_print("\n[Step 3] Validating schema with Node.js...")
    try:
        validator_script = Path(__file__).parent / "nodejs" / "validator.js"
        result_file = work_dir / "validation_result.json"
        
        cmd = [node_path, str(validator_script), str(json_file), str(result_file)]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            cwd=str(Path(__file__).parent)
        )
        
        if result.returncode != 0:
            # Node.js validation script failed (not validation failed, but script error)
            error_details = []
            if result.stderr:
                error_details.append(f"stderr: {result.stderr}")
            if result.stdout:
                error_details.append(f"stdout: {result.stdout}")
            if not error_details:
                error_details.append("No error output captured")
            
            error_msg = f"[ERROR] Node.js validation script failed: {', '.join(error_details)}"
            safe_print(error_msg)
            try:
                _original_stderr.write(error_msg + "\n")
                _original_stderr.flush()
            except Exception:
                pass
            raise RuntimeError(f"Node.js validation script error: {', '.join(error_details)}")
        
        # Suppress stdout - only show errors
        # Only print error messages from Node.js output
        if result.stdout:
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line and ('Error' in line or 'ERROR' in line or 'error' in line):
                    safe_print(f"[Node.js] {line}")
        
        safe_print(f"[OK] Validation complete: {result_file}")
        
        return str(result_file)
        
    except Exception as e:
        error_msg = f"[ERROR] Validation failed: {e}"
        safe_print(error_msg)
        # Also write to stderr for API error capture
        try:
            _original_stderr.write(error_msg + "\n")
            _original_stderr.flush()
        except Exception:
            pass
        raise


def main():
    """CLI interface for integration example."""
    if len(sys.argv) < 2:
        print("Usage: python integration_example.py <DWG_FILE> [ODA_PATH] [NODE_PATH] [OUTPUT_DIR]")
        print("\nExample:")
        print("  python integration_example.py plan.dwg")
        print("  python integration_example.py plan.dwg C:/ODA/ODAFileConverter.exe")
        print("\nNote: If ODA_PATH is not provided, it will use config.py settings")
        sys.exit(1)
    
    dwg_file = sys.argv[1]
    oda_path = sys.argv[2] if len(sys.argv) > 2 else None
    node_path = sys.argv[3] if len(sys.argv) > 3 else None
    output_dir = sys.argv[4] if len(sys.argv) > 4 else None
    
    try:
        result_file = run_full_validation(dwg_file, oda_path, node_path, output_dir)
        safe_print(f"\n[OK] Complete! Result saved to: {result_file}")
    except Exception as e:
        error_msg = f"\n[ERROR] Pipeline failed: {e}"
        try:
            _original_stderr.write(error_msg + "\n")
            _original_stderr.flush()
        except Exception:
            pass
        # Also use safe_print for console output
        safe_print(error_msg)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

