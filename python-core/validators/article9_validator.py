"""
Article 9 Validator - Basement Floor
"""

from typing import Dict, List


def detect_basement(elements: List[Dict], keywords: Dict = None) -> Dict:
    """Detect basement elements."""
    kw = keywords or {}
    basement_kw = kw.get('basement') or ['basement', 'sardab', 'سرداب', 'sardab']
    
    basement_elements = [e for e in elements if any(
        kw in str(e.get('name', '')).lower() or 
        kw in str(e.get('floor', '')).lower() or
        kw in str(e.get('original_label', '')).lower()
        for kw in basement_kw
    )]
    
    return {
        'has_basement': len(basement_elements) > 0,
        'count': 1 if len(basement_elements) > 0 else 0,
        'elements': basement_elements
    }


def validate_article9(elements: List[Dict], metadata: Dict, article9_schema: Dict) -> List[Dict]:
    """Validate Article 9 rules."""
    results = []
    basement_keywords = article9_schema.get('keywords', {})
    basement_info = detect_basement(elements, basement_keywords)
    
    for rule in article9_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '9',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if not basement_info['has_basement']:
            rule_result['pass'] = True
            rule_result['details'] = {
                'note': 'No basement detected. Rule applies when basement is present.',
                'basement_detected': False,
                'status': 'PASS'
            }
        elif rule_type == 'basement':
            if rule_id == '9.1':
                max_basements = rule.get('max_basements')
                rule_result['pass'] = basement_info['count'] <= max_basements
                rule_result['details'] = {
                    'basement_count': basement_info['count'],
                    'max_allowed': max_basements,
                    'status': 'PASS' if rule_result['pass'] else 'FAIL'
                }
            elif rule_id == '9.2':
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'Basement extension validation requires spatial analysis',
                    'status': 'FAIL',
                    'error': 'Spatial analysis not implemented'
                }
        elif rule_type == 'use':
            # Rule 9.4: Permitted uses
            permitted = rule.get('permitted_uses', [])
            rule_result['pass'] = False
            rule_result['details'] = {
                'permitted_uses': permitted,
                'note': 'Use validation requires element classification',
                'status': 'FAIL',
                'error': 'Element classification not available'
            }
        
        results.append(rule_result)
    
    return results

