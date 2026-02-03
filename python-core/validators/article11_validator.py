"""
Article 11 Validator - Element Areas and Internal Dimensions
"""

from typing import Dict, List


def validate_article11(elements: List[Dict], article11_schema: Dict) -> List[Dict]:
    """Validate Article 11 rules."""
    results = []
    
    # Get basic and additional elements from schema
    basic_elements = article11_schema.get('basic_elements', [])
    additional_elements = article11_schema.get('additional_elements', [])
    
    # Rule 11.0: At least one of each basic element
    rule_result = {
        'article_id': '11',
        'rule_id': '11.0',
        'rule_type': 'requirement',
        'description_en': article11_schema.get('rules', [{}])[0].get('description_en', ''),
        'description_ar': article11_schema.get('rules', [{}])[0].get('description_ar', ''),
        'pass': False,
        'details': {}
    }
    
    missing_basic = []
    found_basic = []
    
    for basic in basic_elements:
        element_name = basic.get('element_en', '')
        found = any(
            e.get('name') == element_name or
            element_name in str(e.get('original_label', '')).lower()
            for e in elements
        )
        if found:
            found_basic.append(element_name)
        else:
            missing_basic.append(element_name)
    
    rule_result['pass'] = len(missing_basic) == 0
    rule_result['details'] = {
        'required_basic_elements': [b.get('element_en') for b in basic_elements],
        'found_basic_elements': found_basic,
        'missing_basic_elements': missing_basic if missing_basic else None,
        'status': 'PASS' if rule_result['pass'] else 'FAIL'
    }
    results.append(rule_result)
    
    # Validate each basic element's area and width
    for basic in basic_elements:
        element_name = basic.get('element_en', '')
        matching_elements = [
            e for e in elements
            if e.get('name') == element_name or element_name in str(e.get('original_label', '')).lower()
        ]
        
        for el in matching_elements:
            el_result = {
                'article_id': '11',
                'rule_id': basic.get('id'),
                'rule_type': 'element',
                'description_en': f"{basic.get('element_en')} - {basic.get('element_ar')}",
                'description_ar': basic.get('element_ar', ''),
                'pass': False,
                'details': {}
            }
            
            issues = []
            area = el.get('area', 0) or 0
            width = el.get('width', 0) or 0
            min_area = basic.get('min_area_m2')
            min_width = basic.get('min_width_m')
            
            if min_area and area < min_area:
                issues.append(f"Area {area:.2f} m² < {min_area} m²")
            if min_width and width < min_width:
                issues.append(f"Width {width:.2f} m < {min_width} m")
            
            el_result['pass'] = len(issues) == 0
            el_result['details'] = {
                'element_name': element_name,
                'area_m2': round(area, 2),
                'width_m': round(width, 2),
                'min_area_m2': min_area,
                'min_width_m': min_width,
                'issues': issues if issues else None,
                'status': 'PASS' if el_result['pass'] else 'FAIL'
            }
            results.append(el_result)
    
    return results

