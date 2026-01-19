# Roof Plan Data Extraction

## Overview
This document describes all data that can be extracted from roof plan DXF/DWG files. The extraction focuses on identifying occupied areas (areas with labels/text) and empty areas (areas without labels/text).

## Key Principle
**If the roof plan has no label or text, it is considered empty.**

## 1. Roof Surface Area

### 1.1 Total Roof Area
- **Source**: Largest closed polygon on roof-related layers
- **Layer Keywords**: `roof`, `rooftop`, `surface`, `سطح`, `terrace`, `roof floor`
- **Calculation**: Sum of all roof polygon areas (in m²)
- **Unit Conversion**: Based on DXF `$INSUNITS` (typically 4 = millimeters, 6 = meters)
- **Area Range**: 1.0 m² to 10,000 m² (filtered to exclude unrealistic sizes)

### 1.2 First Floor Roof Area
- **Source**: Largest roof polygon (assumed to be first floor roof)
- **Purpose**: Used as reference for calculating coverage percentages
- **Calculation**: `max(roof_polygon_areas)`

## 2. Occupied Areas (Areas with Labels/Text)

### 2.1 Roof Floor Buildings
- **Definition**: Closed polygons on roof that have associated text labels
- **Layer Keywords**: `roof room`, `roof building`, `roof structure`, `roof floor room`
- **Identification**: 
  - Geometry on roof-related layers with text labels nearby
  - Layers containing both roof keywords AND building/room keywords
- **Data Extracted**:
  - Area (m²)
  - Layer name
  - Vertices (coordinates)
  - Associated text label (if available)
  - Position (X, Y coordinates of label)

### 2.2 Labeled Roof Elements
- **Types**: Rooms, structures, buildings on roof floor
- **Detection Method**: 
  - Extract all TEXT and MTEXT entities from DXF
  - Match text labels to nearby geometry polygons
  - If geometry has a label → considered "occupied"
- **Data Extracted**:
  - Element name (from text label)
  - Area (m²)
  - Width (m)
  - Position (X, Y coordinates)
  - Layer name

### 2.3 Total Occupied Area
- **Calculation**: Sum of all labeled roof building areas
- **Formula**: `total_occupied_area = Σ(roof_building_areas)`
- **Purpose**: Calculate how much of the roof is already occupied

## 3. Empty Areas (Areas without Labels/Text)

### 3.1 Unlabeled Roof Geometry
- **Definition**: Closed polygons on roof layers that have NO associated text labels
- **Identification**:
  - Geometry on roof-related layers
  - No nearby text labels within matching distance
  - Considered "empty" or "open" space
- **Data Extracted**:
  - Area (m²)
  - Layer name
  - Vertices (coordinates)
  - Status: "unlabeled" or "empty"

### 3.2 Open Roof Area
- **Calculation**: Total roof area minus occupied area
- **Formula**: `open_roof_area = total_roof_area - total_occupied_area`
- **Purpose**: Calculate available/open space on roof

## 4. Parapets

### 4.1 Parapet Geometry
- **Layer Keywords**: `parapet`, `dروة`, `drowa`, `railing`, `barrier`, `edge`
- **Data Extracted**:
  - Area (m²)
  - Layer name
  - Vertices (coordinates)
  - Count (number of parapet polygons)

### 4.2 Parapet Location
- **Purpose**: Identify parapets around open roof areas
- **Note**: Height validation requires elevation data (not available from 2D plan)

## 5. Coverage Calculations

### 5.1 Roof Building Coverage
- **Formula**: `coverage_percent = (total_occupied_area / first_floor_roof_area) × 100`
- **Purpose**: Calculate percentage of roof occupied by buildings
- **Maximum Allowed**: 70% (per Article 10.1)

### 5.2 Open Roof Percentage
- **Formula**: `open_percent = (open_roof_area / first_floor_roof_area) × 100`
- **Purpose**: Calculate percentage of roof that is open/unoccupied
- **Minimum Required**: 30% (per Article 10.3)

## 6. Data Structure

### 6.1 Roof Geometry Data
```json
{
  "roof_polygons": [
    {
      "area_m2": 150.5,
      "layer": "ROOF",
      "vertices": [[x1, y1], [x2, y2], ...],
      "has_label": false
    }
  ],
  "roof_building_polygons": [
    {
      "area_m2": 45.2,
      "layer": "ROOF_ROOM",
      "vertices": [[x1, y1], [x2, y2], ...],
      "label": "ROOF ROOM 1",
      "has_label": true
    }
  ],
  "parapet_polygons": [
    {
      "area_m2": 2.5,
      "layer": "PARAPET",
      "vertices": [[x1, y1], [x2, y2], ...]
    }
  ],
  "total_roof_area_m2": 150.5,
  "first_floor_roof_area_m2": 150.5,
  "total_occupied_area_m2": 45.2,
  "open_roof_area_m2": 105.3,
  "coverage_percent": 30.0,
  "open_percent": 70.0,
  "insunits": 4
}
```

### 6.2 Labeled Elements Data
```json
{
  "labeled_elements": [
    {
      "name": "roof_room",
      "original_label": "ROOF ROOM 1",
      "area": 45.2,
      "width": 5.0,
      "x": 1234.5,
      "y": 5678.9,
      "layer": "ROOF_ROOM"
    }
  ],
  "unlabeled_geometry": [
    {
      "name": "unlabeled",
      "is_unlabeled": true,
      "area": 105.3,
      "layer": "ROOF"
    }
  ]
}
```

## 7. Extraction Process

### 7.1 Step 1: Extract Geometry
- Read all POLYLINE, LWPOLYLINE, and HATCH entities
- Filter for closed polygons
- Calculate area using shoelace formula
- Convert units based on `$INSUNITS`

### 7.2 Step 2: Extract Text Labels
- Read all TEXT and MTEXT entities
- Extract text content and position
- Match text labels to nearby geometry

### 7.3 Step 3: Classify Roof Elements
- **Roof Surface**: Largest polygon on roof layers
- **Roof Buildings**: Geometry with labels on roof layers
- **Empty Areas**: Geometry without labels on roof layers
- **Parapets**: Geometry on parapet layers

### 7.4 Step 4: Calculate Areas
- Total roof area: Sum of roof polygons
- Occupied area: Sum of labeled roof building polygons
- Open area: Total roof area - Occupied area
- Coverage percentage: (Occupied / Total) × 100

## 8. Important Notes

### 8.1 Empty vs Occupied
- **Occupied**: Has text label → counted as roof building
- **Empty**: No text label → counted as open space
- **Rule**: If roof plan has no label or text, it is considered empty

### 8.2 Unit Conversion
- DXF files may use different units (mm, cm, m, inches, feet)
- Check `$INSUNITS` value:
  - 1 = inches
  - 2 = feet
  - 3 = centimeters
  - 4 = millimeters (most common)
  - 6 = meters
- All extracted areas are converted to m²

### 8.3 Area Filtering
- Very small areas (< 1.0 m²): Filtered out (likely noise)
- Very large areas (> 10,000 m²): Filtered out (likely plot boundary or error)

### 8.4 Label Matching
- Text labels are matched to geometry based on:
  - Distance from text position to geometry centroid
  - Same layer preference
  - Closest geometry within reasonable distance

## 9. Limitations

### 9.1 Elevation Data
- Roof plan is 2D, so elevation/height data is not available
- Parapet height validation requires elevation data (manual verification)

### 9.2 Projection Detection
- Non-structural projections ≤ 30cm are excluded from coverage
- Detection requires detailed geometry analysis (may require manual verification)

### 9.3 Label Accuracy
- If labels are missing or incorrectly placed, classification may be inaccurate
- Manual verification recommended for critical cases

## 10. Summary

### Extractable Data:
1. ✅ Total roof area (m²)
2. ✅ First floor roof area (m²)
3. ✅ Occupied area (labeled roof buildings) (m²)
4. ✅ Empty/open area (unlabeled geometry) (m²)
5. ✅ Coverage percentage (%)
6. ✅ Open roof percentage (%)
7. ✅ Parapet count and areas
8. ✅ Labeled roof elements (names, areas, positions)
9. ✅ Unlabeled roof geometry (areas, positions)

### Not Extractable (Requires Manual Verification):
1. ❌ Parapet heights (requires elevation data)
2. ❌ Non-structural projection distances (requires detailed geometry)
3. ❌ Continuous open area verification (requires spatial analysis)

