# Quick Start Guide

## Prerequisites Check

1. **Python 3.7+** installed
   ```bash
   python --version
   ```

2. **Node.js 14+** installed
   ```bash
   node --version
   ```

3. **ODA File Converter** installed
   - Download: https://www.opendesign.com/guestfiles/oda_file_converter
   - Note the path (e.g., `C:/ODA/ODAFileConverter.exe`)

## Installation (30 seconds)

```bash
# Install Node.js dependencies
npm install
```

Python validation now runs from `python_standalone/`, so you also need its Python dependencies:

```bash
pip install -r python_standalone/requirements.txt
```

## Quick Test

### 1. Test API Server

```bash
# Start server
npm run api

# In another terminal, test with curl:
curl -X POST http://localhost:6670/api/validate \
  -H "Content-Type: application/json" \
  -d @test/sample_elements.json
```

### 2. Full Pipeline (if you have a DWG file)

```bash
# Start server
npm run api

# Upload DWG
curl -X POST http://localhost:6670/api/validate-dwg \
  -F "dwg=@your_plan.dwg"
```

## Example Workflow

### Step 1: Convert DWG → DXF
```bash
python python/dwg_converter.py "C:/Program Files/ODA/ODAFileConverter 26.10.0/ODAFileConverter.exe" plan.dwg converted
```

### Step 2: Validate DXF (Extraction + Validation in Python Standalone)
```bash
python python_standalone/cli_validate_json.py --dxf plan.dxf > validation_result.json
```

## Postman Collection

Use the example in `examples/postman_example.json` as a reference for API responses.

**Endpoint:** `POST http://localhost:6670/api/validate`

**Body:**
```json
{
  "elements": [
    { "name": "main_hall", "area": 25, "width": 4.2, "ventilation": "natural" },
    { "name": "kitchen", "area": 12, "width": 3.5, "ventilation": "natural" }
  ]
}
```

## Troubleshooting

**"ODA File Converter not found"**
- Provide full absolute path: `C:/ODA/ODAFileConverter.exe` (Windows) or `/usr/bin/ODAFileConverter` (Linux)

**"Python path / ODA path on server"**
- Set env vars before starting Node:
  - `PYTHON_EXE` (full path to `python.exe`)
  - `ODA_PATH` (full path to `ODAFileConverter.exe`)

**"Python script not found"**
- Ensure you're running from project root
- Use: `python python_standalone/cli_validate_json.py ...`

