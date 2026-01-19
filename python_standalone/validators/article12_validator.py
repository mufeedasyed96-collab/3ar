"""
Article 12 Validator - Building Ventilation and Lighting
"""

from typing import Dict, List


def validate_article12(elements: List[Dict], article12_schema: Dict) -> List[Dict]:
    """Validate Article 12 rules."""
    results = []
    
    # Identify living spaces
    living_space_names = ['main_hall', 'master_bedroom', 'additional_bedroom', 'living_space_bedroom', 'staff_bedroom']
    living_spaces = [e for e in elements if e.get('name') in living_space_names]
    
    for rule in article12_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '12',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'ventilation':
            # Rule 12.1: Ventilation and lighting openings
            if len(living_spaces) == 0:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'No living spaces detected',
                    'living_spaces_found': 0,
                    'status': 'FAIL'
                }
            else:
                # Check if ventilation property exists
                spaces_with_vent = [s for s in living_spaces if s.get('ventilation') and s.get('ventilation') != 'none_required']
                rule_result['pass'] = len(spaces_with_vent) == len(living_spaces)
                rule_result['details'] = {
                    'living_spaces_found': len(living_spaces),
                    'spaces_with_ventilation': len(spaces_with_vent),
                    'min_glazed_percent': rule.get('min_glazed_percent', 8),
                    'min_ventilation_percent': rule.get('min_ventilation_percent', 4),
                    'status': 'PASS' if rule_result['pass'] else 'FAIL',
                    'note': 'Glazed area and ventilation percentages require manual verification'
                }
        
        elif rule_type == 'safety':
            # Rules 12.2, 12.3: Emergency escape openings
            if len(living_spaces) == 0:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'No living spaces detected',
                    'living_spaces_found': 0,
                    'status': 'FAIL'
                }
            else:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'living_spaces_found': len(living_spaces),
                    'required_per_living_space': rule.get('required_per_living_space', 1),
                    'note': 'Escape opening validation requires opening geometry data',
                    'status': 'UNKNOWN',
                    'error': 'Opening geometry not available'
                }
        
        results.append(rule_result)
    
    return results

