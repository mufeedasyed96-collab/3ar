/**
 * Configuration module for architectural schema validation rules
 * All Articles: 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18, 19, 20
 */

// If road_config is in the same directory or accessible via require
let ROAD_ARTICLES = [];
try {
    const roadConfig = require('./config_roads');
    ROAD_ARTICLES = roadConfig.ROAD_ARTICLES || [];
} catch (e) {
    console.warn("Could not load config_roads", e);
}

const ARTICLES = [
    {
        "article_id": "1",
        "title_ar": "التعريفات",
        "title_en": "Definitions",
        "terms": [
            {
                "term_ar": "مسؤول البناء",
                "term_en": "building_official",
                "definition_ar": "هو الشخص المكلف بإدارة تراخيص البناء في البلدية المعنية أو من ينوب عنه",
                "definition_en": "Person responsible for managing building permits in the municipality"
            },
            {
                "term_ar": "كود البناء",
                "term_en": "building_code",
                "definition_ar": "كودات أبوظبي الدولية للبناء شاملة المراجع والمعايير القياسية المشار إليها في هذه الأحكام",
                "definition_en": "Abu Dhabi International Building Codes including referenced standards"
            },
            {
                "term_ar": "السكن الخاص",
                "term_en": "private_housing",
                "definition_ar": "وحدة سكنيه تخصص لعائلة واحدة مع ملحقاتها ويدخل ضمنها الفيلات الحكومية والمساكن الشعبية",
                "definition_en": "Residential unit for single family including government villas and public housing"
            },
            {
                "term_ar": "الفيلا السكنية",
                "term_en": "residential_villa",
                "definition_ar": "وحدة سكنية منفصلة، حين يكون المبنى الرئيسي في القسيمة السكنية مخصص لأغراض سكن العائلة والذي لا يقوم البناء من دونه",
                "definition_en": "Detached residential unit, main building designated for family housing"
            },
            {
                "term_ar": "الفراغ المعيشي",
                "term_en": "living_space",
                "definition_ar": "المكان المنتفع به لغرض المعيشة ويشمل الصالات وغرف النوم وغرف المكتب وما شابه",
                "definition_en": "Space used for living including halls, bedrooms, offices"
            },
            {
                "term_ar": "الفراغ الخدمي",
                "term_en": "service_space",
                "definition_ar": "المكان المنتفع به للأغراض الخدمية ويشمل الغرف الخاصة بالخدمات والمرافق المشتركة بالمبنى",
                "definition_en": "Space for service purposes including service rooms and shared facilities"
            },
            {
                "term_ar": "الأجنحة السكنية",
                "term_en": "residential_suites",
                "definition_ar": "وحدات معيشية غير متكاملة ومغلقة داخل حيز الفيلا السكنية، تشترك مع باقي عناصر السكن في المرافق والخدمات وليس لها مدخل مستقل من خارج الفيلا السكنية",
                "definition_en": "Non-independent living units within villa sharing facilities with no separate entrance"
            },
            {
                "term_ar": "دورة المياه",
                "term_en": "toilet",
                "definition_ar": "حمام ملحق بالصالات أو المجالس دون غرف النوم ولا يستخدم لأغراض الاستحمام",
                "definition_en": "Bathroom attached to halls without bathing facilities"
            },
            {
                "term_ar": "الملاحق",
                "term_en": "annexes",
                "definition_ar": "المباني الثانوية في القسيمة السكنية وتشمل ملحق الخدمات وملحق الضيافة والملحق الرياضي والمرآب وغيرها",
                "definition_en": "Secondary buildings including service annex, hospitality annex, sports annex, garage"
            },
            {
                "term_ar": "ملحق الضيافة",
                "term_en": "hospitality_annex",
                "definition_ar": "مبنى مخصص لاستقبال الضيوف",
                "definition_en": "Building designated for receiving guests (Majlis)"
            },
            {
                "term_ar": "ملحق الخدمات",
                "term_en": "service_annex",
                "definition_ar": "مبنى مخصص للاستخدامات الخدمية للفيلا السكنية كغرف العمالة المنزلية والمطبخ والمخازن وما شابه",
                "definition_en": "Building for service uses like staff rooms, kitchen, storage"
            },
            {
                "term_ar": "المجلس",
                "term_en": "majlis",
                "definition_ar": "الفراغ المعيشي المخصص لاستقبال الضيوف في الفيلا الرئيسية أو ملحق الضيافة له مدخل مخصص للضيوف",
                "definition_en": "Living space for receiving guests with dedicated guest entrance"
            },
            {
                "term_ar": "المنشآت المؤقتة",
                "term_en": "temporary_structures",
                "definition_ar": "هي المنشآت المشيدة من عناصر ومواد خفيفة (غير الطابوق والخرسانة أو الهياكل المعدنية الثابتة) و التي لا يزيد مدة بقاؤها عن 180 يوم",
                "definition_en": "Structures built from lightweight materials not exceeding 180 days"
            },
            {
                "term_ar": "مرآب السيارات",
                "term_en": "car_garage",
                "definition_ar": "مكان مسقوف ومغلق من ثلاث جهات على الأقل مخصص لمواقف السيارات",
                "definition_en": "Covered space enclosed from at least 3 sides for parking"
            },
            {
                "term_ar": "الملحق الرياضي",
                "term_en": "sports_annex",
                "definition_ar": "مبنى مخصص لممارسة الأنشطة الرياضية",
                "definition_en": "Building for sports activities"
            },
            {
                "term_ar": "المطبخ التحضيري",
                "term_en": "pantry_kitchen",
                "definition_ar": "مطبخ صغير داخل الفيلا السكنية أو ملحق الضيافة يخصص لتجهيز الوجبات الخفيفة وتسخين الطعام",
                "definition_en": "Small kitchen for light meal preparation and reheating"
            },
            {
                "term_ar": "الشارع الفرعي",
                "term_en": "secondary_street",
                "definition_ar": "هو أي شارع يقع عليه حد من حدود القسيمة غير الشارع الرئيسي",
                "definition_en": "Any street on plot boundary other than main street"
            },
            {
                "term_ar": "نسبة البناء",
                "term_en": "building_coverage_ratio",
                "definition_ar": "النسبة المئوية لمساحة الحدود الخارجية القصوى للمباني والفراغات المسقوفة بمواد غير خفيفة من مساحة قطعة الأرض (القسيمة) عند إسقاطها أفقيا",
                "definition_en": "Percentage of maximum building footprint to plot area"
            },
            {
                "term_ar": "المساحة الطابقية",
                "term_en": "floor_area",
                "definition_ar": "مجموع المساحات داخل غلاف المبنى وتقاس من واجهات الجدران الخارجية",
                "definition_en": "Total area within building envelope measured from exterior walls"
            },
            {
                "term_ar": "المواد الخفيفة",
                "term_en": "lightweight_materials",
                "definition_ar": "مواد تستخدم لتغطية مساحة مفتوحة وتكون حاملة لنفسها فقط ويمكن إزالتها وتركيبها دون التأثير على الهيكل الإنشائي لعناصر البناء",
                "definition_en": "Self-supporting materials that can be removed without affecting structure"
            },
            {
                "term_ar": "خط البناء",
                "term_en": "building_line",
                "definition_ar": "الخط الواقع على الحدود الخارجية القصوى للإسقاط الأفقي للمباني",
                "definition_en": "Line at maximum horizontal projection of buildings"
            },
            {
                "term_ar": "الارتداد",
                "term_en": "setback",
                "definition_ar": "أقصر مسافة أفقية فاصلة بين خط البناء وحدود القسيمة",
                "definition_en": "Shortest horizontal distance between building line and plot boundary"
            },
            {
                "term_ar": "المسافة الفاصلة",
                "term_en": "separation_distance",
                "definition_ar": "هي المسافة الواقعة بين خطوط البناء للمباني المختلفة بالقسيمة السكنية",
                "definition_en": "Distance between building lines of different buildings on plot"
            },
            {
                "term_ar": "البروز",
                "term_en": "projection",
                "definition_ar": "الجزء البارز عن الحائط الخارجي للبناء لأغراض جمالية أو وظيفية",
                "definition_en": "Part projecting from exterior wall for aesthetic or functional purposes"
            },
            {
                "term_ar": "ارتفاع المبنى",
                "term_en": "building_height",
                "definition_ar": "المسافة الرأسية التي يتم قياسها من مستوى منسوب محور الطريق حتى أعلى نقطة في المبنى",
                "definition_en": "Vertical distance from road axis level to highest point of building"
            },
            {
                "term_ar": "ارتفاع الطابق",
                "term_en": "floor_height",
                "definition_ar": "صافي المسافة الرأسية من منسوب تشطيب أرضية الطابق إلى منسوب بطنية السقف الإنشائي للطابق نفسه عند أي نقطة",
                "definition_en": "Clear vertical distance from floor finish to structural ceiling soffit"
            },
            {
                "term_ar": "الفناء الداخلي",
                "term_en": "internal_courtyard",
                "definition_ar": "مساحة داخلية مفتوحة من الجهة العلوية ومحاطة بحوائط من كافة الجهات بغرض توفير التهوية والإضاءة الطبيعية",
                "definition_en": "Internal open space surrounded by walls for ventilation and natural light"
            },
            {
                "term_ar": "الفناء الخارجي",
                "term_en": "external_courtyard",
                "definition_ar": "مساحة خارجية مفتوحة من الجهة العلوية ومحاطة بحوائط من ثلاث جهات بغرض توفير التهوية والإضاءة الطبيعية",
                "definition_en": "External open space surrounded by walls on 3 sides"
            },
            {
                "term_ar": "طابق السرداب",
                "term_en": "basement_floor",
                "definition_ar": "الطابق الذي يقع جزئيا أو كليا تحت الطابق الأرضي للفيلا السكنية",
                "definition_en": "Floor partially or fully below ground floor"
            },
            {
                "term_ar": "الطابق الأرضي",
                "term_en": "ground_floor",
                "definition_ar": "أول طابق في المبنى يكون منسوب أرضيته أعلى من منسوب محور الطريق",
                "definition_en": "First floor with floor level above road axis"
            },
            {
                "term_ar": "القسائم ذات المساحات الصغيرة",
                "term_en": "small_plots",
                "definition_ar": "القسائم السكنية التي تقل مساحتها عن 350 متر مربع",
                "definition_en": "Residential plots less than 350 sqm"
            },
            {
                "term_ar": "القسائم ذات المساحات الكبيرة",
                "term_en": "large_plots",
                "definition_ar": "القسائم السكنية التي تزيد مساحتها عن عشرة آلاف متر مربع (10,000م2)",
                "definition_en": "Residential plots exceeding 10,000 sqm"
            }
        ]
    },
    {
        "article_id": "2",
        "title_ar": "الاستخدام المسموح به في القسيمة",
        "title_en": "Permitted Use of Plot",
        "rules": [
            {
                "rule_id": "2.1",
                "description_ar": "تستخدم القسائم السكنية فقط للغرض المخصصة له باستثناء القسائم السكنية الواقعة ضمن المحاور التجارية والاستثمارية المعتمدة من الدائرة",
                "description_en": "Residential plots used only for designated purpose except commercial/investment corridors",
                "rule_type": "use_restriction"
            }
        ]
    },
    {
        "article_id": "3",
        "title_ar": "الاستخدام المسموح به في القسيمة",
        "title_en": "Permitted Plot Components",
        "rules": [
            {
                "rule_id": "3.1",
                "description_ar": "يتم تطوير القسيمة السكنية بالمكونات التالية",
                "description_en": "Plot development components",
                "permitted_components": [
                    { "component_ar": "الفيلا السكنية", "component_en": "residential_villa" },
                    { "component_ar": "ملاحق الخدمات", "component_en": "service_annexes" },
                    { "component_ar": "ملحق الضيافة", "component_en": "hospitality_annex" },
                    { "component_ar": "الملحق الرياضي", "component_en": "sports_annex" },
                    { "component_ar": "حوض السباحة", "component_en": "swimming_pool" },
                    { "component_ar": "مرآب السيارات", "component_en": "car_garage" },
                    { "component_ar": "غرفة الكهرباء والمحولات", "component_en": "electrical_room" },
                    { "component_ar": "غرفة مضخات حوض السباحة", "component_en": "pool_pump_room" },
                    { "component_ar": "عناصر تنسيق الموقع", "component_en": "landscaping_elements" },
                    { "component_ar": "الأسوار الخارجية ومداخل الأفراد والسيارات", "component_en": "fences_and_entrances" },
                    { "component_ar": "المظلات الخفيفة ومظلات مواقف السيارات", "component_en": "light_canopies" }
                ]
            }
        ]
    },
    {
        "article_id": "4",
        "title_ar": "عدد الوحدات المسموح به بالقسيمة",
        "title_en": "Permitted Number of Units",
        "rules": [
            {
                "rule_id": "4.1",
                "description_ar": "يسمح ببناء فيلا سكنية واحدة فقط لكل قسيمة ولا يسمح بتعدد الوحدات السكنية في القسيمة الواحدة إلا بناء على المعايير الصادرة",
                "description_en": "Only one residential villa per plot unless otherwise approved",
                "rule_type": "quantity",
                "max_villas_per_plot": 1
            }
        ]
    },

    {
        "article_id": "5",
        "title_ar": "نسبة البناء والمساحة الطابقية",
        "title_en": "Building Coverage and Floor Area",
        "rules": [
            {
                "rule_id": "5.1",
                "description_ar": "يجب ألا تتعدى نسبة البناء في القسائم السكنية سبعين بالمائة (70%) من مساحة القسيمة. وتشمل هذه النسبة الفيلا السكنية وكافة المباني الأخرى. ولا تحتسب البروزات الجمالية التي لا تزيد عن 50 سم ضمن هذه النسبة",
                "description_en": "Building coverage must not exceed 70% of plot area. Aesthetic projections up to 50cm not included",
                "rule_type": "percentage",
                "element": "building_coverage",
                "max_value": 70,
                "unit": "percent",
                "exclusion": "aesthetic_projections_up_to_50cm"
            },
            {
                "rule_id": "5.2",
                "description_ar": "تخصص النسبة الباقية للمناطق المفتوحة وتشمل الحدائق والمداخل والأفنية والممرات ومواقف السيارات وحوض السباحة ومناطق الترفيه كمناطق ألعاب الأطفال وغيرها",
                "description_en": "Remaining 30% for open areas including gardens, entrances, courtyards, parking, pool, recreation",
                "rule_type": "percentage",
                "element": "open_area",
                "min_value": 30,
                "unit": "percent"
            },
            {
                "rule_id": "5.3",
                "description_ar": "يجوز تغطية أجزاء من المساحة المفتوحة المذكورة بالبند السابق بمواد خفيفة، وتشمل المنشآت المؤقتة حسب أحكام المادة (27) من اللائحة التنفيذية مثل بيت الشعر والخيمة. على ألا تزيد نسبة هذه التغطيات عن (50%) من إجمالي المساحة المفتوحة",
                "description_en": "Lightweight coverage of open areas must not exceed 50% of total open area",
                "rule_type": "percentage",
                "element": "lightweight_coverage_of_open_area",
                "max_value": 50,
                "unit": "percent"
            },
            {
                "rule_id": "5.4",
                "description_ar": "الحد الأدنى للمساحة الطابقية للفيلا السكنية هو مائتا متر مربع (200م2) والدور الأرضي مائة وأربعون مترا مربعا (140م2) كشرط واحد.",
                "description_en": "Minimum villa floor area 200 sqm and ground floor area 140 sqm as a single requirement.",
                "rule_type": "area",
                "element": "villa_and_ground_floor_area",
                "min_total_floor_area": 200,
                "min_ground_floor_area": 140,
                "unit": "m2"
            }
        ]
    },
    {
        "article_id": "6",
        "title_ar": "خط البناء والارتدادات والبروزات",
        "title_en": "Building Line, Setbacks and Projections",
        "rules": [
            {
                "rule_id": "6.1",
                "description_ar": "لا يقل ارتداد خط البناء عن حد القسيمة المطل على شارع عن مترين (2.00 م)، ولا يقل عن متر ونصف (1.50 م) عن الحدود الأخرى",
                "description_en": "Setback from street minimum 2m, from other boundaries minimum 1.5m",
                "rule_type": "setback",
                "constraints": [
                    {
                        "boundary_type": "street_facing",
                        "min_setback_m": 2.0
                    },
                    {
                        "boundary_type": "other_boundaries",
                        "min_setback_m": 1.5
                    }
                ]
            },
            {
                "rule_id": "6.2",
                "description_ar": "يسمح ببناء الملاحق على حد القسيمة بدون ارتداد",
                "description_en": "Annexes permitted on plot boundary without setback",
                "rule_type": "exception",
                "element": "annexes",
                "min_setback_m": 0
            },
            {
                "rule_id": "6.3",
                "description_ar": "يسمح بعمل بروز لمظلة مدخل السيارات خارج حدود القسيمة. على ألا يزيد عن مترين (2.0م). ولا يقل ارتفاع بطنية البروز عن 4.50 متر من منسوب تشطيب الرصيف",
                "description_en": "Car entrance canopy projection outside plot max 2m, minimum soffit height 4.5m",
                "rule_type": "projection",
                "element": "car_entrance_canopy",
                "max_projection_m": 2.0,
                "min_soffit_height_m": 4.5
            },
            {
                "rule_id": "6.4",
                "description_ar": "لا يسمح بالامتداد خارج حدود القسيمة تحت مستوى 2.45 متر من منسوب تشطيب الرصيف إلا في الحالات التالية: الدرج بما لا يتجاوز 30.5 سم مع توفير حاجز حماية بارتفاع 91.5 سم. العناصر الجمالية بما لا يتجاوز 30.5 سم",
                "description_en": "Extensions below 2.45m pavement level: stairs max 30.5cm with 91.5cm barrier, aesthetic elements max 30.5cm",
                "rule_type": "projection",
                "height_threshold_m": 2.45,
                "exceptions": [
                    {
                        "element": "stairs",
                        "max_projection_cm": 30.5,
                        "required_barrier_height_cm": 91.5
                    },
                    {
                        "element": "aesthetic_elements",
                        "max_projection_cm": 30.5
                    }
                ]
            },
            {
                "rule_id": "6.5",
                "description_ar": "لا يسمح بالامتداد خارج حدود القسيمة فوق مستوى 2.45 متر من منسوب تشطيب الرصيف إلا في حالة بروز العناصر الجمالية مسافة 30 سم خارج حدود القسيمة أو لعمل مظلات المداخل",
                "description_en": "Extensions above 2.45m: only aesthetic elements max 30cm or entrance canopies",
                "rule_type": "projection",
                "height_threshold_m": 2.45,
                "max_aesthetic_projection_cm": 30
            },
            {
                "rule_id": "6.6",
                "description_ar": "لا يسمح بعمل أي بروز في حدود الجار سواء لأغراض جمالية أو وظيفية أو إنشائية ويشمل ذلك أعمدة السور والأساسات",
                "description_en": "No projections into neighbor boundaries including fence columns and foundations",
                "rule_type": "restriction",
                "element": "neighbor_boundary",
                "projection_allowed": false
            }
        ]
    },
    {
        "article_id": "7",
        "title_ar": "المسافات الفاصلة بين المباني",
        "title_en": "Separation Distances Between Buildings",
        "keywords": {
            "annex": ["annex", "outbuilding", "shed", "workshop", "storage", "ملحق"],
            "corridor": ["corridor", "passage", "hallway", "ممر"]
        },
        "rules": [
            {
                "rule_id": "7.1",
                "description_ar": "يجب ألا تقل المسافة الفاصلة بين الفيلا السكنية والملاحق أو أي مبنى آخر، أو بين الملاحق بعضها لبعض عن متر ونصف المتر (1.5 م)",
                "description_en": "Minimum separation between villa and annexes or between annexes is 1.5m",
                "rule_type": "separation",
                "element": "buildings_on_plot",
                "min_separation_m": 1.5
            },
            {
                "rule_id": "7.2",
                "description_ar": "يلزم تخصيص مسافة لممرات الحركة خالية من العوائق لا تقل عن 1.1 متر",
                "description_en": "Movement corridors must be minimum 1.1m clear of obstacles",
                "rule_type": "circulation",
                "element": "movement_corridors",
                "min_width_m": 1.1
            },
            {
                "rule_id": "7.3",
                "description_ar": "في حال صدرت موافقة ببناء فيلات سكنية اضافية تكون المسافة الفاصلة بين هذه الفيلات وفقا لما تحدده القرارات الإدارية. على ألا تقل المسافة الفاصلة بين الوحدات في القسائم المرخص لها سابقا بالتعدد عن 3 متر",
                "description_en": "Multiple villas on approved plots must have minimum 3m separation",
                "rule_type": "separation",
                "element": "multiple_villas",
                "min_separation_m": 3.0
            }
        ]
    },
    {
        "article_id": "8",
        "title_ar": "عدد الطوابق والارتفاعات والمناسيب",
        "title_en": "Number of Floors, Heights and Levels",
        "keywords": {
            "basement": ["basement", "sardab", "سرداب"],
            "ground": ["ground", "0"],
            "first": ["first", "1"],
            "roof": ["roof", "surface", "سطح"]
        },
        "rules": [
            {
                "rule_id": "8.1",
                "description_ar": "لا يزيد عدد طوابق الفيلا السكنية في أي مقطع رأسي عن الطابق الأرضي والطابق الأول وطابق السطح وطابق السرداب",
                "description_en": "Maximum floors: Ground + First + Roof + Basement",
                "rule_type": "floors",
                "max_floors": {
                    "basement": 1,
                    "ground": 1,
                    "first": 1,
                    "roof": 1,
                    "total_above_ground": 3
                }
            },
            {
                "rule_id": "8.2",
                "description_ar": "يسمح بعمل فروق في المناسيب ضمن الطابق الواحد بما لا يتعارض مع البند (1) من هذه المادة",
                "description_en": "Level variations within single floor permitted if not creating additional floor",
                "rule_type": "levels",
                "split_levels_permitted": true
            },
            {
                "rule_id": "8.3",
                "description_ar": "الحد الأقصى لارتفاع الفيلا السكنية ثمانية عشر مترا (18.00 م) يقاس من منسوب محور الطريق وحتى أعلى نقطة في المبنى",
                "description_en": "Maximum villa height 18m measured from road axis to highest point",
                "rule_type": "height",
                "element": "villa",
                "max_height_m": 18.0,
                "measurement_from": "road_axis_level"
            },
            {
                "rule_id": "8.4",
                "description_ar": "لا يقل منسوب أرضية الطابق الأرضي للفيلا السكنية عن خمسة وأربعين سنتيمتر (0.45 م) من منسوب محور الطريق، وعن عشرين سنتيمترا (0.20 م) من منسوب الأرض خارج أي من مداخل الفيلا",
                "description_en": "Ground floor level min 45cm above road axis, min 20cm above ground at entrances",
                "rule_type": "level",
                "element": "ground_floor",
                "constraints": [
                    {
                        "reference": "road_axis",
                        "min_height_m": 0.45
                    },
                    {
                        "reference": "ground_at_entrances",
                        "min_height_m": 0.20
                    }
                ]
            },
            {
                "rule_id": "8.5",
                "description_ar": "لا يزيد منسوب أرضية الطابق الأرضي للفيلا السكنية عن متر ونصف (1.5م) من منسوب الأرض أو عن مترين (2.00م) في حال وجود سرداب",
                "description_en": "Ground floor max 1.5m above ground, or 2.0m if basement exists",
                "rule_type": "level",
                "element": "ground_floor",
                "constraints": [
                    {
                        "condition": "no_basement",
                        "max_height_m": 1.5
                    },
                    {
                        "condition": "with_basement",
                        "max_height_m": 2.0
                    }
                ]
            },
            {
                "rule_id": "8.8",
                "description_ar": "لا يقل منسوب أي من مداخل القسيمة عن خمسة عشر سنتيمتر (0.15 م) من منسوب محور الطريق المقابل له",
                "description_en": "Plot entrance level minimum 15cm above adjacent road axis",
                "rule_type": "level",
                "element": "plot_entrance",
                "min_height_above_road_m": 0.15
            },
            {
                "rule_id": "8.9",
                "description_ar": "يلزم على المكتب الاستشاري والمقاول عند تصميم وتنفيذ مناسيب المساحات المفتوحة والأفنية والمداخل والأسطح بالقسيمة السكنية اتخاذ ما يلزم لضمان عدم تجمع مياه الأمطار داخل القسيمة وصرفها إلى خارجها وبعيدا عن المباني مع عمل نسبة ميول لا تقل عن 2% باتجاه نقاط الصرف",
                "description_en": "Minimum 2% slope for drainage of open areas away from buildings",
                "rule_type": "drainage",
                "min_slope_percent": 2
            },
            {
                "rule_id": "8.10",
                "description_ar": "يجب ألا يقل ارتفاع أي طابق عن ثلاثة أمتار (3.00م) ويستثنى من ذلك الفراغ تحت قلبه الدرج. ولا يقل ارتفاع أي فراغ مستخدم تحت قلية الدرج عن 2.05 متر",
                "description_en": "Minimum floor height 3m except under stairs. Under stair usable space min 2.05m",
                "rule_type": "height",
                "element": "floor_height",
                "min_height_m": 3.0,
                "exceptions": [
                    {
                        "element": "under_stair_space",
                        "min_height_m": 2.05
                    }
                ]
            },
            {
                "rule_id": "8.11",
                "description_ar": "لا يقل ارتفاع طابق السرداب عن ثلاثة أمتار (3.00م) ولا يزيد عن أربعة أمتار (4.00م). وفي حالة استخدامه لأغراض مواقف السيارات لا يقل ارتفاع الجزء المخصص لمواقف السيارات عن 2.15 متر",
                "description_en": "Basement height min 3m max 4m. Parking area min 2.15m height",
                "rule_type": "height",
                "element": "basement",
                "min_height_m": 3.0,
                "max_height_m": 4.0,
                "parking_min_height_m": 2.15
            }
        ]
    },
    {
        "article_id": "9",
        "title_ar": "طابق السرداب",
        "title_en": "Basement Floor",
        "keywords": {
            "basement": ["basement", "sardab", "سرداب"]
        },
        "rules": [
            {
                "rule_id": "9.1",
                "description_ar": "يسمح ببناء طابق واحد لسرداب واحد فقط تحت الطابق الأرضي للفيلا السكنية لا يزيد ارتفاع الجزء الظاهر منه فوق سطح الأرض عن 50% من ارتفاع طابق السرداب أو (1.85 م) أيهما أقل",
                "description_en": "One basement only. Visible portion max 50% of basement height or 1.85m whichever less",
                "rule_type": "basement",
                "max_basements": 1,
                "visible_portion": {
                    "max_percent": 50,
                    "max_height_m": 1.85,
                    "condition": "whichever_less"
                }
            },
            {
                "rule_id": "9.2",
                "description_ar": "في حال امتداد السرداب خارج حدود الطابق الأرضي للفيلا السكنية، يجب ألا تقل مساحة السرداب الممتدة أسفل حدود الطابق الأرضي للفيلا السكنية عن 40% من مساحة الطابق الأرضي مع عدم بناء طابق السرداب داخل فسحات الارتداد",
                "description_en": "Basement extending beyond ground floor must have min 40% under ground floor footprint, not in setbacks",
                "rule_type": "basement",
                "min_under_ground_floor_percent": 40,
                "setback_restriction": true
            },
            {
                "rule_id": "9.4",
                "description_ar": "يسمح باستخدام طابق السرداب فقط لأغراض مواقف السيارات وفراغات معيشية، وفراغات خدمية، ومطبخ وحمامات",
                "description_en": "Basement permitted uses: parking, living spaces, service spaces, kitchen, bathrooms",
                "rule_type": "use",
                "element": "basement",
                "permitted_uses": ["parking", "living_spaces", "service_spaces", "kitchen", "bathrooms"]
            }
        ]
    },
    {
        "article_id": "10",
        "title_ar": "طابق السطح",
        "title_en": "Roof Floor",
        "rules": [
            {
                "rule_id": "10.1",
                "description_ar": "إجمالي مساحة المباني على طابق السطح لا تتجاوز 70% من مساحة سقف الطابق الأول. ولا يتم احتساب البروزات غير الإنشائية لأغراض الجمالية التي لا تزيد عن 30 سم من الحد الخارجي لطابق السطح ضمن تلك النسبة",
                "description_en": "Roof floor buildings max 70% of first floor roof area. Non-structural projections up to 30cm excluded",
                "rule_type": "area",
                "element": "roof_floor_buildings",
                "max_percent_of_first_floor_roof": 70,
                "excluded_projections_cm": 30
            },
            {
                "rule_id": "10.3",
                "description_ar": "تكون النسبة الباقية من مساحة سقف الطابق الأول ونسبتها 30% كما يلي: تكون خالية من كافة أنواع المباني والخدمات، غير مسقوفة ولا تحتوي أي نوع من أنواع التغطية، تحدها دروة على حافة السطح لا يزيد ارتفاعها عن مترين (2.00م) ولا يقل عن متر وعشرين سنتيمتر (1.20م)",
                "description_en": "30% of roof must be open, uncovered, with parapet 1.2-2.0m high",
                "rule_type": "area",
                "element": "roof_open_area",
                "min_percent": 30,
                "parapet": {
                    "min_height_m": 1.2,
                    "max_height_m": 2.0
                }
            },
            {
                "rule_id": "10.4",
                "description_ar": "يلزم بناء دروة تحد أي مساحة غير مبنية من طابق السطح وكذلك السقف العلوي لطابق السطح بارتفاع لا يزيد عن مترين (2.00م) ولا يقل عن متر وعشرين سنتيمتر (1.20م)",
                "description_en": "Parapet required around open roof areas and top roof, height 1.2-2.0m",
                "rule_type": "safety",
                "element": "parapet",
                "min_height_m": 1.2,
                "max_height_m": 2.0
            }
        ]
    },
    {
        "article_id": "11",
        "title_ar": "مساحات العناصر والأبعاد الداخلية",
        "title_en": "Element Areas and Internal Dimensions",
        "rules": [
            {
                "rule_id": "11.0",
                "description_ar": "عند تصميم عناصر السكن يجب الالتزام بتوفير فراغ واحد على الأقل من العناصر الأساسية كما يسمح بإضافة أي من العناصر الإضافية",
                "description_en": "Design must include at least one of each basic element. Additional elements optional",
                "rule_type": "requirement"
            }
        ],
        "basic_elements": [
            {
                "id": "11.1",
                "element_ar": "صالة رئيسية",
                "element_en": "main_hall",
                "min_area_m2": 20,
                "min_width_m": 4,
                "ventilation": "natural",
                "required": true
            },
            {
                "id": "11.2",
                "element_ar": "غرفة نوم رئيسية واحدة",
                "element_en": "master_bedroom",
                "min_area_m2": 16,
                "min_width_m": 4,
                "ventilation": "natural",
                "required": true
            },
            {
                "id": "11.3",
                "element_ar": "غرفة نوم إضافية واحدة",
                "element_en": "additional_bedroom",
                "min_area_m2": 14,
                "min_width_m": 3.2,
                "ventilation": "natural",
                "required": true
            },
            {
                "id": "11.4",
                "element_ar": "حمام",
                "element_en": "bathroom",
                "min_area_m2": 3.5,
                "min_width_m": 1.6,
                "ventilation": "natural_or_mechanical",
                "required": true
            },
            {
                "id": "11.5",
                "element_ar": "دورة مياه",
                "element_en": "toilet",
                "min_area_m2": 2.5,
                "min_width_m": 1.2,
                "ventilation": "natural_or_mechanical",
                "required": true
            },
            {
                "id": "11.6",
                "element_ar": "مطبخ",
                "element_en": "kitchen",
                "min_area_m2": 12,
                "min_width_m": 3,
                "ventilation": "natural_and_mechanical",
                "required": true
            }
        ],
        "additional_elements": [
            {
                "id": "11.7",
                "element_ar": "فراغ معيشي/ غرفة نوم",
                "element_en": "living_space_bedroom",
                "min_area_m2": 9,
                "min_width_m": 3,
                "ventilation": "natural",
                "required": false
            },
            {
                "id": "11.8",
                "element_ar": "فراغ خدمي أقل من 4 متر مربع",
                "element_en": "service_space_under_4sqm",
                "min_area_m2": null,
                "min_width_m": null,
                "ventilation": "null_required",
                "required": false
            },
            {
                "id": "11.9",
                "element_ar": "فراغ خدمي من 4 حتى 9 متر مربع",
                "element_en": "service_space_4_to_9sqm",
                "min_area_m2": 4,
                "min_width_m": 2,
                "ventilation": "natural_or_mechanical",
                "required": false
            },
            {
                "id": "11.10",
                "element_ar": "فراغ خدمي أكثر من 9 متر مربع",
                "element_en": "service_space_over_9sqm",
                "min_area_m2": 9,
                "min_width_m": 3,
                "ventilation": "natural",
                "required": false
            },
            {
                "id": "11.11",
                "element_ar": "كراج",
                "element_en": "garage",
                "min_area_m2": 18,
                "min_width_m": 3.2,
                "ventilation": "natural_or_mechanical",
                "required": false
            },
            {
                "id": "11.12",
                "element_ar": "غرفة نوم عمالة منزلية",
                "element_en": "staff_bedroom",
                "min_area_m2": 9,
                "min_width_m": 3,
                "ventilation": "natural",
                "required": false
            },
            {
                "id": "11.13",
                "element_ar": "حمام عمالة منزلية",
                "element_en": "staff_bathroom",
                "min_area_m2": 3.0,
                "min_width_m": 1.5,
                "ventilation": "natural_or_mechanical",
                "required": false
            }
        ]
    },
    {
        "article_id": "12",
        "title_ar": "تهوية وإنارة المباني",
        "title_en": "Building Ventilation and Lighting",
        "keywords": {
            "living_spaces": ["main_hall", "master_bedroom", "additional_bedroom", "living_space_bedroom", "staff_bedroom"]
        },
        "rules": [
            {
                "rule_id": "12.1",
                "description_ar": "يلزم أن تتوفر لكل الفراغات المعيشية من مكونات السكن الخاص، فتحات تهوية وإنارة تطل على منطقة مفتوحة بشكل مباشر أو من خلال فناء داخلي أو خارجي. وتحسب مساحة هذه الفتحات، بحيث لا يقل المسطح الزجاجي للفتحة عن (8%) من مساحة أرضية الفراغ، بينما لا تقل المساحة التي تسمح بدخول الهواء عن (4%)",
                "description_en": "Living spaces require openings to open area. Glazed area min 8% of floor area, ventilation opening min 4%",
                "rule_type": "ventilation",
                "element": "living_spaces",
                "min_glazed_percent": 8,
                "min_ventilation_percent": 4
            },
            {
                "rule_id": "12.2",
                "description_ar": "يلزم توفير فتحة واحدة على الأقل مخصصة لأغراض الهروب والإنقاذ بكل فراغ معيشي بكافة طوابق الفيلا السكنية",
                "description_en": "Each living space on all floors must have at least one emergency escape opening",
                "rule_type": "safety",
                "element": "escape_opening",
                "required_per_living_space": 1
            },
            {
                "rule_id": "12.3",
                "description_ar": "الحد الأدنى لارتفاع المسطح المفتوح من الفتحة المخصصة لأغراض الهروب والإنقاذ هو 0.61 م والحد الأدنى للعرض هو 0.51 م",
                "description_en": "Emergency escape opening min clear height 0.61m, min width 0.51m",
                "rule_type": "safety",
                "element": "escape_opening",
                "min_clear_height_m": 0.61,
                "min_clear_width_m": 0.51
            }
        ]
    },
    {
        "article_id": "13",
        "title_ar": "السلالم والدرج",
        "title_en": "Stairs and Steps",
        "rules": [
            {
                "rule_id": "13.1",
                "description_ar": "يلزم عمل درج واحد يصل بين جميع الطوابق من داخل الفيلا فقط ولا يشترط فيه الاتصال الرأسي بين الطوابق، كما يسمح بدرج ثاني على ألا تقل المسافة بين الدرجين عن 15 متر",
                "description_en": "One stair required connecting all floors. Second stair permitted if min 15m apart",
                "rule_type": "circulation",
                "min_stairs": 1,
                "max_stairs": 2,
                "min_separation_if_two_m": 15
            },
            {
                "rule_id": "13.3",
                "description_ar": "لا يقل الطول الظاهري لدرجة السلم عن متر وعشرين سنتيمتر (1.2م) مقاسا بين السطح الخارجي لحاجزي الدرج (الدرابزين) على جانبي الدرج، أو حاجز الدرج والحائط المقابل. ولا يزيد العرض الكلي للدرج عن 1.5م عند أضيق نقطة فيه",
                "description_en": "Stair clear width min 1.2m between handrails or handrail and wall. Max total width 1.5m at narrowest",
                "rule_type": "dimension",
                "element": "stair",
                "min_clear_width_m": 1.2,
                "max_total_width_m": 1.5
            },
            {
                "rule_id": "13.4",
                "description_ar": "ألا يزيد ارتفاع الدرجة عن ثمانية عشر سنتيمتر (18سم) ولا يقل عن عشرة سنتيمتر (10سم)، ولا يقل صافي عمقها عن ثمانية وعشرين سنتيمترا (28سم) ولا يزيد بروز أنف درجة السلم عن 3.2 سنتيمتر عند أي نقطة",
                "description_en": "Step riser 10-18cm, tread min 28cm, nosing max 3.2cm",
                "rule_type": "dimension",
                "element": "step",
                "riser": {
                    "min_cm": 10,
                    "max_cm": 18
                },
                "tread_min_cm": 28,
                "nosing_max_cm": 3.2
            },
            {
                "rule_id": "13.5",
                "description_ar": "لا يزيد الارتفاع الرأسي لقلبة السلم الواحدة عن 3.65 متر، ولا يقل صافي إرتفاع الفراغ تحت أي قلبة عن (2.05 م)",
                "description_en": "Single stair flight max vertical rise 3.65m, min headroom under flight 2.05m",
                "rule_type": "dimension",
                "element": "stair_flight",
                "max_vertical_rise_m": 3.65,
                "min_headroom_m": 2.05
            },
            {
                "rule_id": "13.6",
                "description_ar": "لا يقل ارتفاع حاجز الدرج (الدرابزين) عن ستة وثمانين ونصف سنتيمتر (0.865م)، ولا يزيد عن ستة وتسعين ونصف سنتيمتر (0.965م)، مقاسا عموديا من مستوى تشطيب أنف الدرجة. ويزود كل درج بالدرابزين على أحد جوانبه على الأقل",
                "description_en": "Handrail height 86.5-96.5cm measured from step nosing. At least one handrail per stair",
                "rule_type": "safety",
                "element": "handrail",
                "min_height_cm": 86.5,
                "max_height_cm": 96.5,
                "min_handrails": 1
            }
        ]
    },
    {
        "article_id": "14",
        "title_ar": "الأسوار",
        "title_ar": "الأسوار",
        "title_en": "Fences",
        "keywords": {
            "fence": ["fence", "wall", "boundary", "سور", "جدار"],
            "screen": ["screen", "satr", "ساتر", "privacy"]
        },
        "rules": [
            {
                "rule_id": "14.1",
                "description_ar": "لا يزيد الارتداد بين السور وبين حدود الطريق عن سنتيمترين (0.02 م)",
                "description_en": "Setback between fence and road boundary max 2cm",
                "rule_type": "dimension",
                "element": "fence",
                "max_setback_cm": 2
            },
            {
                "rule_id": "14.2",
                "description_ar": "لا يزيد ارتفاع السور عن أربعة أمتار (4.00 م)",
                "description_en": "Fence height max 4m",
                "rule_type": "dimension",
                "element": "fence",
                "max_height_m": 4.0
            },
            {
                "rule_id": "14.3",
                "description_ar": "يجب ألا يقل ارتفاع السور عن مترين (2.00 م)",
                "description_en": "Fence height min 2m",
                "rule_type": "dimension",
                "element": "fence",
                "min_height_m": 2.0
            },
            {
                "rule_id": "14.4",
                "description_ar": "يجب أن يكون السور على الحدود المشتركة صماء (بدون فتحات) بارتفاع لا يقل عن مترين (2.00 م)",
                "description_en": "Shared boundary fence must be solid (no openings) min 2m height",
                "rule_type": "safety",
                "element": "fence",
                "min_solid_height_m": 2.0,
                "solid_required": true
            },
            {
                "rule_id": "14.5",
                "description_ar": "يجوز وضع ساتر شفاف فوق ارتفاع السور بما لا يزيد عن مترين (2.00 م) فوق السور",
                "description_en": "Transparent screen above fence max 2m extra height allowed",
                "rule_type": "dimension",
                "element": "fence_screen",
                "max_screen_height_m": 2.0
            }
        ]
    },
    {
        "article_id": "15",
        "title_ar": "المداخل",
        "title_en": "Entrances",
        "keywords": {
            "vehicle_entrance": ["vehicle entrance", "car entrance", "garage entrance", "مدخل السيارات", "مدخل الكراج"],
            "pedestrian_entrance": ["pedestrian entrance", "main entrance", "entrance", "مدخل", "مدخل الأفراد"]
        },
        "rules": [
            {
                "rule_id": "15.2a",
                "description_ar": "يسمح ببناء مدخلين للسيارات كحد أقصى للقسيمة الواحدة على ألا تقل المسافة بينهما عن ستة أمتار (6.00م). ويسمح أن يكون أحدهما مدخلا للكراج دون تحديد المسافة بينهما",
                "description_en": "Max 2 vehicle entrances per plot, min 6m apart. Garage entrance exempt from separation",
                "rule_type": "entrance",
                "element": "vehicle_entrance",
                "max_count": 2,
                "min_separation_m": 6.0
            },
            {
                "rule_id": "15.2b",
                "description_ar": "لا يزيد عرض مدخل السيارات ومدخل الكراج عن ستة أمتار (6.00م) ولا يقل عن ثلاثة أمتار (3.00م)",
                "description_en": "Vehicle/garage entrance width 3-6m",
                "rule_type": "dimension",
                "element": "vehicle_entrance",
                "min_width_m": 3.0,
                "max_width_m": 6.0
            },
            {
                "rule_id": "15.2c",
                "description_ar": "يجب ألا يقل صافي ارتفاع مظلة مدخل السيارات عن أربعة أمتار ونصف المتر (4.50م) ولا يزيد ارتفاع أعلى نقطة فيها عن ستة أمتار (6.00م) من منسوب محور الطريق المواجه لهذا المدخل. ولا يزيد عرض المظلة عن عرض المدخل بأكثر من مترين (2.00م) ودون التعدي على حدود الجار",
                "description_en": "Vehicle entrance canopy: min clear height 4.5m, max total height 6m, max overhang 2m beyond entrance width",
                "rule_type": "canopy",
                "element": "vehicle_entrance_canopy",
                "min_clear_height_m": 4.5,
                "max_total_height_m": 6.0,
                "max_overhang_beyond_entrance_m": 2.0
            },
            {
                "rule_id": "15.3a",
                "description_ar": "يسمح بعمل مدخلين للأفراد بحد أقصى لكل قسيمة بالإضافة إلى مدخل واحد فقط لملحق الضيافة وذلك في حالة وجود وحدة سكنية واحدة داخل القسيمة",
                "description_en": "Max 2 pedestrian entrances per plot plus 1 for hospitality annex for single villa plots",
                "rule_type": "entrance",
                "element": "pedestrian_entrance",
                "max_count": 2,
                "hospitality_annex_entrance": 1
            },
            {
                "rule_id": "15.3e",
                "description_ar": "لا يزيد عرض أي مدخل للأفراد عن مترين (2.00م) ولا يقل عن متر واحد (1.00م)",
                "description_en": "Pedestrian entrance width 1-2m",
                "rule_type": "dimension",
                "element": "pedestrian_entrance",
                "min_width_m": 1.0,
                "max_width_m": 2.0
            },
            {
                "rule_id": "15.4",
                "description_ar": "لا يسمح بفتح باب أي مدخل للقسيمة خارج حدودها",
                "description_en": "Entrance doors must not open outside plot boundary",
                "rule_type": "restriction",
                "element": "entrance_door",
                "swing_outside_plot": false
            }
        ]
    },
    {
        "article_id": "16",
        "title_ar": "مواقف السيارات",
        "title_en": "Car Parking",
        "keywords": {
            "parking": ["parking", "garage", "car", "vehicle", "موقف", "كراج", "سيارات"]
        },
        "rules": [
            {
                "rule_id": "16.2",
                "description_ar": "يلزم الفصل بين أماكن صف السيارات وبين الفراغات المفتوحة المخصصة للعب الأطفال أو المحتمل استخدامها من قبلهم، سواء من خلال الفصل بينهم بحواجز مبوبة، أو باستخدام عناصر التصميم الموقعي (Landscape) أو تخصيص فراغات مغلقة (كراجات) لصف السيارات",
                "description_en": "Parking must be separated from children's play areas by barriers, landscaping, or enclosed garages",
                "rule_type": "safety",
                "element": "parking",
                "child_safety_separation_required": true
            }
        ]
    },

    {
        "article_id": "17",
        "title_ar": "خط البناء والارتدادات والبروزات - العناصر الجمالية",
        "title_en": "Building Line, Setbacks and Projections - Aesthetic Elements",
        "rules": [
            {
                "article_id": "17",
                "description_en": "Aesthetic elements are allowed below 2.45 m from pavement finishing level, with maximum projection outside plot boundary of 0.305 m.",
                "severity": "fail",
                "auto_checkable": true,
                "inputs_required": [
                    "plot_boundary_polygon",
                    "aesthetic_elements_geometry",
                    "aesthetic_elements_height_m",
                    "pavement_finish_level_reference"
                ],
                "checks": [
                    {
                        "check_id": "17.1",
                        "type": "projection_limit_when_below_height",
                        "when": { "metric": "aesthetic_element_height_m", "operator": "<", "value": 2.45 },
                        "metric": "max_outside_plot_projection_m",
                        "operator": "<=",
                        "value": 0.305,
                        "compute": {
                            "method": "max_distance_of_element_outside_plot_boundary",
                            "boundary_ref": "plot_boundary_polygon",
                            "geometry_ref": "aesthetic_elements_geometry",
                            "tolerance_m": 0.005
                        }
                    },
                    {
                        "check_id": "17.2",
                        "type": "height_unknown_fallback",
                        "when": { "metric": "aesthetic_element_height_m", "operator": "is_null", "value": true },
                        "metric": "max_outside_plot_projection_m",
                        "operator": "<=",
                        "value": 0.305,
                        "severity": "warning",
                        "compute": {
                            "method": "max_distance_of_element_outside_plot_boundary",
                            "boundary_ref": "plot_boundary_polygon",
                            "geometry_ref": "aesthetic_elements_geometry",
                            "tolerance_m": 0.005
                        }
                    }
                ],
                "layer_hints": {
                    "aesthetic_include_keywords": ["FACADE", "DECOR", "PROJ", "CLADDING", "ARCH"],
                    "exclude_keywords": ["TEXT", "DIM", "GRID", "ANNO"]
                }
            }
        ]
    },


    {
        "article_id": "18",
        "title_ar": "اشتراطات تصميمية للمباني",
        "title_en": "Building Design Requirements",
        "rules": [
            {
                "rule_id": "18.2",
                "description_ar": "يمنع تقسيم الفيلا السكنية لشقق أو وحدات مستقلة",
                "description_en": "Villa subdivision into apartments or independent units prohibited",
                "rule_type": "restriction",
                "subdivision_prohibited": true
            },
            {
                "rule_id": "18.3",
                "description_ar": "يسمح بمطبخ واحد فقط في القسيمة السكنية ويسمح بعمل مطابخ إضافية متخصصة كمطبخ القلي أو مطبخ التبريد شريطة أن تكون ملاصقة لفراغ المطبخ الرئيسي ولا تزيد مساحتها عن 9 متر مربع",
                "description_en": "One main kitchen per plot. Specialized kitchens (frying/cold) permitted adjacent to main kitchen, max 9 sqm each",
                "rule_type": "kitchen",
                "main_kitchen_max": 1,
                "specialized_kitchen_max_area_m2": 9
            },
            {
                "rule_id": "18.5",
                "description_ar": "لا يسمح بأكثر من مطبخ تحضيري واحد في كل طابق ولا تزيد مساحته عن 6 متر مربع",
                "description_en": "Max one pantry kitchen per floor, max 6 sqm",
                "rule_type": "kitchen",
                "element": "pantry_kitchen",
                "max_per_floor": 1,
                "max_area_m2": 6
            },
            {
                "rule_id": "18.6",
                "description_ar": "عند وجود فرق في الارتفاع بين منسوب أرضية أي طابق وأي جزء آخر مرتفع عنها وزاد فرق الارتفاق بين المنسوبين عن 70 سم، يجب توفير حاجز مانع للسقوط ولا يقل ارتفاعه عن متر وعشرين سنتيمتر (1.20م) من أرضية الفراغ، وعلى ألا تسمح أي فتحة في الحاجز المذكور بمرور كرة قطرها 10سم",
                "description_en": "Fall barrier required where level difference exceeds 70cm, min height 1.2m, max opening 10cm diameter",
                "rule_type": "safety",
                "element": "fall_barrier",
                "level_difference_threshold_cm": 70,
                "min_barrier_height_m": 1.2,
                "max_opening_diameter_cm": 10
            },
            {
                "rule_id": "18.7",
                "description_ar": "سياج المسبح: يجب إحاطة منطقة حوض السباحة بحاجز أو سياج يمنع انتقال الأطفال إلى المنطقة دون مرافق",
                "description_en": "Pool fence required to prevent unaccompanied child access",
                "rule_type": "safety",
                "element": "pool_fence",
                "required": true,
                "specifications": {
                    "min_walkway_width_m": 1.0,
                    "min_area_between_fence_and_pool": "equal_to_pool_area",
                    "min_fence_height_m": 1.2,
                    "max_clearance_below_fence_cm": 10,
                    "max_vertical_gap_cm": 10,
                    "gate_self_closing": true,
                    "gate_opens_away_from_pool": true,
                    "lock_height_m": 1.5
                }
            },
            {
                "rule_id": "18.8",
                "description_ar": "يجب ألا يقل الحد الأدنى لعرض المدخل الرئيسي للفيلا السكنية عن متر وعشرين سنتيمتر (1.20م) ويجب أن يفتح مباشرة على فراغ معيشي",
                "description_en": "Villa main entrance min width 1.2m, must open to living space",
                "rule_type": "entrance",
                "element": "villa_main_entrance",
                "min_width_m": 1.2,
                "opens_to": "living_space"
            },
            {
                "rule_id": "18.9",
                "description_ar": "يجب ألا يقل الحد الأدنى لعرض الأبواب في مبنى الفيلا السكنية ومباني الملحقات عن 81.5 سم",
                "description_en": "Minimum door width 81.5cm for villa and annexes",
                "rule_type": "dimension",
                "element": "interior_doors",
                "min_width_cm": 81.5
            },
            {
                "rule_id": "18.10",
                "description_ar": "يجب ألا يقل الحد الأدنى لعرض الممرات الداخلية في مبنى الفيلا السكنية ومباني الملحقات عن 91.5 سم",
                "description_en": "Minimum internal corridor width 91.5cm",
                "rule_type": "dimension",
                "element": "internal_corridors",
                "min_width_cm": 91.5
            },
            {
                "rule_id": "18.12",
                "description_ar": "في حالة إضافة توسعة لوحدة سكنية يلزم أن يكون الرابط صالة مشتركة تجمع الفراغات القائمة مع الفراغات المضافة على ألا يقل أقل أضلاعها عن 4 متر وذلك في جميع الطوابق. ويستثنى من ذلك الإضافات التي لا تزيد عن خمسين مترا مربعا (50م2) في الطابق الواحد",
                "description_en": "Villa extensions require connecting hall min 4m dimension. Extensions under 50 sqm per floor exempt",
                "rule_type": "extension",
                "connecting_hall_min_dimension_m": 4,
                "exemption_max_area_m2": 50
            }
        ]
    },
    {
        "article_id": "19",
        "title_ar": "الأجنحة السكنية بالفيلا الرئيسية",
        "title_en": "Residential Suites in Main Villa",
        "keywords": {
            "suite": ["suite", "جناح", "wing", "residential_suite"]
        },
        "rules": [
            {
                "rule_id": "19.1",
                "description_ar": "يكون الوصول إلى مدخل الأجنحة من خلال المدخل الرئيسي للفيلا السكنية ولا يسمح بوجود مدخل منفصل لها من خارج الفيلا",
                "description_en": "Suite access only through main villa entrance, no separate external entrance",
                "rule_type": "access",
                "element": "residential_suite",
                "separate_entrance_prohibited": true
            },
            {
                "rule_id": "19.2",
                "description_ar": "يتكون الجناح السكني من ثلاث (3) غرف بحد أقصى وفراغ معيشي واحد وحمامات ويسمح بمطبخ تحضيري في حال لم يكن هناك مطبخ تحضيري آخر في نفس الطابق",
                "description_en": "Suite max: 3 rooms, 1 living space, bathrooms. Pantry kitchen only if no other on same floor",
                "rule_type": "composition",
                "element": "residential_suite",
                "max_rooms": 3,
                "max_living_spaces": 1,
                "pantry_kitchen": "one_per_floor"
            }
        ]
    },
    {
        "article_id": "20",
        "title_ar": "الشروط الخاصة ببناء الملاحق",
        "title_en": "Annex Building Requirements",
        "rules": [
            {
                "rule_id": "20.1",
                "description_ar": "في حال تلاصق الملاحق بعضها ببعض لا تزيد المساحة البنائية لكتلة الملاحق عن 70% من مساحة الطابق الأرضي للفيلا الرئيسية التي تلتحق بها هذه الملاحق ولا يسمح بالاتصال الداخلي بين فراغات الملاحق المختلفة",
                "description_en": "Connected annexes max 70% of main villa ground floor area. No internal connection between different annexes",
                "rule_type": "area",
                "element": "connected_annexes",
                "max_percent_of_villa_ground_floor": 70,
                "internal_connection_prohibited": true
            },
            {
                "rule_id": "20.2",
                "description_ar": "يسمح ببناء طابق أرضي واحد بحد ارتفاع أقصى ستة أمتار (6.00م) يقاس من منسوب محور الطريق ويسمح بزيادة هذا الارتفاع لملحق الضيافة المبني خارج فسحة الارتداد بمقدار 0.5 متر لكل 2 متر زيادة في طول الملحق عن 8.00 متر وبحد ارتفاع أقصى 8.00 متر",
                "description_en": "Annex max height 6m. Hospitality annex outside setback: +0.5m per 2m length above 8m, max 8m total",
                "rule_type": "height",
                "element": "annex",
                "max_height_m": 6.0,
                "hospitality_annex_bonus": {
                    "condition": "outside_setback",
                    "length_threshold_m": 8.0,
                    "height_bonus_m": 0.5,
                    "per_length_m": 2.0,
                    "max_total_height_m": 8.0
                }
            },
            {
                "rule_id": "20.3",
                "description_ar": "الحد الأدنى للارتفاع الداخلي للملاحق هو ثلاثة أمتار (3.00م) يقاس من منسوب تشطيب الأرضية وحتى مستوى السطح الأسفل لبلاطة السقف الخرسانية (بطنية السقف). ويسمح بحد أدنى لارتفاع الفراغات الخدمية لا يقل عن 2.7 متر",
                "description_en": "Annex min internal height 3m to ceiling soffit. Service spaces min 2.7m",
                "rule_type": "height",
                "element": "annex_internal",
                "min_height_m": 3.0,
                "service_spaces_min_height_m": 2.7
            },
            {
                "rule_id": "20.4",
                "description_ar": "يتكون ملحق الضيافة من مجلس واحد وصالة طعام وغرفة نوم وحمامات ومغاسل ومطبخ تحضيري. ويمكن إضافة مجلس آخر لا تزيد مساحته عن 30 متر مربع بشرط ألا تقل مساحة المجلس الرئيسي عن ستين مترا مربعا (60م2)",
                "description_en": "Hospitality annex: 1 majlis, dining, bedroom, bathrooms, pantry. Second majlis (max 30 sqm) only if main majlis min 60 sqm",
                "rule_type": "composition",
                "element": "hospitality_annex",
                "required_spaces": ["majlis", "dining", "bedroom", "bathrooms", "pantry"],
                "second_majlis": {
                    "condition": "main_majlis_min_60_sqm",
                    "max_area_m2": 30
                }
            },
            {
                "rule_id": "20.5",
                "description_ar": "لا تزيد مساحة المطبخ التحضيري عن (15%) من مساحة المجلس ولا يقل طول أصغر أضلاعه عن مترين (2.00م)",
                "description_en": "Hospitality annex pantry max 15% of majlis area, min dimension 2m",
                "rule_type": "area",
                "element": "hospitality_annex_pantry",
                "max_percent_of_majlis": 15,
                "min_dimension_m": 2.0
            },
            {
                "rule_id": "20.6",
                "description_ar": "لا تزيد مساحة الملحق عن (50%) من مساحة الحدود الخارجية القصوى للطابق الارضي للفيلا السكنية",
                "description_en": "Hospitality annex max 50% of villa ground floor footprint",
                "rule_type": "area",
                "element": "hospitality_annex",
                "max_percent_of_villa_ground_floor": 50
            },
            {
                "rule_id": "20.7",
                "description_ar": "يجوز السماح بزيادة مساحة الملحق حتى (70%) من مساحة الحدود الخارجية القصوى للطابق الارضي للفيلا السكنية، على ألا تقل مساحة المجلس الرئيسي في هذه الحالة عن 70 متر أو (70%) من مساحة ملحق الضيافة أيهما أكبر، ولا تزيد مساحة المطبخ التحضيري عن (10%) من مساحة المجلس",
                "description_en": "Hospitality annex can be 70% of villa ground floor if majlis is min 70 sqm or 70% of annex (whichever larger), pantry max 10% of majlis",
                "rule_type": "area",
                "element": "hospitality_annex_extended",
                "max_percent_of_villa_ground_floor": 70,
                "majlis_requirement": {
                    "min_area_m2": 70,
                    "or_min_percent_of_annex": 70,
                    "condition": "whichever_larger"
                },
                "pantry_max_percent_of_majlis": 10
            },
            {
                "rule_id": "20.8",
                "description_ar": "لا تزيد مساحة بناء ملحق الخدمات عن (50%) من مساحة بناء الحدود الخارجية القصوى للطابق الارضي للفيلا السكنية الرئيسية",
                "description_en": "Service annex max 50% of main villa ground floor footprint",
                "rule_type": "area",
                "element": "service_annex",
                "max_percent_of_villa_ground_floor": 50
            },
            {
                "rule_id": "20.9",
                "description_ar": "لا تزيد مساحة مبنى الملحق الرياضي عن (20%) من مساحة بناء الحدود الخارجية القصوى للطابق الارضي للفيلا السكنية ويتكون من صالة ألعاب رياضية ودورة مياه وغرفة تغيير ملابس، على ألا تقل مساحة صالة الألعاب عن 70% من مساحة الملحق الرياضي",
                "description_en": "Sports annex max 20% of villa ground floor. Gym area min 70% of sports annex",
                "rule_type": "area",
                "element": "sports_annex",
                "max_percent_of_villa_ground_floor": 20,
                "gym_min_percent_of_annex": 70
            }
        ]
    },
    {
        "article_id": "21",
        "title_ar": "القسائم ذات المساحات الصغيرة وذات المساحات الكبيرة والقصور",
        "title_en": "Small Plots, Large Plots and Palaces",
        "rules": [
            {
                "rule_id": "21.1",
                "description_ar": "في حالة القسائم السكنية ذات المساحات الصغيرة وذات المساحات الكبيرة وتلك التي تخصص لاستخدام القصور يتم تطبيق الاشتراطات التخطيطية الصادرة عن الدائرة",
                "description_en": "Small plots (<350 sqm), large plots (>10,000 sqm) and palaces follow special planning requirements",
                "rule_type": "special_category",
                "small_plot_threshold_m2": 350,
                "large_plot_threshold_m2": 10000
            }
        ]
    }
]

// Combine with ROAD_ARTICLES
const ALL_ARTICLES = [...ARTICLES, ...ROAD_ARTICLES];


function get_article(article_id) {
    /**Get article configuration by ID.*/
    return ALL_ARTICLES.find(article => article.article_id === String(article_id)) || null;
}


function get_all_articles() {
    /**Get all articles.*/
    return ALL_ARTICLES;
}

module.exports = {
    ARTICLES: ALL_ARTICLES,
    get_article,
    get_all_articles
};
