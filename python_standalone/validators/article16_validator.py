"""
Article 16 Validator - Car Parking
"""

from typing import Dict, List

def validate_article16(elements: List[Dict], article16_schema: Dict) -> List[Dict]:
    """Validate Article 16 rules."""
    results = []
    
    # Detect parking elements
    keywords = article16_schema.get('keywords', {})
    parking_keywords = keywords.get('parking') or ["parking", "garage", "car", "vehicle", "موقف", "كراج", "سيارات"]
    
    parking_elements = [e for e in elements if any(kw in str(e.get('name', '')).lower() or kw in str(e.get('original_label', '')).lower() for kw in parking_keywords)]
    
    for rule in article16_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '16',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'safety':
            # Rule 16.2: Separation from play areas
            if not parking_elements:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'No parking elements detected',
                    'status': 'FAIL',
                    'error': 'Minimum 2 parking spaces required (Rule 16.1), none found.'
                }
            else:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'parking_count': len(parking_elements),
                    'note': 'Safety separation validation requires spatial analysis of play areas vs parking',
                    'status': 'FAIL',
                    'error': 'Spatial analysis not implemented'
                }
        
        results.append(rule_result)
    
    return results
