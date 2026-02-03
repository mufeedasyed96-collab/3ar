"""
Article 5 Validator - Building Coverage and Floor Area
Validates building coverage percentage and minimum floor areas.
"""

from typing import Dict, List, Any, Optional


def calculate_ground_floor_area(elements: List[Dict]) -> float:
    """Calculate total ground floor area from elements."""
    total = 0.0
    for el in elements:
        floor = str(el.get('floor', '')).lower()
        if 'ground' in floor or floor == '0' or floor == '':
            area = el.get('area', 0) or 0
            if area > 0:
                total += area
    return total


def calculate_total_building_area(elements: List[Dict]) -> float:
    """Calculate total building area from all floors."""
    total = 0.0
    for el in elements:
        area = el.get('area', 0) or 0
        if area > 0:
            total += area
    return total


def validate_article5(elements: List[Dict], metadata: Dict, article5_schema: Dict) -> List[Dict]:
    """
    Validate Article 5 rules: Building Coverage and Floor Area.
    
    Args:
        elements: List of extracted elements
        metadata: Metadata with plot_area_m2, building_area_m2, etc.
        article5_schema: Article 5 configuration
        
    Returns:
        List of validation results
    """
    results = []
    
    # Get plot and building areas
    plot_area = metadata.get('plot_area_m2')
    building_area_from_metadata = metadata.get('building_area_m2')
    
    # Calculate building footprint (prefer metadata, fallback to calculation)
    building_footprint = building_area_from_metadata if building_area_from_metadata else calculate_ground_floor_area(elements)
    
    # Sanity check: if metadata value is too large, use calculated
    if building_area_from_metadata and building_area_from_metadata > 50000:
        building_footprint = calculate_ground_floor_area(elements)
    
    # Total building area
    total_building_area = building_area_from_metadata if building_area_from_metadata else calculate_total_building_area(elements)
    if building_area_from_metadata and building_area_from_metadata > 50000:
        total_building_area = calculate_total_building_area(elements)
    
    # Ground floor area
    ground_floor_area = calculate_ground_floor_area(elements)
    if ground_floor_area > 5000 and building_area_from_metadata:
        ground_floor_area = building_area_from_metadata
    
    # Open area
    open_area = (plot_area - building_footprint) if plot_area else None
    open_area_percent = ((open_area / plot_area) * 100) if plot_area and open_area else None
    
    # Building coverage percent
    building_coverage_percent = ((building_footprint / plot_area) * 100) if plot_area and plot_area >= 20 else None
    
    for rule in article5_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        description_en = rule.get('description_en', '')
        description_ar = rule.get('description_ar', '')
        
        rule_result = {
            'article_id': '5',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': description_en,
            'description_ar': description_ar,
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'percentage':
            if rule.get('element') == 'building_coverage':
                # Rule 5.1: Building coverage max 70%
                if not plot_area or plot_area < 20:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'error': 'Plot area missing or invalid',
                        'status': 'FAIL',
                        'plot_area_m2': plot_area,
                        'building_footprint_area_m2': building_footprint,
                        'building_coverage_percent': None
                    }
                elif building_footprint == 0:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'error': 'No building footprint found',
                        'status': 'FAIL',
                        'plot_area_m2': plot_area,
                        'building_footprint_area_m2': 0,
                        'building_coverage_percent': 0
                    }
                else:
                    max_value = rule.get('max_value')
                    rule_result['pass'] = building_coverage_percent <= max_value
                    rule_result['details'] = {
                        'plot_area_m2': round(plot_area, 2),
                        'building_footprint_area_m2': round(building_footprint, 2),
                        'building_coverage_percent': round(building_coverage_percent, 2),
                        'max_allowed_percent': max_value,
                        'status': 'PASS' if rule_result['pass'] else 'FAIL',
                        'reason': f"Building coverage {building_coverage_percent:.2f}% {'≤' if rule_result['pass'] else '>'} {max_value}%"
                    }
                    
            elif rule.get('element') == 'open_area':
                # Rule 5.2: Open area min 30%
                if not plot_area or plot_area < 20:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'error': 'Plot area missing or invalid',
                        'status': 'FAIL',
                        'plot_area_m2': plot_area,
                        'open_area_m2': None,
                        'open_area_percent': None
                    }
                else:
                    min_value = rule.get('min_value')
                    rule_result['pass'] = open_area_percent >= min_value if open_area_percent else False
                    rule_result['details'] = {
                        'plot_area_m2': round(plot_area, 2),
                        'open_area_m2': round(open_area, 2) if open_area else None,
                        'open_area_percent': round(open_area_percent, 2) if open_area_percent else None,
                        'min_required_percent': min_value,
                        'status': 'PASS' if rule_result['pass'] else 'FAIL',
                        'reason': f"Open area {open_area_percent:.2f}% {'≥' if rule_result['pass'] else '<'} {min_value}%" if open_area_percent else 'Cannot calculate'
                    }
                    
            elif rule.get('element') == 'lightweight_coverage_of_open_area':
                # Rule 5.3: Lightweight coverage max 50% of open area
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'Lightweight coverage validation requires manual verification',
                    'max_percent': rule.get('max_value'),
                    'status': 'FAIL',
                    'error': 'Lightweight coverage data missing'
                }
        
        elif rule_type == 'area':
            # Rule 5.4: Minimum floor areas
            constraints = rule.get('constraints', [])
            issues = []
            
            for constraint in constraints:
                element_type = constraint.get('element')
                min_value = constraint.get('min_value')
                
                if element_type == 'villa_total_floor_area':
                    if total_building_area < min_value:
                        issues.append(f"Total floor area {total_building_area:.2f} m² < {min_value} m²")
                elif element_type == 'ground_floor_area':
                    if ground_floor_area < min_value:
                        issues.append(f"Ground floor area {ground_floor_area:.2f} m² < {min_value} m²")
            
            rule_result['pass'] = len(issues) == 0
            rule_result['details'] = {
                'villa_total_floor_area_m2': round(total_building_area, 2),
                'ground_floor_area_m2': round(ground_floor_area, 2),
                'constraints': constraints,
                'issues': issues if issues else None,
                'status': 'PASS' if rule_result['pass'] else 'FAIL',
                'reason': 'All area requirements met' if rule_result['pass'] else '; '.join(issues)
            }
        
        results.append(rule_result)
    
    return results

