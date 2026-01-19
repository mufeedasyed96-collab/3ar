# Python Standalone DXF Validator

A Python-only standalone version of the architectural schema validator that accepts DXF files and validates them against building code rules. High-fidelity reporting and automated metadata extraction included.

## Features

- ✅ **Direct DXF Processing**: Native parsing without external dependencies or Node.js.
- ✅ **Human-Readable Reports**: Integrated `ReportFormatter` for beautiful, emoji-enriched compliance summaries.
- ✅ **Automated Metadata Extraction**: Automatically identifies **Owner Name**, **Plot Number**, and **Consultant** from CAD labels.
- ✅ **Smart Geometry Engine**: Detects visually closed polylines and HATCH elements for accurate area calculations.
- ✅ **Automatic Unit Handling**: Detects `INSUNITS` for seamless conversion between millimeters, centimeters, and meters.
- ✅ **RESTful API**: Multi-endpoint Flask server for integration with Postman or other services.

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Option 1: Console Script (Recommended)

Validate a DXF file from command line. The script automatically checks the local directory and the `uploads/` folder.

**1. Generate a human-readable report on screen:**
```bash
python console_validate.py plan.dxf
```

**2. Save the report to a text file:**
```bash
python console_validate.py plan.dxf report.txt
```

**3. Save machine-readable JSON results:**
```bash
python console_validate.py plan.dxf report.json
```

### Option 2: Flask API (Postman)

Start the API server:

```bash
python api.py
```

The API will run on `http://localhost:5000`

#### API Endpoints

**POST /api/validate**
- Upload DXF file via multipart/form-data (max 500MB)
- Or send JSON with `{"dxf_path": "path/to/file.dxf"}`

**POST /api/validate-from-elements**
- Send already extracted elements as JSON for faster validation of large files.

#### Postman Example

1. Create a POST request to `http://localhost:5000/api/validate`
2. In Body, select "form-data", add key "file" (type: File), and select your DXF.

### Option 3: Python Module

```python
from main_validator import SchemaValidator
from report_formatter import ReportFormatter

validator = SchemaValidator()
result = validator.validate_from_dxf("plan.dxf")

# Optional: Format as human-readable report
formatter = ReportFormatter(result)
print(formatter.format_report())
```

## Validated Articles

- **Article 5**: Basic Plot and Building Data (Areas, Coverage)
- **Article 6**: Building Line, Setbacks and Projections
- **Article 10**: Roof Floor
- **Article 13**: Stairs and Steps
- **Article 18**: Building Design Requirements
- **Article 19**: Residential Suites
- **Article 20**: Annex Building Requirements

## File Structure

```
python_standalone/
├── main_validator.py      # Main validator orchestrator
├── dxf_extractor.py       # Robust DXF file parser & metadata engine
├── report_formatter.py    # NEW: High-fidelity report generator
├── console_validate.py    # Updated CLI with smart path resolution
├── api.py                 # Flask API server
├── validators/            # Article-specific validation logic
├── uploads/               # Default directory for DXF drawings
└── requirements.txt       # Python dependencies
```

## Troubleshooting

**Import errors**: Run `pip install -r requirements.txt` to ensure all packages (GeoPandas, Shapely, ezdxf) are present.

**Large Files (100MB+)**: 
- The native parser is optimized for single-pass extraction.
- Processing a 170MB file takes approximately 90 seconds. 
- Use the JSON export option to save results for reuse.

**Unit Mismatch**: The system detects `INSUNITS` from the DXF header. If your drawing is "unitless", it defaults to Millimeters (most common in MENA region architectural drawings).

