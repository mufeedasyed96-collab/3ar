"""
Article 20 Validator - Annex Building Requirements
Validates rules for connected annexes, heights, hospitality annexes, service annexes, and sports annexes.
"""

from typing import Dict, List, Any


def validate_article20(elements: List[Dict], article20_schema: Dict, metadata: Dict = None) -> List[Dict]:
    """
    Validate all rules in Article 20 based on building elements.
    
    :param elements: List of dicts representing building elements from DXF extraction.
                     Elements have: name, area, width, original_label, floor, height_m, etc.
    :param article20_schema: JSON dict for Article 20 rules from config.js
    :param metadata: Optional metadata with villa_ground_floor_area_m2, plot_area_m2, etc.
    :return: List of validation results for each rule, matching Node.js validator format
    """
    results = []
    
    # Get villa ground floor area from metadata or calculate from elements
    villa_ground_area_m2 = None
    if metadata and metadata.get("villa_ground_floor_area_m2"):
        villa_ground_area_m2 = metadata["villa_ground_floor_area_m2"]
    else:
        # Try to calculate from ground floor elements
        ground_floor_elements = [e for e in elements if e.get("floor") == 0 or 
                                (e.get("original_label", "") and ("ground" in e.get("original_label", "").lower() or "أرضي" in e.get("original_label", "")))]
        if ground_floor_elements:
            villa_ground_area_m2 = sum(e.get("area", 0) or 0 for e in ground_floor_elements)

    for rule in article20_schema.get('rules', []):
        rule_id = rule.get("rule_id")
        rule_type = rule.get("rule_type")
        description_en = rule.get("description_en", "")
        description_ar = rule.get("description_ar", "")
        
        ruleResult = {
            "article_id": "20",
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

        # ---------------- Area Rules (20.2, 20.14b, 20.14c, 20.15, 20.16) ----------------
        if rule_type == "area":
            element_name = rule.get("element")
            
            if element_name == "connected_annexes":
                # Rule 20.2: Connected annexes max 70% of villa ground floor, no internal connections
                annex_keywords = ["annex", "ملحق", "connected_annex"]
                annexes = [e for e in elements if 
                          any(keyword in (e.get("name", "") or "").lower() or 
                              keyword in (e.get("original_label", "") or "").lower() 
                              for keyword in annex_keywords)]
                
                if not annexes:
                    ruleResult["pass"] = True
                    ruleResult["passed_instances"] = 1
                    ruleResult["failed_instances"] = 0
                    ruleResult["details"] = {
                        "annexes_count": 0,
                        "note": "PASS: No connected annexes detected (annexes are optional)",
                        "rule_type": "area",
                        "status": "PASS"
                    }
                elif not villa_ground_area_m2:
                    ruleResult["pass"] = False
                    ruleResult["details"] = {
                        "annexes_count": len(annexes),
                        "note": "FAIL: Cannot validate - villa ground floor area not available",
                        "rule_type": "area",
                        "status": "FAIL",
                        "error": "Villa ground floor area required for validation"
                    }
                else:
                    total_area = sum(a.get("area", 0) or 0 for a in annexes)
                    percent = (total_area / villa_ground_area_m2) * 100 if villa_ground_area_m2 > 0 else 0
                    
                    violations = []
                    if percent > rule.get("max_percent_of_villa_ground_floor"):
                        violations.append(f"Total annex area {percent:.2f}% exceeds {rule.get('max_percent_of_villa_ground_floor')}% of villa ground floor")
                    
                    if rule.get("internal_connection_prohibited"):
                        for idx, a in enumerate(annexes):
                            if a.get("internal_connection", False):
                                violations.append(f"Annex '{a.get('original_label', a.get('name', f'Annex {idx+1}'))}' has prohibited internal connection")
                    
                    ruleResult["pass"] = len(violations) == 0
                    ruleResult["passed_instances"] = len(annexes) - len([a for a in annexes if a.get("internal_connection", False)]) if violations else len(annexes)
                    ruleResult["failed_instances"] = len([a for a in annexes if a.get("internal_connection", False)]) if violations else 0
                    ruleResult["details"] = {
                        "annexes_count": len(annexes),
                        "total_area_m2": total_area,
                        "villa_ground_area_m2": villa_ground_area_m2,
                        "percent_of_villa_ground": percent,
                        "max_percent_allowed": rule.get("max_percent_of_villa_ground_floor"),
                        "violations": violations,
                        "note": "PASS: Connected annexes meet area and connection requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                        "rule_type": "area",
                        "status": "PASS" if not violations else "FAIL"
                    }
            
            elif element_name == "hospitality_annex":
                # Rule 20.14b: Hospitality annex max 50% of villa ground floor
                hospitality_annexes = [e for e in elements if 
                                      e.get("name") == "hospitality_annex" or
                                      (e.get("original_label", "") and ("hospitality" in e.get("original_label", "").lower() or "ضيافة" in e.get("original_label", "")))]
                
                if not hospitality_annexes:
                    ruleResult["pass"] = True
                    ruleResult["passed_instances"] = 1
                    ruleResult["failed_instances"] = 0
                    ruleResult["details"] = {
                        "annexes_count": 0,
                        "note": "PASS: No hospitality annexes detected",
                        "rule_type": "area",
                        "status": "PASS"
                    }
                elif not villa_ground_area_m2:
                    ruleResult["pass"] = False
                    ruleResult["details"] = {
                        "note": "FAIL: Cannot validate - villa ground floor area not available",
                        "rule_type": "area",
                        "status": "FAIL",
                        "error": "Villa ground floor area required for validation"
                    }
                else:
                    violations = []
                    for annex in hospitality_annexes:
                        area = annex.get("area", 0) or 0
                        percent = (area / villa_ground_area_m2) * 100 if villa_ground_area_m2 > 0 else 0
                        if percent > rule.get("max_percent_of_villa_ground_floor"):
                            violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' area {percent:.2f}% exceeds {rule.get('max_percent_of_villa_ground_floor')}%")
                    
                    ruleResult["pass"] = len(violations) == 0
                    ruleResult["passed_instances"] = len(hospitality_annexes) - len(violations) if violations else len(hospitality_annexes)
                    ruleResult["failed_instances"] = len(violations)
                    ruleResult["details"] = {
                        "annexes_count": len(hospitality_annexes),
                        "max_percent_allowed": rule.get("max_percent_of_villa_ground_floor"),
                        "violations": violations,
                        "note": "PASS: Hospitality annexes meet area requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                        "rule_type": "area",
                        "status": "PASS" if not violations else "FAIL"
                    }
            
            elif element_name == "hospitality_annex_extended":
                # Rule 20.14c: Extended hospitality annex can be 70% if majlis requirements met
                hospitality_annexes = [e for e in elements if 
                                      e.get("name") == "hospitality_annex" or
                                      (e.get("original_label", "") and ("hospitality" in e.get("original_label", "").lower() or "ضيافة" in e.get("original_label", "")))]
                
                if not hospitality_annexes:
                    ruleResult["pass"] = True
                    ruleResult["passed_instances"] = 1
                    ruleResult["failed_instances"] = 0
                    ruleResult["details"] = {
                        "annexes_count": 0,
                        "note": "PASS: No hospitality annexes detected",
                        "rule_type": "area",
                        "status": "PASS"
                    }
                elif not villa_ground_area_m2:
                    ruleResult["pass"] = False
                    ruleResult["details"] = {
                        "note": "FAIL: Cannot validate - villa ground floor area and majlis data not available",
                        "rule_type": "area",
                        "status": "FAIL",
                        "error": "Villa ground floor area and majlis area required for validation"
                    }
                else:
                    violations = []
                    majlis_req = rule.get("majlis_requirement", {})
                    
                    for annex in hospitality_annexes:
                        area = annex.get("area", 0) or 0
                        percent = (area / villa_ground_area_m2) * 100 if villa_ground_area_m2 > 0 else 0
                        
                        if percent > rule.get("max_percent_of_villa_ground_floor"):
                            # Check majlis requirements
                            majlis_area = annex.get("majlis_area_m2", 0) or 0
                            min_majlis_area = majlis_req.get("min_area_m2")
                            min_percent_annex = majlis_req.get("or_min_percent_of_annex")
                            required_majlis = max(min_majlis_area, min_percent_annex / 100 * area)
                            
                            if majlis_area < required_majlis:
                                violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' majlis area {majlis_area:.2f} m² below required {required_majlis:.2f} m²")
                            
                            # Check pantry max 10% of majlis
                            pantry_area = annex.get("pantry_area_m2", 0) or 0
                            if pantry_area > (rule.get("pantry_max_percent_of_majlis") / 100 * majlis_area):
                                violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' pantry exceeds {rule.get('pantry_max_percent_of_majlis')}% of majlis")
                    
                    ruleResult["pass"] = len(violations) == 0
                    ruleResult["passed_instances"] = len(hospitality_annexes) - len(violations) if violations else len(hospitality_annexes)
                    ruleResult["failed_instances"] = len(violations)
                    ruleResult["details"] = {
                        "annexes_count": len(hospitality_annexes),
                        "max_percent_allowed": rule.get("max_percent_of_villa_ground_floor"),
                        "majlis_requirement": majlis_req,
                        "violations": violations,
                        "note": "PASS: Extended hospitality annexes meet requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                        "rule_type": "area",
                        "status": "PASS" if not violations else "FAIL"
                    }
            
            elif element_name == "service_annex":
                # Rule 20.15: Service annex max 50% of villa ground floor
                service_annexes = [e for e in elements if 
                                  e.get("name") == "service_annex" or
                                  (e.get("original_label", "") and ("service" in e.get("original_label", "").lower() or "خدمات" in e.get("original_label", "")))]
                
                if not service_annexes:
                    ruleResult["pass"] = True
                    ruleResult["passed_instances"] = 1
                    ruleResult["failed_instances"] = 0
                    ruleResult["details"] = {
                        "annexes_count": 0,
                        "note": "PASS: No service annexes detected",
                        "rule_type": "area",
                        "status": "PASS"
                    }
                elif not villa_ground_area_m2:
                    ruleResult["pass"] = False
                    ruleResult["details"] = {
                        "note": "FAIL: Cannot validate - villa ground floor area not available",
                        "rule_type": "area",
                        "status": "FAIL",
                        "error": "Villa ground floor area required for validation"
                    }
                else:
                    violations = []
                    for annex in service_annexes:
                        area = annex.get("area", 0) or 0
                        percent = (area / villa_ground_area_m2) * 100 if villa_ground_area_m2 > 0 else 0
                        if percent > rule.get("max_percent_of_villa_ground_floor"):
                            violations.append(f"Service annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' area {percent:.2f}% exceeds {rule.get('max_percent_of_villa_ground_floor')}%")
                    
                    ruleResult["pass"] = len(violations) == 0
                    ruleResult["passed_instances"] = len(service_annexes) - len(violations) if violations else len(service_annexes)
                    ruleResult["failed_instances"] = len(violations)
                    ruleResult["details"] = {
                        "annexes_count": len(service_annexes),
                        "max_percent_allowed": rule.get("max_percent_of_villa_ground_floor"),
                        "violations": violations,
                        "note": "PASS: Service annexes meet area requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                        "rule_type": "area",
                        "status": "PASS" if not violations else "FAIL"
                    }
            
            elif element_name == "sports_annex":
                # Rule 20.16: Sports annex max 20% of villa ground floor, gym min 70% of annex
                sports_annexes = [e for e in elements if 
                                 e.get("name") == "sports_annex" or
                                 (e.get("original_label", "") and ("sports" in e.get("original_label", "").lower() or "رياضي" in e.get("original_label", "")))]
                
                if not sports_annexes:
                    ruleResult["pass"] = True
                    ruleResult["passed_instances"] = 1
                    ruleResult["failed_instances"] = 0
                    ruleResult["details"] = {
                        "annexes_count": 0,
                        "note": "PASS: No sports annexes detected",
                        "rule_type": "area",
                        "status": "PASS"
                    }
                elif not villa_ground_area_m2:
                    ruleResult["pass"] = False
                    ruleResult["details"] = {
                        "note": "FAIL: Cannot validate - villa ground floor area not available",
                        "rule_type": "area",
                        "status": "FAIL",
                        "error": "Villa ground floor area required for validation"
                    }
                else:
                    violations = []
                    for annex in sports_annexes:
                        area = annex.get("area", 0) or 0
                        percent = (area / villa_ground_area_m2) * 100 if villa_ground_area_m2 > 0 else 0
                        
                        if percent > rule.get("max_percent_of_villa_ground_floor"):
                            violations.append(f"Sports annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' area {percent:.2f}% exceeds {rule.get('max_percent_of_villa_ground_floor')}%")
                        
                        # Check gym area min 70% of annex
                        gym_area = annex.get("gym_area_m2", 0) or 0
                        min_gym_area = rule.get("gym_min_percent_of_annex") / 100 * area
                        if gym_area < min_gym_area:
                            violations.append(f"Sports annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' gym area {gym_area:.2f} m² below required {min_gym_area:.2f} m² (70% of annex)")
                    
                    ruleResult["pass"] = len(violations) == 0
                    ruleResult["passed_instances"] = len(sports_annexes) - len(violations) if violations else len(sports_annexes)
                    ruleResult["failed_instances"] = len(violations)
                    ruleResult["details"] = {
                        "annexes_count": len(sports_annexes),
                        "max_percent_allowed": rule.get("max_percent_of_villa_ground_floor"),
                        "gym_min_percent_of_annex": rule.get("gym_min_percent_of_annex"),
                        "violations": violations,
                        "note": "PASS: Sports annexes meet area and gym requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                        "rule_type": "area",
                        "status": "PASS" if not violations else "FAIL"
                    }
            
            elif element_name == "hospitality_annex_pantry":
                # Rule 20.14a: Pantry max 15% of majlis area, min dimension 2m
                hospitality_annexes = [e for e in elements if 
                                      e.get("name") == "hospitality_annex" or
                                      (e.get("original_label", "") and ("hospitality" in e.get("original_label", "").lower() or "ضيافة" in e.get("original_label", "")))]
                
                violations = []
                for annex in hospitality_annexes:
                    majlis_area = annex.get("majlis_area_m2", 0) or 0
                    pantry_area = annex.get("pantry_area_m2", 0) or 0
                    pantry_width = annex.get("pantry_width_m", 0) or 0
                    
                    if majlis_area > 0:
                        pantry_percent = (pantry_area / majlis_area) * 100
                        if pantry_percent > rule.get("max_percent_of_majlis"):
                            violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' pantry {pantry_percent:.2f}% exceeds {rule.get('max_percent_of_majlis')}% of majlis")
                    
                    if pantry_width > 0 and pantry_width < rule.get("min_dimension_m"):
                        violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' pantry width {pantry_width:.2f} m below minimum {rule.get('min_dimension_m')} m")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(hospitality_annexes) - len(violations) if violations else len(hospitality_annexes)
                ruleResult["failed_instances"] = len(violations)
                ruleResult["details"] = {
                    "annexes_count": len(hospitality_annexes),
                    "max_percent_of_majlis": rule.get("max_percent_of_majlis"),
                    "min_dimension_m": rule.get("min_dimension_m"),
                    "violations": violations,
                    "note": "PASS: Hospitality annex pantries meet requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "area",
                    "status": "PASS" if not violations else "FAIL"
                }

        # ---------------- Height Rules (20.3, 20.4) ----------------
        elif rule_type == "height":
            element_name = rule.get("element")
            
            if element_name == "annex":
                # Rule 20.3: Annex max height 6m (with hospitality bonus)
                annexes = [e for e in elements if 
                          "annex" in (e.get("name", "") or "").lower() or
                          "ملحق" in (e.get("original_label", "") or "")]
                
                violations = []
                for annex in annexes:
                    height = annex.get("height_m", 0) or 0
                    max_height = rule.get("max_height_m")
                    
                    # Check hospitality annex bonus
                    is_hospitality = "hospitality" in (annex.get("name", "") or "").lower() or "ضيافة" in (annex.get("original_label", "") or "")
                    is_outside_setback = annex.get("outside_setback", False)
                    
                    if is_hospitality and is_outside_setback:
                        bonus = rule.get("hospitality_annex_bonus", {})
                        length = annex.get("length_m", 0) or 0
                        if length > bonus.get("length_threshold_m"):
                            extra_length = length - bonus.get("length_threshold_m")
                            bonus_height = (extra_length / bonus.get("per_length_m")) * bonus.get("height_bonus_m")
                            max_height = min(bonus.get("max_total_height_m"), max_height + bonus_height)
                    
                    if height > max_height:
                        violations.append(f"Annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' height {height:.2f} m exceeds max {max_height:.2f} m")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(annexes) - len(violations) if violations else len(annexes)
                ruleResult["failed_instances"] = len(violations)
                ruleResult["details"] = {
                    "annexes_count": len(annexes),
                    "max_height_m": rule.get("max_height_m"),
                    "violations": violations,
                    "note": "PASS: Annexes meet height requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "height",
                    "status": "PASS" if not violations else "FAIL"
                }
            
            elif element_name == "annex_internal":
                # Rule 20.4: Annex min internal height 3m, service spaces min 2.7m
                annexes = [e for e in elements if 
                          "annex" in (e.get("name", "") or "").lower() or
                          "ملحق" in (e.get("original_label", "") or "")]
                
                violations = []
                for annex in annexes:
                    internal_height = annex.get("internal_height_m", 0) or 0
                    min_height = rule.get("min_height_m")
                    
                    # Check if service space
                    is_service = "service" in (annex.get("name", "") or "").lower() or "خدمات" in (annex.get("original_label", "") or "")
                    if is_service:
                        min_height = rule.get("service_spaces_min_height_m")
                    
                    if internal_height > 0 and internal_height < min_height:
                        violations.append(f"Annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' internal height {internal_height:.2f} m below minimum {min_height:.2f} m")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(annexes) - len(violations) if violations else len(annexes)
                ruleResult["failed_instances"] = len(violations)
                ruleResult["details"] = {
                    "annexes_count": len(annexes),
                    "min_height_m": rule.get("min_height_m"),
                    "service_spaces_min_height_m": rule.get("service_spaces_min_height_m"),
                    "violations": violations,
                    "note": "PASS: Annexes meet internal height requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "height",
                    "status": "PASS" if not violations else "FAIL"
                }

        # ---------------- Composition Rules (20.12) ----------------
        elif rule_type == "composition":
            element_name = rule.get("element")
            
            if element_name == "hospitality_annex":
                # Rule 20.12: Hospitality annex required spaces
                hospitality_annexes = [e for e in elements if 
                                      e.get("name") == "hospitality_annex" or
                                      (e.get("original_label", "") and ("hospitality" in e.get("original_label", "").lower() or "ضيافة" in e.get("original_label", "")))]
                
                if not hospitality_annexes:
                    ruleResult["pass"] = True
                    ruleResult["passed_instances"] = 1
                    ruleResult["failed_instances"] = 0
                    ruleResult["details"] = {
                        "annexes_count": 0,
                        "note": "PASS: No hospitality annexes detected",
                        "rule_type": "composition",
                        "status": "PASS"
                    }
                else:
                    violations = []
                    required_spaces = rule.get("required_spaces", [])
                    second_majlis_rule = rule.get("second_majlis", {})
                    
                    for annex in hospitality_annexes:
                        # Check required spaces
                        spaces = annex.get("spaces", [])
                        missing = [s for s in required_spaces if s not in spaces]
                        if missing:
                            violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' missing required spaces: {missing}")
                        
                        # Check second majlis condition
                        majlis_area = annex.get("majlis_area_m2", 0) or 0
                        second_majlis_area = annex.get("second_majlis_area_m2", 0) or 0
                        
                        if second_majlis_area > 0:
                            if majlis_area < second_majlis_rule.get("condition", {}).get("main_majlis_min_60_sqm"):
                                violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' second majlis present but main majlis {majlis_area:.2f} m² below required 60 m²")
                            if second_majlis_area > second_majlis_rule.get("max_area_m2"):
                                violations.append(f"Hospitality annex '{annex.get('original_label', annex.get('name', 'Unknown'))}' second majlis {second_majlis_area:.2f} m² exceeds max {second_majlis_rule.get('max_area_m2')} m²")
                    
                    ruleResult["pass"] = len(violations) == 0
                    ruleResult["passed_instances"] = len(hospitality_annexes) - len(violations) if violations else len(hospitality_annexes)
                    ruleResult["failed_instances"] = len(violations)
                    ruleResult["details"] = {
                        "annexes_count": len(hospitality_annexes),
                        "required_spaces": required_spaces,
                        "second_majlis_rule": second_majlis_rule,
                        "violations": violations,
                        "note": "PASS: Hospitality annexes meet composition requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                        "rule_type": "composition",
                        "status": "PASS" if not violations else "FAIL"
                    }

        results.append(ruleResult)

    return results

