# System Architecture

## Overview

This system validates DWG architectural schemas through a two-stage pipeline:
1. **Python**: DWG → DXF conversion and element extraction
2. **Node.js**: Rule validation and schema pass/fail determination

## Data Flow

```
┌─────────────┐
│  DWG File   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Python: DWG Converter          │
│  - Uses ODA File Converter      │
│  - Handles large files          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────┐
│  DXF File   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Python: DXF Extractor          │
│  - Single traversal             │
│  - Name normalization           │
│  - Deduplication                │
│  - JSON export                  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  JSON Elements      │
│  [                   │
│    {                 │
│      "name": "...",  │
│      "area": 25,     │
│      "width": 4.2,   │
│      "ventilation":  │
│    }                 │
│  ]                   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Node.js: Schema Validator       │
│  - Rule evaluation               │
│  - Required element check        │
│  - Deduplication                 │
│  - Pass/fail determination       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Validation Result (JSON)        │
│  {                               │
│    "schema_pass": true,          │
│    "element_results": [...]      │
│  }                               │
└─────────────────────────────────┘
```

## Components

### Python Components

#### 1. `dwg_converter.py`
- **Purpose**: Convert DWG to DXF using ODA File Converter
- **Key Features**:
  - Handles large files with timeout protection
  - Error handling and cleanup
  - Configurable output directory

#### 2. `dxf_extractor.py`
- **Purpose**: Parse DXF and extract architectural elements
- **Key Features**:
  - **Single Traversal**: One pass through DXF file for efficiency
  - **Name Normalization**: Uses NAME_MAP and PARTIAL_RULES
  - **Deduplication**: Prevents duplicate elements
  - **Deterministic**: Same DXF → same output
  - **Large File Support**: Efficient line-by-line processing

### Node.js Components

#### 1. `config.js`
- **Purpose**: Centralized validation rules
- **Contains**:
  - Global rules (min_area_m2, min_width_m)
  - Required elements (basic_elements)
  - Optional elements (additional_elements)
  - Element-specific overrides (element_rules)

#### 2. `validator.js`
- **Purpose**: Validate extracted elements against rules
- **Key Features**:
  - **Deduplication**: Removes duplicate elements
  - **Rule Evaluation**: Checks area, width, ventilation
  - **Required Element Check**: Ensures all basic_elements present
  - **Schema Pass/Fail**: Determines overall schema validity
  - **Postman-ready Output**: Standardized JSON format

## Key Design Decisions

### 1. Single Traversal
- DXF parser reads file once, extracting all data in one pass
- Reduces I/O operations and memory usage
- Critical for large files

### 2. Deduplication Strategy
- **Python**: Uses Set to track seen element names during extraction
- **Node.js**: Deduplicates before validation to ensure accuracy
- Prevents false positives from duplicate entries

### 3. Name Normalization
- Two-stage approach:
  1. Exact match against NAME_MAP
  2. Pattern matching with PARTIAL_RULES
- Ensures consistent element naming across different DXF sources

### 4. Deterministic Results
- No randomness in processing
- Same DXF file always produces same validation
- Critical for reproducible validation

### 5. Performance Optimization
- Streaming file reading (line-by-line)
- Minimal memory footprint
- Efficient string operations
- No unnecessary data structures

## Validation Rules

### Global Rules
- `min_area_m2`: 10.0 m² (default)
- `min_width_m`: 2.5 m (default)
- `ventilation`: ["natural", "mechanical"]

### Required Elements
Must be present for schema to pass:
- main_hall
- bedroom
- kitchen
- bathroom

### Element-Specific Rules
Override global rules when present:
- Example: `main_hall` requires 20.0 m² area (vs 10.0 default)
- Example: `corridor` requires only 1.2 m width (vs 2.5 default)

## API Design

### Endpoints

**POST /api/validate**
- Input: JSON with elements or json_path
- Output: Postman-ready validation result
- Use case: Quick validation check

**POST /api/validate-full**
- Input: Same as above
- Output: Complete result with summary
- Use case: Detailed validation report

**GET /api/health**
- Output: Service status
- Use case: Health monitoring

**GET /api/config**
- Output: Current validation configuration
- Use case: Configuration inspection

## Error Handling

### Python
- FileNotFoundError: Missing DWG/DXF files
- RuntimeError: Conversion failures
- Graceful degradation: Missing data uses defaults

### Node.js
- ENOENT: Missing JSON files
- SyntaxError: Invalid JSON
- Validation errors: Detailed in element_results

## Testing

### Test Coverage
- Element validation
- Deduplication
- Required element checking
- File-based validation
- Error handling

### Test Files
- `test/sample_elements.json`: Sample input data
- `test/validator_test.js`: Comprehensive test suite

## Performance Characteristics

### Time Complexity
- DXF Parsing: O(n) where n = file size
- Validation: O(m) where m = number of elements
- Deduplication: O(m) using Set

### Space Complexity
- DXF Parsing: O(m) for element storage
- Validation: O(m) for result storage
- Minimal memory footprint

### Scalability
- Handles files up to several GB
- Efficient for 100+ elements
- Suitable for production use

## Security Considerations

- No code execution from user input
- File path validation
- Timeout protection for external tools
- Error message sanitization

## Future Enhancements

Potential improvements:
1. Caching for repeated validations
2. Parallel processing for multiple files
3. Database storage for validation history
4. WebSocket support for real-time validation
5. Enhanced DXF parsing with ezdxf library

