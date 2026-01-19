# Extractable Data from Site Layout Plans (DXF/DWG)

This document lists all data that can be extracted from site layout plans without any validation or condition checking.

## 1. DXF File Metadata

- **INSUNITS**: Drawing units (1=inches, 2=feet, 3=centimeters, 4=millimeters, 5/6=meters)
- **File encoding**: UTF-8 or Latin-1 (auto-detected)

## 2. Plot Boundary Data

- **plot_area_m2**: Total plot area in square meters
- **plot_layer**: Layer name containing plot boundary
- **plot_vertices**: List of coordinate points defining plot boundary
- **plot_raw_area**: Raw area value before unit conversion
- **plot_candidates_count**: Number of potential plot boundaries found
- **valid_plot_candidates_count**: Number of valid plot candidates (50-50000 m²)

## 3. Building Footprint Data

- **building_area_m2**: Total building footprint area in square meters
- **building_layer**: Layer name(s) containing building footprint
- **building_vertices**: List of coordinate points defining building footprint
- **building_raw_area**: Raw area value before unit conversion
- **building_candidates_count**: Number of potential building footprints found
- **valid_building_candidates_count**: Number of valid building candidates (10-10000 m²)

## 4. Coverage Calculation

- **coverage_percent**: Building coverage percentage (building_area / plot_area × 100)

## 4.1. Area Calculation from Site Layout Plan

**Important Note**: All area calculations are based on the **SITE LAYOUT PLAN** only. This does NOT include individual floor plans (ground floor, first floor, roof floor). The site layout plan shows the overall plot boundary and total building footprint as viewed from above.

### Plot Area from Site Layout Plan

The plot area is extracted directly from the site layout plan using the following methods:

1. **Primary Method - Plot Boundary Layers**:
   - Identifies closed polylines/polygons on layers containing keywords: `plot`, `site`, `boundary`, `property`, `parcels`, `limit`, `PROPERTY LINE`, `PLOT LIMIT`, `SITE LIMIT`
   - Filters candidates to reasonable size range: **50-50,000 m²**
   - Selects the **largest valid candidate** as the plot boundary
   - Calculates area using **Shoelace formula** from polygon vertices
   - Converts to m² based on **INSUNITS** value

2. **Fallback Method - Largest Polygon**:
   - If no explicit plot layer found, uses the **largest closed polygon** in range 20-100,000 m²
   - This handles cases where plot boundary is not explicitly labeled

3. **Area Calculation Formula**:
   ```
   Area = 0.5 × |Σ(xi × yi+1 - xi+1 × yi)|
   ```
   - Where (xi, yi) are polygon vertex coordinates
   - Result converted to m² based on INSUNITS

### Total Building Area from Site Layout Plan

The total building area is calculated from the **SITE LAYOUT PLAN** only (not from individual floor plans). It represents the total building footprint visible on the site plan:

1. **Building Footprint Detection from Site Plan**:
   - Identifies closed polylines/polygons on **architectural/building layers** in the site layout plan
   - Includes layers with keywords: `wall`, `room`, `building`, `structure`, `arch`, `floor`, `plan`
   - Excludes layers with keywords: `landscape`, `garden`, `pergola`, `furniture`, `annotation`, `title`, `frame`, `text`, `dim`, `axis`, `grid`, `block`, `plot`, `site`, `boundary`, `property`, `parcels`, `limit`, `land`

2. **What is Included in Building Area**:
   - **Total building footprint**: The complete building outline as shown on site layout plan
   - **Main building**: Primary building structure footprint
   - **Annexes**: Separate building structures on the plot (if visible on site plan)
   - **All building structures**: Any built structures visible on the site layout plan

3. **Exclusions from Building Area**:
   - **Pools**: Excluded (pools are open areas, not building)
   - **Small projections**: Areas < 0.25 m² (likely aesthetic projections ≤ 0.5m)
   - **Unrealistic sizes**: Areas outside range 10-10,000 m²
   - **Landscape elements**: Gardens, pergolas, furniture, annotations

4. **Calculation Process**:
   ```
   Total Building Area (from site plan) = Σ(area of all valid building footprints visible on site layout plan)
   ```
   - Each building footprint area calculated using Shoelace formula from site plan geometry
   - All areas converted to m² based on INSUNITS
   - Sum of all valid building candidates (10-10,000 m² range)

5. **Important**: 
   - This is the **total building footprint area from the site layout plan**
   - It represents the building coverage on the plot as shown in the site plan
   - It does NOT include separate floor-by-floor calculations from individual floor plans
   - The site layout plan shows the overall building outline from above

5. **Unit Conversion**:
   - Reads **INSUNITS** from DXF header
   - Converts area based on unit:
     - INSUNITS 1 (inches): area_m² = area / 1550.0031
     - INSUNITS 2 (feet): area_m² = area / 10.7639
     - INSUNITS 3 (centimeters): area_m² = area / 10000.0
     - INSUNITS 4 (millimeters): area_m² = area / 1000000.0
     - INSUNITS 5/6 (meters): area_m² = area (no conversion)

### Open Area Calculation from Site Layout Plan

Open area is calculated from the site layout plan as the difference between plot area and building area:

```
Open Area (from site plan) = Plot Area (from site plan) - Total Building Area (from site plan)
```

Open areas visible on site layout plan include:
- Gardens and landscaping
- Driveways and parking areas
- Courtyards and entrances
- Pools and recreation areas
- Pathways and circulation spaces
- All non-built areas visible on the site layout plan

## Summary: Plot and Building Areas from Site Layout Plan

**From Site Layout Plan Only** (not from individual floor plans):

- **Plot Area**: Total plot/site boundary area visible on site layout plan (typically 50-50,000 m²)
- **Total Building Area**: Sum of all building footprints visible on site layout plan (typically 10-10,000 m²)
- **Open Area**: Plot Area - Total Building Area (remaining open space on site plan)
- **Coverage Percentage**: (Total Building Area / Plot Area) × 100

**Note**: These calculations are based solely on the site layout plan geometry. Individual floor plans (ground floor, first floor, roof floor) are NOT used for these area calculations.

## 5. Labeled Architectural Elements

For each element with a text label in the DXF:

- **name**: Normalized element name (e.g., "main_hall", "master_bedroom", "bathroom")
- **original_label**: Original text label from DXF (preserves floor info, e.g., "BEDROOM 1", "GROUND FLOOR KITCHEN")
- **area**: Element area in square meters (calculated from geometry)
- **width**: Element width in meters (minimum bounding box dimension)
- **ventilation**: Ventilation type (default: "natural")
- **layer**: DXF layer name where element is located
- **text_position**: X, Y coordinates of text label
- **geometry_vertices**: List of coordinate points defining element boundary

### Normalized Element Types

The system recognizes and normalizes these element types:

- **main_hall** (hall, sitting, majles, living, salon, صالة, مجلس)
- **master_bedroom** (master bedroom, mbr, غرفة نوم رئيسية)
- **additional_bedroom** (bedroom, bed room, br, غرفة نوم)
- **bathroom** (bathroom, t&b, washroom, shower, حمام)
- **toilet** (toilet, wc, lavatory, دورة مياه)
- **kitchen** (kitchen, kitch)
- **living_space_bedroom** (living/bed, studio)
- **service_space_under_4sqm** (store, storage, مخزن)
- **staff_bedroom** (maid, staff room)
- **staff_bathroom** (maid bathroom)
- **garage** (garage, كراج)
- **pool** (pool, swimming pool, swimmingpool, حوض السباحة, بركة)

## 6. Unlabeled Geometry (Empty Spaces)

For closed polygons/polylines without text labels:

- **name**: "unlabeled"
- **is_unlabeled**: true (flag to identify unlabeled geometry)
- **area**: Area in square meters (0.1 - 100,000 m² range)
- **width**: null (not calculated for unlabeled geometry)
- **ventilation**: null
- **original_label**: "" (empty, no label)
- **layer**: DXF layer name
- **vertices**: List of coordinate points defining the geometry

## 7. Geometry Data

For each closed polyline/polygon in the DXF:

- **type**: Geometry type (POLYLINE, LWPOLYLINE, etc.)
- **layer**: DXF layer name
- **closed**: Boolean indicating if geometry is closed
- **vertices**: List of [x, y] coordinate pairs
- **area**: Raw area calculated using shoelace formula
- **centroid**: {x, y} coordinates of geometry center

## 8. Text Labels

For each text entity in the DXF:

- **name**: Text content (cleaned of DXF formatting codes)
- **x**: X coordinate of text position
- **y**: Y coordinate of text position
- **layer**: DXF layer name
- **ventilation**: Extracted from text if present

## 9. Unit Conversion Information

- **insunits**: Original INSUNITS value from DXF
- **area_conversion**: Conversion factor used (based on INSUNITS)
- **width_conversion**: Conversion factor used (based on INSUNITS)

## 10. Diagnostic Information

- **plot_diagnostics**: 
  - total_candidates
  - valid_candidates
  - all_plot_areas (top 5)
  - all_plot_layers (top 5)
  - fallback_used (if largest polygon method was used)
  - fallback_method
  - fallback_area_m2
  - fallback_layer

- **building_diagnostics**:
  - total_candidates
  - valid_candidates
  - total_building_area
  - valid_building_area

## 11. Calculation Methods

- **Area Calculation**: Shoelace formula from polygon vertices
  - Formula: `Area = 0.5 * |Σ(xi*yi+1 - xi+1*yi)|`
  - Converted to m² based on INSUNITS

- **Width Calculation**: Minimum bounding box dimension
  - Formula: `Width = min(max_x - min_x, max_y - min_y)`
  - Converted to meters based on INSUNITS

- **Geometry Matching**: Text labels matched to nearest geometry
  - Distance calculated from text position to geometry centroid
  - Preference given to geometry on same layer

## 12. Roof Validation Data (if Shapely available)

- **roof_area_m2**: Total roof area
- **roof_building_area_m2**: Area of buildings on roof
- **roof_open_area_m2**: Open/uncovered roof area
- **roof_coverage_percent**: Percentage of roof covered by buildings
- **parapet_detected**: Boolean indicating if parapet geometry found

## Notes

- All areas are in square meters (m²)
- All widths/distances are in meters (m)
- All coordinates are in drawing units (converted based on INSUNITS)
- Unlabeled geometry is used for area calculations but not for room-specific validation
- Floor information can be extracted from original_label (e.g., "GROUND FLOOR", "FIRST FLOOR")
- Multiple elements can have the same normalized name (e.g., multiple bathrooms)

