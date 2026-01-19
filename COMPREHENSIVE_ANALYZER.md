# Comprehensive Plan Data Analyzer

A sophisticated analysis module that calculates or infers missing numeric values from extracted DXF/DWG plan data. Integrates with Ollama semantic interpretation for enhanced analysis.

## Overview

The Comprehensive Plan Analyzer provides:

1. **Calculation of Missing Values**:
   - Plot area from geometry
   - Building heights from text or worst-case inference
   - Projection dimensions (canopies, terraces, annexes)
   - Distances from plot boundary to buildings/annexes

2. **Semantic Interpretation**:
   - Uses Ollama for intelligent text analysis
   - Extracts height measurements from annotations
   - Identifies building elements and classifications

3. **Structured Output**:
   - JSON format ready for validation system
   - Status indicators (ok/computed/missing)
   - Detailed notes and assumptions

## Features

### 1. Plot Area Analysis
- Calculates from polygon vertices using Shoelace formula
- Falls back to metadata if available
- Status: `ok`, `computed`, or `missing`

### 2. Height Analysis
- Extracts from text labels (H=, height, elevation, etc.)
- Supports multiple units (meters, centimeters, feet, etc.)
- Infers worst-case height if missing
- Uses Ollama semantic interpretation when available

### 3. Distance Calculations
- Calculates minimum distance from building to plot boundary
- Uses geometric algorithms (point-to-segment distance)
- Handles complex polygon shapes

### 4. Projection Analysis
- Detects projection keywords (canopy, terrace, balcony, etc.)
- Calculates projection dimensions from geometry
- Estimates based on building-to-plot distance

### 5. Annex Analysis
- Identifies separate building structures (garages, annexes, etc.)
- Analyzes each annex independently
- Calculates dimensions and distances

## Usage

### Basic Usage

```python
from python.comprehensive_analyzer import ComprehensivePlanAnalyzer
import json

# Load extracted DXF data
with open('extracted_elements.json', 'r') as f:
    extracted_data = json.load(f)

# Create analyzer
analyzer = ComprehensivePlanAnalyzer(use_ollama=True, ollama_model="llama3.2")

# Analyze data
results = analyzer.analyze_extracted_data(extracted_data)

# Save results
with open('comprehensive_analysis.json', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(json.dumps(results, indent=2, ensure_ascii=False))
```

### Command Line Usage

```bash
# Analyze extracted JSON file
python python/comprehensive_analyzer.py extracted_elements.json

# Specify output file
python python/comprehensive_analyzer.py extracted_elements.json -o analysis_results.json

# Disable Ollama (use rule-based only)
python python/comprehensive_analyzer.py extracted_elements.json --no-ollama
```

### Integration with Extraction Pipeline

```python
from python.dxf_extractor import DXFExtractor
from python.comprehensive_analyzer import ComprehensivePlanAnalyzer

# Extract DXF data
extractor = DXFExtractor(use_ollama=True)
json_file = extractor.extract_to_json('plan.dxf')

# Load extracted data
with open(json_file, 'r') as f:
    extracted_data = json.load(f)

# Comprehensive analysis
analyzer = ComprehensivePlanAnalyzer(use_ollama=True)
results = analyzer.analyze_extracted_data(extracted_data)

# Save comprehensive analysis
with open('comprehensive_analysis.json', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
```

## Output Format

```json
{
  "plot_area": {
    "value": 500.0,
    "status": "computed"
  },
  "buildings": [
    {
      "id": "B1",
      "area_m2": 200.0,
      "height": {
        "value": 6.0,
        "status": "computed"
      },
      "projection": {
        "value": 1.5,
        "status": "computed"
      },
      "distance_to_plot": {
        "value": 2.0,
        "status": "computed"
      },
      "annexes": [
        {
          "id": "A1",
          "name": "garage",
          "area_m2": 18.0,
          "height": {
            "value": 6.0,
            "status": "computed"
          },
          "projection": {
            "value": null,
            "status": "missing"
          },
          "distance_to_plot": {
            "value": 1.5,
            "status": "computed"
          }
        }
      ]
    }
  ],
  "notes": "Plot area calculated from geometry: 500.00 m². Building height inferred: 6.0m (worst-case assumption). Projection dimension calculated: 1.5m. Extracted 1 height measurement(s) from text labels.",
  "analysis_timestamp": "2026-01-04T16:40:37.265000"
}
```

## Status Indicators

### `status: "ok"`
- Value was found in original data
- No calculation or inference needed
- Highest confidence

### `status: "computed"`
- Value was calculated from geometry or inferred
- May use worst-case assumptions
- Medium confidence

### `status: "missing"`
- Value could not be calculated or inferred
- Requires manual verification
- Low confidence

## Assumptions and Worst-Case Scenarios

### Height Inference
- **Residential**: 6.0m (typical maximum for single-family)
- **Commercial**: 12.0m (typical maximum for small commercial)
- **Mixed-Use**: 9.0m (typical maximum for mixed-use)
- **Default**: 6.0m

These are conservative worst-case assumptions based on typical building regulations.

### Projection Dimensions
- Detected from text keywords (canopy, terrace, balcony, etc.)
- Calculated from building-to-plot distance
- Conservative estimates (typically 1.5m for canopies, 0.5-2m for balconies)

## Geometric Calculations

### Polygon Area (Shoelace Formula)
```
Area = 0.5 × |Σ(xi × yi+1 - xi+1 × yi)|
```

### Distance to Plot Boundary
- Calculates minimum distance from building centroid to plot boundary
- Uses point-to-segment distance algorithm
- Handles complex polygon shapes

### Projection Dimension
- Based on building position relative to plot boundary
- Accounts for text annotations indicating projections
- Conservative estimates when exact dimensions unavailable

## Integration with Ollama

The analyzer uses Ollama semantic interpretation when available:

1. **Height Extraction**: Analyzes text labels semantically to extract height values
2. **Element Classification**: Identifies building elements and their types
3. **Text Analysis**: Interprets annotations and labels intelligently

If Ollama is unavailable, the system falls back to rule-based methods.

## Example Workflow

```python
# 1. Extract DXF data
from python.dxf_extractor import DXFExtractor

extractor = DXFExtractor(use_ollama=True)
json_file = extractor.extract_to_json('plan.dxf')

# 2. Load extracted data
import json
with open(json_file, 'r') as f:
    extracted_data = json.load(f)

# 3. Comprehensive analysis
from python.comprehensive_analyzer import ComprehensivePlanAnalyzer

analyzer = ComprehensivePlanAnalyzer(use_ollama=True)
results = analyzer.analyze_extracted_data(extracted_data)

# 4. Use results for validation
print(f"Plot Area: {results['plot_area']['value']} m² ({results['plot_area']['status']})")
for building in results['buildings']:
    print(f"Building {building['id']}:")
    print(f"  Height: {building['height']['value']}m ({building['height']['status']})")
    print(f"  Distance to Plot: {building['distance_to_plot']['value']}m ({building['distance_to_plot']['status']})")
    print(f"  Projection: {building['projection']['value']}m ({building['projection']['status']})")
```

## Error Handling

The analyzer handles errors gracefully:

- **Missing Data**: Returns `status: "missing"` for unavailable values
- **Invalid Geometry**: Skips calculations for invalid polygons
- **Ollama Unavailable**: Falls back to rule-based methods
- **Parsing Errors**: Continues with available data

## Limitations

1. **2D Plans Only**: Height extraction from text only, not from 3D geometry
2. **Text-Dependent**: Requires text labels for semantic analysis
3. **Assumptions**: Uses worst-case assumptions when data is missing
4. **Geometry Complexity**: May struggle with very complex polygon shapes

## Best Practices

1. **Enable Ollama**: Provides better semantic interpretation
2. **Review Notes**: Always check the `notes` field for assumptions
3. **Verify Missing Data**: Manually verify values with `status: "missing"`
4. **Check Confidence**: Prefer `status: "ok"` over `status: "computed"`
5. **Use Worst-Case**: Assume worst-case scenarios for compliance

## Future Enhancements

Potential improvements:
- Support for 3D geometry analysis
- Machine learning for better height inference
- Integration with building regulation databases
- Caching of analysis results
- Batch processing optimization

