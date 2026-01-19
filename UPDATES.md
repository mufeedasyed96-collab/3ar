# Configuration Updates

## Summary

The system has been updated to use the exact rules structure from Article 11: "Element Areas and Internal Dimensions".

## Changes Made

### 1. Node.js Configuration (`nodejs/config.js`)

**Updated Structure:**
- Changed from flat structure to Article 11 format
- Added `article_id`, `title_ar`, `title_en`, `rules` array
- `basic_elements` and `additional_elements` are now arrays of objects with:
  - `id`: Rule ID (e.g., "11.1")
  - `element_ar`: Arabic name
  - `element_en`: English name (used for validation)
  - `min_area_m2`: Minimum area requirement
  - `min_width_m`: Minimum width requirement
  - `ventilation`: Ventilation type requirement
  - `required`: Boolean flag

**New Required Elements:**
- `main_hall` (11.1)
- `master_bedroom` (11.2)
- `additional_bedroom` (11.3) - replaces generic "bedroom"
- `bathroom` (11.4)
- `toilet` (11.5) - NEW required element
- `kitchen` (11.6)

**New Optional Elements:**
- `living_space_bedroom` (11.7) - replaces "living_room"
- `service_space_under_4sqm` (11.8) - no area/width requirements
- `service_space_4_to_9sqm` (11.9)
- `service_space_over_9sqm` (11.10)
- `garage` (11.11)
- `staff_bedroom` (11.12)
- `staff_bathroom` (11.13)

**Ventilation Types:**
- `"natural"`: Natural ventilation only
- `"natural_or_mechanical"`: Either natural or mechanical acceptable
- `"natural_and_mechanical"`: Either natural or mechanical acceptable (for validation)
- `"none_required"`: No ventilation requirement

### 2. Node.js Validator (`nodejs/validator.js`)

**Key Updates:**
- `findElementDefinition()`: Searches through `basic_elements` and `additional_elements` arrays
- `getElementRules()`: Extracts rules from element definition objects
- `isValidVentilation()`: Handles new ventilation types
- `validateElement()`: Handles null area/width for `service_space_under_4sqm`
- `validateSchema()`: Gets required elements from `basic_elements` array using `element_en`

**Validation Logic:**
- Elements must match `element_en` from config
- Area/width validation skipped if `null` in config
- Ventilation validation uses new type system

### 3. Python DXF Extractor (`python/dxf_extractor.py`)

**Updated NAME_MAP:**
- Added mappings for all new element names
- Maintained backward compatibility with old names
- Maps "bedroom" → "additional_bedroom"
- Maps "living_room" → "living_space_bedroom"
- Added mappings for service spaces, staff rooms, toilet

**Updated PARTIAL_RULES:**
- Added regex patterns for new elements
- Maintained legacy patterns for backward compatibility

**Updated Default Estimates:**
- Area and width defaults match Article 11 requirements
- Updated for all new element types

### 4. Test Files

**Updated `test/sample_elements.json`:**
- Changed "bedroom" → "additional_bedroom"
- Changed "living_room" → "living_space_bedroom"
- Added "toilet" element
- Added "garage" element
- All elements now use correct names from Article 11

### 5. API Example (`api_example.js`)

**Updated `/api/config` endpoint:**
- Returns Article 11 structure
- Includes Arabic and English names
- Returns element IDs and full rule details

## Validation Rules Summary

### Required Elements (All Must Be Present)

| Element | Min Area (m²) | Min Width (m) | Ventilation |
|---------|---------------|---------------|-------------|
| main_hall | 20 | 4 | natural |
| master_bedroom | 16 | 4 | natural |
| additional_bedroom | 14 | 3.2 | natural |
| bathroom | 3.5 | 1.6 | natural_or_mechanical |
| toilet | 2.5 | 1.2 | natural_or_mechanical |
| kitchen | 12 | 3 | natural_and_mechanical |

### Optional Elements (Validated If Present)

| Element | Min Area (m²) | Min Width (m) | Ventilation |
|---------|---------------|---------------|-------------|
| living_space_bedroom | 9 | 3 | natural |
| service_space_under_4sqm | null | null | none_required |
| service_space_4_to_9sqm | 4 | 2 | natural_or_mechanical |
| service_space_over_9sqm | 9 | 3 | natural |
| garage | 18 | 3.2 | natural_or_mechanical |
| staff_bedroom | 9 | 3 | natural |
| staff_bathroom | 3 | 1.5 | natural_or_mechanical |

## Testing

All tests passing:
- ✅ Element validation
- ✅ Deduplication
- ✅ Required element checking
- ✅ File-based validation
- ✅ Ventilation type validation
- ✅ Null area/width handling

## Backward Compatibility

The system maintains backward compatibility:
- Old element names are mapped to new names in Python extractor
- Legacy patterns still work for element detection
- Existing DXF files will be normalized to new names

## Next Steps

1. Update any external systems that reference old element names
2. Update documentation to reflect Article 11 structure
3. Test with real DWG/DXF files to verify normalization

