"""
Article 7 Validator - Separation Distances Between Buildings
"""

from typing import Dict, List


def validate_article7(elements: List[Dict], metadata: Dict, article7_schema: Dict) -> List[Dict]:
    """Validate Article 7 rules."""
    results = []
    
    for rule in article7_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '7',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'separation':
            # Rule 7.1, 7.3: Separation distances
            annex_keywords = ['annex', 'outbuilding', 'shed', 'workshop', 'storage', 'ملحق']
            annexes = [e for e in elements if any(kw in str(e.get('name', '')).lower() for kw in annex_keywords)]
            
            if len(annexes) == 0:
                rule_result['pass'] = True
                rule_result['details'] = {
                    'note': 'No annexes detected. Rule applies when annexes are present.',
                    'min_separation_m': rule.get('min_separation_m', 1.5),
                    'status': 'PASS'
                }
            else:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'Separation distance validation requires spatial analysis',
                    'annexes_detected': len(annexes),
                    'min_separation_m': rule.get('min_separation_m', 1.5),
                    'status': 'UNKNOWN',
                    'error': 'Spatial analysis not implemented'
                }
        
        elif rule_type == 'circulation':
            # Rule 7.2: Movement corridors
            corridor_keywords = ['corridor', 'passage', 'hallway', 'ممر']
            corridors = [e for e in elements if any(kw in str(e.get('name', '')).lower() for kw in corridor_keywords)]
            
            min_width = rule.get('min_width_m', 1.1)
            failed = [c for c in corridors if (c.get('width', 0) or 0) < min_width]
            
            rule_result['pass'] = len(failed) == 0
            rule_result['details'] = {
                'corridor_count': len(corridors),
                'failed_count': len(failed),
                'min_width_m': min_width,
                'status': 'PASS' if rule_result['pass'] else 'FAIL'
            }
        
        results.append(rule_result)
    
    return results

