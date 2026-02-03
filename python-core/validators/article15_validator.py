"""
Article 15 Validator - Entrances
"""

from typing import Dict, List


def validate_article15(elements: List[Dict], metadata: Dict, article15_schema: Dict) -> List[Dict]:
    """Validate Article 15 rules."""
    results = []
    
    # Detect entrances
    keywords = article15_schema.get('keywords', {})
    vehicle_keywords = keywords.get('vehicle_entrance') or ['vehicle entrance', 'car entrance', 'garage entrance', 'مدخل السيارات', 'مدخل الكراج']
    pedestrian_keywords = keywords.get('pedestrian_entrance') or ['pedestrian entrance', 'main entrance', 'entrance', 'مدخل', 'مدخل الأفراد']
    
    vehicle_entrances = [
        e for e in elements
        if any(kw in str(e.get('name', '')).lower() or kw in str(e.get('original_label', '')).lower()
               for kw in vehicle_keywords)
    ]
    
    pedestrian_entrances = [
        e for e in elements
        if any(kw in str(e.get('name', '')).lower() or kw in str(e.get('original_label', '')).lower()
               for kw in pedestrian_keywords)
    ]
    
    for rule in article15_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '15',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'entrance':
            if rule.get('element') == 'vehicle_entrance':
                # Rule 15.2a: Max 2 vehicle entrances, min 6m apart
                max_count = rule.get('max_count')
                count = len(vehicle_entrances)
                if count == 0:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'vehicle_entrance_count': 0,
                        'error': 'No vehicle entrances detected',
                        'status': 'FAIL'
                    }
                else:
                    rule_result['pass'] = count <= max_count
                    rule_result['details'] = {
                        'vehicle_entrance_count': count,
                        'max_allowed': max_count,
                        'min_separation_m': rule.get('min_separation_m'),
                        'note': 'Separation distance requires spatial analysis',
                        'status': 'PASS' if rule_result['pass'] else 'FAIL'
                    }

            elif rule.get('element') == 'pedestrian_entrance':
                # Rule 15.3a: Max 2 pedestrian entrances
                max_count = rule.get('max_count')
                count = len(pedestrian_entrances)
                if count == 0:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'pedestrian_entrance_count': 0,
                        'error': 'No pedestrian entrances detected',
                        'status': 'FAIL'
                    }
                else:
                    rule_result['pass'] = count <= max_count
                    rule_result['details'] = {
                        'pedestrian_entrance_count': count,
                        'max_allowed': max_count,
                        'status': 'PASS' if rule_result['pass'] else 'FAIL'
                    }
        
        elif rule_type == 'dimension':
            if rule.get('element') == 'vehicle_entrance':
                # Rule 15.2b: Vehicle entrance width 3-6m
                min_width = rule.get('min_width_m')
                max_width = rule.get('max_width_m')
                
                if not vehicle_entrances:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'vehicle_entrance_count': 0,
                        'status': 'FAIL',
                        'error': 'No vehicle entrances to validate dimensions'
                    }
                else:
                    failed = [
                        e for e in vehicle_entrances
                        if (e.get('width', 0) or 0) < min_width or (e.get('width', 0) or 0) > max_width
                    ]
                    rule_result['pass'] = len(failed) == 0
                    rule_result['details'] = {
                        'vehicle_entrance_count': len(vehicle_entrances),
                        'failed_count': len(failed),
                        'min_width_m': min_width,
                        'max_width_m': max_width,
                        'status': 'PASS' if rule_result['pass'] else 'FAIL'
                    }

            elif rule.get('element') == 'pedestrian_entrance':
                # Rule 15.3e: Pedestrian entrance width 1-2m
                min_width = rule.get('min_width_m')
                max_width = rule.get('max_width_m')
                
                if not pedestrian_entrances:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'pedestrian_entrance_count': 0,
                        'status': 'FAIL',
                        'error': 'No pedestrian entrances to validate dimensions'
                    }
                else:
                    failed = [
                        e for e in pedestrian_entrances
                        if (e.get('width', 0) or 0) < min_width or (e.get('width', 0) or 0) > max_width
                    ]
                    rule_result['pass'] = len(failed) == 0
                    rule_result['details'] = {
                        'pedestrian_entrance_count': len(pedestrian_entrances),
                        'failed_count': len(failed),
                        'min_width_m': min_width,
                        'max_width_m': max_width,
                        'status': 'PASS' if rule_result['pass'] else 'FAIL'
                    }
        
        elif rule_type == 'restriction':
            # Rule 15.4: Doors must not open outside plot
            rule_result['pass'] = False
            rule_result['details'] = {
                'note': 'Door swing validation requires spatial analysis',
                'status': 'FAIL',
                'error': 'Spatial analysis not implemented'
            }
        
        results.append(rule_result)
    
    return results

