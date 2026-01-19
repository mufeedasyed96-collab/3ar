# Car and Parking Detection from Ground Floor Plan

## Overview
This document describes all car and parking-related data that can be extracted from ground floor DXF/DWG files. The extraction focuses on identifying vehicle entrances, parking spaces, garage areas, and car-related elements.

## Key Principle
**If car shapes, parking areas, or vehicle entrances are present in the ground floor plan, they should be detected and validated against Article 15 rules.**

## 1. Vehicle Entrance Detection

### 1.1 Detection Methods
Vehicle entrances are detected using multiple methods:

#### Method 1: Explicit Keywords
- **Element Names/Labels**: `vehicle entrance`, `car entrance`, `vehicular entrance`, `car gate`, `vehicle gate`
- **Arabic**: `مدخل السيارات`, `مدخل السيارة`, `بوابة السيارات`, `مدخل الكراج`
- **Block Names**: `vehicle_entrance`, `car_entrance`, `garage_entrance`

#### Method 2: Layer Names
- **Layer Keywords**: Elements on layers named:
  - `Vehicle Entrance` / `مدخل السيارات`
  - `Car Entrance` / `مدخل السيارة`
  - `Garage Entrance` / `مدخل الكراج`
  - `Vehicle Gate` / `بوابة السيارات`

#### Method 3: Car-Related Keywords
- **Keywords**: `car`, `cars`, `vehicle`, `vehicles`, `vehicular`, `auto`, `automobile`
- **Arabic**: `سيارة`, `سيارات`, `مركبة`, `مركبات`, `عربة`
- **Detection**: If element name, label, or layer contains car-related keywords
- **Dimension Validation**: Width should be 2.5-7m (vehicle entrance range)

#### Method 4: Garage/Parking Keywords
- **Keywords**: `garage`, `كراج`, `موقف`, `parking`, `parking space`, `parking area`
- **Detection**: Garage elements with entrance dimensions (width 2.5-7m)
- **Context**: Must have entrance/door/gate context or reasonable dimensions

### 1.2 Dimension Requirements
- **Minimum Width**: 3.0m (Article 15.2b)
- **Maximum Width**: 6.0m (Article 15.2b)
- **Validation Range**: 2.5-7.0m (with tolerance for detection)
- **Unit Conversion**: Based on DXF `$INSUNITS` (typically 4 = millimeters, 6 = meters)

### 1.3 Data Extracted
- **Count**: Number of vehicle entrances detected
- **Width**: Entrance width in meters (normalized)
- **Type**: Garage entrance vs. non-garage vehicle entrance
- **Layer**: DXF layer name
- **Position**: Element position (if available)
- **Label**: Original text label from DXF

## 2. Parking Space Detection

### 2.1 Parking Area Identification
- **Keywords**: `parking`, `parking space`, `parking area`, `موقف`, `مواقف`
- **Layer Names**: Elements on layers containing parking keywords
- **Geometry**: Closed polygons representing parking spaces
- **Car Shapes**: Unlabeled geometry that might represent car outlines

### 2.2 Parking Space Properties
- **Area**: Parking space area in m²
- **Width**: Parking space width (typically 2.5-3.0m per space)
- **Count**: Number of parking spaces (estimated from area)
- **Location**: Position relative to building and plot boundary

### 2.3 Car Shape Detection
- **Unlabeled Geometry**: Closed polygons without text labels
- **Dimensions**: Typical car dimensions (4-5m length, 1.8-2.0m width)
- **Area Range**: 5-15 m² per car space
- **Visual Indicators**: Car outline shapes in garage/parking areas

## 3. Garage Detection

### 3.1 Garage Identification
- **Keywords**: `garage`, `كراج`, `parking`, `موقف`
- **Layer Names**: Elements on garage-related layers
- **Element Names**: Normalized to `garage` type
- **Context**: Garage areas typically have vehicle entrances

### 3.2 Garage Properties
- **Area**: Garage area in m²
- **Width**: Garage entrance width (3-6m for vehicle entrance)
- **Count**: Number of garage spaces
- **Entrance Type**: Garage entrance (exempt from separation requirement per Article 15.2a)

### 3.3 Garage Entrance Separation
- **Rule**: Garage entrances are exempt from 6m separation requirement
- **Non-Garage Vehicle Entrances**: Must be minimum 6m apart
- **Detection**: Separates garage entrances from other vehicle entrances

## 4. Ground Floor Specific Detection

### 4.1 Floor Identification
- **Label Keywords**: `ground`, `ground floor`, `G`, `GF`, `أرضي`, `دور أرضي`
- **Layer Names**: Layers containing ground floor indicators
- **Context**: Elements on ground floor are checked for car/parking detection

### 4.2 Ground Floor Car Elements
- **Vehicle Entrances**: Typically located on ground floor
- **Parking Areas**: Usually on ground floor or basement
- **Garage Spaces**: Ground floor or basement level
- **Car Shapes**: Visual car outlines in parking/garage areas

## 5. Extracted Data Structure

### 5.1 Element Properties (from DXF Extraction)
Each element extracted from DXF contains the following properties:

```json
{
  "name": "garage",                    // Normalized element name (from NAME_MAP or PARTIAL_RULES)
  "area": 18.0,                        // Area in m² (extracted from geometry or estimated)
  "width": 3.2,                        // Width in m (extracted from geometry or estimated)
  "ventilation": "natural",            // Ventilation type (default: "natural")
  "original_label": "GARAGE",           // Original text label from DXF
  "layer": "GARAGE_LAYER",             // DXF layer name (if available)
  "is_unlabeled": false,                // true if element has no text label
  "vertices": [[x1, y1], [x2, y2], ...] // Polygon vertices (for unlabeled geometry)
}
```

### 5.2 Garage Element Defaults
When garage elements are detected but geometry is missing, default values are used:

```json
{
  "name": "garage",
  "area": 18.0,    // Default garage area estimate (m²)
  "width": 3.2     // Default garage width estimate (m)
}
```

**Source**: `python/dxf_extractor.py` - `_estimate_area()` and `_estimate_width()` methods

### 5.3 Vehicle Entrance Detection Data
After detection and validation, vehicle entrances contain:

```json
{
  "vehicle_entrances": [
    {
      "name": "garage",                 // Normalized name: "garage" or detected type
      "original_label": "GARAGE",        // Original DXF text label
      "layer": "GARAGE_LAYER",          // DXF layer name
      "width": 4.5,                     // Width in meters (normalized from INSUNITS)
      "area": 18.0,                     // Area in m²
      "ventilation": "natural",         // Ventilation type
      "floor": "ground_floor",          // Floor level (extracted from label)
      "detection_method": "garage_keyword", // How it was detected
      "validated": true                 // Whether dimensions pass validation
    }
  ],
  "total_vehicle_entrances": 1,
  "garage_entrances": 1,
  "non_garage_vehicle_entrances": 0,
  "valid_vehicle_entrances": 1          // After dimension filtering
}
```

### 5.4 Detection Diagnostics
The system provides diagnostic information about detection:

```json
{
  "detection_diagnostics": {
    "total_elements_checked": 491,
    "vehicle_entrances_detected": 0,
    "pedestrian_entrances_detected": 0,
    "garage_entrances_count": 0,
    "non_garage_vehicle_entrances_count": 0,
    "detection_methods": {
      "layer_name_check": true,
      "element_name_check": true,
      "label_check": true,
      "car_keyword_check": true,
      "dimension_validation": true
    },
    "note": "Entrances detected by checking: layer names, element names, labels, car-related keywords, and dimension validation (width 2.5-7m for vehicle, 0.8-2.5m for pedestrian)"
  }
}
```

### 5.5 Parking Space Data
Parking spaces are detected as garage elements or unlabeled geometry:

```json
{
  "parking_elements": [
    {
      "name": "garage",                 // Or "unlabeled" if no label
      "original_label": "PARKING",       // Original label or empty string
      "layer": "PARKING_LAYER",         // DXF layer name
      "area": 18.0,                     // Area in m²
      "width": 3.2,                     // Width in m (estimated if missing)
      "is_unlabeled": false,            // true if no text label
      "floor": "ground_floor"           // Floor level
    }
  ],
  "total_parking_area_m2": 18.0,
  "parking_spaces_estimated": 1         // Based on area (18 m² / 12 m² per space)
}
```

### 5.6 Car Shape Data (Unlabeled Geometry)
Car shapes are detected as unlabeled closed polygons:

```json
{
  "car_shapes": [
    {
      "name": "unlabeled",              // Special name for unlabeled geometry
      "area": 8.5,                      // Area in m² (from polygon calculation)
      "width": null,                    // Width not calculated for unlabeled
      "original_label": "",             // Empty - no label
      "is_unlabeled": true,             // Flag identifying unlabeled geometry
      "layer": "CAR_SHAPES_LAYER",      // DXF layer name
      "vertices": [[x1, y1], ...],     // Polygon vertices
      "floor": "ground_floor"           // Floor level (if determinable)
    }
  ],
  "total_car_shapes": 2,
  "total_car_area_m2": 17.0
}
```

**Note**: Unlabeled geometry is filtered to exclude:
- Areas < 0.1 m² (too small)
- Areas > 100,000 m² (likely plot boundaries)
- Non-closed polygons
- Polygons with < 3 vertices

## 6. Detection Process

### 6.1 Step 1: Extract All Elements (Python - `dxf_extractor.py`)
1. **Read DXF File**: Parse DXF file using text-based parsing
2. **Extract Geometry**: Extract all closed polygons/polylines
   - Source: `_extract_geometry()` method
   - Returns: List of geometry with `type`, `layer`, `vertices`, `area`, `closed` flag
3. **Extract Text Labels**: Extract all TEXT, MTEXT, ATTRIB entities
   - Source: `_extract_text_labels()` method
   - Returns: List of labels with `name`, `x`, `y`, `layer`
4. **Match Labels to Geometry**: Find closest geometry for each label
   - Source: `_find_closest_geometry_index()` method
   - Distance threshold: Reasonable distance based on layer matching
5. **Normalize Element Names**: Map labels to normalized names
   - Source: `NAME_MAP` (exact match) and `PARTIAL_RULES` (partial match)
   - Garage keywords: `"garage"` → `"garage"`, `"كراج"` → `"garage"`
6. **Calculate/Estimate Dimensions**:
   - **Area**: From polygon calculation or `_estimate_area()` default (18.0 m² for garage)
   - **Width**: From geometry or `_estimate_width()` default (3.2 m for garage)
   - **Unit Conversion**: Based on `$INSUNITS` (4 = mm, 6 = m)
7. **Extract Unlabeled Geometry**: Closed polygons without text labels
   - Source: Third pass in `parse_dxf()` method
   - Filtered: Areas 0.1-100,000 m², closed polygons only
   - Properties: `name: "unlabeled"`, `is_unlabeled: true`, `vertices` array

### 6.2 Step 2: Filter by Floor (Node.js - `validator.js`)
1. **Extract Floor Info**: From `original_label` using `extractFloorInfo()` method
   - Keywords: `"ground"`, `"ground floor"`, `"G"`, `"GF"`, `"أرضي"`
2. **Filter Ground Floor Elements**: Keep only elements on ground floor
   - Elements with `floor === "ground floor"` or `floor === null` (assumed ground)

### 6.3 Step 3: Detect Vehicle Entrances (Node.js - `validateArticle15()`)
1. **Check Element Name**: Normalized name (e.g., `"garage"`)
2. **Check Original Label**: Raw DXF text (e.g., `"GARAGE"`, `"كراج"`)
3. **Check Layer Name**: DXF layer (e.g., `"GARAGE_LAYER"`, `"VEHICLE_ENTRANCE"`)
4. **Check Keywords**:
   - Vehicle entrance keywords: `vehicle entrance`, `car entrance`, `garage entrance`
   - Car-related keywords: `car`, `vehicle`, `auto`, `سيارة`
   - Garage keywords: `garage`, `parking`, `كراج`, `موقف`
5. **Validate Dimensions**:
   - Width: 2.5-7.0m (vehicle entrance range with tolerance)
   - Area: Reasonable (0-500 m² for car-related, 0-200 m² for garage)
6. **Filter Valid Entrances**: Apply dimension validation
   - Width outside 2.5-7m → exclude unless has explicit keywords
   - Width in range → include
   - No width data → include (will validate later)

### 6.4 Step 4: Classify Elements
1. **Vehicle Entrances**: Elements passing detection + dimension validation
2. **Garage Entrances**: Vehicle entrances with garage keywords
3. **Non-Garage Vehicle Entrances**: Vehicle entrances without garage keywords
4. **Parking Spaces**: Garage elements or unlabeled geometry with parking dimensions
5. **Car Shapes**: Unlabeled geometry with car-like dimensions (5-15 m² area)

### 6.5 Step 5: Generate Diagnostics
- Count total elements checked
- Count detected entrances by type
- Record detection methods used
- Include validation notes

## 7. Article 15 Validation

### 7.1 Rule 15.2a - Vehicle Entrance Count
- **Maximum**: 2 vehicle entrances per plot
- **Separation**: Minimum 6m apart (garage entrances exempt)
- **Detection**: Counts all detected vehicle entrances
- **Validation**: Checks count and separation distance

### 7.2 Rule 15.2b - Vehicle Entrance Width
- **Range**: 3-6m width
- **Validation**: Checks each vehicle entrance width
- **Unit Conversion**: Normalizes width to meters based on INSUNITS

### 7.3 Rule 15.2c - Vehicle Entrance Canopy
- **Clear Height**: Minimum 4.5m
- **Total Height**: Maximum 6.0m
- **Overhang**: Maximum 2m beyond entrance width
- **Note**: Requires elevation data (manual verification)

### 7.4 Rule 15.3a - Pedestrian Entrance Count
- **Maximum**: 2 pedestrian entrances + 1 for hospitality annex
- **Detection**: Counts pedestrian entrances separately from vehicle entrances

### 7.5 Rule 15.3e - Pedestrian Entrance Width
- **Range**: 1-2m width
- **Validation**: Checks each pedestrian entrance width

### 7.6 Rule 15.4 - Door Swing Restriction
- **Requirement**: Entrance doors must not open outside plot boundary
- **Validation**: Requires spatial data (plot boundary + door position)

## 8. Important Notes

### 8.1 Detection Accuracy
- **Labeled Elements**: Most accurate (explicit labels)
- **Layer Names**: Good accuracy (if layers are properly named)
- **Keyword Matching**: Moderate accuracy (may have false positives)
- **Dimension Validation**: Filters out incorrectly sized elements

### 8.2 Unit Conversion
- DXF files may use different units (mm, cm, m, inches, feet)
- Check `$INSUNITS` value:
  - 1 = inches
  - 2 = feet
  - 3 = centimeters
  - 4 = millimeters (most common)
  - 6 = meters
- All extracted dimensions are converted to meters

### 8.3 Dimension Filtering
- **Vehicle Entrances**: Width 2.5-7m (filters out doors, windows, etc.)
- **Parking Spaces**: Area 5-15 m² per space
- **Car Shapes**: Area 5-15 m², width 1.5-3.0m

### 8.4 Ground Floor Specific
- Only elements on ground floor are checked
- Floor identification from labels: `ground`, `ground floor`, `G`, `GF`, `أرضي`
- Elements without floor labels are checked if on ground floor layers

## 9. Limitations

### 9.1 Unlabeled Car Shapes
- Car outline shapes without labels may not be detected as entrances
- Car shapes are detected but may not count as vehicle entrances
- Manual verification may be required for unlabeled car shapes

### 9.2 Block Attributes
- CAD blocks with attributes may not be fully extracted
- Block names are checked, but attributes may require manual verification

### 9.3 Spatial Validation
- Separation distance (6m) requires spatial coordinates
- Door swing direction requires door position and orientation
- Plot boundary validation requires plot vertices

### 9.4 Elevation Data
- Canopy height validation requires elevation data
- 2D plans don't contain height information
- Manual verification required for height-related rules

## 10. Actual Extracted Data Properties

### 10.1 Element Object Structure
From `python/dxf_extractor.py`, each extracted element has:

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `name` | string | Normalized element name | `NAME_MAP` or `PARTIAL_RULES` |
| `area` | number | Area in m² | Polygon calculation or `_estimate_area()` |
| `width` | number | Width in m | Geometry or `_estimate_width()` |
| `ventilation` | string | Ventilation type | Default: `"natural"` |
| `original_label` | string | Original DXF text | From TEXT/MTEXT/ATTRIB |
| `layer` | string | DXF layer name | From geometry/label entity |
| `is_unlabeled` | boolean | Unlabeled geometry flag | `true` if no text label |
| `vertices` | array | Polygon vertices | `[[x, y], ...]` for unlabeled |

### 10.2 Garage Element Defaults
When garage is detected but geometry missing:

| Property | Value | Source |
|----------|-------|--------|
| `area` | 18.0 m² | `_estimate_area("garage")` |
| `width` | 3.2 m | `_estimate_width("garage")` |

### 10.3 Detection Keywords (Actual Implementation)
From `nodejs/validator.js`:

**Vehicle Entrance Keywords:**
```javascript
['vehicle entrance', 'car entrance', 'vehicular entrance', 'car gate', 'vehicle gate',
 'garage entrance', 'garage door', 'car door',
 'مدخل السيارات', 'مدخل السيارة', 'بوابة السيارات', 'مدخل الكراج']
```

**Car-Related Keywords:**
```javascript
['car', 'cars', 'vehicle', 'vehicles', 'vehicular', 'auto', 'automobile',
 'سيارة', 'سيارات', 'مركبة', 'مركبات', 'عربة']
```

**Garage Keywords:**
```javascript
['garage', 'كراج', 'موقف', 'parking', 'parking space', 'parking area']
```

**Vehicle Entrance Layer Keywords:**
```javascript
['vehicle entrance', 'car entrance', 'vehicular entrance', 'car gate', 'vehicle gate',
 'garage entrance', 'garage door', 'car door',
 'مدخل السيارات', 'مدخل السيارة', 'بوابة السيارات', 'مدخل الكراج',
 'vehicle_entrance', 'car_entrance', 'garage_entrance'] // Block names
```

### 10.4 Dimension Validation Ranges
From `nodejs/validator.js`:

| Element Type | Width Range | Area Range | Notes |
|--------------|-------------|------------|-------|
| Vehicle Entrance | 2.5-7.0 m | 0-500 m² | With tolerance for detection |
| Vehicle Entrance (Ideal) | 3.0-6.0 m | - | Article 15.2b requirement |
| Garage Element | 1.0-15.0 m | 0-200 m² | Lenient for garage detection |
| Car-Related | 0.5-20.0 m | 0-500 m² | Very lenient if car keyword present |
| Pedestrian Entrance | 0.8-2.5 m | - | With tolerance for detection |
| Pedestrian Entrance (Ideal) | 1.0-2.0 m | - | Article 15.3e requirement |
| Unlabeled Geometry | - | 0.1-100,000 m² | Filtered in extraction |

### 10.5 Floor Detection Keywords
From `nodejs/validator.js` - `extractFloorInfo()`:

| Floor | Keywords |
|-------|----------|
| Ground Floor | `"ground"`, `"ground floor"`, `"G"`, `"GF"`, `"أرضي"`, `"دور أرضي"` |
| First Floor | `"first floor"`, `"1st floor"`, `"floor 1"` |
| Second Floor | `"second floor"`, `"2nd floor"`, `"floor 2"` |
| Third Floor | `"third floor"`, `"3rd floor"`, `"floor 3"` |

## 11. Summary

### Extractable Data from Ground Floor:
1. ✅ Vehicle entrance count and types
2. ✅ Vehicle entrance widths (3-6m validation)
3. ✅ Garage entrance identification
4. ✅ Parking space areas and counts
5. ✅ Car shape detection (unlabeled geometry)
6. ✅ Pedestrian entrance count and widths
7. ✅ Layer names for entrance elements
8. ✅ Element labels and names
9. ✅ Dimension validation results
10. ✅ Detection diagnostics (methods used, counts)

### Not Extractable (Requires Manual Verification):
1. ❌ Entrance separation distances (requires spatial coordinates)
2. ❌ Door swing direction (requires door orientation data)
3. ❌ Canopy heights (requires elevation data)
4. ❌ Plot boundary position (requires plot vertices)
5. ❌ Block attributes (may not be fully extracted)

### Detection Methods:
1. ✅ Element name matching
2. ✅ Label text matching
3. ✅ Layer name matching
4. ✅ Car keyword detection
5. ✅ Dimension validation
6. ✅ Ground floor filtering

### Validation Rules Applied:
- **Article 15.2a**: Vehicle entrance count (max 2, min 6m separation)
- **Article 15.2b**: Vehicle entrance width (3-6m)
- **Article 15.2c**: Vehicle entrance canopy (height, overhang)
- **Article 15.3a**: Pedestrian entrance count (max 2 + 1 for hospitality)
- **Article 15.3e**: Pedestrian entrance width (1-2m)
- **Article 15.4**: Door swing restriction (not outside plot)

## 11. Detection Keywords Reference

### Vehicle Entrance Keywords:
- English: `vehicle entrance`, `car entrance`, `vehicular entrance`, `car gate`, `vehicle gate`, `garage entrance`, `garage door`, `car door`
- Arabic: `مدخل السيارات`, `مدخل السيارة`, `بوابة السيارات`, `مدخل الكراج`
- Block Names: `vehicle_entrance`, `car_entrance`, `garage_entrance`

### Car-Related Keywords:
- English: `car`, `cars`, `vehicle`, `vehicles`, `vehicular`, `auto`, `automobile`
- Arabic: `سيارة`, `سيارات`, `مركبة`, `مركبات`, `عربة`

### Garage/Parking Keywords:
- English: `garage`, `parking`, `parking space`, `parking area`
- Arabic: `كراج`, `موقف`, `مواقف`

### Pedestrian Entrance Keywords:
- English: `pedestrian entrance`, `main entrance`, `entrance`, `door`, `gate`, `front door`, `main door`, `entry`
- Arabic: `مدخل`, `مدخل الأفراد`, `الباب الرئيسي`, `باب`

### Ground Floor Keywords:
- English: `ground`, `ground floor`, `G`, `GF`, `first floor` (if ground is first)
- Arabic: `أرضي`, `دور أرضي`, `الطابق الأرضي`

