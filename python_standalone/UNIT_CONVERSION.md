# Unit Conversion System

## Overview

The DXF validator automatically detects and converts units from DXF files to ensure accurate area and width calculations. All calculations are performed in meters (m) and square meters (m²) regardless of the original DXF file units.

## How It Works

### 1. INSUNITS Detection

The system reads the `$INSUNITS` value from the DXF file header, which indicates the drawing units:

- **1** = Inches
- **2** = Feet
- **3** = Centimeters
- **4** = Millimeters (default if not found)
- **5** = Meters
- **6** = Meters (alternative)

### 2. Automatic Conversion

All extracted values are automatically converted to standard units:

- **Areas**: Converted to square meters (m²)
- **Widths/Lengths**: Converted to meters (m)
- **Distances**: Converted to meters (m)

### 3. Conversion Formulas

The system uses the following conversion factors:

#### Length Conversions
- Inches → Meters: `length / 39.3701`
- Feet → Meters: `length / 3.28084`
- Centimeters → Meters: `length / 100.0`
- Millimeters → Meters: `length / 1000.0`
- Meters → Meters: `length` (no conversion)

#### Area Conversions
- Square Inches → Square Meters: `area / 1550.0031`
- Square Feet → Square Meters: `area / 10.7639`
- Square Centimeters → Square Meters: `area / 10000.0`
- Square Millimeters → Square Meters: `area / 1000000.0`
- Square Meters → Square Meters: `area` (no conversion)

### 4. Fallback Detection

If INSUNITS is not found or has an invalid value, the system uses magnitude-based detection:

- **Large values (> 50 for length, > 1,000,000 for area)**: Assumes millimeters
- **Medium values (> 5 for length, > 10,000 for area)**: Assumes centimeters
- **Small values**: Assumes meters

## Usage in Code

### In DXF Extractor

The `DXFExtractor` class automatically:
1. Reads INSUNITS from the DXF header
2. Converts all areas to m² using `_convert_area_to_m2()`
3. Converts all widths to m using unit conversion in `_find_room_dimensions()`
4. Includes `insunits` in element metadata

### In Validators

All validators receive:
- **Elements**: Already converted to meters/m²
- **Metadata**: Contains `insunits` and `unit_name` for reference

Example:
```python
# Elements already have converted values
element = {
    "name": "kitchen",
    "area": 12.5,  # Already in m²
    "width": 3.0,  # Already in m
    "insunits": 4  # Original unit (millimeters)
}

# Metadata includes unit information
metadata = {
    "insunits": 4,
    "unit_name": "millimeters",
    ...
}
```

### Using Unit Converter Utility

For custom conversions, use the `unit_converter` module:

```python
from unit_converter import convert_length_to_meters, convert_area_to_m2, get_insunits_from_metadata

# Convert length
length_m = convert_length_to_meters(1000, insunits=4)  # 1000 mm = 1.0 m

# Convert area
area_m2 = convert_area_to_m2(1000000, insunits=4)  # 1000000 mm² = 1.0 m²

# Get INSUNITS from metadata
insunits = get_insunits_from_metadata(metadata)
```

## Validation Rules

All validation rules use meters and square meters:

- **Article 5**: Building coverage (%), floor areas (m²)
- **Article 6**: Setbacks (m), projections (m)
- **Article 11**: Element areas (m²), widths (m)
- **Article 13**: Stair dimensions (m)
- **Article 15**: Entrance widths (m)
- **Article 18**: Door widths (m), corridor widths (m)

## Debugging

The system logs detected units during validation:

```
[Unit Detection] INSUNITS=4 (millimeters) - All areas converted to m², all widths converted to m
```

This helps verify that units are being detected correctly.

## Important Notes

1. **All extracted values are already converted** - No need to convert again in validators
2. **INSUNITS is included in metadata** - Available for reference if needed
3. **Default is millimeters** - If INSUNITS is not found, assumes millimeters (most common)
4. **Consistent units** - All calculations use meters/m² for consistency

## Testing

To test unit conversion:

```python
from unit_converter import convert_length_to_meters, convert_area_to_m2

# Test millimeters
assert convert_length_to_meters(1000, 4) == 1.0  # 1000 mm = 1 m
assert convert_area_to_m2(1000000, 4) == 1.0  # 1000000 mm² = 1 m²

# Test feet
assert abs(convert_length_to_meters(3.28084, 2) - 1.0) < 0.001  # 3.28 ft ≈ 1 m
assert abs(convert_area_to_m2(10.7639, 2) - 1.0) < 0.001  # 10.76 ft² ≈ 1 m²
```

