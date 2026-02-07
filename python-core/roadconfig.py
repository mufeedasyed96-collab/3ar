"""
Configuration module for Roads and Access validation rules
Source: Road Geometric Design Manual (TR-514 / Second Edition - January 2022)
        Standard Drawing Guideline Part 1 (TR-541-1 / Third Edition - June 2024)
Department: Department of Municipalities and Transport (DMT), Abu Dhabi, UAE
"""

ROAD_ARTICLES = [
    # SECTION 1: ROAD TYPE CLASSIFICATION
    {
        "article_id": "R1",
        "title_ar": "تصنيف أنواع الطرق",
        "title_en": "Road Type Classification",
        "rules": [
            {"rule_id": "R1.1", "description_ar": "الطريق السريع الريفي: سرعة التصميم", "description_en": "Rural Freeway: Design speed range 100-140 km/h", "rule_type": "speed_range", "element": "design_speed_rural_freeway", "min_speed_kmh": 100, "max_speed_kmh": 140},
            {"rule_id": "R1.2", "description_ar": "الطريق السريع الحضري: سرعة التصميم", "description_en": "Urban Freeway: Design speed range 80-120 km/h", "rule_type": "speed_range", "element": "design_speed_urban_freeway", "min_speed_kmh": 80, "max_speed_kmh": 120},
            {"rule_id": "R1.3", "description_ar": "البوليفارد: سرعة التصميم", "description_en": "Boulevard: Design speed range 60-80 km/h", "rule_type": "speed_range", "element": "design_speed_boulevard", "min_speed_kmh": 60, "max_speed_kmh": 80},
            {"rule_id": "R1.4", "description_ar": "الأفنيو: سرعة التصميم", "description_en": "Avenue: Design speed range 50-70 km/h", "rule_type": "speed_range", "element": "design_speed_avenue", "min_speed_kmh": 50, "max_speed_kmh": 70},
            {"rule_id": "R1.5", "description_ar": "الشارع: سرعة التصميم", "description_en": "Street: Design speed range 40-60 km/h", "rule_type": "speed_range", "element": "design_speed_street", "min_speed_kmh": 40, "max_speed_kmh": 60}
        ]
    },
    # SECTION 2: LANE WIDTH
    {
        "article_id": "R2",
        "title_ar": "عرض الحارات",
        "title_en": "Lane Width",
        "rules": [
            {"rule_id": "R2.1", "description_ar": "الحد الأدنى لعرض حارة المرور للطرق السريعة", "description_en": "Minimum travel lane width for freeways: 3.65m", "rule_type": "dimension_min", "element": "lane_width_freeway", "min_width_m": 3.65, "desirable_width_m": 3.65, "max_width_m": 3.75, "dwg_checkable": True},
            {"rule_id": "R2.2", "description_ar": "عرض حارة الطريق في طرق الشاحنات الريفية", "description_en": "Rural truck route lane width: 3.65-4.0m", "rule_type": "dimension_range", "element": "lane_width_truck_route", "min_width_m": 3.65, "desirable_width_m": 3.75, "max_width_m": 4.0, "dwg_checkable": True},
            {"rule_id": "R2.3", "description_ar": "عرض الحارة القياسي للبوليفارد والأفنيو", "description_en": "Standard lane width for Boulevard/Avenue: 3.3m", "rule_type": "dimension", "element": "lane_width_boulevard_avenue", "standard_width_m": 3.3, "edge_lane_width_m": 3.5, "dwg_checkable": True},
            {"rule_id": "R2.4", "description_ar": "عرض الحارة القياسي للشوارع وممرات الوصول", "description_en": "Standard lane width for Streets/Access: 3.0m", "rule_type": "dimension", "element": "lane_width_street_access", "standard_width_m": 3.0, "max_width_m": 3.3, "dwg_checkable": True},
            {"rule_id": "R2.5", "description_ar": "عرض حارة الالتفاف لليسار", "description_en": "Left turn lane width: 3.0-3.3m", "rule_type": "dimension_range", "element": "lane_width_left_turn", "min_width_m": 3.0, "desirable_width_m": 3.3, "dwg_checkable": True},
            {"rule_id": "R2.6", "description_ar": "عرض حارة المواقف", "description_en": "Parking lane width: 2.5m", "rule_type": "dimension", "element": "lane_width_parking", "standard_width_m": 2.5, "dwg_checkable": True},
            {"rule_id": "R2.7", "description_ar": "عرض الرامب (حارة واحدة)", "description_en": "Single lane ramp width: 5.0-5.5m", "rule_type": "dimension_range", "element": "ramp_lane_width", "min_width_m": 5.0, "max_width_m": 5.5, "dwg_checkable": True},
            {"rule_id": "R2.8", "description_ar": "عرض ممر الدراجات الهوائية", "description_en": "Cycle lane width (one-way): 1.2-2.5m", "rule_type": "dimension_range", "element": "cycle_lane_width", "min_width_m": 1.2, "desirable_width_m": 1.5, "max_width_m": 2.5, "dwg_checkable": True}
        ]
    },
    # SECTION 3: SHOULDER WIDTH
    {
        "article_id": "R3",
        "title_ar": "عرض الكتف",
        "title_en": "Shoulder Width",
        "rules": [
            {"rule_id": "R3.1", "description_ar": "عرض الكتف الأيمن للطرق السريعة", "description_en": "Right shoulder width for freeways: min 3.0m", "rule_type": "dimension_min", "element": "shoulder_width_right_freeway", "min_width_m": 3.0, "dwg_checkable": True},
            {"rule_id": "R3.2", "description_ar": "عرض الكتف الأيسر للطرق السريعة", "description_en": "Left shoulder width for freeways: min 2.0m", "rule_type": "dimension_min", "element": "shoulder_width_left_freeway", "min_width_m": 2.0, "dwg_checkable": True},
            {"rule_id": "R3.3", "description_ar": "عرض كتف الطريق لطرق الشاحنات الريفية", "description_en": "Shoulder width for rural truck routes: Right 3.6m, Left 3.0m", "rule_type": "dimension", "element": "shoulder_width_truck_route", "right_width_m": 3.6, "left_width_m": 3.0, "dwg_checkable": True},
            {"rule_id": "R3.4", "description_ar": "عرض كتف الرامب الأيمن", "description_en": "Ramp right shoulder width: min 3.0m", "rule_type": "dimension_min", "element": "shoulder_width_ramp_right", "min_width_m": 3.0, "dwg_checkable": True},
            {"rule_id": "R3.5", "description_ar": "عرض كتف الرامب الأيسر", "description_en": "Ramp left shoulder width: min 1.2m", "rule_type": "dimension_min", "element": "shoulder_width_ramp_left", "min_width_m": 1.2, "dwg_checkable": True}
        ]
    },
    # SECTION 4: MEDIAN WIDTH
    {
        "article_id": "R4",
        "title_ar": "عرض الجزيرة الوسطية",
        "title_en": "Median Width",
        "rules": [
            {"rule_id": "R4.1", "description_ar": "عرض الجزيرة المنخفضة (بدون حاجز)", "description_en": "Depressed median width (no barrier): min 10.0m, recommended 18.0m", "rule_type": "dimension_range", "element": "median_width_depressed", "min_width_m": 10.0, "recommended_width_m": 18.0, "desirable_width_m": 20.0, "dwg_checkable": True},
            {"rule_id": "R4.2", "description_ar": "عرض الجزيرة مع حاجز خرساني", "description_en": "Flush median with concrete barrier: min 7.8m", "rule_type": "dimension_range", "element": "median_width_barrier", "min_width_m": 7.8, "recommended_width_m": 8.0, "desirable_width_m": 10.0, "dwg_checkable": True},
            {"rule_id": "R4.3", "description_ar": "عرض الجزيرة المرتفعة للشوارع الحضرية", "description_en": "Curbed median width for urban streets: 2.0-6.0m", "rule_type": "dimension_range", "element": "median_width_urban_curbed", "min_width_m": 2.0, "standard_width_m": 4.0, "max_width_m": 6.0, "dwg_checkable": True},
            {"rule_id": "R4.4", "description_ar": "الحد الأدنى لملجأ المشاة في الجزيرة", "description_en": "Minimum pedestrian refuge width in median: 2.0m", "rule_type": "dimension_min", "element": "pedestrian_refuge_width", "min_width_m": 2.0, "dwg_checkable": True}
        ]
    },
    # SECTION 5: CURVE RADIUS
    {
        "article_id": "R5",
        "title_ar": "نصف قطر المنحنى",
        "title_en": "Curve Radius",
        "rules": [
            {"rule_id": "R5.1", "description_ar": "الحد الأدنى لنصف قطر المنحنى الأفقي حسب سرعة التصميم", "description_en": "Minimum horizontal curve radius by design speed (varies by superelevation)", "rule_type": "curve_radius_by_speed", "element": "horizontal_curve_radius", "dwg_checkable": True},
            {"rule_id": "R5.2", "description_ar": "نصف قطر الالتفاف لليمين حسب مركبة التصميم WB-12", "description_en": "Right turn radius for WB-12: R1=36m, R2=12m, R3=36m", "rule_type": "compound_curve", "element": "right_turn_radius_wb12", "design_vehicle": "WB-12", "r1_m": 36, "r2_m": 12, "r3_m": 36, "offset_m": 2.0, "dwg_checkable": True},
            {"rule_id": "R5.3", "description_ar": "نصف قطر الالتفاف لليمين حسب مركبة التصميم WB-15", "description_en": "Right turn radius for WB-15: R1=55m, R2=18m, R3=55m", "rule_type": "compound_curve", "element": "right_turn_radius_wb15", "design_vehicle": "WB-15", "r1_m": 55, "r2_m": 18, "r3_m": 55, "offset_m": 2.0, "dwg_checkable": True},
            {"rule_id": "R5.4", "description_ar": "نصف قطر منحنى الدخول للدوار", "description_en": "Roundabout entry curve radius: 15-25m", "rule_type": "dimension_range", "element": "roundabout_entry_radius", "min_radius_m": 15, "max_radius_m": 25, "dwg_checkable": True},
            {"rule_id": "R5.5", "description_ar": "نصف قطر منحنى الخروج للدوار", "description_en": "Roundabout exit curve radius: 20-40m", "rule_type": "dimension_range", "element": "roundabout_exit_radius", "min_radius_m": 20, "max_radius_m": 40, "dwg_checkable": True}
        ]
    },
    # SECTION 6: GRADIENT
    {
        "article_id": "R6",
        "title_ar": "الميل الطولي",
        "title_en": "Gradient",
        "rules": [
            {"rule_id": "R6.1", "description_ar": "الحد الأقصى للميل الطولي للطرق السريعة (أرض مستوية)", "description_en": "Maximum grade for freeways (flat terrain): 3.0%, absolute max 4.0%", "rule_type": "slope_max", "element": "grade_freeway_flat", "max_grade_percent": 3.0, "absolute_max_percent": 4.0, "dwg_checkable": True},
            {"rule_id": "R6.2", "description_ar": "الحد الأقصى للميل الطولي للشوارع الحضرية", "description_en": "Maximum grade for urban streets: 6.0%, absolute max 8.0%", "rule_type": "slope_max", "element": "grade_urban_street", "max_grade_percent": 6.0, "absolute_max_percent": 8.0, "dwg_checkable": True},
            {"rule_id": "R6.3", "description_ar": "الحد الأدنى للميل الطولي (للتصريف)", "description_en": "Minimum grade for drainage: 0.3%", "rule_type": "slope_min", "element": "grade_minimum_drainage", "min_grade_percent": 0.3, "dwg_checkable": True},
            {"rule_id": "R6.4", "description_ar": "الحد الأقصى لميل الرامب (صعود)", "description_en": "Maximum ramp upgrade: 5.0%", "rule_type": "slope_max", "element": "grade_ramp_upgrade", "max_grade_percent": 5.0, "dwg_checkable": True},
            {"rule_id": "R6.5", "description_ar": "الحد الأقصى لميل الرامب (نزول)", "description_en": "Maximum ramp downgrade: 6.0%", "rule_type": "slope_max", "element": "grade_ramp_downgrade", "max_grade_percent": 6.0, "dwg_checkable": True}
        ]
    },
    # SECTION 7: SIGHT DISTANCE
    {
        "article_id": "R7",
        "title_ar": "مسافة الرؤية",
        "title_en": "Sight Distance",
        "rules": [
            {"rule_id": "R7.1", "description_ar": "مسافة التوقف حسب سرعة التصميم", "description_en": "Stopping sight distance by design speed (varies)", "rule_type": "sight_distance_by_speed", "element": "stopping_sight_distance", "dwg_checkable": "partial"},
            {"rule_id": "R7.2", "description_ar": "مسافة التجاوز (للطرق ذات الحارتين)", "description_en": "Passing sight distance for two-lane roads (varies by speed)", "rule_type": "sight_distance_by_speed", "element": "passing_sight_distance", "dwg_checkable": "partial"}
        ]
    },
    # SECTION 8: CROSS SLOPE
    {
        "article_id": "R8",
        "title_ar": "الميل العرضي",
        "title_en": "Cross Slope",
        "rules": [
            {"rule_id": "R8.1", "description_ar": "ميل عرضي لحارة المرور", "description_en": "Travel lane cross slope: 1.5-2.5%", "rule_type": "slope_range", "element": "cross_slope_travel_lane", "min_slope_percent": 1.5, "desirable_slope_percent": 2.0, "max_slope_percent": 2.5, "dwg_checkable": True},
            {"rule_id": "R8.2", "description_ar": "ميل عرضي للكتف المرصوف", "description_en": "Paved shoulder cross slope: 2.0-5.0%", "rule_type": "slope_range", "element": "cross_slope_paved_shoulder", "min_slope_percent": 2.0, "max_slope_percent": 5.0, "dwg_checkable": True},
            {"rule_id": "R8.3", "description_ar": "أقصى ميل جانبي (Superelevation) للطرق السريعة الريفية", "description_en": "Maximum superelevation for rural freeways: 8.0%", "rule_type": "slope_max", "element": "superelevation_rural_freeway", "max_slope_percent": 8.0, "dwg_checkable": True},
            {"rule_id": "R8.4", "description_ar": "أقصى ميل جانبي للطرق في مناطق الرمال", "description_en": "Maximum superelevation for sand area roads: 5.0%", "rule_type": "slope_max", "element": "superelevation_sand_area", "max_slope_percent": 5.0, "dwg_checkable": True}
        ]
    },
    # SECTION 9: PEDESTRIAN FACILITIES
    {
        "article_id": "R9",
        "title_ar": "مرافق المشاة",
        "title_en": "Pedestrian Facilities",
        "rules": [
            {"rule_id": "R9.1", "description_ar": "الحد الأدنى لعرض الرصيف (خالي من العوائق)", "description_en": "Minimum sidewalk clear width: 2.0m", "rule_type": "dimension_min", "element": "sidewalk_clear_width", "min_width_m": 2.0, "dwg_checkable": True},
            {"rule_id": "R9.2", "description_ar": "عرض الرصيف للبوليفارد", "description_en": "Sidewalk width for Boulevard: 2.5-4.0m", "rule_type": "dimension_range", "element": "sidewalk_width_boulevard", "min_width_m": 2.5, "desirable_width_m": 3.0, "max_width_m": 4.0, "dwg_checkable": True},
            {"rule_id": "R9.3", "description_ar": "أقصى ميل طولي لمنحدرات المشاة", "description_en": "Maximum pedestrian ramp gradient: 8.3% (1:12)", "rule_type": "slope_max", "element": "pedestrian_ramp_gradient", "max_slope_percent": 8.3, "ratio": "1:12", "dwg_checkable": True},
            {"rule_id": "R9.4", "description_ar": "أقصى ميل عرضي لمنحدرات المشاة", "description_en": "Maximum pedestrian ramp cross slope: 2.0%", "rule_type": "slope_max", "element": "pedestrian_ramp_cross_slope", "max_slope_percent": 2.0, "dwg_checkable": True},
            {"rule_id": "R9.5", "description_ar": "الحد الأقصى للمسافة بين معابر المشاة", "description_en": "Maximum pedestrian crossing spacing: 150m", "rule_type": "spacing_max", "element": "pedestrian_crossing_spacing", "max_spacing_m": 150, "dwg_checkable": True},
            {"rule_id": "R9.6", "description_ar": "ارتفاع الرصيف للبوليفارد والأفنيو", "description_en": "Kerb height for Boulevard/Avenue: 150mm", "rule_type": "dimension", "element": "kerb_height_boulevard_avenue", "height_mm": 150, "dwg_checkable": True},
            {"rule_id": "R9.7", "description_ar": "ارتفاع الرصيف للشوارع وممرات الوصول", "description_en": "Kerb height for Streets/Access: 100mm", "rule_type": "dimension", "element": "kerb_height_street_access", "height_mm": 100, "dwg_checkable": True}
        ]
    },
    # SECTION 10: INTERSECTION DESIGN
    {
        "article_id": "R10",
        "title_ar": "تصميم التقاطعات",
        "title_en": "Intersection Design",
        "rules": [
            {"rule_id": "R10.1", "description_ar": "نصف قطر الزاوية للسيارة (90 درجة)", "description_en": "Corner radius for passenger car (90°): min 6.0m", "rule_type": "dimension_min", "element": "corner_radius_car_90", "min_radius_m": 6.0, "dwg_checkable": True},
            {"rule_id": "R10.2", "description_ar": "نصف قطر الزاوية للشاحنة الوحيدة (90 درجة)", "description_en": "Corner radius for single unit truck (90°): min 12.0m", "rule_type": "dimension_min", "element": "corner_radius_su_90", "min_radius_m": 12.0, "dwg_checkable": True},
            {"rule_id": "R10.3", "description_ar": "نصف قطر الزاوية لـ WB-15 (90 درجة)", "description_en": "Corner radius for WB-15 (90°): min 18.0m", "rule_type": "dimension_min", "element": "corner_radius_wb15_90", "min_radius_m": 18.0, "dwg_checkable": True},
            {"rule_id": "R10.4", "description_ar": "مسافة الرؤية عند التقاطع", "description_en": "Intersection sight distance (varies by speed)", "rule_type": "sight_distance_by_speed", "element": "intersection_sight_distance", "dwg_checkable": "partial"}
        ]
    },
    # SECTION 11: RIGHT-OF-WAY
    {
        "article_id": "R11",
        "title_ar": "حرم الطريق",
        "title_en": "Right-of-Way",
        "rules": [
            {"rule_id": "R11.1", "description_ar": "عرض حرم الطريق لطرق الشاحنات الريفية", "description_en": "ROW width for rural truck routes: min 36.0m, typical 40.0m", "rule_type": "dimension", "element": "row_width_truck_route", "min_width_m": 36.0, "typical_width_m": 40.0, "dwg_checkable": True},
            {"rule_id": "R11.2", "description_ar": "عرض حرم الطريق للبوليفارد", "description_en": "ROW width for Boulevard: min 40.0m, typical 50.0m", "rule_type": "dimension", "element": "row_width_boulevard", "min_width_m": 40.0, "typical_width_m": 50.0, "dwg_checkable": True},
            {"rule_id": "R11.3", "description_ar": "عرض حرم الطريق للأفنيو", "description_en": "ROW width for Avenue: min 30.0m, typical 40.0m", "rule_type": "dimension", "element": "row_width_avenue", "min_width_m": 30.0, "typical_width_m": 40.0, "dwg_checkable": True},
            {"rule_id": "R11.4", "description_ar": "عرض حرم الطريق للشارع", "description_en": "ROW width for Street: min 20.0m, typical 25.0m", "rule_type": "dimension", "element": "row_width_street", "min_width_m": 20.0, "typical_width_m": 25.0, "dwg_checkable": True}
        ]
    },
    # SECTION 12: RAMP DESIGN
    {
        "article_id": "R12",
        "title_ar": "تصميم الرامب",
        "title_en": "Ramp Design",
        "rules": [
            {"rule_id": "R12.1", "description_ar": "طول حارة التباطؤ حسب سرعة الطريق الرئيسي", "description_en": "Deceleration lane length by highway speed (varies)", "rule_type": "dimension_by_speed", "element": "deceleration_lane_length", "dwg_checkable": True},
            {"rule_id": "R12.2", "description_ar": "طول حارة التسارع حسب سرعة الطريق الرئيسي", "description_en": "Acceleration lane length by highway speed (varies)", "rule_type": "dimension_by_speed", "element": "acceleration_lane_length", "dwg_checkable": True},
            {"rule_id": "R12.3", "description_ar": "زاوية الانحراف للرامب", "description_en": "Exit ramp divergence angle: 2.0-5.0°", "rule_type": "angle_range", "element": "ramp_divergence_angle", "min_angle_deg": 2.0, "max_angle_deg": 5.0, "typical_angle_deg": 4.0, "dwg_checkable": True},
            {"rule_id": "R12.4", "description_ar": "الحد الأدنى لطول حارة التباطؤ", "description_en": "Minimum deceleration lane length: 140m", "rule_type": "dimension_min", "element": "deceleration_lane_min_length", "min_length_m": 140, "dwg_checkable": True}
        ]
    },
    # SECTION 13: ROUNDABOUT DESIGN
    {
        "article_id": "R13",
        "title_ar": "تصميم الدوار",
        "title_en": "Roundabout Design",
        "rules": [
            {"rule_id": "R13.1", "description_ar": "الحد الأدنى لنصف قطر الجزيرة المركزية", "description_en": "Minimum central island radius (non-mountable): 10.0m", "rule_type": "dimension_min", "element": "roundabout_central_island_radius", "min_radius_m": 10.0, "dwg_checkable": True},
            {"rule_id": "R13.2", "description_ar": "عرض طوق الشاحنات (إذا لزم)", "description_en": "Truck apron width (if required): 2.0-3.0m", "rule_type": "dimension_range", "element": "roundabout_truck_apron", "min_width_m": 2.0, "max_width_m": 3.0, "dwg_checkable": True},
            {"rule_id": "R13.3", "description_ar": "الحد الأدنى لنصف قطر أنف جزيرة الفاصل", "description_en": "Minimum splitter island nose radius: 0.3m", "rule_type": "dimension_min", "element": "splitter_island_nose_radius", "min_radius_m": 0.3, "dwg_checkable": True}
        ]
    },
    # SECTION 14: PARKING DESIGN
    {
        "article_id": "R14",
        "title_ar": "تصميم المواقف",
        "title_en": "Parking Design",
        "rules": [
            {"rule_id": "R14.1", "description_ar": "أبعاد موقف 90 درجة", "description_en": "90° parking stall: 2.5m × 5.5m, aisle 6.0m", "rule_type": "dimension", "element": "parking_stall_90", "stall_width_m": 2.5, "stall_length_m": 5.5, "aisle_width_m": 6.0, "dwg_checkable": True},
            {"rule_id": "R14.2", "description_ar": "أبعاد موقف 60 درجة", "description_en": "60° parking stall: 2.5m × 5.5m, aisle 5.0m", "rule_type": "dimension", "element": "parking_stall_60", "stall_width_m": 2.5, "stall_length_m": 5.5, "aisle_width_m": 5.0, "dwg_checkable": True},
            {"rule_id": "R14.3", "description_ar": "أبعاد موقف 45 درجة", "description_en": "45° parking stall: 2.5m × 5.5m, aisle 4.0m", "rule_type": "dimension", "element": "parking_stall_45", "stall_width_m": 2.5, "stall_length_m": 5.5, "aisle_width_m": 4.0, "dwg_checkable": True},
            {"rule_id": "R14.4", "description_ar": "أبعاد الموقف الموازي", "description_en": "Parallel parking stall: 2.5m × 6.5m, aisle 3.5m", "rule_type": "dimension", "element": "parking_stall_parallel", "stall_width_m": 2.5, "stall_length_m": 6.5, "aisle_width_m": 3.5, "dwg_checkable": True},
            {"rule_id": "R14.5", "description_ar": "أبعاد موقف ذوي الاحتياجات الخاصة", "description_en": "Accessible parking stall: 3.6m × 5.5m, aisle 6.0m", "rule_type": "dimension", "element": "parking_stall_accessible", "stall_width_m": 3.6, "stall_length_m": 5.5, "aisle_width_m": 6.0, "dwg_checkable": True}
        ]
    }
]

# Design Vehicles
DESIGN_VEHICLES = {
    "P": {"name": "Passenger Car", "length_m": 5.8, "width_m": 2.1},
    "SU": {"name": "Single Unit Truck", "length_m": 9.2, "width_m": 2.6},
    "WB-12": {"name": "Intermediate Semitrailer", "length_m": 16.8, "width_m": 2.6},
    "WB-15": {"name": "Interstate Semitrailer", "length_m": 21.0, "width_m": 2.6},
    "WB-19": {"name": "Turnpike Double", "length_m": 23.0, "width_m": 2.6}
}

# Road Types
ROAD_TYPES = {
    "rural_freeway": {"min_speed": 100, "max_speed": 140},
    "urban_freeway": {"min_speed": 80, "max_speed": 120},
    "boulevard": {"min_speed": 60, "max_speed": 80},
    "avenue": {"min_speed": 50, "max_speed": 70},
    "street": {"min_speed": 40, "max_speed": 60},
    "access_lane": {"min_speed": 30, "max_speed": 50}
}
