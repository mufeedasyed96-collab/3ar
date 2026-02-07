/**
 * Configuration module for Road geometry validation rules
 * Source: Road Geometric Design Manual (TR-514 / Second Edition - January 2022)
 *         Standard Drawing Guideline Part 1 (TR-541-1 / Third Edition - June 2024)
 * Department: Department of Municipalities and Transport (DMT), Abu Dhabi, UAE
 */

const ROAD_ARTICLES = [
    // ============================================================================
    // SECTION 1: ROAD TYPE CLASSIFICATION
    // ============================================================================
    {
        article_id: "R1",
        title_ar: "تصنيف أنواع الطرق",
        title_en: "Road Type Classification",
        rules: [
            {
                rule_id: "R1.1",
                description_ar: "الطريق السريع الريفي: سرعة التصميم",
                description_en: "Rural Freeway: Design speed range",
                rule_type: "speed_range",
                element: "design_speed_rural_freeway",
                min_speed_kmh: 100,
                max_speed_kmh: 140,
                dwg_checkable: false,
                requires: ["project_metadata"]
            },
            {
                rule_id: "R1.2",
                description_ar: "الطريق السريع الحضري: سرعة التصميم",
                description_en: "Urban Freeway: Design speed range",
                rule_type: "speed_range",
                element: "design_speed_urban_freeway",
                min_speed_kmh: 80,
                max_speed_kmh: 120,
                dwg_checkable: false,
                requires: ["project_metadata"]
            },
            {
                rule_id: "R1.3",
                description_ar: "البوليفارد: سرعة التصميم",
                description_en: "Boulevard: Design speed range",
                rule_type: "speed_range",
                element: "design_speed_boulevard",
                min_speed_kmh: 60,
                max_speed_kmh: 80,
                dwg_checkable: false,
                requires: ["project_metadata"]
            },
            {
                rule_id: "R1.4",
                description_ar: "الأفنيو: سرعة التصميم",
                description_en: "Avenue: Design speed range",
                rule_type: "speed_range",
                element: "design_speed_avenue",
                min_speed_kmh: 50,
                max_speed_kmh: 70,
                dwg_checkable: false,
                requires: ["project_metadata"]
            },
            {
                rule_id: "R1.5",
                description_ar: "الشارع: سرعة التصميم",
                description_en: "Street: Design speed range",
                rule_type: "speed_range",
                element: "design_speed_street",
                min_speed_kmh: 40,
                max_speed_kmh: 60,
                dwg_checkable: false,
                requires: ["project_metadata"]
            }
        ],
        evidence: ["TR-514 Chapter 2 - Road Classification"]
    },

    // ============================================================================
    // SECTION 2: LANE WIDTH
    // ============================================================================
    {
        article_id: "R2",
        title_ar: "عرض الحارات",
        title_en: "Lane Width Requirements",
        rules: [
            {
                rule_id: "R2.1",
                description_ar: "الحد الأدنى لعرض حارة المرور للطرق السريعة",
                description_en: "Minimum travel lane width for freeways",
                rule_type: "dimension_min",
                element: "lane_width_freeway",
                min_width_m: 3.65,
                desirable_width_m: 3.65,
                max_width_m: 3.75,
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "R2.2",
                description_ar: "عرض حارة الطريق في طرق الشاحنات الريفية",
                description_en: "Rural truck route lane width",
                rule_type: "dimension_range",
                element: "lane_width_truck_route",
                min_width_m: 3.65,
                desirable_width_m: 3.75,
                max_width_m: 4.0,
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "R2.3",
                description_ar: "عرض الحارة القياسي للبوليفارد والأفنيو",
                description_en: "Standard lane width for Boulevard/Avenue",
                rule_type: "dimension",
                element: "lane_width_boulevard_avenue",
                standard_width_m: 3.3,
                edge_lane_width_m: 3.5,
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "R2.4",
                description_ar: "عرض الحارة القياسي للشوارع وممرات الوصول",
                description_en: "Standard lane width for Streets/Access/Frontage",
                rule_type: "dimension",
                element: "lane_width_street_access",
                standard_width_m: 3.0,
                max_width_m: 3.3,
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "R2.5",
                description_ar: "عرض حارة الالتفاف لليسار",
                description_en: "Left turn lane width",
                rule_type: "dimension_range",
                element: "lane_width_left_turn",
                min_width_m: 3.0,
                desirable_width_m: 3.3,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R2.6",
                description_ar: "عرض حارة المواقف",
                description_en: "Parking lane width",
                rule_type: "dimension",
                element: "lane_width_parking",
                standard_width_m: 2.5,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R2.7",
                description_ar: "عرض الرامب (حارة واحدة)",
                description_en: "Single lane ramp width",
                rule_type: "dimension_range",
                element: "ramp_lane_width",
                min_width_m: 5.0,
                max_width_m: 5.5,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R2.8",
                description_ar: "عرض ممر الدراجات الهوائية (اتجاه واحد)",
                description_en: "Cycle lane width (one-way)",
                rule_type: "dimension_range",
                element: "cycle_lane_width",
                min_width_m: 1.2,
                desirable_width_m: 1.5,
                max_width_m: 2.5,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R2.9",
                description_ar: "عرض مسار الدراجات الهوائية (اتجاهين)",
                description_en: "Cycle track width (two-way)",
                rule_type: "dimension_range",
                element: "cycle_track_width_two_way",
                min_width_m: 2.0,
                desirable_width_m: 2.5,
                max_width_m: 3.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Chapter 3 - Cross Section Elements", "TR-541 GM-1 to GM-10"]
    },

    // ============================================================================
    // SECTION 3: SHOULDER WIDTH
    // ============================================================================
    {
        article_id: "R3",
        title_ar: "عرض الكتف",
        title_en: "Shoulder Width Requirements",
        rules: [
            {
                rule_id: "R3.1",
                description_ar: "عرض الكتف الأيمن للطرق السريعة",
                description_en: "Right shoulder width for freeways",
                rule_type: "dimension_min",
                element: "shoulder_width_right_freeway",
                min_width_m: 3.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R3.2",
                description_ar: "عرض الكتف الأيسر للطرق السريعة",
                description_en: "Left shoulder width for freeways",
                rule_type: "dimension_min",
                element: "shoulder_width_left_freeway",
                min_width_m: 2.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R3.3",
                description_ar: "عرض كتف الطريق لطرق الشاحنات الريفية",
                description_en: "Shoulder width for rural truck routes",
                rule_type: "dimension",
                element: "shoulder_width_truck_route",
                right_width_m: 3.6,
                left_width_m: 3.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R3.4",
                description_ar: "عرض كتف الرامب الأيمن",
                description_en: "Ramp right shoulder width",
                rule_type: "dimension_min",
                element: "shoulder_width_ramp_right",
                min_width_m: 3.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R3.5",
                description_ar: "عرض كتف الرامب الأيسر",
                description_en: "Ramp left shoulder width",
                rule_type: "dimension_min",
                element: "shoulder_width_ramp_left",
                min_width_m: 1.2,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R3.6",
                description_ar: "منطقة الحافة المرصوفة للبوليفارد",
                description_en: "Paved edge zone for Boulevard",
                rule_type: "dimension_min",
                element: "edge_zone_paved_boulevard",
                min_width_m: 0.5,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R3.7",
                description_ar: "منطقة التشجير للبوليفارد",
                description_en: "Landscape zone for Boulevard",
                rule_type: "dimension_min",
                element: "landscape_zone_boulevard",
                min_width_m: 1.5,
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 3.3 - Shoulders"]
    },

    // ============================================================================
    // SECTION 4: MEDIAN WIDTH
    // ============================================================================
    {
        article_id: "R4",
        title_ar: "عرض الجزيرة الوسطية",
        title_en: "Median Width Requirements",
        rules: [
            {
                rule_id: "R4.1",
                description_ar: "عرض الجزيرة المنخفضة (بدون حاجز)",
                description_en: "Depressed median width (no barrier)",
                rule_type: "dimension_range",
                element: "median_width_depressed",
                min_width_m: 10.0,
                recommended_width_m: 18.0,
                desirable_width_m: 20.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R4.2",
                description_ar: "عرض الجزيرة مع حاجز خرساني",
                description_en: "Flush median with concrete barrier",
                rule_type: "dimension_range",
                element: "median_width_barrier",
                min_width_m: 7.8,
                recommended_width_m: 8.0,
                desirable_width_m: 10.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R4.3",
                description_ar: "عرض الجزيرة المرتفعة للشوارع الحضرية",
                description_en: "Curbed median width for urban streets",
                rule_type: "dimension_range",
                element: "median_width_urban_curbed",
                min_width_m: 2.0,
                standard_width_m: 4.0,
                max_width_m: 6.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R4.4",
                description_ar: "عرض الجزيرة الجانبية",
                description_en: "Side median width",
                rule_type: "dimension_range",
                element: "median_width_side",
                min_width_m: 0.5,
                standard_width_m: 2.0,
                max_width_m: 4.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R4.5",
                description_ar: "الحد الأدنى لملجأ المشاة في الجزيرة",
                description_en: "Minimum pedestrian refuge width in median",
                rule_type: "dimension_min",
                element: "pedestrian_refuge_width",
                min_width_m: 2.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R4.6",
                description_ar: "عرض الجزيرة للفصل الفعلي والنفسي",
                description_en: "Median width for physical/psychological separation",
                rule_type: "dimension_min",
                element: "median_width_separation",
                min_width_m: 12.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R4.7",
                description_ar: "عرض الجزيرة للتشجير",
                description_en: "Median width for landscaping",
                rule_type: "dimension_min",
                element: "median_width_landscape",
                min_width_m: 18.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 3.4 - Medians"]
    },

    // ============================================================================
    // SECTION 5: CURVE RADIUS
    // ============================================================================
    {
        article_id: "R5",
        title_ar: "نصف قطر المنحنى",
        title_en: "Curve Radius Requirements",
        rules: [
            {
                rule_id: "R5.1",
                description_ar: "الحد الأدنى لنصف قطر المنحنى الأفقي حسب سرعة التصميم",
                description_en: "Minimum horizontal curve radius by design speed",
                rule_type: "curve_radius_by_speed",
                element: "horizontal_curve_radius",
                radius_by_speed: {
                    30: { emax_4: 30, emax_6: 25, emax_8: 22 },
                    40: { emax_4: 55, emax_6: 45, emax_8: 40 },
                    50: { emax_4: 90, emax_6: 75, emax_8: 65 },
                    60: { emax_4: 135, emax_6: 110, emax_8: 95 },
                    70: { emax_4: 190, emax_6: 155, emax_8: 135 },
                    80: { emax_4: 250, emax_6: 210, emax_8: 180 },
                    90: { emax_4: 340, emax_6: 275, emax_8: 240 },
                    100: { emax_4: 435, emax_6: 355, emax_8: 305 },
                    110: { emax_4: 540, emax_6: 440, emax_8: 380 },
                    120: { emax_4: 665, emax_6: 540, emax_8: 465 },
                    130: { emax_4: 805, emax_6: 655, emax_8: 560 },
                    140: { emax_4: 950, emax_6: 775, emax_8: 665 }
                },
                dwg_checkable: true,
                requires: ["plan_geometry", "design_speed"]
            },
            {
                rule_id: "R5.2",
                description_ar: "نصف قطر الالتفاف لليمين حسب مركبة التصميم WB-12",
                description_en: "Right turn radius for WB-12 design vehicle",
                rule_type: "compound_curve",
                element: "right_turn_radius_wb12",
                design_vehicle: "WB-12",
                r1_m: 36,
                r2_m: 12,
                r3_m: 36,
                offset_m: 2.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R5.3",
                description_ar: "نصف قطر الالتفاف لليمين حسب مركبة التصميم WB-15",
                description_en: "Right turn radius for WB-15 design vehicle",
                rule_type: "compound_curve",
                element: "right_turn_radius_wb15",
                design_vehicle: "WB-15",
                r1_m: 55,
                r2_m: 18,
                r3_m: 55,
                offset_m: 2.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R5.4",
                description_ar: "نصف قطر الالتفاف لليمين حسب مركبة التصميم WB-19/WB-20",
                description_en: "Right turn radius for WB-19/WB-20 design vehicle",
                rule_type: "compound_curve",
                element: "right_turn_radius_wb19",
                design_vehicle: "WB-19/WB-20",
                r1_m: 180,
                r2_m: 18,
                r3_m: 180,
                offset_m: 3.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R5.5",
                description_ar: "نصف قطر منحنى الدخول للدوار",
                description_en: "Roundabout entry curve radius",
                rule_type: "dimension_range",
                element: "roundabout_entry_radius",
                min_radius_m: 15,
                max_radius_m: 25,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R5.6",
                description_ar: "نصف قطر منحنى الخروج للدوار",
                description_en: "Roundabout exit curve radius",
                rule_type: "dimension_range",
                element: "roundabout_exit_radius",
                min_radius_m: 20,
                max_radius_m: 40,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Chapter 5 - Horizontal Alignment", "TR-541 GM-16"]
    },

    // ============================================================================
    // SECTION 6: GRADIENT (LONGITUDINAL SLOPE)
    // ============================================================================
    {
        article_id: "R6",
        title_ar: "الميل الطولي",
        title_en: "Gradient (Longitudinal Slope) Requirements",
        rules: [
            {
                rule_id: "R6.1",
                description_ar: "الحد الأقصى للميل الطولي للطرق السريعة (أرض مستوية)",
                description_en: "Maximum grade for freeways (flat terrain)",
                rule_type: "slope_max",
                element: "grade_freeway_flat",
                max_grade_percent: 3.0,
                absolute_max_percent: 4.0,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R6.2",
                description_ar: "الحد الأقصى للميل الطولي للطرق السريعة (أرض متموجة)",
                description_en: "Maximum grade for freeways (rolling terrain)",
                rule_type: "slope_max",
                element: "grade_freeway_rolling",
                max_grade_percent: 4.0,
                absolute_max_percent: 5.0,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R6.3",
                description_ar: "الحد الأقصى للميل الطولي للشوارع الحضرية",
                description_en: "Maximum grade for urban streets",
                rule_type: "slope_max",
                element: "grade_urban_street",
                max_grade_percent: 6.0,
                absolute_max_percent: 8.0,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R6.4",
                description_ar: "الحد الأدنى للميل الطولي (للتصريف)",
                description_en: "Minimum grade for drainage",
                rule_type: "slope_min",
                element: "grade_minimum_drainage",
                min_grade_percent: 0.3,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R6.5",
                description_ar: "الحد الأدنى للميل في الطرق ذات الحواف",
                description_en: "Minimum grade for curbed roadways",
                rule_type: "slope_min",
                element: "grade_minimum_curbed",
                min_grade_percent: 0.5,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R6.6",
                description_ar: "الحد الأقصى لميل الرامب (صعود)",
                description_en: "Maximum ramp upgrade",
                rule_type: "slope_max",
                element: "grade_ramp_upgrade",
                max_grade_percent: 5.0,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R6.7",
                description_ar: "الحد الأقصى لميل الرامب (نزول)",
                description_en: "Maximum ramp downgrade",
                rule_type: "slope_max",
                element: "grade_ramp_downgrade",
                max_grade_percent: 6.0,
                dwg_checkable: true,
                requires: ["profile_geometry"]
            }
        ],
        evidence: ["TR-514 Chapter 6 - Vertical Alignment"]
    },

    // ============================================================================
    // SECTION 7: SIGHT DISTANCE
    // ============================================================================
    {
        article_id: "R7",
        title_ar: "مسافة الرؤية",
        title_en: "Sight Distance Requirements",
        rules: [
            {
                rule_id: "R7.1",
                description_ar: "مسافة التوقف حسب سرعة التصميم",
                description_en: "Stopping sight distance by design speed",
                rule_type: "sight_distance_by_speed",
                element: "stopping_sight_distance",
                ssd_by_speed: {
                    30: { level: 35, grade_minus3: 40 },
                    40: { level: 50, grade_minus3: 55 },
                    50: { level: 65, grade_minus3: 75 },
                    60: { level: 85, grade_minus3: 95 },
                    70: { level: 105, grade_minus3: 120 },
                    80: { level: 130, grade_minus3: 150 },
                    90: { level: 160, grade_minus3: 185 },
                    100: { level: 185, grade_minus3: 215 },
                    110: { level: 220, grade_minus3: 255 },
                    120: { level: 250, grade_minus3: 290 },
                    130: { level: 285, grade_minus3: 330 },
                    140: { level: 320, grade_minus3: 375 }
                },
                dwg_checkable: "partial",
                requires: ["plan_geometry", "profile_geometry", "design_speed"]
            },
            {
                rule_id: "R7.2",
                description_ar: "مسافة اتخاذ القرار حسب سرعة التصميم",
                description_en: "Decision sight distance by design speed",
                rule_type: "sight_distance_by_speed",
                element: "decision_sight_distance",
                dsd_by_speed: {
                    50: { manoeuvre_a: 95, manoeuvre_b: 155 },
                    60: { manoeuvre_a: 120, manoeuvre_b: 195 },
                    70: { manoeuvre_a: 150, manoeuvre_b: 235 },
                    80: { manoeuvre_a: 180, manoeuvre_b: 280 },
                    90: { manoeuvre_a: 215, manoeuvre_b: 325 },
                    100: { manoeuvre_a: 250, manoeuvre_b: 370 },
                    110: { manoeuvre_a: 285, manoeuvre_b: 420 },
                    120: { manoeuvre_a: 325, manoeuvre_b: 470 }
                },
                dwg_checkable: "partial",
                requires: ["plan_geometry", "profile_geometry", "design_speed"]
            },
            {
                rule_id: "R7.3",
                description_ar: "مسافة التجاوز (للطرق ذات الحارتين)",
                description_en: "Passing sight distance (two-lane roads)",
                rule_type: "sight_distance_by_speed",
                element: "passing_sight_distance",
                psd_by_speed: {
                    50: 345,
                    60: 410,
                    70: 485,
                    80: 540,
                    90: 615,
                    100: 670,
                    110: 730,
                    120: 795
                },
                dwg_checkable: "partial",
                requires: ["plan_geometry", "profile_geometry", "design_speed"]
            }
        ],
        evidence: ["TR-514 Chapter 4 - Sight Distance"]
    },

    // ============================================================================
    // SECTION 8: CROSS SLOPE (DRAINAGE)
    // ============================================================================
    {
        article_id: "R8",
        title_ar: "الميل العرضي (التصريف)",
        title_en: "Cross Slope (Drainage) Requirements",
        rules: [
            {
                rule_id: "R8.1",
                description_ar: "ميل عرضي لحارة المرور",
                description_en: "Travel lane cross slope",
                rule_type: "slope_range",
                element: "cross_slope_travel_lane",
                min_slope_percent: 1.5,
                desirable_slope_percent: 2.0,
                max_slope_percent: 2.5,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R8.2",
                description_ar: "ميل عرضي للكتف المرصوف",
                description_en: "Paved shoulder cross slope",
                rule_type: "slope_range",
                element: "cross_slope_paved_shoulder",
                min_slope_percent: 2.0,
                max_slope_percent: 5.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R8.3",
                description_ar: "ميل عرضي للرصيف",
                description_en: "Sidewalk cross slope",
                rule_type: "slope_range",
                element: "cross_slope_sidewalk",
                desirable_slope_percent: 1.5,
                max_slope_percent: 2.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R8.4",
                description_ar: "أقصى ميل جانبي (Superelevation) للطرق السريعة الريفية",
                description_en: "Maximum superelevation for rural freeways",
                rule_type: "slope_max",
                element: "superelevation_rural_freeway",
                max_slope_percent: 8.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R8.5",
                description_ar: "أقصى ميل جانبي للطرق السريعة الحضرية",
                description_en: "Maximum superelevation for urban freeways",
                rule_type: "slope_max",
                element: "superelevation_urban_freeway",
                max_slope_percent: 6.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R8.6",
                description_ar: "أقصى ميل جانبي للطرق في مناطق الرمال",
                description_en: "Maximum superelevation for sand area roads",
                rule_type: "slope_max",
                element: "superelevation_sand_area",
                max_slope_percent: 5.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 3.2 - Cross Slopes and Superelevation"]
    },

    // ============================================================================
    // SECTION 9: PEDESTRIAN FACILITIES
    // ============================================================================
    {
        article_id: "R9",
        title_ar: "مرافق المشاة",
        title_en: "Pedestrian Facilities Requirements",
        rules: [
            {
                rule_id: "R9.1",
                description_ar: "الحد الأدنى لعرض الرصيف (خالي من العوائق)",
                description_en: "Minimum sidewalk clear width",
                rule_type: "dimension_min",
                element: "sidewalk_clear_width",
                min_width_m: 2.0,
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "R9.2",
                description_ar: "عرض الرصيف للبوليفارد",
                description_en: "Sidewalk width for Boulevard",
                rule_type: "dimension_range",
                element: "sidewalk_width_boulevard",
                min_width_m: 2.5,
                desirable_width_m: 3.0,
                max_width_m: 4.0,
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "R9.3",
                description_ar: "أقصى ميل طولي لمنحدرات المشاة",
                description_en: "Maximum pedestrian ramp gradient",
                rule_type: "slope_max",
                element: "pedestrian_ramp_gradient",
                max_slope_percent: 8.3,
                ratio: "1:12",
                dwg_checkable: true,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "R9.4",
                description_ar: "أقصى ميل عرضي لمنحدرات المشاة",
                description_en: "Maximum pedestrian ramp cross slope",
                rule_type: "slope_max",
                element: "pedestrian_ramp_cross_slope",
                max_slope_percent: 2.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R9.5",
                description_ar: "الحد الأقصى للمسافة بين معابر المشاة",
                description_en: "Maximum pedestrian crossing spacing",
                rule_type: "spacing_max",
                element: "pedestrian_crossing_spacing",
                max_spacing_m: 150,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R9.6",
                description_ar: "مسافة خط وقوف المركبات من ممر المشاة",
                description_en: "Vehicle stop bar distance from crosswalk",
                rule_type: "spacing",
                element: "stop_bar_crosswalk_distance",
                distance_m: 3.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R9.7",
                description_ar: "ارتفاع الرصيف للبوليفارد والأفنيو",
                description_en: "Kerb height for Boulevard/Avenue",
                rule_type: "dimension",
                element: "kerb_height_boulevard_avenue",
                height_mm: 150,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R9.8",
                description_ar: "ارتفاع الرصيف للشوارع وممرات الوصول",
                description_en: "Kerb height for Streets/Access",
                rule_type: "dimension",
                element: "kerb_height_street_access",
                height_mm: 100,
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 3.6 - Pedestrian and Cyclist Facilities"]
    },

    // ============================================================================
    // SECTION 10: INTERSECTION DESIGN
    // ============================================================================
    {
        article_id: "R10",
        title_ar: "تصميم التقاطعات",
        title_en: "Intersection Design Requirements",
        rules: [
            {
                rule_id: "R10.1",
                description_ar: "نصف قطر الزاوية للسيارة (90 درجة)",
                description_en: "Corner radius for passenger car (90°)",
                rule_type: "dimension_min",
                element: "corner_radius_car_90",
                min_radius_m: 6.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R10.2",
                description_ar: "نصف قطر الزاوية للشاحنة الوحيدة (90 درجة)",
                description_en: "Corner radius for single unit truck (90°)",
                rule_type: "dimension_min",
                element: "corner_radius_su_90",
                min_radius_m: 12.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R10.3",
                description_ar: "نصف قطر الزاوية لـ WB-15 (90 درجة)",
                description_en: "Corner radius for WB-15 (90°)",
                rule_type: "dimension_min",
                element: "corner_radius_wb15_90",
                min_radius_m: 18.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R10.4",
                description_ar: "مسافة الرؤية عند التقاطع (يمين ويسار)",
                description_en: "Intersection sight distance (left and right)",
                rule_type: "sight_distance_by_speed",
                element: "intersection_sight_distance",
                isd_by_speed: {
                    50: { left: 85, right: 85 },
                    60: { left: 105, right: 105 },
                    70: { left: 130, right: 130 },
                    80: { left: 160, right: 160 },
                    90: { left: 195, right: 195 }
                },
                dwg_checkable: "partial",
                requires: ["plan_geometry", "design_speed"]
            },
            {
                rule_id: "R10.5",
                description_ar: "مسافة تقاطع طريق الخدمة من محطات الرامب (تحكم توقف)",
                description_en: "Service road intersection from ramp terminals (stop control)",
                rule_type: "spacing_range",
                element: "service_road_intersection_stop",
                min_spacing_m: 120,
                max_spacing_m: 150,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R10.6",
                description_ar: "مسافة تقاطع طريق الخدمة من محطات الرامب (إشارة ضوئية)",
                description_en: "Service road intersection from ramp terminals (signal control)",
                rule_type: "spacing_range",
                element: "service_road_intersection_signal",
                min_spacing_m: 210,
                max_spacing_m: 300,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Chapter 7 - Intersection Design", "TR-541 GM-16"]
    },

    // ============================================================================
    // SECTION 11: RIGHT-OF-WAY
    // ============================================================================
    {
        article_id: "R11",
        title_ar: "حرم الطريق",
        title_en: "Right-of-Way Requirements",
        rules: [
            {
                rule_id: "R11.1",
                description_ar: "عرض حرم الطريق لطرق الشاحنات الريفية",
                description_en: "Right-of-way width for rural truck routes",
                rule_type: "dimension",
                element: "row_width_truck_route",
                min_width_m: 36.0,
                typical_width_m: 40.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R11.2",
                description_ar: "عرض حرم الطريق للبوليفارد",
                description_en: "Right-of-way width for Boulevard",
                rule_type: "dimension",
                element: "row_width_boulevard",
                min_width_m: 40.0,
                typical_width_m: 50.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R11.3",
                description_ar: "عرض حرم الطريق للأفنيو",
                description_en: "Right-of-way width for Avenue",
                rule_type: "dimension",
                element: "row_width_avenue",
                min_width_m: 30.0,
                typical_width_m: 40.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R11.4",
                description_ar: "عرض حرم الطريق للشارع",
                description_en: "Right-of-way width for Street",
                rule_type: "dimension",
                element: "row_width_street",
                min_width_m: 20.0,
                typical_width_m: 25.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R11.5",
                description_ar: "عرض حرم الطريق لممر الوصول",
                description_en: "Right-of-way width for Access Lane",
                rule_type: "dimension",
                element: "row_width_access_lane",
                min_width_m: 15.0,
                typical_width_m: 20.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Section 3.8 - Right-of-Way"]
    },

    // ============================================================================
    // SECTION 12: SIDE SLOPES
    // ============================================================================
    {
        article_id: "R12",
        title_ar: "المنحدرات الجانبية",
        title_en: "Side Slope Requirements",
        rules: [
            {
                rule_id: "R12.1",
                description_ar: "المنحدرات الأمامية في القطعات والردم",
                description_en: "Front slopes in cut sections and fills",
                rule_type: "slope_max",
                element: "front_slope_cut_fill",
                max_slope: "1V:6H",
                max_slope_ratio: 0.167,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R12.2",
                description_ar: "منحدرات القطع في مناطق الرمال المتحركة",
                description_en: "Cut slopes in blowing sand areas",
                rule_type: "slope_max",
                element: "cut_slope_sand_area",
                max_slope: "1V:10H",
                max_slope_ratio: 0.1,
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "R12.3",
                description_ar: "منحدرات الردم في مناطق الرمال (أقصى ارتفاع 4م)",
                description_en: "Fill slopes in sand areas (max 4m height)",
                rule_type: "slope_max",
                element: "fill_slope_sand_area",
                max_slope: "1V:6H",
                max_slope_ratio: 0.167,
                max_height_m: 4.0,
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 3.7 - Blowing Sand Precautions"]
    },

    // ============================================================================
    // SECTION 13: RAMP DESIGN (TR-541)
    // ============================================================================
    {
        article_id: "R13",
        title_ar: "تصميم الرامب",
        title_en: "Ramp Design Requirements",
        rules: [
            {
                rule_id: "R13.1",
                description_ar: "طول حارة التباطؤ حسب سرعة الطريق الرئيسي",
                description_en: "Deceleration lane length by highway speed",
                rule_type: "dimension_by_speed",
                element: "deceleration_lane_length",
                length_by_speed: {
                    80: { stop: 130, exit_30: 100, exit_50: 55 },
                    100: { stop: 170, exit_30: 145, exit_50: 100, exit_70: 85 },
                    120: { stop: 200, exit_30: 175, exit_50: 140, exit_70: 120 },
                    140: { stop: 240, exit_30: 205, exit_50: 175, exit_70: 150 }
                },
                dwg_checkable: true,
                requires: ["plan_geometry", "design_speed"]
            },
            {
                rule_id: "R13.2",
                description_ar: "طول حارة التسارع حسب سرعة الطريق الرئيسي",
                description_en: "Acceleration lane length by highway speed",
                rule_type: "dimension_by_speed",
                element: "acceleration_lane_length",
                length_by_speed: {
                    80: { from_stop: 260, from_30: 210, from_50: 140 },
                    100: { from_stop: 415, from_30: 355, from_50: 275 },
                    120: { from_stop: 595, from_30: 535, from_50: 445 }
                },
                dwg_checkable: true,
                requires: ["plan_geometry", "design_speed"]
            },
            {
                rule_id: "R13.3",
                description_ar: "زاوية الانحراف للرامب",
                description_en: "Exit ramp divergence angle",
                rule_type: "angle_range",
                element: "ramp_divergence_angle",
                min_angle_deg: 2.0,
                max_angle_deg: 5.0,
                typical_angle_deg: 4.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R13.4",
                description_ar: "إزاحة الأنف الفيزيائي",
                description_en: "Physical nose offset",
                rule_type: "dimension",
                element: "gore_nose_offset",
                offset_m: 1.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R13.5",
                description_ar: "الحد الأدنى لطول حارة التباطؤ",
                description_en: "Minimum deceleration lane length",
                rule_type: "dimension_min",
                element: "deceleration_lane_min_length",
                min_length_m: 140,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-541 GM-4, GM-5"]
    },

    // ============================================================================
    // SECTION 14: ROUNDABOUT DESIGN (TR-541)
    // ============================================================================
    {
        article_id: "R14",
        title_ar: "تصميم الدوار",
        title_en: "Roundabout Design Requirements",
        rules: [
            {
                rule_id: "R14.1",
                description_ar: "الحد الأدنى لنصف قطر الجزيرة المركزية (غير قابلة للتسلق)",
                description_en: "Minimum central island radius (non-mountable)",
                rule_type: "dimension_min",
                element: "roundabout_central_island_radius",
                min_radius_m: 10.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R14.2",
                description_ar: "عرض طوق الشاحنات (إذا لزم)",
                description_en: "Truck apron width (if required)",
                rule_type: "dimension_range",
                element: "roundabout_truck_apron",
                min_width_m: 2.0,
                max_width_m: 3.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R14.3",
                description_ar: "الحد الأدنى لنصف قطر أنف جزيرة الفاصل",
                description_en: "Minimum splitter island nose radius",
                rule_type: "dimension_min",
                element: "splitter_island_nose_radius",
                min_radius_m: 0.3,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R14.4",
                description_ar: "إزاحة جزيرة الفاصل",
                description_en: "Splitter island offset",
                rule_type: "dimension_range",
                element: "splitter_island_offset",
                min_offset_m: 0.3,
                max_offset_m: 1.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R14.5",
                description_ar: "نسبة انحراف الدخول/الخروج",
                description_en: "Entry/exit deflection taper ratio",
                rule_type: "ratio",
                element: "roundabout_deflection_taper",
                ratio: "10:1",
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-541 GM-1, GM-1A"]
    },

    // ============================================================================
    // SECTION 15: PARKING DESIGN (TR-541)
    // ============================================================================
    {
        article_id: "R15",
        title_ar: "تصميم المواقف",
        title_en: "Parking Design Requirements",
        rules: [
            {
                rule_id: "R15.1",
                description_ar: "أبعاد موقف 90 درجة",
                description_en: "90° parking stall dimensions",
                rule_type: "dimension",
                element: "parking_stall_90",
                stall_width_m: 2.5,
                stall_length_m: 5.5,
                aisle_width_m: 6.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R15.2",
                description_ar: "أبعاد موقف 60 درجة",
                description_en: "60° parking stall dimensions",
                rule_type: "dimension",
                element: "parking_stall_60",
                stall_width_m: 2.5,
                stall_length_m: 5.5,
                aisle_width_m: 5.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R15.3",
                description_ar: "أبعاد موقف 45 درجة",
                description_en: "45° parking stall dimensions",
                rule_type: "dimension",
                element: "parking_stall_45",
                stall_width_m: 2.5,
                stall_length_m: 5.5,
                aisle_width_m: 4.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R15.4",
                description_ar: "أبعاد الموقف الموازي",
                description_en: "Parallel parking stall dimensions",
                rule_type: "dimension",
                element: "parking_stall_parallel",
                stall_width_m: 2.5,
                stall_length_m: 6.5,
                aisle_width_m: 3.5,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R15.5",
                description_ar: "أبعاد موقف ذوي الاحتياجات الخاصة",
                description_en: "Accessible parking stall dimensions",
                rule_type: "dimension",
                element: "parking_stall_accessible",
                stall_width_m: 3.6,
                stall_length_m: 5.5,
                aisle_width_m: 6.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "R15.6",
                description_ar: "أبعاد موقف الدراجات النارية",
                description_en: "Motorcycle parking dimensions",
                rule_type: "dimension",
                element: "parking_stall_motorcycle",
                stall_width_m: 1.2,
                stall_length_m: 2.5,
                aisle_width_m: 3.0,
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-541 GM-7, GM-7A, GM-10, GM-10A"]
    }
];

// ============================================================================
// RULE TYPE DEFINITIONS
// ============================================================================
const RULE_TYPES = {
    dimension_min: "Minimum dimension requirement",
    dimension_max: "Maximum dimension requirement",
    dimension: "Fixed dimension requirement",
    dimension_range: "Dimension within a range",
    dimension_by_speed: "Dimension varies by design speed",
    slope_min: "Minimum slope requirement",
    slope_max: "Maximum slope requirement",
    slope_range: "Slope within a range",
    speed_range: "Speed within a range",
    spacing: "Fixed spacing requirement",
    spacing_max: "Maximum spacing requirement",
    spacing_range: "Spacing within a range",
    sight_distance_by_speed: "Sight distance varies by design speed",
    curve_radius_by_speed: "Curve radius varies by design speed and superelevation",
    compound_curve: "Three-centered compound curve design",
    angle_range: "Angle within a range",
    ratio: "Fixed ratio requirement",
    boolean: "True/false requirement"
};

// ============================================================================
// DESIGN VEHICLES
// ============================================================================
const DESIGN_VEHICLES = {
    P: { name: "Passenger Car", length_m: 5.8, width_m: 2.1 },
    SU: { name: "Single Unit Truck", length_m: 9.2, width_m: 2.6 },
    "WB-12": { name: "Intermediate Semitrailer", length_m: 16.8, width_m: 2.6 },
    "WB-15": { name: "Interstate Semitrailer", length_m: 21.0, width_m: 2.6 },
    "WB-19": { name: "Turnpike Double", length_m: 23.0, width_m: 2.6 },
    "WB-20": { name: "Turnpike Double", length_m: 23.0, width_m: 2.6 },
    "WB-29": { name: "Rocky Mountain Double", length_m: 33.5, width_m: 2.6 },
    "WB-35": { name: "Triples", length_m: 38.0, width_m: 2.6 }
};

// ============================================================================
// ROAD TYPE DEFINITIONS
// ============================================================================
const ROAD_TYPES = {
    rural_freeway: { min_speed: 100, max_speed: 140 },
    urban_freeway: { min_speed: 80, max_speed: 120 },
    expressway: { min_speed: 80, max_speed: 120 },
    rural_arterial: { min_speed: 80, max_speed: 120 },
    rural_collector: { min_speed: 60, max_speed: 100 },
    rural_local: { min_speed: 40, max_speed: 80 },
    rural_truck_route: { min_speed: 80, max_speed: 100 },
    boulevard: { min_speed: 60, max_speed: 80 },
    avenue: { min_speed: 50, max_speed: 70 },
    street: { min_speed: 40, max_speed: 60 },
    access_lane: { min_speed: 30, max_speed: 50 },
    frontage_lane: { min_speed: 30, max_speed: 50 }
};

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================
const SUMMARY = {
    total_articles: ROAD_ARTICLES.length,
    total_rules: ROAD_ARTICLES.reduce((sum, article) => sum + article.rules.length, 0),
    sources: [
        "TR-514: Road Geometric Design Manual, Second Edition - January 2022",
        "TR-541-1: Standard Drawing Guideline Part 1, Third Edition - June 2024"
    ],
    categories: [
        "Road Type Classification",
        "Lane Width",
        "Shoulder Width",
        "Median Width",
        "Curve Radius",
        "Gradient",
        "Sight Distance",
        "Cross Slope",
        "Pedestrian Facilities",
        "Intersection Design",
        "Right-of-Way",
        "Side Slopes",
        "Ramp Design",
        "Roundabout Design",
        "Parking Design"
    ]
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    ROAD_ARTICLES,
    RULE_TYPES,
    DESIGN_VEHICLES,
    ROAD_TYPES,
    SUMMARY
};
