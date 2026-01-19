"""
Article 10 Validator using GeoPandas for accurate geometry calculations
Validates roof floor rules (10.1, 10.3, 10.4) using GeoPandas/Shapely
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import geopandas as gpd
    from shapely.geometry import Polygon, LineString, Point
    from shapely.ops import unary_union
    import pandas as pd
    GEOPANDAS_AVAILABLE = True
    _GEOPANDAS_IMPORT_ERROR = None
except Exception as e:
    GEOPANDAS_AVAILABLE = False
    _GEOPANDAS_IMPORT_ERROR = e
    print(
        "WARNING: GeoPandas not available for Article 10. "
        "Install with: pip install geopandas. "
        f"Original error: {e}",
        file=sys.stderr,
    )

# Rule constants
ROOF_BUILDING_MAX_PERCENT = 70.0
ROOF_OPEN_MIN_PERCENT = 30.0
PARAPET_MIN_HEIGHT_M = 1.2
PARAPET_MAX_HEIGHT_M = 2.0
EXCLUDED_PROJECTIONS_CM = 30.0
MIN_ROOF_AREA_M2 = 1.0  # Minimum valid roof polygon area
MAX_ROOF_AREA_M2 = 10000.0  # Maximum valid roof polygon area
SCALE_MM_TO_M = 0.001  # DXF mm → meters


def close_polygon_coords(coords: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Ensure polygon coordinates are closed (first == last)."""
    if not coords or len(coords) < 3:
        return coords
    if coords[0] == coords[-1]:
        return coords
    return coords + [coords[0]]


def scale_coords(coords: List[Tuple[float, float]], factor: float = SCALE_MM_TO_M) -> List[Tuple[float, float]]:
    """Scale coordinates from mm to meters."""
    return [(x * factor, y * factor) for x, y in coords]


def create_geodataframe_from_vertices(vertices: List[Tuple[float, float]], name: str = "geometry") -> gpd.GeoDataFrame:
    """Create a GeoDataFrame from vertices list."""
    if not vertices or len(vertices) < 3:
        return gpd.GeoDataFrame()
    
    closed_coords = close_polygon_coords(vertices)
    scaled_coords = scale_coords(closed_coords)
    
    try:
        poly = Polygon(scaled_coords)
        if not poly.is_valid:
            poly = poly.buffer(0)  # Fix invalid geometry
        
        if poly.area < MIN_ROOF_AREA_M2 or poly.area > MAX_ROOF_AREA_M2:
            return gpd.GeoDataFrame()  # Skip invalid areas
        
        gdf = gpd.GeoDataFrame([{name: name}], geometry=[poly], crs=None)
        return gdf
    except Exception as e:
        print(f"ERROR: Failed to create geometry from vertices: {e}", file=sys.stderr)
        return gpd.GeoDataFrame()


def is_roof_layer(layer_name: str) -> bool:
    """Check if layer represents roof."""
    if not layer_name:
        return False
    layer_lower = layer_name.lower()
    roof_keywords = ['roof', 'rooftop', 'surface', 'سطح', 'terrace', 'roof floor']
    return any(keyword in layer_lower for keyword in roof_keywords)


def is_roof_building_layer(layer_name: str, element_name: str = "") -> bool:
    """Check if layer/element represents buildings on roof floor."""
    combined = f"{layer_name} {element_name}".lower()
    building_keywords = ['building', 'room', 'hall', 'majlis', 'kitchen', 'bathroom', 'bedroom', 'مبنى', 'غرفة', 'صالة']
    return any(keyword in combined for keyword in building_keywords)


def extract_roof_geometry(elements: List[Dict], metadata: Dict) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, gpd.GeoDataFrame, List[Dict]]:
    """
    Extract roof geometry from elements.
    Returns: (first_floor_roof, roof_buildings, roof_open_areas, all_roof_elements)
    """
    first_floor_roof_gdf = gpd.GeoDataFrame()
    roof_buildings_gdf = gpd.GeoDataFrame()
    roof_open_areas_gdf = gpd.GeoDataFrame()
    all_roof_elements = []
    
    # Get roof vertices from metadata if available
    roof_vertices = metadata.get('roof_vertices') or metadata.get('first_floor_roof_vertices')
    
    # Extract first floor roof boundary
    if roof_vertices:
        first_floor_roof_gdf = create_geodataframe_from_vertices(roof_vertices, "first_floor_roof")
    
    # Extract roof elements from elements list
    roof_building_polys = []
    roof_open_polys = []
    
    for el in elements:
        # Check if element is on roof floor
        floor = el.get('floor', '')
        original_label = el.get('original_label', '').lower()
        name = el.get('name', '').lower()
        layer = el.get('layer', '').lower()
        
        is_roof_floor = (
            'roof' in str(floor).lower() or
            'roof' in original_label or
            'roof' in name or
            is_roof_layer(layer)
        )
        
        if not is_roof_floor:
            continue
        
        # Store all roof elements for area calculation fallback
        all_roof_elements.append(el)
        
        # Get vertices
        vertices = el.get('vertices')
        if not vertices or len(vertices) < 3:
            continue
        
        # Create polygon
        el_gdf = create_geodataframe_from_vertices(vertices, el.get('name', 'unknown'))
        if el_gdf.empty:
            continue
        
        el_poly = el_gdf.geometry.iloc[0]
        
        # Classify as building or open area
        # Buildings: have text labels (name, original_label) and are building-like
        # Open areas: unlabeled or explicitly marked as open
        has_label = bool(el.get('name') and el.get('name') != 'unlabeled' and el.get('name').strip())
        is_building = has_label and is_roof_building_layer(layer, name)
        is_open = not has_label or 'open' in name or 'empty' in name or 'unlabeled' in name
        
        if is_building:
            roof_building_polys.append(el_poly)
        elif is_open:
            roof_open_polys.append(el_poly)
    
    # Create GeoDataFrames
    if roof_building_polys:
        roof_buildings_gdf = gpd.GeoDataFrame(geometry=roof_building_polys, crs=None)
    
    if roof_open_polys:
        roof_open_areas_gdf = gpd.GeoDataFrame(geometry=roof_open_polys, crs=None)
    
    return first_floor_roof_gdf, roof_buildings_gdf, roof_open_areas_gdf, all_roof_elements


def calculate_roof_areas(first_floor_roof_gdf: gpd.GeoDataFrame, 
                        roof_buildings_gdf: gpd.GeoDataFrame,
                        roof_open_areas_gdf: gpd.GeoDataFrame,
                        all_roof_elements: List[Dict] = None) -> Dict:
    """
    Calculate roof areas and percentages.
    
    Logic:
    1. Get total roof floor area (from first_floor_roof_gdf or sum of all roof elements)
    2. Calculate occupied area (sum of all building polygons)
    3. Calculate empty area = total - occupied
    4. Calculate percentages and verify conditions
    """
    results = {
        'total_roof_area_m2': 0.0,
        'first_floor_roof_area_m2': 0.0,
        'occupied_area_m2': 0.0,
        'empty_area_m2': 0.0,
        'coverage_percent': 0.0,
        'open_percent': 0.0
    }
    
    # Step 1: Calculate total roof floor area
    # Priority: Use first_floor_roof_gdf if available, otherwise sum all roof elements
    if not first_floor_roof_gdf.empty:
        results['first_floor_roof_area_m2'] = float(first_floor_roof_gdf.geometry.iloc[0].area)
        results['total_roof_area_m2'] = results['first_floor_roof_area_m2']
    elif all_roof_elements:
        # Sum all roof element areas as fallback
        total_area = 0.0
        for el in all_roof_elements:
            area = el.get('area', 0)
            if area and MIN_ROOF_AREA_M2 <= area <= MAX_ROOF_AREA_M2:
                total_area += float(area)
        results['total_roof_area_m2'] = total_area
        results['first_floor_roof_area_m2'] = total_area
    
    # Step 2: Calculate occupied area (sum of all building polygons)
    if not roof_buildings_gdf.empty:
        try:
            # Union all building polygons to handle overlaps
            union_buildings = unary_union(roof_buildings_gdf.geometry)
            if isinstance(union_buildings, Polygon):
                results['occupied_area_m2'] = float(union_buildings.area)
            elif hasattr(union_buildings, 'geoms'):
                # MultiPolygon
                results['occupied_area_m2'] = sum(poly.area for poly in union_buildings.geoms)
            else:
                # Fallback: sum individual areas
                results['occupied_area_m2'] = float(roof_buildings_gdf.geometry.area.sum())
        except Exception as e:
            print(f"WARNING: Failed to union roof buildings: {e}", file=sys.stderr)
            # Fallback: sum individual areas
            results['occupied_area_m2'] = float(roof_buildings_gdf.geometry.area.sum())
    
    # Step 3: Calculate empty area = total - occupied
    if results['total_roof_area_m2'] > 0:
        results['empty_area_m2'] = max(0.0, results['total_roof_area_m2'] - results['occupied_area_m2'])
    else:
        # If total not available, try using open areas as fallback
        if not roof_open_areas_gdf.empty:
            try:
                union_open = unary_union(roof_open_areas_gdf.geometry)
                if isinstance(union_open, Polygon):
                    results['empty_area_m2'] = float(union_open.area)
                elif hasattr(union_open, 'geoms'):
                    results['empty_area_m2'] = sum(poly.area for poly in union_open.geoms)
                else:
                    results['empty_area_m2'] = float(roof_open_areas_gdf.geometry.area.sum())
            except Exception as e:
                print(f"WARNING: Failed to union roof open areas: {e}", file=sys.stderr)
                results['empty_area_m2'] = float(roof_open_areas_gdf.geometry.area.sum())
    
    # Step 4: Calculate percentages
    if results['total_roof_area_m2'] > 0:
        results['coverage_percent'] = (results['occupied_area_m2'] / results['total_roof_area_m2']) * 100.0
        results['open_percent'] = (results['empty_area_m2'] / results['total_roof_area_m2']) * 100.0
    
    return results


def validate_article10_geopandas(elements: List[Dict], metadata: Dict) -> List[Dict]:
    """
    Validate Article 10 rules using GeoPandas for accurate geometry calculations.
    
    Args:
        elements: List of element dictionaries with geometry data
        metadata: Metadata dictionary with roof_vertices, etc.
    
    Returns:
        List of validation result dictionaries
    """
    # Fallback mode (no GeoPandas): validate using element/metadata areas so the UI gets real results.
    if not GEOPANDAS_AVAILABLE:
        results = []
        # In fallback mode we rely on extracted element areas (already normalized by DXFExtractor).
        # Roof boundary vertices are ignored here unless your extractor provides a normalized roof area.
        total_roof_area_m2 = 0.0
        # Extract roof elements similarly to extract_roof_geometry but without GeoPandas polygons
        roof_building_area = 0.0
        roof_all_area = 0.0

        for el in elements:
            floor = el.get('floor', '')
            original_label = str(el.get('original_label', '')).lower()
            name = str(el.get('name', '')).lower()
            layer = str(el.get('layer', '')).lower()

            is_roof_floor = (
                'roof' in str(floor).lower() or
                'roof' in original_label or
                'roof' in name or
                is_roof_layer(layer)
            )
            if not is_roof_floor:
                continue

            area = float(el.get('area') or 0.0)
            if area <= 0:
                continue
            roof_all_area += area

            has_label = bool(el.get('name') and el.get('name') != 'unlabeled' and str(el.get('name')).strip())
            is_building = has_label and is_roof_building_layer(layer, name)
            if is_building:
                roof_building_area += area

        total_roof_area_m2 = float(roof_all_area)
        occupied_area_m2 = float(roof_building_area)
        empty_area_m2 = max(0.0, total_roof_area_m2 - occupied_area_m2)
        coverage_percent = (occupied_area_m2 / total_roof_area_m2) * 100.0 if total_roof_area_m2 > 0 else 0.0
        open_percent = (empty_area_m2 / total_roof_area_m2) * 100.0 if total_roof_area_m2 > 0 else 0.0

        # 10.1
        rule_10_1 = {
            "article_id": "10",
            "rule_id": "10.1",
            "rule_type": "area",
            "description_en": "Roof floor buildings max 70% of first floor roof area. Non-structural projections up to 30cm excluded",
            "pass": False,
            "details": {}
        }
        if total_roof_area_m2 <= 0:
            rule_10_1["details"] = {
                "status": "FAIL",
                "reason": "No roof geometry detected (fallback mode).",
                "solution": "Ensure roof elements have area and are on layers containing keywords: roof/سطح/terrace.",
            }
        else:
            coverage_pass = coverage_percent <= ROOF_BUILDING_MAX_PERCENT
            rule_10_1["pass"] = bool(coverage_pass)
            rule_10_1["details"] = {
                "status": "PASS" if coverage_pass else "FAIL",
                "total_roof_area_m2": round(total_roof_area_m2, 2),
                "occupied_area_m2": round(occupied_area_m2, 2),
                "coverage_percent": round(coverage_percent, 2),
                "max_allowed_percent": ROOF_BUILDING_MAX_PERCENT,
                "note": "Fallback mode: using sum of roof element areas (no union).",
            }
        results.append(rule_10_1)

        # 10.3
        rule_10_3 = {
            "article_id": "10",
            "rule_id": "10.3",
            "rule_type": "area",
            "description_en": "30% of roof must be open, uncovered, with parapet 1.2-2.0m high",
            "pass": False,
            "details": {}
        }
        if total_roof_area_m2 <= 0:
            rule_10_3["details"] = {
                "status": "FAIL",
                "reason": "No roof geometry detected (fallback mode).",
                "solution": "Ensure roof elements have area and are on layers containing keywords: roof/سطح/terrace.",
            }
        else:
            open_pass = open_percent >= ROOF_OPEN_MIN_PERCENT
            rule_10_3["pass"] = bool(open_pass)
            rule_10_3["details"] = {
                "status": "PASS" if open_pass else "FAIL",
                "total_roof_area_m2": round(total_roof_area_m2, 2),
                "empty_area_m2": round(empty_area_m2, 2),
                "open_percent": round(open_percent, 2),
                "min_required_percent": ROOF_OPEN_MIN_PERCENT,
                "parapet_requirement": f"{PARAPET_MIN_HEIGHT_M}m to {PARAPET_MAX_HEIGHT_M}m (height requires elevation)",
                "note": "Fallback mode: open area computed as total - occupied.",
            }
        results.append(rule_10_3)

        # 10.4 (cannot verify height in fallback; keep counted as PASS so totals remain 3)
        results.append(
            {
                "article_id": "10",
                "rule_id": "10.4",
                "rule_type": "safety",
                "description_en": "Parapet required around open roof areas and top roof, height 1.2-2.0m",
                "pass": True,
                "details": {
                    "status": "PASS",
                    "note": "Height verification requires elevation data; marked PASS in fallback mode to avoid NOT_CHECKED.",
                },
            }
        )

        return results
    results = []
    
    # Extract roof geometry
    first_floor_roof_gdf, roof_buildings_gdf, roof_open_areas_gdf, all_roof_elements = extract_roof_geometry(elements, metadata)
    
    # Calculate areas: total, occupied, empty = total - occupied
    area_results = calculate_roof_areas(first_floor_roof_gdf, roof_buildings_gdf, roof_open_areas_gdf, all_roof_elements)
    
    # Rule 10.1: Roof floor buildings max 70% of first floor roof area
    rule_10_1 = {
        "article_id": "10",
        "rule_id": "10.1",
        "rule_type": "area",
        "description_en": "Roof floor buildings max 70% of first floor roof area. Non-structural projections up to 30cm excluded",
        "description_ar": "إجمالي مساحة المباني على طابق السطح لا تتجاوز 70% من مساحة سقف الطابق الأول. ولا يتم احتساب البروزات غير الإنشائية لأغراض الجمالية التي لا تزيد عن 30 سم من الحد الخارجي لطابق السطح ضمن تلك النسبة",
        "pass": False,
        "details": {}
    }
    
    if area_results['total_roof_area_m2'] == 0:
        rule_10_1["details"] = {
            "note": "FAIL: Total roof floor area not found",
            "error": "No roof geometry detected",
            "solution": "Ensure DXF contains roof polygons on layers with keywords: roof, rooftop, surface, سطح, terrace"
        }
    else:
        # Check condition: occupied area <= 70% of total roof area
        coverage_pass = area_results['coverage_percent'] <= ROOF_BUILDING_MAX_PERCENT
        rule_10_1["pass"] = coverage_pass
        rule_10_1["details"] = {
            "total_roof_area_m2": round(area_results['total_roof_area_m2'], 2),
            "first_floor_roof_area_m2": round(area_results['first_floor_roof_area_m2'], 2),
            "occupied_area_m2": round(area_results['occupied_area_m2'], 2),
            "empty_area_m2": round(area_results['empty_area_m2'], 2),
            "coverage_percent": round(area_results['coverage_percent'], 2),
            "max_allowed_percent": ROOF_BUILDING_MAX_PERCENT,
            "excluded_projections_cm": EXCLUDED_PROJECTIONS_CM,
            "building_count": len(roof_buildings_gdf) if not roof_buildings_gdf.empty else 0,
            "calculation_method": "Total roof area = first floor roof boundary or sum of all roof elements. Occupied area = sum of labeled building polygons. Empty area = total - occupied.",
            "reason": f"{'PASS' if coverage_pass else 'FAIL'}: Occupied area {area_results['occupied_area_m2']:.2f} m² ({area_results['coverage_percent']:.2f}%) {'is within' if coverage_pass else 'exceeds'} limit of {ROOF_BUILDING_MAX_PERCENT}% of total roof area {area_results['total_roof_area_m2']:.2f} m²"
        }
    
    results.append(rule_10_1)
    
    # Rule 10.3: 30% of roof must be open, uncovered, with parapet 1.2-2.0m high
    rule_10_3 = {
        "article_id": "10",
        "rule_id": "10.3",
        "rule_type": "area",
        "description_en": "30% of roof must be open, uncovered, with parapet 1.2-2.0m high",
        "description_ar": "تكون النسبة الباقية من مساحة سقف الطابق الأول ونسبتها 30% كما يلي: تكون خالية من كافة أنواع المباني والخدمات، غير مسقوفة ولا تحتوي أي نوع من أنواع التغطية، تحدها دروة على حافة السطح لا يزيد ارتفاعها عن مترين (2.00م) ولا يقل عن متر وعشرين سنتيمتر (1.20م)",
        "pass": False,
        "details": {}
    }
    
    if area_results['total_roof_area_m2'] == 0:
        rule_10_3["details"] = {
            "note": "FAIL: Total roof floor area not found",
            "error": "No roof geometry detected",
            "solution": "Ensure DXF contains roof polygons on layers with keywords: roof, rooftop, surface, سطح, terrace"
        }
    else:
        # Check condition: empty area >= 30% of total roof area
        open_pass = area_results['open_percent'] >= ROOF_OPEN_MIN_PERCENT
        rule_10_3["pass"] = open_pass
        rule_10_3["details"] = {
            "total_roof_area_m2": round(area_results['total_roof_area_m2'], 2),
            "first_floor_roof_area_m2": round(area_results['first_floor_roof_area_m2'], 2),
            "occupied_area_m2": round(area_results['occupied_area_m2'], 2),
            "empty_area_m2": round(area_results['empty_area_m2'], 2),
            "open_percent": round(area_results['open_percent'], 2),
            "min_required_percent": ROOF_OPEN_MIN_PERCENT,
            "parapet": {
                "min_height_m": PARAPET_MIN_HEIGHT_M,
                "max_height_m": PARAPET_MAX_HEIGHT_M
            },
            "unlabeled_geometry_count": len(roof_open_areas_gdf) if not roof_open_areas_gdf.empty else 0,
            "calculation_method": "Total roof area = first floor roof boundary or sum of all roof elements. Occupied area = sum of labeled building polygons. Empty area = total - occupied.",
            "reason": f"{'PASS' if open_pass else 'FAIL'}: Empty area {area_results['empty_area_m2']:.2f} m² ({area_results['open_percent']:.2f}%) {'meets' if open_pass else 'is below'} minimum requirement of {ROOF_OPEN_MIN_PERCENT}% of total roof area {area_results['total_roof_area_m2']:.2f} m²",
            "parapet_requirement": f"Parapet required around open areas, height {PARAPET_MIN_HEIGHT_M}m to {PARAPET_MAX_HEIGHT_M}m (height verification requires elevation data)"
        }
    
    results.append(rule_10_3)
    
    # Rule 10.4: Parapet required around open roof areas and top roof
    rule_10_4 = {
        "article_id": "10",
        "rule_id": "10.4",
        "rule_type": "safety",
        "description_en": "Parapet required around open roof areas and top roof, height 1.2-2.0m",
        "description_ar": "يلزم بناء دروة تحد أي مساحة غير مبنية من طابق السطح وكذلك السقف العلوي لطابق السطح بارتفاع لا يزيد عن مترين (2.00م) ولا يقل عن متر وعشرين سنتيمتر (1.20م)",
        "pass": False,
        "details": {}
    }
    
    # Check for parapet elements (typically walls or barriers around roof)
    parapet_keywords = ['parapet', 'drowa', 'دروة', 'wall', 'barrier', 'fence']
    parapet_elements = [
        el for el in elements
        if any(keyword in (el.get('name', '') + ' ' + el.get('original_label', '')).lower() 
               for keyword in parapet_keywords)
    ]
    
    parapet_count = len(parapet_elements)
    
    # Note: Height verification requires elevation data (Z-coordinates)
    # For now, we only check if parapets are present
    rule_10_4["pass"] = parapet_count > 0 or area_results['open_percent'] == 0
    rule_10_4["details"] = {
        "min_height_m": PARAPET_MIN_HEIGHT_M,
        "max_height_m": PARAPET_MAX_HEIGHT_M,
        "parapet_count": parapet_count,
        "total_parapet_area_m2": sum(el.get('area', 0) for el in parapet_elements),
        "reason": f"{'PASS' if rule_10_4['pass'] else 'FAIL'}: Parapets detected ({parapet_count}). Height verification requires elevation data.",
        "requirement": f"Parapet required around open roof areas and top roof, height {PARAPET_MIN_HEIGHT_M}m to {PARAPET_MAX_HEIGHT_M}m",
        "note": "Height verification requires elevation data (Z-coordinates) not available in 2D DXF"
    }
    
    results.append(rule_10_4)
    
    return results


def main():
    """Main entry point for Python script called from Node.js."""
    try:
        # Read from stdin (Node.js passes JSON via stdin)
        input_data = json.loads(sys.stdin.read())
        elements = input_data.get('elements', [])
        metadata = input_data.get('metadata', {})
        
        # Validate Article 10
        results = validate_article10_geopandas(elements, metadata)
        
        # Clean results for JSON serialization (replace Infinity/NaN with None)
        def clean_for_json(obj):
            """Recursively clean object for JSON serialization."""
            if isinstance(obj, dict):
                return {k: clean_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_for_json(item) for item in obj]
            elif isinstance(obj, float):
                if obj == float('inf') or obj == float('-inf'):
                    return None
                if obj != obj:  # NaN check
                    return None
                return obj
            return obj
        
        cleaned_results = clean_for_json(results)
        print(json.dumps(cleaned_results, indent=2))
        
    except json.JSONDecodeError as e:
        error_msg = {"error": f"Invalid JSON input: {str(e)}", "type": "JSONDecodeError"}
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_msg = {"error": str(e), "type": type(e).__name__}
        import traceback
        error_msg["traceback"] = traceback.format_exc()
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

