"""
Main Validator - Orchestrates all article validations
Python-only standalone version
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from dxf_extractor import DXFExtractor
from config import get_article, get_all_articles
from structured_text_parser import StructuredTextParser

# Import validators
try:
    from validators.article6_validator import validate_article6_geopandas
except ImportError as e:
    print(f"Warning: Could not import article6_validator: {e}", file=sys.stderr)
    validate_article6_geopandas = None

try:
    from validators.article10_validator import validate_article10_geopandas
except ImportError as e:
    print(f"Warning: Could not import article10_validator: {e}", file=sys.stderr)
    validate_article10_geopandas = None

try:
    from validators.article13_validator import validate_article13_geopandas
except ImportError as e:
    print(f"Warning: Could not import article13_validator: {e}", file=sys.stderr)
    validate_article13_geopandas = None

try:
    from validators.article18_validator import validate_article18
except ImportError as e:
    print(f"Warning: Could not import article18_validator: {e}", file=sys.stderr)
    validate_article18 = None

try:
    from validators.article19_validator import validate_article19
except ImportError as e:
    print(f"Warning: Could not import article19_validator: {e}", file=sys.stderr)
    validate_article19 = None

try:
    from validators.article20_validator import validate_article20
except ImportError as e:
    print(f"Warning: Could not import article20_validator: {e}", file=sys.stderr)
    validate_article20 = None

# Import additional validators (will create these)
try:
    from validators.article5_validator import validate_article5
except ImportError:
    validate_article5 = None

try:
    from validators.article7_validator import validate_article7
except ImportError:
    validate_article7 = None

try:
    from validators.article8_validator import validate_article8
except ImportError:
    validate_article8 = None

try:
    from validators.article9_validator import validate_article9
except ImportError:
    validate_article9 = None

try:
    from validators.article11_validator import validate_article11
except ImportError:
    validate_article11 = None

try:
    from validators.article12_validator import validate_article12
except ImportError:
    validate_article12 = None

try:
    from validators.article15_validator import validate_article15
except ImportError:
    validate_article15 = None


class SchemaValidator:
    """Main validator that orchestrates all article validations."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize validator.
        
        Args:
            config_path: Path to config JSON file (optional, will use Python config.py if not provided)
        """
        self.config = self._load_config(config_path)
        self.extractor = DXFExtractor()
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict:
        """Load configuration from JSON file or use Python config.py."""
        if config_path and Path(config_path).exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Use Python config.py
        return {"articles": get_all_articles()}
    
    def validate_from_dxf(self, dxf_file: str) -> Dict:
        """
        Validate DXF file directly.
        
        Args:
            dxf_file: Path to DXF file
            
        Returns:
            Dictionary with validation results
        """
        # Extract structured text data (for critical areas like plot, floors, stair schedule labels)
        text_data = {}
        try:
            text_data = StructuredTextParser.parse_structured_labels(dxf_file) or {}
        except Exception:
            text_data = {}

        # Extract elements and metadata using deep extraction
        elements = self.extractor.parse_dxf(dxf_file)
        plot_building_data = self.extractor.extract_plot_and_building(dxf_file)
        elevation_metadata = self.extractor._extract_elevation_metadata(dxf_file)
        
        # Get INSUNITS for unit conversion
        insunits = plot_building_data.get('insunits', 4)
        
        # Unit name mapping
        unit_names = {1: "inches", 2: "feet", 3: "centimeters", 4: "millimeters", 5: "meters", 6: "meters"}
        unit_name = unit_names.get(insunits, "unknown")
        print(f"[Unit Detection] INSUNITS={insunits} ({unit_name}) - All areas converted to m², all widths converted to m", file=sys.stderr)
        
        # Merge structured text parser metadata into tech_details (Article 13 uses this)
        tech_details_from_text = (text_data.get("metadata") or {}) if isinstance(text_data, dict) else {}
        if isinstance(tech_details_from_text, dict):
            if "no of steps" in tech_details_from_text:
                plot_building_data.setdefault("tech_details", {})["steps"] = int(tech_details_from_text["no of steps"])
            if "riser height" in tech_details_from_text:
                plot_building_data.setdefault("tech_details", {})["riser"] = tech_details_from_text["riser height"]
            if "thread" in tech_details_from_text:
                plot_building_data.setdefault("tech_details", {})["tread"] = tech_details_from_text["thread"]

        # Prefer structured text areas for Article 5/8 when available
        plot_area_m2 = (text_data.get("plot_area") if isinstance(text_data, dict) else None) or plot_building_data.get("plot_area_m2")
        ground_floor_m2 = (text_data.get("floors", {}).get("ground") if isinstance(text_data, dict) else None) or plot_building_data.get("building_area_m2")
        first_floor_m2 = (text_data.get("floors", {}).get("first") if isinstance(text_data, dict) else None)
        roof_floor_m2 = (text_data.get("floors", {}).get("roof") if isinstance(text_data, dict) else None)

        total_building_m2 = 0.0
        for v in (ground_floor_m2, first_floor_m2, roof_floor_m2):
            if v:
                try:
                    total_building_m2 += float(v)
                except Exception:
                    pass

        coverage_percent = plot_building_data.get("coverage_percent")
        try:
            if plot_area_m2 and ground_floor_m2:
                coverage_percent = (float(ground_floor_m2) / float(plot_area_m2)) * 100.0
        except Exception:
            pass
        
        # Combine metadata including deep extracted project and tech details
        metadata = {
            'project': plot_building_data.get('project', {}),
            'tech_details': plot_building_data.get('tech_details', {}),
            'text_extracted_data': text_data,
            'plot_area_m2': plot_area_m2,
            'building_area_m2': ground_floor_m2,
            'ground_area_m2': ground_floor_m2,
            'first_floor_area_m2': first_floor_m2,
            'roof_area_m2': roof_floor_m2,
            'total_building_area_m2': total_building_m2,
            'coverage_percent': coverage_percent,
            'plot_vertices': plot_building_data.get('plot_vertices', []),
            'building_vertices': plot_building_data.get('building_vertices', []),
            'road_axis_elevation': elevation_metadata.get('road_axis_elevation'),
            'max_point_elevation': elevation_metadata.get('max_point_elevation'),
            'floor_heights': elevation_metadata.get('floor_heights', []),
            'insunits': insunits,
            'unit_name': unit_name,
        }
        
        return self.validate_schema(elements, metadata)
    
    def validate_schema(self, elements: List[Dict], metadata: Dict = None) -> Dict:
        """
        Validate all articles.
        
        Args:
            elements: List of extracted elements
            metadata: Optional metadata (plot area, building area, etc.)
            
        Returns:
            Dictionary with all validation results
        """
        if metadata is None:
            metadata = {}
        
        # Prepare the structured output
        results = {
            "metadata": {
                "document_name_ar": "دليل السكن الخاص",
                "document_name_en": "Abu Dhabi Private Housing Guide",
                "version": "2.0",
                "year": 2022,
                "issuing_authority_ar": "دائرة البلديات والنقل",
                "issuing_authority_en": "Department of Municipalities and Transport",
                "scope": "Technical regulations for private residential villa construction in Abu Dhabi Emirate"
            },
            "definitions": {
                "article_id": "1",
                "title_ar": "التعريفات",
                "title_en": "Definitions",
                "terms": [
                    {"term_ar": "مسؤول البناء", "term_en": "building_official", "definition_ar": "هو الشخص المكلف بإدارة تراخيص البناء في البلدية المعنية أو من ينوب عنه", "definition_en": "Person responsible for managing building permits in the municipality"},
                    {"term_ar": "كود البناء", "term_en": "building_code", "definition_ar": "كودات أبوظبي الدولية للبناء شاملة المراجع والمعايير القياسية المشار إليها في هذه الأحكام", "definition_en": "Abu Dhabi International Building Codes including referenced standards"},
                    {"term_ar": "السكن الخاص", "term_en": "private_housing", "definition_ar": "وحدة سكنيه تخصص لعائلة واحدة مع ملحقاتها ويدخل ضمنها الفيلات الحكومية والمساكن الشعبية", "definition_en": "Residential unit for single family including government villas and public housing"},
                    {"term_ar": "الفيلا السكنية", "term_en": "residential_villa", "definition_ar": "وحدة سكنية منفصلة، حين يكون المبنى الرئيسي في القسيمة السكنية مخصص لأغراض سكن العائلة والذي لا يقوم البناء من دونه", "definition_en": "Detached residential unit, main building designated for family housing"},
                    {"term_ar": "الفراغ المعيشي", "term_en": "living_space", "definition_ar": "المكان المنتفع به لغرض المعيشة ويشمل الصالات وغرف النوم وغرف المكتب وما شابه", "definition_en": "Space used for living including halls, bedrooms, offices"},
                    {"term_ar": "الفراغ الخدمي", "term_en": "service_space", "definition_ar": "المكان المنتفع به للأغراض الخدمية ويشمل الغرف الخاصة بالخدمات والمرافق المشتركة بالمبنى", "definition_en": "Space for service purposes including service rooms and shared facilities"},
                    {"term_ar": "الأجنحة السكنية", "term_en": "residential_suites", "definition_ar": "وحدات معيشية غير متكاملة ومغلقة داخل حيز الفيلا السكنية، تشترك مع باقي عناصر السكن في المرافق والخدمات وليس لها مدخل مستقل من خارج الفيلا السكنية", "definition_en": "Non-independent living units within villa sharing facilities with no separate entrance"},
                    {"term_ar": "دورة المياه", "term_en": "toilet", "definition_ar": "حمام ملحق بالصالات أو المجالس دون غرف النوم ولا يستخدم لأغراض الاستحمام", "definition_en": "Bathroom attached to halls without bathing facilities"},
                    {"term_ar": "الملاحق", "term_en": "annexes", "definition_ar": "المباني الثانوية في القسيمة السكنية وتشمل ملحق الخدمات وملحق الضيافة والملحق الرياضي والمرآب وغيرها", "definition_en": "Secondary buildings including service annex, hospitality annex, sports annex, garage"},
                    {"term_ar": "ملحق الضيافة", "term_en": "hospitality_annex", "definition_ar": "مبنى مخصص لاستقبال الضيوف", "definition_en": "Building designated for receiving guests (Majlis)"},
                    {"term_ar": "ملحق الخدمات", "term_en": "service_annex", "definition_ar": "مبنى مخصص للاستخدامات الخدمية للفيلا السكنية كغرف العمالة المنزلية والمطبخ والمخازن وما شابه", "definition_en": "Building for service uses like staff rooms, kitchen, storage"},
                    {"term_ar": "المجلس", "term_en": "majlis", "definition_ar": "الفراغ المعيشي المخصص لاستقبال الضيوف في الفيلا الرئيسية أو ملحق الضيافة له مدخل مخصص للضيوف", "definition_en": "Living space for receiving guests with dedicated guest entrance"},
                    {"term_ar": "المنشآت المؤقتة", "term_en": "temporary_structures", "definition_ar": "هي المنشآت المشيدة من عناصر ومواد خفيفة (غير الطابوق والخرسانة أو الهياكل المعدنية الثابتة) و التي لا يزيد مدة بقاؤها عن 180 يوم", "definition_en": "Structures built from lightweight materials not exceeding 180 days"},
                    {"term_ar": "مرآب السيارات", "term_en": "car_garage", "definition_ar": "مكان مسقوف ومغلق من ثلاث جهات على الأقل مخصص لمواقف السيارات", "definition_en": "Covered space enclosed from at least 3 sides for parking"},
                    {"term_ar": "الملحق الرياضي", "term_en": "sports_annex", "definition_ar": "مبنى مخصص لممارسة الأنشطة الرياضية", "definition_en": "Building for sports activities"},
                    {"term_ar": "المطبخ التحضيري", "term_en": "pantry_kitchen", "definition_ar": "مطبخ صغير داخل الفيلا السكنية أو ملحق الضيافة يخصص لتجهيز الوجبات الخفيفة وتسخين الطعام", "definition_en": "Small kitchen for light meal preparation and reheating"},
                    {"term_ar": "الشارع الفرعي", "term_en": "secondary_street", "definition_ar": "هو أي شارع يقع عليه حد من حدود القسيمة غير الشارع الرئيسي", "definition_en": "Any street on plot boundary other than main street"},
                    {"term_ar": "نسبة البناء", "term_en": "building_coverage_ratio", "definition_ar": "النسبة المئوية لمساحة الحدود الخارجية القصوى للمباني والفراغات المسقوفة بمواد غير خفيفة من مساحة قطعة الأرض (القسيمة) عند إسقاطها أفقيا", "definition_en": "Percentage of maximum building footprint to plot area"},
                    {"term_ar": "المساحة الطابقية", "term_en": "floor_area", "definition_ar": "مجموع المساحات داخل غلاف المبنى وتقاس من واجهات الجدران الخارجية", "definition_en": "Total area within building envelope measured from exterior walls"},
                    {"term_ar": "المواد الخفيفة", "term_en": "lightweight_materials", "definition_ar": "مواد تستخدم لتغطية مساحة مفتوحة وتكون حاملة لنفسها فقط ويمكن إزالتها وتركيبها دون التأثير على الهيكل الإنشائي لعناصر البناء", "definition_en": "Self-supporting materials that can be removed without affecting structure"},
                    {"term_ar": "خط البناء", "term_en": "building_line", "definition_ar": "الخط الواقع على الحدود الخارجية القصوى للإسقاط الأفقي للمباني", "definition_en": "Line at maximum horizontal projection of buildings"},
                    {"term_ar": "الارتداد", "term_en": "setback", "definition_ar": "أقصر مسافة أفقية فاصلة بين خط البناء وحدود القسيمة", "definition_en": "Shortest horizontal distance between building line and plot boundary"},
                    {"term_ar": "المسافة الفاصلة", "term_en": "separation_distance", "definition_ar": "هي المسافة الواقعة بين خطوط البناء للمباني المختلفة بالقسيمة السكنية", "definition_en": "Distance between building lines of different buildings on plot"},
                    {"term_ar": "البروز", "term_en": "projection", "definition_ar": "الجزء البارز عن الحائط الخارجي للبناء لأغراض جمالية أو وظيفية", "definition_en": "Part projecting from exterior wall for aesthetic or functional purposes"},
                    {"term_ar": "ارتفاع المبنى", "term_en": "building_height", "definition_ar": "المسافة الرأسية التي يتم قياسها من مستوى منسوب محور الطريق حتى أعلى نقطة في المبنى", "definition_en": "Vertical distance from road axis level to highest point of building"},
                    {"term_ar": "ارتفاع الطابق", "term_en": "floor_height", "definition_ar": "صافي المسافة الرأسية من منسوب تشطيب أرضية الطابق إلى منسوب بطنية السقف الإنشائي للطابق نفسه عند أي نقطة", "definition_en": "Clear vertical distance from floor finish to structural ceiling soffit"},
                    {"term_ar": "الفناء الداخلي", "term_en": "internal_courtyard", "definition_ar": "مساحة داخلية مفتوحة من الجهة العلوية ومحاطة بحوائط من كافة الجهات بغرض توفير التهوية والإضاءة الطبيعية", "definition_en": "Internal open space surrounded by walls for ventilation and natural light"},
                    {"term_ar": "الفناء الخارجي", "term_en": "external_courtyard", "definition_ar": "مساحة خارجية مفتوحة من الجهة العلوية ومحاطة بحوائط من ثلاث جهات بغرض توفير التهوية والإضاءة الطبيعية", "definition_en": "External open space surrounded by walls on 3 sides"},
                    {"term_ar": "طابق السرداب", "term_en": "basement_floor", "definition_ar": "الطابق الذي يقع جزئيا أو كليا تحت الطابق الأرضي للفيلا السكنية", "definition_en": "Floor partially or fully below ground floor"},
                    {"term_ar": "الطابق الأرضي", "term_en": "ground_floor", "definition_ar": "أول طابق في المبنى يكون منسوب أرضيته أعلى من منسوب محور الطريق", "definition_en": "First floor with floor level above road axis"},
                    {"term_ar": "القسائم ذات المساحات الصغيرة", "term_en": "small_plots", "definition_ar": "القسائم السكنية التي تقل مساحتها عن 350 متر مربع", "definition_en": "Residential plots less than 350 sqm"},
                    {"term_ar": "القسائم ذات المساحات الكبيرة", "term_en": "large_plots", "definition_ar": "القسائم السكنية التي تزيد مساحتها عن عشرة آلاف متر مربع (10,000م2)", "definition_en": "Residential plots exceeding 10,000 sqm"}
                ]
            },
            "articles": get_all_articles(),
            "input_metadata": metadata
        }

        raw_results: Dict[str, List[Dict]] = {}
        
        # Validate all articles in order: 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18, 19, 20
        
        # Article 5 - Building Coverage and Floor Area
        article5_schema = self._get_article_schema("5")
        if validate_article5 and article5_schema:
            try:
                results_list = validate_article5(elements, metadata, article5_schema)
                raw_results['5'] = results_list
            except Exception as e:
                print(f"Error validating Article 5: {e}", file=sys.stderr)
        
        # Article 6 - Setbacks and Projections
        if validate_article6_geopandas:
            try:
                results_list = validate_article6_geopandas(elements, metadata)
                raw_results['6'] = results_list
            except Exception as e:
                print(f"Error validating Article 6: {e}", file=sys.stderr)
        
        # Article 7 - Separation Distances
        article7_schema = self._get_article_schema("7")
        if validate_article7 and article7_schema:
            try:
                results_list = validate_article7(elements, metadata, article7_schema)
                raw_results['7'] = results_list
            except Exception as e:
                print(f"Error validating Article 7: {e}", file=sys.stderr)
        
        # Article 8 - Floors, Heights and Levels
        article8_schema = self._get_article_schema("8")
        if validate_article8 and article8_schema:
            try:
                results_list = validate_article8(elements, metadata, article8_schema)
                raw_results['8'] = results_list
            except Exception as e:
                print(f"Error validating Article 8: {e}", file=sys.stderr)
        
        # Article 9 - Basement Floor
        article9_schema = self._get_article_schema("9")
        if validate_article9 and article9_schema:
            try:
                results_list = validate_article9(elements, metadata, article9_schema)
                raw_results['9'] = results_list
            except Exception as e:
                print(f"Error validating Article 9: {e}", file=sys.stderr)
        
        # Article 10 - Roof Floor
        if validate_article10_geopandas:
            try:
                results_list = validate_article10_geopandas(elements, metadata)
                raw_results['10'] = results_list
            except Exception as e:
                print(f"Error validating Article 10: {e}", file=sys.stderr)
        
        # Article 11 - Element Areas and Internal Dimensions
        article11_schema = self._get_article_schema("11")
        if validate_article11 and article11_schema:
            try:
                results_list = validate_article11(elements, article11_schema)
                raw_results['11'] = results_list
            except Exception as e:
                print(f"Error validating Article 11: {e}", file=sys.stderr)
        
        # Article 12 - Ventilation and Lighting
        article12_schema = self._get_article_schema("12")
        if validate_article12 and article12_schema:
            try:
                results_list = validate_article12(elements, article12_schema)
                raw_results['12'] = results_list
            except Exception as e:
                print(f"Error validating Article 12: {e}", file=sys.stderr)
        
        # Article 13 - Stairs
        if validate_article13_geopandas:
            try:
                results_list = validate_article13_geopandas(elements, metadata)
                raw_results['13'] = results_list
            except Exception as e:
                print(f"Error validating Article 13: {e}", file=sys.stderr)
        
        # Article 15 - Entrances
        article15_schema = self._get_article_schema("15")
        if validate_article15 and article15_schema:
            try:
                results_list = validate_article15(elements, metadata, article15_schema)
                raw_results['15'] = results_list
            except Exception as e:
                print(f"Error validating Article 15: {e}", file=sys.stderr)
        
        # Article 18 - Building Design
        article18_schema = self._get_article_schema("18")
        if validate_article18 and article18_schema:
            try:
                results_list = validate_article18(elements, article18_schema)
                raw_results['18'] = results_list
            except Exception as e:
                print(f"Error validating Article 18: {e}", file=sys.stderr)
        
        # Article 19 - Residential Suites
        article19_schema = self._get_article_schema("19")
        if validate_article19 and article19_schema:
            try:
                results_list = validate_article19(elements, article19_schema)
                raw_results['19'] = results_list
            except Exception as e:
                print(f"Error validating Article 19: {e}", file=sys.stderr)
        
        # Article 20 - Annex Buildings
        article20_schema = self._get_article_schema("20")
        if validate_article20 and article20_schema:
            try:
                results_list = validate_article20(elements, article20_schema, metadata)
                raw_results['20'] = results_list
            except Exception as e:
                print(f"Error validating Article 20: {e}", file=sys.stderr)

        # Merge results into the articles structure
        for article in results['articles']:
            aid = article.get('article_id')
            art_results = raw_results.get(aid, [])
            
            # Embed validation into rules
            if 'rules' in article:
                for rule in article['rules']:
                    rid = str(rule.get('rule_id'))
                    matches = [r for r in art_results if str(r.get('rule_id')) == rid]
                    
                    if matches:
                        all_pass = all(m.get('pass', False) for m in matches)
                        rule['validation'] = {
                            "status": "PASSED" if all_pass else "FAILED",
                            "passed": all_pass,
                            "instances": matches
                        }
                    else:
                        rule['validation'] = {
                            "status": "NOT_CHECKED",
                            "passed": None,
                            "instances": []
                        }
            
            # Special handling for Article 11 elements
            if aid == "11":
                for cat in ["basic_elements", "additional_elements"]:
                    if cat in article:
                        for element in article[cat]:
                            eid = str(element.get('id'))
                            matches = [r for r in art_results if str(r.get('rule_id')) == eid]
                            if matches:
                                all_pass = all(m.get('pass', False) for m in matches)
                                element['validation'] = {
                                    "status": "PASSED" if all_pass else "FAILED",
                                    "passed": all_pass,
                                    "instances": matches
                                }
                            else:
                                element['validation'] = {
                                    "status": "NOT_CHECKED",
                                    "passed": None,
                                    "instances": []
                                }

        # ------------------------------------------------------------------
        # Backward-compatible (frontend) payload
        # ------------------------------------------------------------------
        def _is_unknown(item: Dict) -> bool:
            d = item.get("details") or {}
            status = str(d.get("status") or "").upper().strip()
            # Some validators mark uncheckable items as UNKNOWN; we should not treat those as failures.
            return status in ("UNKNOWN", "NOT_CHECKED")

        def _with_element_field(item: Dict) -> Dict:
            # Frontend expects `element` in many places (esp. article_11_results mapping).
            if "element" in item and item.get("element"):
                return item
            d = item.get("details") or {}
            element_name = d.get("element_name")
            if element_name:
                return {**item, "element": element_name}
            # Fall back to rule_id as an identifier
            if item.get("rule_id"):
                return {**item, "element": str(item.get("rule_id"))}
            return item

        def _article_counts(items: List[Dict]) -> Dict[str, int]:
            effective = [it for it in items if not _is_unknown(it)]
            passed = sum(1 for it in effective if it.get("pass") is True)
            failed = sum(1 for it in effective if it.get("pass") is not True)
            return {"total": len(effective), "passed": passed, "failed": failed}

        def _article_pass(items: List[Dict]) -> bool:
            c = _article_counts(items)
            return c["failed"] == 0

        def _get_article_results(article_id: str) -> List[Dict]:
            return [_with_element_field(it) for it in (raw_results.get(article_id) or [])]

        article_5_results = _get_article_results("5")
        article_6_results = _get_article_results("6")
        article_7_results = _get_article_results("7")
        article_8_results = _get_article_results("8")
        article_9_results = _get_article_results("9")
        article_10_results = _get_article_results("10")
        article_11_results = _get_article_results("11")
        article_12_results = _get_article_results("12")
        article_13_results = _get_article_results("13")
        article_15_results = _get_article_results("15")
        article_18_results = _get_article_results("18")
        article_19_results = _get_article_results("19")
        article_20_results = _get_article_results("20")
        # Article 14 is not validated in python_standalone currently; keep empty for compat.
        article_14_results: List[Dict] = []

        # Article-level pass flags and rule counts
        a5 = _article_counts(article_5_results)
        a6 = _article_counts(article_6_results)
        a7 = _article_counts(article_7_results)
        a8 = _article_counts(article_8_results)
        a9 = _article_counts(article_9_results)
        a10 = _article_counts(article_10_results)
        a12 = _article_counts(article_12_results)
        a13 = _article_counts(article_13_results)
        a15 = _article_counts(article_15_results)
        a18 = _article_counts(article_18_results)
        a19 = _article_counts(article_19_results)
        a20 = _article_counts(article_20_results)

        # Element-type summary (used heavily by the current frontend)
        element_type_items = [it for it in article_11_results if str(it.get("rule_type") or "") == "element"]
        element_type_effective = [it for it in element_type_items if not _is_unknown(it)]
        passed_element_types = sum(1 for it in element_type_effective if it.get("pass") is True)
        failed_element_types = sum(1 for it in element_type_effective if it.get("pass") is not True)
        total_element_types = len(element_type_effective)

        # Overall schema pass: no effective failures across articles + elements
        overall_schema_pass = (
            _article_pass(article_5_results)
            and _article_pass(article_6_results)
            and _article_pass(article_7_results)
            and _article_pass(article_8_results)
            and _article_pass(article_9_results)
            and _article_pass(article_10_results)
            and _article_pass(article_12_results)
            and _article_pass(article_13_results)
            and _article_pass(article_15_results)
            and _article_pass(article_18_results)
            and _article_pass(article_19_results)
            and _article_pass(article_20_results)
            and (failed_element_types == 0)
        )

        # Keep the rich structured output, but also add the "legacy" flat keys.
        results.update(
            {
                "schema_pass": overall_schema_pass,
                "schema_status": "PASS" if overall_schema_pass else "FAIL",
                "article_5_results": article_5_results,
                "article_6_results": article_6_results,
                "article_7_results": article_7_results,
                "article_8_results": article_8_results,
                "article_9_results": article_9_results,
                "article_10_results": article_10_results,
                "article_11_results": article_11_results,
                "article_12_results": article_12_results,
                "article_13_results": article_13_results,
                "article_15_results": article_15_results,
                "article_18_results": article_18_results,
                "article_19_results": article_19_results,
                "article_20_results": article_20_results,
                "article_14_results": article_14_results,
                "summary": {
                    "total_element_types": total_element_types,
                    "passed_element_types": passed_element_types,
                    "failed_element_types": failed_element_types,
                    # Instance counts are not modeled the same way in python_standalone; keep basic counters.
                    "total_instances": total_element_types,
                    "passed_instances": passed_element_types,
                    "failed_instances": failed_element_types,
                    "missing_required": 0,
                    "required_elements": [],
                    "present_required": [],
                    "element_counts": {},
                    "article_5_pass": a5["failed"] == 0,
                    "article_5_total_rules": a5["total"],
                    "article_5_passed_rules": a5["passed"],
                    "article_5_failed_rules": a5["failed"],
                    "article_6_pass": a6["failed"] == 0,
                    "article_6_total_rules": a6["total"],
                    "article_6_passed_rules": a6["passed"],
                    "article_6_failed_rules": a6["failed"],
                    "article_7_pass": a7["failed"] == 0,
                    "article_7_total_rules": a7["total"],
                    "article_7_passed_rules": a7["passed"],
                    "article_7_failed_rules": a7["failed"],
                    "article_8_pass": a8["failed"] == 0,
                    "article_8_total_rules": a8["total"],
                    "article_8_passed_rules": a8["passed"],
                    "article_8_failed_rules": a8["failed"],
                    "article_9_pass": a9["failed"] == 0,
                    "article_9_total_rules": a9["total"],
                    "article_9_passed_rules": a9["passed"],
                    "article_9_failed_rules": a9["failed"],
                    "article_10_pass": a10["failed"] == 0,
                    "article_10_total_rules": a10["total"],
                    "article_10_passed_rules": a10["passed"],
                    "article_10_failed_rules": a10["failed"],
                    "article_12_pass": a12["failed"] == 0,
                    "article_12_total_rules": a12["total"],
                    "article_12_passed_rules": a12["passed"],
                    "article_12_failed_rules": a12["failed"],
                    "article_13_pass": a13["failed"] == 0,
                    "article_13_total_rules": a13["total"],
                    "article_13_passed_rules": a13["passed"],
                    "article_13_failed_rules": a13["failed"],
                    "article_15_pass": a15["failed"] == 0,
                    "article_15_total_rules": a15["total"],
                    "article_15_passed_rules": a15["passed"],
                    "article_15_failed_rules": a15["failed"],
                    "article_18_pass": a18["failed"] == 0,
                    "article_18_total_rules": a18["total"],
                    "article_18_passed_rules": a18["passed"],
                    "article_18_failed_rules": a18["failed"],
                    "article_19_pass": a19["failed"] == 0,
                    "article_19_total_rules": a19["total"],
                    "article_19_passed_rules": a19["passed"],
                    "article_19_failed_rules": a19["failed"],
                    "article_20_pass": a20["failed"] == 0,
                    "article_20_total_rules": a20["total"],
                    "article_20_passed_rules": a20["passed"],
                    "article_20_failed_rules": a20["failed"],
                    "article_14_pass": True,
                    "article_14_total_rules": 0,
                    "article_14_passed_rules": 0,
                    "article_14_failed_rules": 0,
                    "article_11_pass": failed_element_types == 0,
                },
                # Convenience top-level project metadata for frontend display
                "project": (metadata or {}).get("project", {}),
            }
        )

        return results
    
    def _get_article_schema(self, article_id: str) -> Optional[Dict]:
        """Get article schema from config."""
        # Use Python config module
        return get_article(article_id)
    
    def export_to_json(self, result: Dict, output_file: str):
        """Export validation results to JSON file."""
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)


def main():
    """CLI interface."""
    if len(sys.argv) < 2:
        print("Usage: python main_validator.py <DXF_FILE> [OUTPUT_JSON]")
        sys.exit(1)
    
    dxf_file = sys.argv[1]
    output_json = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not Path(dxf_file).exists():
        print(f"Error: DXF file not found: {dxf_file}", file=sys.stderr)
        sys.exit(1)
    
    try:
        validator = SchemaValidator()
        result = validator.validate_from_dxf(dxf_file)
        
        if output_json:
            validator.export_to_json(result, output_json)
            print(f"Validation results saved to: {output_json}")
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Print summary
        summary = result.get('summary', {})
        print(f"\nSummary:")
        print(f"  Total rules checked: {summary.get('total_rules_checked', 0)}")
        print(f"  Passed: {summary.get('passed_rules', 0)}")
        print(f"  Failed: {summary.get('failed_rules', 0)}")
        print(f"  Schema pass: {result.get('schema_pass', False)}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

