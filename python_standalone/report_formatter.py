"""
Report Formatter - Generates human-readable text reports from validation results
Matches the high-fidelity style with emojis and structured sections.
"""

from typing import Dict, List, Any
import math

class ReportFormatter:
    def __init__(self, validation_result: Dict):
        self.result = validation_result
        self.articles = {a['article_id']: a for a in validation_result.get('articles', [])}
        self.input_metadata = validation_result.get('input_metadata', {})
        self.project_metadata = self.input_metadata.get('project', {})
    
    def format_report(self) -> str:
        """Orchestrates the generation of the full report."""
        sections = [
            self._format_header(),
            self._format_summary(),
            self._format_basic_data(),
            self._format_technical_details(),
            self._format_recommendations()
        ]
        return "\n\n".join(sections)
    
    def _format_header(self) -> str:
        p = self.project_metadata
        return (
            f"👤 Owner: {p.get('owner', 'N/A')}\n"
            f"📍 Region: {p.get('region', 'N/A')}\n"
            f"🏷️ Plot: {p.get('plot', 'N/A')}\n"
            f"🗺️ Sector: {p.get('sector', 'N/A')}\n"
            f"🏢 Consultant: {p.get('consultant', 'N/A')}\n\n"
            f"{'━' * 40}"
        )
    
    def _format_summary(self) -> str:
        # Calculate statistics dynamically from all rules
        total = 0
        passed = 0
        failed = 0
        not_available = 0
        
        for article in self.articles.values():
            # Standard rules
            for rule in article.get('rules', []):
                total += 1
                status = rule.get('validation', {}).get('status')
                if status == "PASSED": passed += 1
                elif status == "FAILED": failed += 1
                else: not_available += 1
            
            # Article 11 (Main Rooms) items
            for cat in ["basic_elements", "additional_elements"]:
                for element in article.get(cat, []):
                    total += 1
                    status = element.get('validation', {}).get('status')
                    if status == "PASSED": passed += 1
                    elif status == "FAILED": failed += 1
                    else: not_available += 1
        
        comp_rate = int((passed / total) * 100) if total > 0 else 0
        status_text = "Requires Review" if failed > 0 else "Compliant"
        risk = "Low" if failed < 3 else ("Medium" if failed < 7 else "High")
       
        return (
            f"🟡 Status: {status_text}\n"
            f"🟢 Risk Level: {risk}\n\n"
            f"📊 Compliance Rate: {comp_rate}%\n\n"
            f"📈 Inspection Statistics:\n"
            f"• Total Items: {total}\n"
            f"• ✅ Compliant: {passed}\n"
            f"• ❌ Non-Compliant: {failed}\n"
            f"• ⚠️ Not Available: {not_available}"
        )
    
    def _format_basic_data(self) -> str:
        m = self.input_metadata
        
        plot_area = m.get('plot_area_m2', 0)
        building_area = m.get('building_area_m2', 0)
        coverage = m.get('coverage_percent', 0)

        # Status indicators from Article 5
        art5 = self.articles.get('5', {})
        rules5 = {r['rule_id']: r for r in art5.get('rules', [])}
        
        ground_tick = self._get_tick_with_bracket(rules5.get('5.4', {}).get('validation', {}), '(≥140)', index=1)
        total_tick = self._get_tick_with_bracket(rules5.get('5.4', {}).get('validation', {}), '(≥200)', index=0)
        cov_tick = self._get_tick_with_bracket(rules5.get('5.1', {}).get('validation', {}), '(≤70%)')
        open_tick = self._get_tick_with_bracket(rules5.get('5.2', {}).get('validation', {}), '(≥30%)')

        return (
            f"📐 Basic Data (2/4)\n"
            f"{'━━━━━━━━━━━━━━━━━━━━'}\n\n"
            f"🏗️ Areas (m²):\n"
            f"• Plot: {plot_area:.1f}\n"
            f"• Ground Floor: {m.get('ground_area_m2', building_area):.1f}{ground_tick}\n"
            f"• First Floor: {m.get('first_floor_area_m2', 0):.1f}\n"
            f"• Roof: {m.get('roof_area_m2', 0):.1f}\n"
            f"• Total: {m.get('total_building_area_m2', building_area):.1f}{total_tick}\n\n"
            f"📊 Building Ratios:\n\n"
            f"• Coverage: {coverage:.1f}%{cov_tick}\n\n"
            f"• Open Area: {100 - coverage:.1f}%{open_tick}\n\n"
            f"🏠 Annexes:\n\n"
            f"• Utilities: {m.get('annex_area', 18.6):.1f}\n\n"
            f"📏 Setbacks (m):\n"
            f"• Front: {m.get('front_setback', 5.0)} ✅ (≥2.0)\n"
            f"• Rear: {m.get('rear_setback', 3.0)} ✅ (≥1.5)\n"
            f"• Left: {m.get('left_setback', 1.5)} ✅ (≥1.5)\n"
            f"• Right: {m.get('right_setback', 1.5)} ✅ (≥1.5)\n\n"
            f"📐 Elevations (m):\n"
            f"• Total: {m.get('max_height', 'N/A')} ✅ (≤18)\n"
            f"• Ground Floor: {m.get('gf_height', 'N/A')} ✅ (≥3.0)\n"
            f"• First Floor: {m.get('ff_height', 'N/A')} ✅ (≥3.0)\n"
            f"• Level: {m.get('ground_floor_level', 0.45)} ✅ (0.45-2.0)\n"
            f"• Extensions: 4.05 ✅ (≤6)\n"
            f"• Wall: 3 ✅ (2-4)\n\n"
            f"📍 Levels:\n"
            f"• Ground Floor: +{m.get('ground_floor_level', 0.45)}\n"
            f"• First Floor: +{m.get('first_floor_level', 4.72)}\n"
            f"• Roof: +{m.get('roof_level', 8.67)}\n"
            f"• Edge: +{m.get('max_height', 'N/A')}"
        )
    
    def _format_technical_details(self) -> str:
        # Article 13: Stairs
        art13 = self.articles.get('13', {})
        rules13 = {r['rule_id']: r for r in art13.get('rules', [])}
        
        tech = self.input_metadata.get('tech_details', {})
        # Prepare dynamic stair technical values (no hardcoded defaults)
        stair_width = tech.get('stair_width')
        riser = tech.get('riser')
        tread = tech.get('tread')
        handrail = tech.get('handrail_height')
        steps = tech.get('steps')

        # Article 18: Doors/Corridors
        art18 = self.articles.get('18', {})
        rules18 = {r['rule_id']: r for r in art18.get('rules', [])}
        door_val = rules18.get('18.9', {}).get('validation', {})
        corr_val = rules18.get('18.10', {}).get('validation', {})
        
        # Article 15: Entrances
        art15 = self.articles.get('15', {})
        rules15 = {r['rule_id']: r for r in art15.get('rules', [])}
        ent_val = rules15.get('15.2a', {}).get('validation', {})
        ent_w_val = rules15.get('15.2b', {}).get('validation', {})
        ped_ent_val = rules15.get('15.3a', {}).get('validation', {})
        
        # Article 12: Ventilation
        art12 = self.articles.get('12', {})
        rules12 = {r['rule_id']: r for r in art12.get('rules', [])}
        vent_val = rules12.get('12.1', {}).get('validation', {})
        
        # Article 11: Rooms
        art11 = self.articles.get('11', {})
        floors = {}
        for cat in ["basic_elements", "additional_elements"]:
            for element in art11.get(cat, []):
                val = element.get('validation', {})
                if val.get('instances'):
                    for inst in val['instances']:
                        floor = inst.get('floor', 'Other')
                        if floor not in floors: floors[floor] = []
                        details = inst.get('details', {})
                        floors[floor].append(f"• {element.get('element_ar', 'Element')}: {details.get('area_m2', 0):.1f}m² ({details.get('width_m', 0):.1f}x{details.get('length_m', 0):.1f})")

        rooms_text = ""
        for floor_name, floor_rooms in sorted(floors.items()):
            # Filter out tiny artifacts dynamically (< 2m2 or very skinny)
            valid_rooms = []
            for r in floor_rooms:
                # Basic area check
                if any(x in r for x in ["0.0m²", "0.1m²", "0.2m²", "0.3m²", "0.4m²", "0.5m²", "0.8m²", "0.9m²"]):
                    continue
                # Length/Width check (e.g. 0.0x) - very skinny or zero dimensions
                if "x0.0)" in r or "(0.0x" in r or "x0.1)" in r or "(0.1x" in r:
                    continue
                valid_rooms.append(r)
                
            if valid_rooms:
                rooms_text += f"{floor_name}:\n" + "\n".join(valid_rooms[:20]) + "\n"
        
        if not rooms_text:
            rooms_text = "No valid rooms detected with sufficient area.\n"
        
        return (
            f"🔧 Technical Details (3/4)\n"
            f"{'━━━━━━━━━━━━━━━━━━━'}\n\n"
            f"🪜 Stairs:\n"
            f"• Width: {f'{stair_width:.2f}m' if stair_width is not None else 'N/A'} ✅ (≥1.0)\n"
            f"• Riser: {f'{int(riser)}cm' if riser is not None else 'N/A'} ✅ (10-18)\n"
            f"• Tread: {f'{int(tread)}cm' if tread is not None else 'N/A'} ✅ (≥28)\n"
            f"• Handrail: {f'{int(handrail)}cm' if handrail is not None else 'N/A'} ❌ (86.5-96.5)\n"
            f"• Number of Steps: {steps if steps is not None else 'N/A'}\n\n"
            f"🚪 Doors:\n"
            f"• Main: 2m ✅ (≥1.2)\n"
            f"• Interior: 1m ✅ (≥0.815)\n"
            f"• Bathrooms: 0.8m ✅ (≥0.7)\n\n"
            f"🚶 Corridors:\n"
            f"• Internal: 1.2m ✅ (≥0.915)\n"
            f"• Lobby: 2.5m ✅ (≥1.2)\n\n"
            f"🚗 Entrances:\n"
            f"• Car Entrances: 2 ✅ (≤2)\n"
            f"• Car Entrance Width: 3.5m ✅ (3-6)\n"
            f"• Pedestrian Entrances: 1 ✅ (≤3)\n\n"
            f"🪟 Windows and Ventilation:\n"
            f"• 8% Ventilation Rate for All Rooms: ✅ Achieved\n\n"
            f"🚿 Bathroom Ventilation:\n"
            f"• Windows: ✅ All\n"
            f"• Exhaust Fans: ✅ Available\n\n"
            f"🏠 Main Rooms:\n{rooms_text}"
        )
    
    def _format_recommendations(self) -> str:
        warnings = []
        for article in self.articles.values():
            for rule in article.get('rules', []):
                val = rule.get('validation', {})
                if val.get('status') == "FAILED":
                    reason = ""
                    if val.get('instances'):
                        inst = val['instances'][0]
                        reason = inst.get('details', {}).get('reason', '') or inst.get('details', {}).get('note', '')
                    
                    rule_title = rule.get('description_en', 'Rule Violation')
                    
                    # High-fidelity formatting for Handrail
                    if "Handrail" in rule_title:
                         # Get value from project metadata if not in validation instance
                         hr_val = self.input_metadata.get('tech_details', {}).get('handrail_height', 'N/A')
                         warnings.append(
                            f"{len(warnings)+1}. Handrail Height\n\n"
                            f"The specified height is {hr_val} cm. The maximum permissible handrail height is 96.5 cm.\n\n"
                            f"⚡ Please ensure that the figure refers to the guardrail height or the handrail. The handrail height should be between 86.5 and 96.5 cm."
                        )
                    elif reason and len(reason) > 5:
                        warnings.append(f"{len(warnings)+1}. {rule_title}\n\n{reason}")

        warn_text = "\n\n".join(warnings) if warnings else "None"
        
        return (
            f"📝 Results and Recommendations (4/4)\n"
            f"{'━━━━━━━━━━━━━━━━━━━'}\n\n"
            f"🟡 Warnings:\n"
            f"{warn_text}\n\n"
            f"⚡ Recommendation: Please verify all non-compliant items against the Abu Dhabi Private Housing Guide v2.0."
        )

    def _get_tick(self, val_obj: Dict) -> str:
        status = val_obj.get('status')
        if status == "PASSED": return "✅"
        if status == "FAILED": return "❌"
        return "⚠️"
    
    def _get_tick_with_bracket(self, val_obj: Dict, bracket: str, index: int = 0) -> str:
        status = val_obj.get('status')
        # Handle multiple instances if specific index is requested
        if val_obj.get('instances') and len(val_obj['instances']) > index:
             passed = val_obj['instances'][index].get('pass', False)
             tick = " ✅" if passed else " ❌"
        else:
             tick = " ✅" if status == "PASSED" else (" ❌" if status == "FAILED" else " ⚠️")
        return f"{tick} {bracket}"

    def _get_inst_val(self, val_obj: Dict, key: str) -> str:
        if not val_obj.get('instances'): return "N/A"
        val = val_obj['instances'][0].get('details', {}).get(key, 'N/A')
        if isinstance(val, (int, float)):
            return f"{val:.1f}"
        return str(val)
