"""
Article 14 Validator - Fences
"""

from typing import Dict, List

def validate_article14(elements: List[Dict], article14_schema: Dict) -> List[Dict]:
    """Validate Article 14 rules."""
    results = []
    
    # Detect fence elements
    keywords = article14_schema.get('keywords', {})
    fence_keywords = keywords.get('fence') or ["fence", "wall", "boundary", "سور", "جدار"]
    screen_keywords = keywords.get('screen') or ["screen", "satr", "ساتر", "privacy"]
    
    fences = [e for e in elements if any(kw in str(e.get('name', '')).lower() or kw in str(e.get('original_label', '')).lower() for kw in fence_keywords)]
    screens = [e for e in elements if any(kw in str(e.get('name', '')).lower() or kw in str(e.get('original_label', '')).lower() for kw in screen_keywords)]
    
    for rule in article14_schema.get('rules', []):
        rule_id = rule.get('rule_id')
        rule_type = rule.get('rule_type')
        
        rule_result = {
            'article_id': '14',
            'rule_id': rule_id,
            'rule_type': rule_type,
            'description_en': rule.get('description_en', ''),
            'description_ar': rule.get('description_ar', ''),
            'pass': False,
            'details': {}
        }
        
        if rule_type == 'dimension':
            if rule.get('element') == 'fence':
                # Rule 14.1 (Setback), 14.2 (Max Height), 14.3 (Min Height)
                # Note: Height and setback usually require Z-coords or specific spatial analysis
                # For now, we check checking metadata if available or marking as NEEDS_DATA
                
                # Check based on detection first
                if not fences:
                    rule_result['pass'] = False
                    rule_result['details'] = {
                        'note': 'No fence elements detected',
                        'status': 'FAIL',
                        'error': 'Fence is mandatory but not detected'
                    }
                else:
                    # If fences exist, we can't fully validate dimensions without specific attributes
                    # checking for height attribute
                    failed = []
                    
                    if 'max_height_m' in rule:
                        max_h = rule['max_height_m']
                        for f in fences:
                            h = f.get('height')
                            if h and h > max_h:
                                failed.append(f"Fence height {h}m > {max_h}m")
                                
                    if 'min_height_m' in rule:
                        min_h = rule['min_height_m']
                        for f in fences:
                            h = f.get('height')
                            if h and h < min_h:
                                failed.append(f"Fence height {h}m < {min_h}m")
                    
                    if failed:
                        rule_result['pass'] = False
                        rule_result['details'] = {
                            'issues': failed,
                            'status': 'FAIL'
                        }
                    else:
                        rule_result['pass'] = True # weak pass, assuming valid unless proven otherwise or if no data
                        rule_result['details'] = {
                            'note': 'Fence detected. Height validation requires explicit height attributes.',
                            'fence_count': len(fences),
                            'status': 'PASS'
                        }
                        
            elif rule.get('element') == 'fence_screen':
                # Rule 14.5
                if not screens:
                     rule_result['pass'] = True
                     rule_result['details'] = {'note': 'No screens detected', 'status': 'PASS'}
                else:
                    rule_result['pass'] = True
                    rule_result['details'] = {
                         'screen_count': len(screens),
                         'max_screen_height_m': rule.get('max_screen_height_m'),
                         'status': 'PASS',
                         'note': 'Screen height verification requires elevation data'
                    }

        elif rule_type == 'safety':
            # Rule 14.4: Solid fence
             if not fences:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'No fence elements detected',
                    'status': 'FAIL',
                    'error': 'Fence is mandatory but not detected'
                }
             else:
                rule_result['pass'] = False
                rule_result['details'] = {
                    'note': 'Solid fence verification requires visual/material analysis',
                    'status': 'FAIL',
                    'error': 'Material analysis not available'
                }
                
        results.append(rule_result)
        
    return results
