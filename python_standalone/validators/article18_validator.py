"""
Article 18 Validator - Building Design Requirements
Validates rules for kitchens, safety barriers, entrances, dimensions, and extensions.
"""

import json
import re
from typing import Dict, List, Any


def validate_article18(elements: List[Dict], article18_schema: Dict) -> List[Dict]:
    """
    Validate all rules in Article 18 based on building elements.
    
    :param elements: List of dicts representing building elements from DXF extraction.
                     Elements have: name, area, width, original_label, etc.
    :param article18_schema: JSON dict for Article 18 rules from config.js
    :return: List of validation results for each rule, matching Node.js validator format
    """
    results = []

    for rule in article18_schema.get('rules', []):
        rule_id = rule.get("rule_id")
        rule_type = rule.get("rule_type")
        description_en = rule.get("description_en", "")
        description_ar = rule.get("description_ar", "")
        
        ruleResult = {
            "article_id": "18",
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

        # ---------------- Restriction Rules (18.2) ----------------
        if rule_type == "restriction":
            if rule.get("subdivision_prohibited"):
                # Check if any subdivision exists (requires is_subdivision flag in elements)
                subdivided = any(e.get("is_subdivision", False) for e in elements)
                ruleResult["pass"] = not subdivided
                ruleResult["passed_instances"] = 0 if subdivided else 1
                ruleResult["failed_instances"] = 1 if subdivided else 0
                ruleResult["details"] = {
                    "subdivision_detected": subdivided,
                    "note": "FAIL: Subdivision detected but prohibited" if subdivided else "PASS: No subdivision detected",
                    "rule_type": "restriction",
                    "status": "FAIL" if subdivided else "PASS"
                }

        # ---------------- Kitchen Rules (18.3, 18.5) ----------------
        elif rule_type == "kitchen":
            element_name = rule.get("element", "main_kitchen")
            
            if element_name == "main_kitchen":
                # Rule 18.3: One main kitchen per plot, specialized kitchens max 9 sqm
                main_kitchens = []
                specialized_kitchens = []
                for e in elements:
                    label = (e.get("original_label") or "").lower()
                    name = e.get("name")
                    # Normalized name match
                    if name == "kitchen":
                        # If label contains specialized keywords, classify as specialized
                        if any(x in label for x in ["dirty", "frying", "cold", "prep", "specialized"]):
                            specialized_kitchens.append(e)
                        else:
                            main_kitchens.append(e)
                        continue
                    # Word-boundary match for kitchen in label but exclude sinks/taps/ks
                    if label and re.search(r'\bkitchen\b', label):
                        if any(x in label for x in ["sink", "tap", "ks"]):
                            continue
                        if any(x in label for x in ["dirty", "frying", "cold", "prep", "specialized"]):
                            specialized_kitchens.append(e)
                        else:
                            main_kitchens.append(e)

                # If multiple main kitchen labels detected, keep the largest area one as the primary kitchen
                ignored_kitchens = 0
                if len(main_kitchens) > 1:
                    main_kitchens_sorted = sorted(main_kitchens, key=lambda x: x.get('area', 0) or 0, reverse=True)
                    ignored_kitchens = len(main_kitchens_sorted) - 1
                    main_kitchens = [main_kitchens_sorted[0]]

                main_kitchen_count = len(main_kitchens)
                max_allowed = rule.get("main_kitchen_max")

                # Check specialized kitchens area constraints
                violations = []
                if main_kitchen_count > max_allowed:
                    violations.append(f"Too many main kitchens: {main_kitchen_count} > {max_allowed}")

                for sk in specialized_kitchens:
                    area = sk.get("area", 0) or 0
                    max_area = rule.get("specialized_kitchen_max_area_m2")
                    if area > max_area:
                        violations.append(f"Specialized kitchen too large: {area:.2f} m² > {max_area} m²")

                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = 0 if violations else 1
                ruleResult["failed_instances"] = 1 if violations else 0
                ruleResult["details"] = {
                    "main_kitchen_count": main_kitchen_count,
                    "ignored_kitchens": ignored_kitchens,
                    "max_allowed": max_allowed,
                    "specialized_kitchens_count": len(specialized_kitchens),
                    "specialized_kitchens": [{"label": sk.get("original_label", sk.get("name", "")), "area_m2": sk.get("area", 0)} for sk in specialized_kitchens],
                    "violations": violations,
                    "rule_type": "kitchen",
                    "status": "PASS" if not violations else "FAIL",
                    "reason": "PASS: Main kitchen count within limit, specialized kitchens within area limits" if not violations else f"FAIL: {'; '.join(violations)}"
                }
                
            elif element_name == "pantry_kitchen":
                # Rule 18.5: Max one pantry kitchen per floor, max 6 sqm
                pantry_kitchens = [e for e in elements if 
                                  e.get("name") == "pantry_kitchen" or
                                  (e.get("original_label", "") and "pantry" in e.get("original_label", "").lower() and "kitchen" in e.get("original_label", "").lower())]
                
                # Group by floor (extract from original_label or use default floor 1)
                floors = {}
                for pk in pantry_kitchens:
                    # Try to extract floor info from label
                    floor = pk.get("floor", 1)
                    if not floors.get(floor):
                        floors[floor] = []
                    floors[floor].append(pk)
                
                violations = []
                for floor, kitchens in floors.items():
                    if len(kitchens) > rule.get("max_per_floor"):
                        violations.append(f"Too many pantry kitchens on floor {floor}: {len(kitchens)} > {rule.get('max_per_floor')}")
                    for k in kitchens:
                        area = k.get("area", 0) or 0
                        if area > rule.get("max_area_m2"):
                            violations.append(f"Pantry kitchen on floor {floor} too large: {area:.2f} m² > {rule.get('max_area_m2')} m²")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = 0 if violations else len(pantry_kitchens)
                ruleResult["failed_instances"] = len(pantry_kitchens) if violations else 0
                ruleResult["details"] = {
                    "pantry_kitchens_by_floor": {str(k): len(v) for k, v in floors.items()},
                    "max_per_floor": rule.get("max_per_floor"),
                    "max_area_m2": rule.get("max_area_m2"),
                    "violations": violations,
                    "rule_type": "kitchen",
                    "status": "PASS" if not violations else "FAIL",
                    "reason": "PASS: Pantry kitchens within limits per floor and area" if not violations else f"FAIL: {'; '.join(violations)}"
                }

        # ---------------- Safety Rules (18.6, 18.7) ----------------
        elif rule_type == "safety":
            element_name = rule.get("element")
            
            if element_name == "fall_barrier":
                # Rule 18.6: Fall barrier required where level difference > 70cm
                fall_barriers = [e for e in elements if 
                                e.get("name") == "fall_barrier" or
                                (e.get("original_label", "") and ("fall" in e.get("original_label", "").lower() or "barrier" in e.get("original_label", "").lower()))]
                
                violations = []
                for fb in fall_barriers:
                    height = fb.get("height_m", 0) or 0
                    gap = fb.get("max_gap_cm", 0) or 0
                    
                    if rule.get("min_barrier_height_m") and height < rule.get("min_barrier_height_m"):
                        violations.append(f"Fall barrier too short: {height:.2f} m < {rule.get('min_barrier_height_m')} m")
                    if rule.get("max_opening_diameter_cm") and gap > rule.get("max_opening_diameter_cm"):
                        violations.append(f"Fall barrier gap too large: {gap} cm > {rule.get('max_opening_diameter_cm')} cm")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(fall_barriers) if not violations else 0
                ruleResult["failed_instances"] = len(fall_barriers) if violations else 0
                ruleResult["details"] = {
                    "fall_barriers_count": len(fall_barriers),
                    "level_difference_threshold_cm": rule.get("level_difference_threshold_cm"),
                    "min_barrier_height_m": rule.get("min_barrier_height_m"),
                    "max_opening_diameter_cm": rule.get("max_opening_diameter_cm"),
                    "violations": violations,
                    "note": "PASS: Fall barriers meet height and opening requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "safety",
                    "status": "PASS" if not violations else "FAIL"
                }
                
            elif element_name == "pool_fence":
                # Rule 18.7: Pool fence required
                pools = [e for e in elements if 
                        e.get("name") == "pool" or
                        (e.get("original_label", "") and ("pool" in e.get("original_label", "").lower() or "مسبح" in e.get("original_label", "")))]
                
                pool_fences = [e for e in elements if 
                              e.get("name") == "pool_fence" or
                              (e.get("original_label", "") and ("pool" in e.get("original_label", "").lower() and "fence" in e.get("original_label", "").lower()))]
                
                specs = rule.get("specifications", {})
                violations = []
                
                if len(pools) > 0 and len(pool_fences) == 0:
                    violations.append("Pool detected but no pool fence found")
                
                for pf in pool_fences:
                    height = pf.get("height_m", 0) or 0
                    clearance = pf.get("clearance_below_cm", 0) or 0
                    
                    if specs.get("min_fence_height_m") and height < specs["min_fence_height_m"]:
                        violations.append(f"Pool fence too low: {height:.2f} m < {specs['min_fence_height_m']} m")
                    if specs.get("max_clearance_below_fence_cm") and clearance > specs["max_clearance_below_fence_cm"]:
                        violations.append(f"Pool fence clearance too high: {clearance} cm > {specs['max_clearance_below_fence_cm']} cm")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = 0 if violations else 1
                ruleResult["failed_instances"] = 1 if violations else 0
                ruleResult["details"] = {
                    "pools_count": len(pools),
                    "pool_fences_count": len(pool_fences),
                    "specifications": specs,
                    "violations": violations,
                    "note": "PASS: Pool fence requirements met" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "safety",
                    "status": "PASS" if not violations else "FAIL"
                }

        # ---------------- Entrance Rules (18.8) ----------------
        elif rule_type == "entrance":
            element_name = rule.get("element")
            entrances = [e for e in elements if 
                        e.get("name") == element_name or
                        (e.get("original_label", "") and ("main" in e.get("original_label", "").lower() and "entrance" in e.get("original_label", "").lower()))]
            
            violations = []
            for ent in entrances:
                width = ent.get("width", 0) or 0
                # Convert to meters if needed (assuming width is already in meters from DXF extractor)
                if width < rule.get("min_width_m"):
                    violations.append(f"Entrance width too small: {width:.2f} m < {rule.get('min_width_m')} m")
                # Check if opens to living space (requires spatial analysis)
                if rule.get("opens_to") and not ent.get("opens_to"):
                    violations.append(f"Cannot verify entrance opens to {rule.get('opens_to')} - spatial data required")
            
            ruleResult["pass"] = len(violations) == 0
            ruleResult["passed_instances"] = len(entrances) if not violations else 0
            ruleResult["failed_instances"] = len(entrances) if violations else 0
            ruleResult["details"] = {
                "entrances_count": len(entrances),
                "min_width_m": rule.get("min_width_m"),
                "opens_to": rule.get("opens_to"),
                "violations": violations,
                "note": "PASS: Main entrance meets width requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                "rule_type": "entrance",
                "status": "PASS" if not violations else "FAIL"
            }

        # ---------------- Dimension Rules (18.9, 18.10) ----------------
        elif rule_type == "dimension":
            element_name = rule.get("element")
            
            if element_name == "interior_doors":
                # Rule 18.9: Minimum door width 81.5cm
                doors = [e for e in elements if 
                        e.get("name") == "door" or
                        (e.get("original_label", "") and "door" in e.get("original_label", "").lower())]
                
                violations = []
                for door in doors:
                    width = door.get("width", 0) or 0
                    width_cm = width * 100  # Convert meters to cm
                    if width_cm < rule.get("min_width_cm"):
                        violations.append(f"Door width too small: {width_cm:.1f} cm < {rule.get('min_width_cm')} cm")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(doors) if not violations else 0
                ruleResult["failed_instances"] = len(doors) if violations else 0
                ruleResult["details"] = {
                    "doors_count": len(doors),
                    "min_width_cm": rule.get("min_width_cm"),
                    "violations": violations,
                    "note": "PASS: All doors meet minimum width requirement" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "dimension",
                    "status": "PASS" if not violations else "FAIL"
                }
                
            elif element_name == "internal_corridors":
                # Rule 18.10: Minimum corridor width 91.5cm
                corridors = [e for e in elements if 
                            e.get("name") == "corridor" or
                            (e.get("original_label", "") and "corridor" in e.get("original_label", "").lower())]
                
                violations = []
                for corr in corridors:
                    width = corr.get("width", 0) or 0
                    width_cm = width * 100  # Convert meters to cm
                    if width_cm < rule.get("min_width_cm"):
                        violations.append(f"Corridor width too small: {width_cm:.1f} cm < {rule.get('min_width_cm')} cm")
                
                ruleResult["pass"] = len(violations) == 0
                ruleResult["passed_instances"] = len(corridors) if not violations else 0
                ruleResult["failed_instances"] = len(corridors) if violations else 0
                ruleResult["details"] = {
                    "corridors_count": len(corridors),
                    "min_width_cm": rule.get("min_width_cm"),
                    "violations": violations,
                    "note": "PASS: All corridors meet minimum width requirement" if not violations else f"FAIL: {'; '.join(violations)}",
                    "rule_type": "dimension",
                    "status": "PASS" if not violations else "FAIL"
                }

        # ---------------- Extension Rules (18.12) ----------------
        elif rule_type == "extension":
            # Rule 18.12: Villa extensions require connecting hall min 4m dimension
            connecting_halls = [e for e in elements if 
                              e.get("name") == "connecting_hall" or
                              (e.get("original_label", "") and ("connecting" in e.get("original_label", "").lower() and "hall" in e.get("original_label", "").lower()))]
            
            violations = []
            for hall in connecting_halls:
                area = hall.get("area", 0) or 0
                width = hall.get("width", 0) or 0
                
                # Check if extension area exceeds exemption
                if area > rule.get("exemption_max_area_m2"):
                    if width < rule.get("connecting_hall_min_dimension_m"):
                        violations.append(f"Connecting hall width too small for extension > {rule.get('exemption_max_area_m2')} m²: {width:.2f} m < {rule.get('connecting_hall_min_dimension_m')} m")
            
            ruleResult["pass"] = len(violations) == 0
            ruleResult["passed_instances"] = len(connecting_halls) if not violations else 0
            ruleResult["failed_instances"] = len(connecting_halls) if violations else 0
            ruleResult["details"] = {
                "connecting_halls_count": len(connecting_halls),
                "connecting_hall_min_dimension_m": rule.get("connecting_hall_min_dimension_m"),
                "exemption_max_area_m2": rule.get("exemption_max_area_m2"),
                "violations": violations,
                "note": "PASS: Connecting halls meet minimum dimension requirements" if not violations else f"FAIL: {'; '.join(violations)}",
                "rule_type": "extension",
                "status": "PASS" if not violations else "FAIL"
            }

        results.append(ruleResult)

    return results
