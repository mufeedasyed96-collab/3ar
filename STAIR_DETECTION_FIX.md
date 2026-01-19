# Stair Detection Fix Summary

## Problem Identified

The Node.js validator was not detecting stairs because:

1. **DXF Extractor Limitation**: The `_extract_geometry` function in `python/dxf_extractor.py` only extracted closed polygons (POLYLINE, LWPOLYLINE, HATCH), but **LINE entities were not being extracted**.

2. **S-STRS Layer**: Stairs in the DXF file are stored as **LINE entities** in the `S-STRS` layer, not as closed polygons or text labels.

3. **Missing Elements**: Since LINE entities weren't extracted, stairs from S-STRS layer were not included in the elements array passed to the Node.js validator.

## Solution Implemented

### 1. Added LINE Entity Extraction

Modified `_extract_geometry` function to also extract LINE entities:
- Extracts start point (codes 10, 20) and end point (codes 11, 21)
- Converts LINE entities to small rectangles (width = 1.2m typical stair width) for area calculation
- Includes LINE entities in geometry data

### 2. Added Stair Extraction from Layer

Created `_extract_stairs_from_layer` function:
- Extracts geometry from S-STRS, STAIRS, STAIR, STEPS layers
- Filters by reasonable stair dimensions (0.5-50 m² area, 0.8-5.0m width)
- Creates stair elements with normalized name "stairs" and layer info

### 3. Integration

Added stair extraction as "Third pass" in `parse_dxf`:
- Extracts stairs from S-STRS layer even without text labels
- Adds them to elements array before unlabeled geometry extraction

## Debug Script

Created `python/debug_stair_detection.py`:
- Checks elements against Node.js validator stair detection criteria
- Shows which elements are detected as stairs
- Identifies potential stairs by geometry
- Reports excluded elements

## Testing

Run debug script:
```bash
python python/debug_stair_detection.py converted/888MOD20_1_elements.json
```

Expected results:
- Stairs from S-STRS layer should now be extracted
- Elements with "stairs" name or S-STRS layer should appear
- Node.js validator should detect stairs for Article 13 validation

## Next Steps

1. ✅ **Completed**: LINE entity extraction
2. ✅ **Completed**: Stair extraction from S-STRS layer
3. ⚠️ **Pending**: Test with actual DXF file extraction
4. ⚠️ **Pending**: Verify Node.js validator detects stairs correctly

## Notes

- LINE entities are converted to rectangles for area calculation (approximation)
- Stair width is estimated as 1.2m (typical residential stair width)
- Actual stair dimensions should be measured from geometry if available
- The Article 13 validator (`python/article13_stairs_validator.py`) uses `ezdxf` and can detect stairs directly from DXF, but the Node.js validator relies on extracted elements

