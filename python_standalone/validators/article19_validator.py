"""
Article 19 Validator - Residential Suites in Main Villa
Validates rules for suite access and composition.
"""

from typing import Dict, List, Any


def validate_article19(elements: List[Dict], article19_schema: Dict) -> List[Dict]:
    """
    Validate all rules in Article 19 based on building elements.
    
    :param elements: List of dicts representing building elements from DXF extraction.
                     Elements have: name, area, width, original_label, floor, etc.
    :param article19_schema: JSON dict for Article 19 rules from config.js
    :return: List of validation results for each rule, matching Node.js validator format
    """
    results = []

    for rule in article19_schema.get('rules', []):
        rule_id = rule.get("rule_id")
        rule_type = rule.get("rule_type")
        description_en = rule.get("description_en", "")
        description_ar = rule.get("description_ar", "")
        
        ruleResult = {
            "article_id": "19",
            "rule_id": rule_id,
            "rule_type": rule_type,
            "description_en": description_en,
            "description_ar": description_ar,
            "pass": True,
            "total_instances": 1,
            "passed_instances": 0,
            "failed_instances": 0,
            "details": {}
        }

        # ---------------- Access Rules (19.1) ----------------
        if rule_type == "access":
            # Rule 19.1: Suite access only through main villa entrance, no separate external entrance
            # Detect residential suites from elements
            suites = []
            
            # Look for suite-related elements
            keywords = article19_schema.get('keywords', {})
            suite_keywords = keywords.get('suite') or ["suite", "جناح", "wing", "residential_suite"]
            for e in elements:
                name = (e.get("name", "") or "").lower()
                label = (e.get("original_label", "") or "").lower()
                
                # Check if element is a suite
                if any(keyword in name or keyword in label for keyword in suite_keywords):
                    suites.append(e)
            
            violations = []
            for suite in suites:
                # Check if suite has separate entrance
                # This requires spatial analysis - check if suite has its own entrance element
                # For now, check if suite has entrance-related metadata
                if suite.get("separate_entrance", False):
                    violations.append(f"Suite '{suite.get('original_label', suite.get('name', 'Unknown'))}' has separate external entrance")
                
                # Alternative: Check if suite has entrance elements nearby (requires spatial data)
                # This would need geometry analysis to determine if entrance is external
            
            # If no suites detected, assume pass (suites are optional)
            if len(suites) == 0:
                ruleResult["pass"] = True
                ruleResult["passed_instances"] = 1
                ruleResult["failed_instances"] = 0
                ruleResult["details"] = {
                    "suites_count": 0,
                    "note": "PASS: No residential suites detected (suites are optional)",
                    "rule_type": "access",
                    "status": "PASS"
                }
            else:
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(suites) - len(violations) if violations else len(suites)
                ruleResult["failed_instances"] = len(violations)
                ruleResult["details"] = {
                    "suites_count": len(suites),
                    "suites": [{"label": s.get("original_label", s.get("name", "")), "has_separate_entrance": s.get("separate_entrance", False)} for s in suites],
                    "violations": violations,
                    "note": "PASS: All suites access through main villa entrance" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "access",
                    "status": "PASS" if not violations else "FAIL",
                    "reason": "PASS: Suite access requirements met" if not violations else f"FAIL: {len(violations)} suite(s) have separate external entrances"
                }

        # ---------------- Composition Rules (19.2) ----------------
        elif rule_type == "composition":
            # Rule 19.2: Suite max: 3 rooms, 1 living space, bathrooms. Pantry kitchen only if no other on same floor
            # First, check if any suites are detected
            keywords = article19_schema.get('keywords', {})
            suite_keywords = keywords.get('suite') or ["suite", "جناح", "wing", "residential_suite"]
            
            # Identify suites
            suite_elements = {}
            for e in elements:
                name = (e.get("name", "") or "").lower()
                label = (e.get("original_label", "") or "").lower()
                
                # Check if element belongs to a suite
                suite_id = None
                for keyword in suite_keywords:
                    if keyword in name or keyword in label:
                        # Extract suite identifier from label
                        suite_id = e.get("suite_id") or e.get("original_label", "suite_1")
                        break
                
                if suite_id:
                    if suite_id not in suite_elements:
                        suite_elements[suite_id] = []
                    suite_elements[suite_id].append(e)
            
            # If no suites detected, pass (suites are optional, rule only applies when suites exist)
            if len(suite_elements) == 0:
                ruleResult["pass"] = True
                ruleResult["passed_instances"] = 1
                ruleResult["failed_instances"] = 0
                ruleResult["details"] = {
                    "suites_detected": 0,
                    "note": "PASS: No residential suites detected (suites are optional, rule only applies when suites exist)",
                    "rule_type": "composition",
                    "status": "PASS"
                }
            else:
                # Suites detected - validate composition
                violations = []
                suite_details = []
                
                for suite_id, suite_elements_list in suite_elements.items():
                    # Count rooms, living spaces, pantry kitchens in this suite
                    rooms = [e for e in suite_elements_list if 
                            e.get("name") == "bedroom" or 
                            (e.get("original_label", "") and ("room" in e.get("original_label", "").lower() or "غرفة" in e.get("original_label", "")))]
                    
                    living_spaces = [e for e in suite_elements_list if 
                                   e.get("name") == "living_room" or 
                                   (e.get("original_label", "") and ("living" in e.get("original_label", "").lower() or "معيشي" in e.get("original_label", "")))]
                    
                    pantry_kitchens = [e for e in suite_elements_list if 
                                     e.get("name") == "pantry_kitchen" or 
                                     (e.get("original_label", "") and ("pantry" in e.get("original_label", "").lower() or "تحضيري" in e.get("original_label", "")))]
                    
                    suite_violations = []
                    if len(rooms) > rule.get("max_rooms"):
                        suite_violations.append(f"Too many rooms: {len(rooms)} > {rule.get('max_rooms')}")
                    if len(living_spaces) > rule.get("max_living_spaces"):
                        suite_violations.append(f"Too many living spaces: {len(living_spaces)} > {rule.get('max_living_spaces')}")
                    if len(pantry_kitchens) > 1:
                        suite_violations.append(f"Too many pantry kitchens: {len(pantry_kitchens)} > 1")
                    
                    suite_details.append({
                        "suite_id": suite_id,
                        "rooms_count": len(rooms),
                        "living_spaces_count": len(living_spaces),
                        "pantry_kitchens_count": len(pantry_kitchens),
                        "violations": suite_violations
                    })
                    
                    violations.extend([f"Suite '{suite_id}': {v}" for v in suite_violations])
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(suite_elements) - len([s for s in suite_details if s["violations"]]) if violations else len(suite_elements)
                ruleResult["failed_instances"] = len([s for s in suite_details if s["violations"]]) if violations else 0
                ruleResult["details"] = {
                    "suites_count": len(suite_elements),
                    "suites": suite_details,
                    "max_rooms": rule.get("max_rooms"),
                    "max_living_spaces": rule.get("max_living_spaces"),
                    "pantry_kitchen_rule": rule.get("pantry_kitchen"),
                    "violations": violations,
                    "note": "PASS: All suites meet composition requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "composition",
                    "status": "PASS" if not violations else "FAIL",
                    "reason": "PASS: Suite composition requirements met" if not violations else f"FAIL: {len(violations)} violation(s) found"
                }

        results.append(ruleResult)

    return results
