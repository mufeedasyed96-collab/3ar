"""
Article 8 Validator - Number of Floors, Heights and Levels
"""

from typing import Dict, List


def count_floors(elements: List[Dict], keywords: Dict = None) -> Dict[str, int]:
    """Count floors by type."""
    counts = {'basement': 0, 'ground': 0, 'first': 0, 'roof': 0}
    kw = keywords or {}
    
    basement_kw = kw.get('basement') or ['basement', 'sardab', 'سرداب']
    ground_kw = kw.get('ground') or ['ground', '0']
    first_kw = kw.get('first') or ['first', '1']
    roof_kw = kw.get('roof') or ['roof', 'surface', 'سطح']

    for el in elements:
        floor = str(el.get('floor', '')).lower()
        if any(k in floor for k in basement_kw):
            counts['basement'] = 1
        elif any(k in floor for k in ground_kw) or floor == '':
            counts['ground'] = 1
        elif any(k in floor for k in first_kw):
            counts['first'] = 1
        elif any(k in floor for k in roof_kw):
            counts['roof'] = 1
    
    return counts


def validate_article8(elements: List[Dict], metadata: Dict, article8_schema: Dict) -> List[Dict]:
    """Validate Article 8 rules."""
    results = []
    floor_keywords = article8_schema.get('keywords', {})
    floor_counts = count_floors(elements, floor_keywords)
    
    for rule in article8_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '8',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'floors':
            # Rule 8.1: Maximum floors
            max_floors = rule.get('max_floors', {})
            total_above = floor_counts['ground'] + floor_counts['first'] + floor_counts['roof']
            
            issues = []
            if floor_counts['basement'] > max_floors.get('basement'):
                issues.append(f"Basement: {floor_counts['basement']} > {max_floors.get('basement')}")
            if floor_counts['ground'] > max_floors.get('ground'):
                issues.append(f"Ground: {floor_counts['ground']} > {max_floors.get('ground')}")
            if floor_counts['first'] > max_floors.get('first'):
                issues.append(f"First: {floor_counts['first']} > {max_floors.get('first')}")
            if floor_counts['roof'] > max_floors.get('roof'):
                issues.append(f"Roof: {floor_counts['roof']} > {max_floors.get('roof')}")
            if total_above > max_floors.get('total_above_ground'):
                issues.append(f"Total above-ground: {total_above} > {max_floors.get('total_above_ground')}")
            
            rule_result['pass'] = len(issues) == 0
            rule_result['details'] = {
                'floor_counts': floor_counts,
                'total_above_ground': total_above,
                'max_allowed': max_floors,
                'issues': issues if issues else None,
                'status': 'PASS' if rule_result['pass'] else 'FAIL'
            }
        
        elif rule_type in ['height', 'level', 'drainage']:
            # Rules 8.3-8.11: Heights, levels, drainage
            rule_result['pass'] = False
            rule_result['details'] = {
                'note': 'Height/level validation requires elevation metadata',
                'status': 'FAIL',
                'error': 'Elevation data missing or incomplete'
            }
        
        results.append(rule_result)
    
    return results

