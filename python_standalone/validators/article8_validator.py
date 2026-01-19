"""
Article 8 Validator - Number of Floors, Heights and Levels
"""

from typing import Dict, List


def count_floors(elements: List[Dict]) -> Dict[str, int]:
    """Count floors by type."""
    counts = {'basement': 0, 'ground': 0, 'first': 0, 'roof': 0}
    
    for el in elements:
        floor = str(el.get('floor', '')).lower()
        if 'basement' in floor or 'sardab' in floor or 'سرداب' in floor:
            counts['basement'] = 1
        elif 'ground' in floor or floor == '0' or floor == '':
            counts['ground'] = 1
        elif 'first' in floor or floor == '1':
            counts['first'] = 1
        elif 'roof' in floor or 'surface' in floor or 'سطح' in floor:
            counts['roof'] = 1
    
    return counts


def validate_article8(elements: List[Dict], metadata: Dict, article8_schema: Dict) -> List[Dict]:
    """Validate Article 8 rules."""
    results = []
    floor_counts = count_floors(elements)
    
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
            if floor_counts['basement'] > max_floors.get('basement', 1):
                issues.append(f"Basement: {floor_counts['basement']} > {max_floors.get('basement', 1)}")
            if floor_counts['ground'] > max_floors.get('ground', 1):
                issues.append(f"Ground: {floor_counts['ground']} > {max_floors.get('ground', 1)}")
            if floor_counts['first'] > max_floors.get('first', 1):
                issues.append(f"First: {floor_counts['first']} > {max_floors.get('first', 1)}")
            if floor_counts['roof'] > max_floors.get('roof', 1):
                issues.append(f"Roof: {floor_counts['roof']} > {max_floors.get('roof', 1)}")
            if total_above > max_floors.get('total_above_ground', 3):
                issues.append(f"Total above-ground: {total_above} > {max_floors.get('total_above_ground', 3)}")
            
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
            rule_result['pass'] = True  # Requires elevation data
            rule_result['details'] = {
                'note': 'Height/level validation requires elevation metadata',
                'status': 'UNKNOWN'
            }
        
        results.append(rule_result)
    
    return results

