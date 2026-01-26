"""
Article 13 Validator using Shapely for geometry calculations
Validates stairs and steps rules using Shapely.

NOTE:
- DXF plans are usually 2D; riser/tread/headroom/handrail-height often cannot be validated reliably
  unless your extracted elements include Z/elevation or explicit attributes.
"""

import json
import sys
from typing import Dict, List, Optional, Tuple

try:
    from shapely.geometry import Polygon, Point  # type: ignore
    SHAPELY_AVAILABLE = True
    _SHAPELY_IMPORT_ERROR = None
except Exception as e:
    SHAPELY_AVAILABLE = False
    _SHAPELY_IMPORT_ERROR = e
    print(
        "WARNING: Shapely not available for Article 13. "
        "Install with: pip install shapely. "
        f"Original error: {e}",
        file=sys.stderr,
    )
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass
# ---------------------------
# Rule constants
# ---------------------------
# Rule constants (Moved to schema)
SCALE_MM_TO_M = 0.001  # If your extractor outputs mm. If not sure, make this configurable via metadata.

SCALE_MM_TO_M = 0.001  # If your extractor outputs mm. If not sure, make this configurable via metadata.


# ---------------------------
# Helpers
# ---------------------------
def close_polygon_coords(coords: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    if not coords or len(coords) < 3:
        return coords
    return coords if coords[0] == coords[-1] else coords + [coords[0]]


def scale_coords(coords: List[Tuple[float, float]], factor: float) -> List[Tuple[float, float]]:
    return [(x * factor, y * factor) for x, y in coords]


def create_polygon_from_vertices(
    vertices: List[Tuple[float, float]],
    scale_factor: float,
) -> Optional[Polygon]:
    if not vertices or len(vertices) < 3:
        return None
    coords = close_polygon_coords(vertices)
    coords = scale_coords(coords, scale_factor)
    try:
        poly = Polygon(coords)
        if not poly.is_valid:
            poly = poly.buffer(0)  # fix self-intersections
        if poly.is_empty or poly.area <= 0:
            return None
        return poly
    except Exception:
        return None


def polygon_min_width_and_max_length(poly: Polygon) -> Tuple[float, float]:
    """
    Uses minimum rotated rectangle:
    - width = min(adjacent edges)
    - length = max(adjacent edges)
    """
    if poly.is_empty:
        return 0.0, 0.0

    rect = poly.minimum_rotated_rectangle
    if not isinstance(rect, Polygon) or rect.is_empty:
        return 0.0, 0.0

    coords = list(rect.exterior.coords)
    if len(coords) < 4:
        return 0.0, 0.0

    side1 = Point(coords[0]).distance(Point(coords[1]))
    side2 = Point(coords[1]).distance(Point(coords[2]))
    width = float(min(side1, side2))
    length = float(max(side1, side2))
    return width, length


def distance_between_polygons(poly1: Polygon, poly2: Polygon) -> Optional[float]:
    try:
        return float(poly1.distance(poly2))
    except Exception:
        return None


def get_scale_factor_from_metadata(metadata: Dict) -> float:
    """
    Prefer a unit provided by metadata if you have it.
    Fallback assumes mm->m (0.001) because many CAD exports are in mm.
    """
    # Example: metadata may contain "units": "m" | "mm"
    unit = str(metadata.get("units", "")).lower().strip()
    if unit in ("m", "meter", "meters"):
        return 1.0
    if unit in ("mm", "millimeter", "millimeters"):
        return 0.001
    if unit in ("cm", "centimeter", "centimeters"):
        return 0.01
    if unit in ("cm", "centimeter", "centimeters"):
        return 0.01
    return 0.001  # Default to mm if unknown


# ---------------------------
# Extraction
# ---------------------------
STAIR_KEYWORDS = ("stair", "stairs", "staircase", "step", "steps", "درج", "سلم", "سلالم")


def is_stair_element(el: Dict) -> bool:
    name = str(el.get("name", "")).lower()
    original_label = str(el.get("original_label", "")).lower()
    layer = str(el.get("layer", "")).lower()
    block = str(el.get("block_name", "")).lower()
    return any(k in name or k in original_label or k in layer or k in block for k in STAIR_KEYWORDS)


def extract_stair_elements(elements: List[Dict], scale_factor: float) -> List[Dict]:
    stair_elements: List[Dict] = []

    for el in elements:
        if not is_stair_element(el):
            continue

        vertices = el.get("vertices")
        if not vertices or len(vertices) < 3:
            continue

        poly = create_polygon_from_vertices(vertices, scale_factor)
        if poly is None:
            continue

        width, length = polygon_min_width_and_max_length(poly)

        stair_elements.append(
            {
                "element": el,
                "polygon": poly,
                "width_m": width,
                "length_m": length,
                "area_m2": float(poly.area),
                "z_values": el.get("z_values") or [],
                "handrail_height_cm": el.get("handrail_height_cm"),
            }
        )

    return stair_elements


# ---------------------------
# Dimension estimation (limited)
# ---------------------------
def estimate_step_dims(stair: Dict) -> Dict:
    """
    In 2D DXF this is usually not reliable.
    We'll only compute if z_values exist.
    """
    dims = {
        "riser_cm": None,
        "tread_cm": None,
        "nosing_cm": None,  # cannot be derived from footprint
        "vertical_rise_m": None,
        "headroom_m": None,  # cannot be derived from plan
    }

    z_values_raw = stair.get("z_values") or []
    # Clean z_values: ensure they are numbers
    z_values = []
    for z in z_values_raw:
        if isinstance(z, (int, float)):
            z_values.append(float(z))
        elif isinstance(z, str):
            try:
                z_values.append(float(z))
            except ValueError:
                pass
        # Ignore dicts or other types to prevent TypeError

    if len(z_values) >= 2:
        zmin, zmax = float(min(z_values)), float(max(z_values))
        rise = zmax - zmin
        dims["vertical_rise_m"] = rise

        if rise > 0:
            est_steps = max(int(rise / 0.15), 1)  # rough estimate
            dims["riser_cm"] = (rise / est_steps) * 100.0
            length_m = float(stair.get("length_m") or 0.0)
            if length_m > 0:
                dims["tread_cm"] = (length_m / est_steps) * 100.0

    return dims


# ---------------------------
# Validation
# ---------------------------
# ---------------------------
# Validation
# ---------------------------
def _get_rule(schema: Dict, rule_id: str) -> Optional[Dict]:
    """Helper to find rule by ID in schema."""
    if not schema or 'rules' not in schema:
        return None
    for r in schema['rules']:
        if r.get('rule_id') == rule_id:
            return r
    return None

def validate_article13_geopandas(elements: List[Dict], metadata: Dict, article_schema: Dict) -> List[Dict]:
    if not SHAPELY_AVAILABLE:
        return [
            {
                "rule_id": "13.0",
                "pass": False,
                "details": {
                    "status": "FAIL",
                    "rule_type": "dependency",
                    "reason": "Shapely not available for Article 13",
                    "error": str(_SHAPELY_IMPORT_ERROR) if _SHAPELY_IMPORT_ERROR else None,
                },
            }
        ]
    results: List[Dict] = []
    scale_factor = get_scale_factor_from_metadata(metadata)
    stairs = extract_stair_elements(elements, scale_factor)
    stair_count = len(stairs)

    # If no explicit stair geometry found, attempt to infer a stair from technical schedule/text
    inferred_from_tech = False
    tech = metadata.get('tech_details', {}) or {}
    if stair_count == 0 and isinstance(tech, dict):
        if any(k in tech and tech.get(k) is not None for k in ("stair_width", "riser", "tread", "handrail_height")):
            # Create an inferred stair entry using available tech values and floor heights as z_values
            inferred_from_tech = True
            st = {
                "element": {"name": "inferred_stair", "original_label": "stair (inferred from tech schedule)"},
                "polygon": None,
                "width_m": float(tech.get("stair_width")) if tech.get("stair_width") is not None else None,
                "length_m": None,
                "area_m2": 0.0,
                "z_values": metadata.get("floor_heights", []) or [],
                "handrail_height_cm": tech.get("handrail_height")
            }
            stairs = [st]
            stair_count = 1


    # 13.1 stairs count + separation if 2
    rule_13_1 = {
        "article_id": "13",
        "rule_id": "13.1",
        "rule_type": "circulation",
        "description_en": "One stair required connecting all floors. Second stair permitted if min 15m apart",
        "description_ar": "يلزم عمل درج واحد يصل بين جميع الطوابق من داخل الفيلا فقط ولا يشترط فيه الاتصال الرأسي بين الطوابق، كما يسمح بدرج ثاني على ألا تقل المسافة بين الدرجين عن 15 متر",
        "pass": False,
        "details": {},
    }

    # Extract params from schema
    r13_1 = _get_rule(article_schema, "13.1")
    min_stairs = int(r13_1.get('min_stairs', 1)) if r13_1 else 1
    max_stairs = int(r13_1.get('max_stairs', 2)) if r13_1 else 2
    min_sep = float(r13_1.get('min_separation_if_two_m', 15.0)) if r13_1 else 15.0

    if stair_count < min_stairs:
        rule_13_1["pass"] = False
        rule_13_1["details"] = {
            "stair_count": stair_count,
            "min_required": min_stairs,
            "reason": f"FAIL: Only {stair_count} stair(s) detected. Minimum {min_stairs} stair required.",
        }
    elif stair_count > max_stairs:
        rule_13_1["pass"] = False
        rule_13_1["details"] = {
            "stair_count": stair_count,
            "max_allowed": max_stairs,
            "reason": f"FAIL: {stair_count} stairs detected. Maximum {max_stairs} stairs allowed.",
        }
    elif stair_count == 2:
        dist = distance_between_polygons(stairs[0]["polygon"], stairs[1]["polygon"])
        if dist is None:
            rule_13_1["pass"] = False
            rule_13_1["details"] = {
                "stair_count": stair_count,
                "separation_distance_m": None,
                "min_required_separation_m": min_sep,
                "reason": "FAIL: Could not compute separation distance.",
                "status": "FAIL"
            }
        else:
            ok = dist >= min_sep
            rule_13_1["pass"] = ok
            rule_13_1["details"] = {
                "stair_count": stair_count,
                "separation_distance_m": round(dist, 2),
                "min_required_separation_m": min_sep,
                "reason": f"{'PASS' if ok else 'FAIL'}: Separation {dist:.2f}m "
                          f"{'meets' if ok else 'below'} minimum {min_sep}m",
            }
    else:
        rule_13_1["pass"] = True
        rule_13_1["details"] = {
            "stair_count": stair_count,
            "reason": "PASS: One stair detected (required).",
        }

    results.append(rule_13_1)

    # 13.3 width rule
    rule_13_3 = {
        "article_id": "13",
        "rule_id": "13.3",
        "rule_type": "dimension",
        "description_en": "Stair clear width min 1.2m between handrails or handrail and wall. Max total width 1.5m at narrowest",
        "description_ar": "لا يقل الطول الظاهري لدرجة السلم عن متر وعشرين سنتيمتر (1.2م) ... ولا يزيد العرض الكلي للدرج عن 1.5م عند أضيق نقطة فيه",
        "pass": False,
        "details": {},
    }

    # Extract params from schema
    r13_3 = _get_rule(article_schema, "13.3")
    min_clear_width = float(r13_3.get('min_clear_width_m', 1.2)) if r13_3 else 1.2
    max_total_width = float(r13_3.get('max_total_width_m', 1.5)) if r13_3 else 1.5

    if stair_count == 0:
        rule_13_3["pass"] = False
        rule_13_3["details"] = {"stair_count": 0, "status": "FAIL", "reason": "FAIL: No stairs detected."}
    else:
        violations = []
        widths = []
        for i, st in enumerate(stairs, start=1):
            w = float(st.get("width_m") or 0.0)
            widths.append(round(w, 2))
            if w < min_clear_width:
                violations.append(f"Stair {i}: width {w:.2f}m below {min_clear_width}m")
            elif w > max_total_width:
                violations.append(f"Stair {i}: width {w:.2f}m above {max_total_width}m")

        ok = len(violations) == 0
        rule_13_3["pass"] = ok
        rule_13_3["details"] = {
            "stair_count": stair_count,
            "stair_widths_m": widths,
            "min_clear_width_m": min_clear_width,
            "max_total_width_m": max_total_width,
            "violations": violations,
            "reason": "PASS: Widths compliant." if ok else "FAIL: " + "; ".join(violations),
        }

    results.append(rule_13_3)

    # 13.4 riser/tread/nosing -> usually UNKNOWN unless z_values exist
    rule_13_4 = {
        "article_id": "13",
        "rule_id": "13.4",
        "rule_type": "dimension",
        "description_en": "Step riser 10-18cm, tread min 28cm, nosing max 3.2cm",
        "description_ar": "ألا يزيد ارتفاع الدرجة ... ولا يزيد بروز أنف درجة السلم عن 3.2 سم",
        "pass": False,
        "details": {},
    }

    # Extract params from schema
    r13_4 = _get_rule(article_schema, "13.4")
    min_riser = 10.0
    max_riser = 18.0
    min_tread = 28.0
    if r13_4:
        if 'riser' in r13_4:
            min_riser = float(r13_4['riser'].get('min_cm', 10.0))
            max_riser = float(r13_4['riser'].get('max_cm', 18.0))
        min_tread = float(r13_4.get('tread_min_cm', 28.0))

    if stair_count == 0:
        rule_13_4["pass"] = False
        rule_13_4["details"] = {"stair_count": 0, "status": "FAIL", "reason": "FAIL: No stairs detected."}
    else:
        # If no z-values anywhere -> FAIL, not UNKNOWN
        # We need to clean z_values check as well
        any_z = False
        for st in stairs:
            raw_z = st.get("z_values") or []
            valid_z = [z for z in raw_z if isinstance(z, (int, float)) or (isinstance(z, str) and z.replace('.','',1).isdigit())]
            if len(valid_z) >= 2:
                any_z = True
                break
        
        if not any_z:
            rule_13_4["pass"] = False
            rule_13_4["details"] = {
                "status": "FAIL",
                "error": "Elevation data missing",
                "reason": "2D plan lacks elevation/Z data; cannot validate riser/tread/nosing reliably.",
            }
        else:
            violations = []
            per_stair = []
            for i, st in enumerate(stairs, start=1):
                dims = estimate_step_dims(st)
                per_stair.append({"stair": i, **dims})
                r = dims["riser_cm"]
                t = dims["tread_cm"]

                if r is not None:
                    if r < min_riser:
                        violations.append(f"Stair {i}: riser {r:.1f}cm below {min_riser}cm")
                    elif r > max_riser:
                        violations.append(f"Stair {i}: riser {r:.1f}cm above {max_riser}cm")

                if t is not None and t < min_tread:
                    violations.append(f"Stair {i}: tread {t:.1f}cm below {min_tread}cm")

                # nosing requires step detail geometry -> UNKNOWN
            ok = len(violations) == 0
            rule_13_4["pass"] = ok
            rule_13_4["details"] = {
                "status": "PASS" if ok else "FAIL",
                "per_stair_estimates": per_stair,
                "violations": violations,
                "note": "Nosing cannot be derived from footprint; needs detailed step geometry.",
                "reason": "PASS: Estimates compliant." if ok else "FAIL: " + "; ".join(violations),
            }

    results.append(rule_13_4)

    # 13.5 rise/headroom -> headroom typically UNKNOWN in 2D
    rule_13_5 = {
        "article_id": "13",
        "rule_id": "13.5",
        "rule_type": "dimension",
        "description_en": "Single stair flight max vertical rise 3.65m, min headroom under flight 2.05m",
        "description_ar": "لا يزيد الارتفاع الرأسي ... ولا يقل صافي إرتفاع الفراغ ...",
        "pass": False,
        "details": {},
    }

    # Extract params from schema
    r13_5 = _get_rule(article_schema, "13.5")
    max_vert_rise = float(r13_5.get('max_vertical_rise_m', 3.65)) if r13_5 else 3.65

    if stair_count == 0:
        rule_13_5["pass"] = False
        rule_13_5["details"] = {"stair_count": 0, "status": "FAIL", "reason": "FAIL: No stairs detected."}
    else:
        # Same check for Z
        any_z = False
        for st in stairs:
            raw_z = st.get("z_values") or []
            valid_z = [z for z in raw_z if isinstance(z, (int, float)) or (isinstance(z, str) and z.replace('.','',1).isdigit())]
            if len(valid_z) >= 2:
                any_z = True
                break

        if not any_z:
            rule_13_5["pass"] = False
            rule_13_5["details"] = {
                "status": "FAIL",
                "error": "Elevation data missing",
                "reason": "2D plan lacks elevation/Z data; cannot validate vertical rise/headroom reliably.",
            }
        else:
            violations = []
            rises = []
            for i, st in enumerate(stairs, start=1):
                dims = estimate_step_dims(st)
                rise = dims["vertical_rise_m"]
                rises.append(None if rise is None else round(float(rise), 2))
                if rise is not None and rise > max_vert_rise:
                    violations.append(f"Stair {i}: rise {rise:.2f}m above {max_vert_rise}m")
            ok = len(violations) == 0
            rule_13_5["pass"] = ok
            rule_13_5["details"] = {
                "status": "PASS" if ok else "FAIL",
                "vertical_rise_m": rises,
                "violations": violations,
                "note": "Headroom needs section/elevation; not derivable from plan footprint.",
                "reason": "PASS: Rise compliant." if ok else "FAIL: " + "; ".join(violations),
            }

    results.append(rule_13_5)

    # 13.6 handrail height -> usually UNKNOWN unless attribute present
    rule_13_6 = {
        "article_id": "13",
        "rule_id": "13.6",
        "rule_type": "safety",
        "description_en": "Handrail height 86.5-96.5cm measured from step nosing. At least one handrail per stair",
        "description_ar": "لا يقل ارتفاع حاجز الدرج ... ويزود كل درج بالدرابزين ...",
        "pass": False,
        "details": {},
    }

    # Extract params from schema
    r13_6 = _get_rule(article_schema, "13.6")
    min_handrail = float(r13_6.get('min_height_cm', 86.5)) if r13_6 else 86.5
    max_handrail = float(r13_6.get('max_height_cm', 96.5)) if r13_6 else 96.5

    if stair_count == 0:
        rule_13_6["pass"] = False
        rule_13_6["details"] = {"stair_count": 0, "status": "FAIL", "reason": "FAIL: No stairs detected."}
    else:
        heights = []
        missing = []
        violations = []
        for i, st in enumerate(stairs, start=1):
            h = st.get("handrail_height_cm")
            if h is None:
                missing.append(i)
                heights.append(None)
            else:
                h = float(h)
                heights.append(round(h, 1))
                if h < min_handrail:
                    violations.append(f"Stair {i}: handrail {h:.1f}cm below {min_handrail}cm")
                elif h > max_handrail:
                    violations.append(f"Stair {i}: handrail {h:.1f}cm above {max_handrail}cm")

        if missing and not violations:
            rule_13_6["pass"] = False
            rule_13_6["details"] = {
                "status": "FAIL",
                "error": "Handrail height data missing",
                "handrail_heights_cm": heights,
                "missing_for_stairs": missing,
                "reason": "Handrail height not present in extracted data; cannot validate from 2D plan.",
            }
        else:
            ok = len(violations) == 0 and len(missing) == 0
            rule_13_6["pass"] = ok
            rule_13_6["details"] = {
                "status": "PASS" if ok else ("FAIL" if violations else "UNKNOWN"),
                "handrail_heights_cm": heights,
                "missing_for_stairs": missing,
                "violations": violations,
                "reason": "PASS: Handrail heights compliant."
                if ok
                else ("FAIL: " + "; ".join(violations) if violations else "UNKNOWN: Missing handrail data."),
            }

    results.append(rule_13_6)

    return results


# ---------------------------
# Main
# ---------------------------
def main() -> None:
    try:
        input_data = json.loads(sys.stdin.read() or "{}")
        elements = input_data.get("elements", [])
        metadata = input_data.get("metadata", {})

        # Schema (mock fetch for standalone main)
        from config import get_article
        article_schema = get_article("13") or {}
        
        results = validate_article13_geopandas(elements, metadata, article_schema)

        # stdout MUST be pure JSON (Node parses this)
        print(json.dumps(results, ensure_ascii=False, indent=2))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}", "type": "JSONDecodeError"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        import traceback
        print(
            json.dumps(
                {"error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()},
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
