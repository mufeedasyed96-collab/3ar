# MiYar Backend - Architectural Validation System

Complete backend system for validating architectural plans against Abu Dhabi building regulations. The system processes DWG files, extracts architectural elements, and validates them against multiple articles of the Private Residence Guide.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Article Validators](#article-validators)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Node.js Integration](#nodejs-integration)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Response Format](#response-format)

---

## 🏗️ Architecture Overview

```
DWG File Upload
    ↓
[Python] DWG → DXF Converter (ODA File Converter)
    ↓
DXF File
    ↓
[Python Standalone] DXF Extraction + Validation (python_standalone)
    ↓
Validation Result (JSON Response)
```

### Technology Stack

- **Node.js 14+**: Express API server only (HTTP wrapper)
- **Python**: DWG→DXF conversion + DXF extraction + validation (all rules)
- **ODA File Converter**: DWG to DXF conversion

---

## 📁 Project Structure

```
miyar_backend/
├── api_example.js              # Express.js API server (main entry point)
├── config.py                    # Legacy python config (kept for older scripts)
├── integration_example.py      # Legacy full pipeline script (kept for reference)
├── package.json                # Node.js dependencies
├── requirements.txt            # Python dependencies
│
├── python/                     # Python extraction scripts
│   ├── dwg_converter.py        # DWG → DXF conversion
│   ├── dxf_extractor.py        # DXF element extraction
│   ├── comprehensive_validator.py  # Comprehensive DXF validation
│   └── [other validators]      # Additional Python validators
│
├── python_standalone/          # Python-only DXF extraction + validation (current engine)
│   ├── main_validator.py       # Orchestrator (SchemaValidator)
│   ├── validators/             # Article validators
│   └── cli_validate_json.py    # Machine-friendly CLI (JSON stdout)
│
├── converted/                  # Output directory for converted files
├── uploads/                    # Temporary upload directory
└── test/                       # Test files
```

---

## 📚 Article Validators

All article validators are implemented in **Python** under `python_standalone/`:

- **Orchestrator**: `python_standalone/main_validator.py` (`SchemaValidator`)
- **Article implementations**: `python_standalone/validators/`
- **DXF extraction + metadata**: `python_standalone/dxf_extractor.py`

Node.js is only used to run the HTTP server and call the Python validator.

---

## 🚀 Installation

### Prerequisites

1. **Node.js 14.0+** and npm
2. **Python 3.7+**
3. **ODA File Converter** (for DWG conversion)

### Step 1: Install Node.js Dependencies

```bash
cd miyar_backend
npm install
```

**Dependencies:**
- `express` - Web framework
- `multer` - File upload handling
- `cors` - Cross-origin resource sharing

### Step 2: Install Python Dependencies

```bash
pip install -r python_standalone/requirements.txt
```

**Key Dependencies:**
- `ezdxf` - DXF parsing
- `shapely` / `geopandas` - geometry + spatial rules (some articles)

### Step 3: Configure ODA File Converter

Edit `config.py` and set your ODA File Converter path:

```python
ODA_PATH = "C:/ODA/ODAFileConverter.exe"  # Windows
# or
ODA_PATH = "/path/to/ODAFileConverter"     # Linux/Mac
```

---

## 🌐 API Endpoints

### Main API Server

**File**: `api_example.js`  
**Port**: 4448 (default, configurable via `PORT` env variable)

### Runtime Configuration (recommended)

Set these environment variables before starting the Node server:

- `PYTHON_EXE`: Full path to the Python executable (e.g. `C:\Path\to\python.exe`)
- `ODA_PATH`: Full path to ODA File Converter (e.g. `C:\Program Files\ODA\...\ODAFileConverter.exe`)

### Endpoints

#### 1. **POST /api/validate-dwg**

Upload and validate a DWG file.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field name: `dwg` (file upload)

**Response:**
```json
{
  "schema_pass": true,
  "element_results": [...],
  "article_5_results": [...],
  "article_6_results": [...],
  ...
  "summary": {...},
  "article_instances": {...},
  "schema_status": "PASS"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:6670/api/validate-dwg \
  -F "dwg=@plan.dwg"
```

#### 2. **POST /api/validate**

Validate elements from JSON file or direct JSON.

**Request:**
```json
{
  "json_path": "path/to/elements.json"
}
```
or
```json
{
  "elements": [
    { "name": "main_hall", "area": 25, "width": 4.2 }
  ]
}
```

**Response:**
```json
{
  "schema_pass": true,
  "element_results": [...],
  "summary": {...}
}
```

#### 3. **GET /api/health**

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 4. **GET /api/config**

Get current validation configuration.

**Response:**
```json
{
  "articles": [...],
  "article_id": "11",
  "title_en": "...",
  "rules": [...]
}
```

---

## 🔌 Node.js Integration

### Validation engine runs in Python (programmatic)

```python
from python_standalone.main_validator import SchemaValidator

validator = SchemaValidator()
result = validator.validate_from_dxf("plan.dxf")
print(result["schema_pass"])
```

### API Server Usage

```javascript
// Start server
const express = require('express');
const app = express();
const { spawn } = require('child_process');

app.post('/api/validate', (req, res) => {
  // See api_example.js for the full implementation:
  // Node is only the HTTP wrapper; python_standalone does extraction + validation.
  res.status(501).json({ error: "Use api_example.js implementation" });
});

app.listen(4448, () => {
  console.log('Server running on port 4448');
});
```

---

## ⚙️ Configuration

### Article Rules Configuration

**File**: `python_standalone/config.py`

Each article has:
- `article_id`: Article number (e.g., "5", "6", "14")
- `title_en`: English title
- `title_ar`: Arabic title
- `rules`: Array of rule objects

**Example (Article 5):**
```javascript
{
  article_id: "5",
  title_en: "Building Coverage and Floor Area",
  title_ar: "نسبة البناء والمساحة الطابقية",
  rules: [
    {
      rule_id: "5.1",
      description_en: "Building coverage must not exceed 70%",
      rule_type: "percentage",
      max_value: 70
    }
  ]
}
```

### Python Configuration

Configured via environment variables (used by `api_example.js`):

- `PYTHON_EXE`: full path to `python.exe`
- `ODA_PATH`: full path to `ODAFileConverter.exe`

---

## 📖 Usage Examples

### Example 1: Full Pipeline (DWG → Validation)

```bash
# Start API server
node api_example.js

# Upload DWG file (from frontend or Postman)
POST http://localhost:6670/api/validate-dwg
Body: multipart/form-data with "dwg" field
```

### Example 2: Validate Existing JSON

```bash
# Using API (elements payload or extracted JSON)
POST http://localhost:6670/api/validate
Body: { "json_path": "converted/plan_elements.json" }
```

### Example 3: Programmatic Validation

```bash
# Validate a DXF directly (Python standalone)
python python_standalone/cli_validate_json.py --dxf plan.dxf > validation_result.json
```

---

## 📊 Response Format

### Complete Validation Response

The response includes `article_*_results` arrays and a `summary` object. The current ordering used by the backend is:
**5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18, 19, 20, 14**

```json
{
  "schema_pass": true,
  "element_results": [...],
  
  // Articles in backend order
  "article_5_results": [
    {
      "element": "Article 5 - 5.1",
      "rule_id": "5.1",
      "pass": true,
      "details": {...}
    }
  ],
  "article_6_results": [...],
  "article_7_results": [...],
  "article_8_results": [...],
  "article_9_results": [...],
  "article_10_results": [...],
  "article_11_results": [...],
  "article_12_results": [...],
  "article_13_results": [...],
  "article_15_results": [...],
  "article_18_results": [...],
  "article_19_results": [...],
  "article_20_results": [...],
  "article_14_results": [...],
  
  "summary": {
    "total_element_types": 10,
    "passed_element_types": 8,
    "failed_element_types": 2,
    "article_5_pass": true,
    "article_5_total_rules": 4,
    "article_5_passed_rules": 4,
    "article_5_failed_rules": 0,
    // ... similar for all articles
  },
  
  "article_instances": {
    "article_5": {
      "passed_instances": 4,
      "failed_instances": 0
    },
    "article_6": {
      "passed_instances": 6,
      "failed_instances": 0
    },
    // ... for all articles
  },
  
  "schema_status": "PASS"
}
```

### Article Result Structure

Each article result contains:

```json
{
  "element": "Article 5 - 5.1",
  "rule_id": "5.1",
  "description_en": "Building coverage must not exceed 70%",
  "description_ar": "...",
  "pass": true,
  "total_instances": 1,
  "passed_instances": 1,
  "failed_instances": 0,
  "details": {
    "rule_type": "percentage",
    "status": "PASS",
    "reason": "PASS: Building coverage 45% is within limit of 70%",
    "coverage_percent": 45,
    "max_allowed_percent": 70
  }
}
```

---

## 🔍 Validator Details

The validation engine lives in `python_standalone/`:

- **Entrypoint**: `python_standalone/main_validator.py` (`SchemaValidator.validate_from_dxf()` and `validate_schema()`).
- **Article implementations**: `python_standalone/validators/` (one module per article).
- **DXF extraction + metadata**: `python_standalone/dxf_extractor.py`.

---

## 🛠️ Running the Backend

### Development Mode

```bash
# Start API server
npm run api
# or
node api_example.js

# Server runs on http://localhost:6670
```

### Production Mode

```bash
# Set environment variables
export PORT=6670
export NODE_ENV=production

# Start server
node api_example.js
```

### With Auto-reload (Development)

```bash
# Install nodemon globally
npm install -g nodemon

# Run with auto-reload
nodemon api_example.js
```

---

## 🔗 Frontend Integration

### API Base URL

Set in frontend `.env`:
```
VITE_API_URL=http://localhost:6670
```

### Frontend API Call

```typescript
// miyar_frontend/src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6670';

export async function uploadPlan(file: File) {
  const formData = new FormData();
  formData.append("dwg", file);

  const res = await fetch(`${API_BASE_URL}/api/validate-dwg`, {
    method: "POST",
    body: formData
  });

  return res.json();
}
```

---

## 📝 Adding New Articles

1. **Add/extend the article schema** in `python_standalone/config.py`.
2. **Implement the validator** under `python_standalone/validators/` (create `articleXX_validator.py`).
3. **Wire it into the orchestrator** in `python_standalone/main_validator.py` (import + call it, then map to `article_XX_results`).

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 4448 | 
  Select-Object -ExpandProperty OwningProcess | 
  ForEach-Object { Stop-Process -Id $_ -Force }

# Or use different port
PORT=3001 node api_example.js
```

### Python Not Found

- Ensure Python is in PATH
- Or set full path via env var: `PYTHON_EXE="C:\Path\to\python.exe"` (used by `api_example.js`)

### ODA Converter Not Found

- Download from: https://www.opendesign.com/guestfiles/oda_file_converter
- Set full path via env var: `ODA_PATH="C:\Program Files\ODA\...\ODAFileConverter.exe"`

### Validation Errors

- Check element names match normalization rules
- Verify required metadata is provided
- Review article-specific requirements in `python_standalone/config.py`

---

## 📄 License

MIT

---

## 📞 Support

For issues or questions:
1. Check `ARCHITECTURE.md` for system design
2. Review `CONFIG_REFERENCE.md` for configuration details
3. See `POSTMAN_GUIDE.md` for API examples
