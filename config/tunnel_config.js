/**
 * Configuration module for Tunnel geometry validation rules
 * Source: Road Geometric Design Manual (TR-514 / Second Edition - January 2022)
 *         Standard Drawing Guideline Part 1 (TR-541-1 / Third Edition - June 2024)
 * Department: Department of Municipalities and Transport (DMT), Abu Dhabi, UAE
 */

// ============================================================================
// TUNNEL ARTICLES
// ============================================================================
const TUNNEL_ARTICLES = [
    // ============================================================================
    // SECTION 1: TUNNEL VERTICAL CLEARANCES (Section 20 from Complete_Geometric_Design_Rules.md)
    // ============================================================================
    {
        article_id: "T1",
        title_ar: "الخلوص الرأسي للأنفاق",
        title_en: "Tunnel Vertical Clearances",
        rules: [
            {
                rule_id: "T1.1",
                description_ar: "الخلوص الرأسي للأنفاق على الطرق السريعة",
                description_en: "Highway tunnels vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_highway_tunnel",
                min_clearance_m: 6.5,
                notes: "General standard",
                dwg_checkable: true,
                requires: ["elevation_data", "tunnel_profile"]
            },
            {
                rule_id: "T1.2",
                description_ar: "الخلوص الرأسي للأنفاق في المناطق الحضرية",
                description_en: "Urban tunnels vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_urban_tunnel",
                min_clearance_m: 6.0,
                notes: "Urban areas",
                dwg_checkable: true,
                requires: ["elevation_data", "tunnel_profile"]
            },
            {
                rule_id: "T1.3",
                description_ar: "الخلوص الرأسي للافتات والتهوية داخل الأنفاق",
                description_en: "Overhead signs/ventilation in tunnels vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_tunnel_equipment",
                min_clearance_m: 6.5,
                notes: "To bottom of element",
                dwg_checkable: true,
                requires: ["elevation_data", "tunnel_profile"]
            },
            {
                rule_id: "T1.4",
                description_ar: "الخلوص الرأسي لأنفاق المشاة",
                description_en: "Pedestrian tunnels vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_pedestrian_tunnel",
                min_clearance_m: 3.5,
                notes: "Minimum",
                dwg_checkable: true,
                requires: ["elevation_data", "tunnel_profile"]
            }
        ],
        evidence: ["TR-514 Chapter 13 - Tunnels"]
    },

    // ============================================================================
    // SECTION 2: TUNNEL CROSS SECTION (Section 21)
    // ============================================================================
    {
        article_id: "T2",
        title_ar: "المقطع العرضي للنفق",
        title_en: "Tunnel Cross Section",
        rules: [
            {
                rule_id: "T2.1",
                description_ar: "عرض الطريق بين الحواف داخل النفق",
                description_en: "Roadway width between curbs in tunnel",
                rule_type: "dimension_min",
                element: "tunnel_roadway_width",
                condition: "Approach width + 0.6m minimum",
                additional_width_m: 0.6,
                dwg_checkable: true,
                requires: ["cross_section", "tunnel_profile"]
            },
            {
                rule_id: "T2.2",
                description_ar: "الحد الأدنى لعرض الرصيف/الحافة على كل جانب",
                description_en: "Minimum curb/sidewalk width each side",
                rule_type: "dimension_min",
                element: "tunnel_curb_sidewalk_width",
                min_width_m: 0.6,
                notes: "Per side",
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "T2.3",
                description_ar: "العرض الكلي من الجدار إلى الجدار للنفق ثلاثي الحارات",
                description_en: "3-lane tunnel wall-to-wall minimum width",
                rule_type: "dimension_min",
                element: "tunnel_3lane_total_width",
                min_width_m: 12.75,
                notes: "Total clearance",
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "T2.4",
                description_ar: "المقطع المفضل للنفق ثلاثي الحارات",
                description_en: "Desirable 3-lane tunnel section",
                rule_type: "dimension_composite",
                element: "tunnel_3lane_desirable",
                lanes: {
                    lane_count: 3,
                    lane_width_m: 3.65,
                    shoulder_width_m: 3.0,
                    walkway_width_m: 0.9
                },
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "T2.5",
                description_ar: "عرض ممر السلامة",
                description_en: "Safety walkway width",
                rule_type: "dimension",
                element: "tunnel_safety_walkway",
                width_m: 0.9,
                notes: "Beyond shoulders",
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 13.3 - Tunnel Cross Section"]
    },

    // ============================================================================
    // SECTION 3: TUNNEL ALIGNMENT (Section 22)
    // ============================================================================
    {
        article_id: "T3",
        title_ar: "محاذاة النفق",
        title_en: "Tunnel Alignment",
        rules: [
            {
                rule_id: "T3.1",
                description_ar: "المحاذاة الأفقية المفضلة للنفق",
                description_en: "Tunnel horizontal alignment preference",
                rule_type: "design_rule",
                element: "tunnel_horizontal_alignment",
                preferred: "Tangent alignment",
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "T3.2",
                description_ar: "مسافة الرؤية الأفقية على المنحنيات في الأنفاق",
                description_en: "Horizontal sight distance on curves in tunnels",
                rule_type: "design_rule",
                element: "tunnel_curve_sight_distance",
                condition: "Widening shoulder on inside of curves may be required",
                dwg_checkable: false,
                requires: ["plan_geometry", "sight_distance_analysis"]
            },
            {
                rule_id: "T3.3",
                description_ar: "ميول النفق لراحة السائق",
                description_en: "Tunnel grades for driver comfort",
                rule_type: "design_principle",
                element: "tunnel_grades_comfort",
                condition: "Balance construction costs vs. operating expenses",
                dwg_checkable: false,
                requires: ["profile_geometry"]
            },
            {
                rule_id: "T3.4",
                description_ar: "تأثير الميول على الإضاءة والتهوية",
                description_en: "Grade effects on lighting and ventilation",
                rule_type: "design_consideration",
                element: "tunnel_grade_effects",
                considerations: ["length", "grades", "natural ventilation"],
                dwg_checkable: false,
                requires: ["profile_geometry", "mechanical_systems"]
            }
        ],
        evidence: ["TR-514 Section 13.4 - Tunnel Alignment"]
    },

    // ============================================================================
    // SECTION 4: TUNNEL TRAFFIC OPERATIONS (Section 23)
    // ============================================================================
    {
        article_id: "T4",
        title_ar: "عمليات المرور في الأنفاق",
        title_en: "Tunnel Traffic Operations",
        rules: [
            {
                rule_id: "T4.1",
                description_ar: "الحد الأدنى لمسافة مخارج الرامب من بوابة النفق",
                description_en: "Exit ramps minimum distance from tunnel portal",
                rule_type: "spacing_min",
                element: "tunnel_exit_ramp_spacing",
                min_distance_m: 300,
                direction: "downstream",
                dwg_checkable: true,
                requires: ["plan_geometry"]
            },
            {
                rule_id: "T4.2",
                description_ar: "لا نسج أو دمج أو تفرع داخل الأنفاق",
                description_en: "No weaving, merging, or diverging within tunnels",
                rule_type: "design_rule",
                element: "tunnel_traffic_operations",
                prohibited: ["weaving", "merging", "diverging"],
                notes: "Avoid exit/entrance ramps within tunnels",
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Section 13.5 - Tunnel Traffic Operations"]
    },

    // ============================================================================
    // SECTION 5: TUNNEL EMERGENCY AND MAINTENANCE (Section 24)
    // ============================================================================
    {
        article_id: "T5",
        title_ar: "الطوارئ والصيانة في الأنفاق",
        title_en: "Tunnel Emergency and Maintenance",
        rules: [
            {
                rule_id: "T5.1",
                description_ar: "توفير مركبات خدمات الطوارئ",
                description_en: "Emergency service vehicle provision",
                rule_type: "operational",
                element: "tunnel_emergency_vehicles",
                condition: "24/7 emergency service vehicles if no shoulders",
                dwg_checkable: false,
                requires: ["operational_plan"]
            },
            {
                rule_id: "T5.2",
                description_ar: "وصول المشاة في الأنفاق للطوارئ والصيانة",
                description_en: "Pedestrian access in tunnels for emergency and maintenance",
                rule_type: "design_rule",
                element: "tunnel_pedestrian_access",
                condition: "Space for emergency walking and maintenance access",
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 13.6 - Tunnel Emergency Provisions"]
    },

    // ============================================================================
    // SECTION 6: SPECIAL TUNNEL TYPES (Section 25)
    // ============================================================================
    {
        article_id: "T6",
        title_ar: "أنواع الأنفاق الخاصة",
        title_en: "Special Tunnel Types",
        rules: [
            {
                rule_id: "T6.1",
                description_ar: "الحد الأدنى للخلوص الرأسي لأنفاق المشاة",
                description_en: "Pedestrian tunnel minimum vertical clearance",
                rule_type: "dimension_min",
                element: "pedestrian_tunnel_clearance",
                min_clearance_m: 3.5,
                dwg_checkable: true,
                requires: ["elevation_data", "tunnel_profile"]
            },
            {
                rule_id: "T6.2",
                description_ar: "أنفاق منفصلة للمشاة والدراجات",
                description_en: "Separate tunnels for pedestrians/cyclists consideration",
                rule_type: "design_consideration",
                element: "separate_ped_cycle_tunnels",
                condition: "May be warranted for special uses",
                dwg_checkable: false,
                requires: ["traffic_analysis"]
            }
        ],
        evidence: ["TR-514 Section 13.7 - Special Tunnel Types"]
    }
];

// ============================================================================
// RULE TYPES FOR TUNNELS
// ============================================================================
const RULE_TYPES = {
    dimension_min: {
        description: "Minimum dimension requirement",
        validation_method: "value >= min_value"
    },
    dimension_max: {
        description: "Maximum dimension requirement",
        validation_method: "value <= max_value"
    },
    dimension: {
        description: "Fixed dimension requirement",
        validation_method: "value === required_value (with tolerance)"
    },
    dimension_composite: {
        description: "Composite of multiple dimension requirements",
        validation_method: "all sub-dimensions validated"
    },
    spacing_min: {
        description: "Minimum spacing between elements",
        validation_method: "spacing >= min_spacing"
    },
    design_rule: {
        description: "Design requirement to be verified manually",
        validation_method: "manual_review"
    },
    design_principle: {
        description: "Guiding design principle",
        validation_method: "manual_review"
    },
    design_consideration: {
        description: "Factor to consider in design",
        validation_method: "manual_review"
    },
    operational: {
        description: "Operational requirement",
        validation_method: "operational_verification"
    }
};

// ============================================================================
// TUNNEL VERTICAL CLEARANCES LOOKUP
// ============================================================================
const VERTICAL_CLEARANCES = {
    highway_tunnel: 6.5,
    urban_tunnel: 6.0,
    tunnel_equipment: 6.5,
    pedestrian_tunnel: 3.5
};

// ============================================================================
// TUNNEL DIMENSIONS LOOKUP
// ============================================================================
const TUNNEL_STANDARDS = {
    min_curb_sidewalk_width: 0.6,
    three_lane_min_width: 12.75,
    safety_walkway_width: 0.9,
    roadway_additional_width: 0.6,  // Additional width beyond approach
    desirable_3_lane: {
        lane_width: 3.65,
        lane_count: 3,
        shoulder_width: 3.0,
        walkway_width: 0.9
    },
    exit_ramp_spacing_from_portal: 300
};

// ============================================================================
// TUNNEL TYPES
// ============================================================================
const TUNNEL_TYPES = {
    highway_tunnel: {
        description_en: "Highway Tunnel",
        description_ar: "نفق طريق سريع",
        min_vertical_clearance: 6.5
    },
    urban_tunnel: {
        description_en: "Urban Tunnel",
        description_ar: "نفق حضري",
        min_vertical_clearance: 6.0
    },
    pedestrian_tunnel: {
        description_en: "Pedestrian Tunnel",
        description_ar: "نفق مشاة",
        min_vertical_clearance: 3.5
    },
    combined_tunnel: {
        description_en: "Combined Vehicular/Pedestrian Tunnel",
        description_ar: "نفق مشترك للمركبات والمشاة",
        min_vertical_clearance: 6.5
    }
};

// ============================================================================
// TUNNEL LANE CONFIGURATIONS
// ============================================================================
const LANE_CONFIGURATIONS = {
    two_lane: {
        lane_count: 2,
        min_lane_width: 3.65,
        min_shoulder_width: 3.0,
        min_walkway_width: 0.9
    },
    three_lane: {
        lane_count: 3,
        min_lane_width: 3.65,
        min_shoulder_width: 3.0,
        min_walkway_width: 0.9,
        min_wall_to_wall: 12.75
    },
    four_lane: {
        lane_count: 4,
        min_lane_width: 3.65,
        min_shoulder_width: 3.0,
        min_walkway_width: 0.9
    }
};

// ============================================================================
// PROHIBITED OPERATIONS WITHIN TUNNELS
// ============================================================================
const PROHIBITED_OPERATIONS = [
    "weaving",
    "merging",
    "diverging",
    "lane_changes_at_portal",
    "exit_ramps_within_tunnel",
    "entrance_ramps_within_tunnel"
];

// ============================================================================
// EMERGENCY REQUIREMENTS
// ============================================================================
const EMERGENCY_REQUIREMENTS = {
    no_shoulder_condition: {
        requirement: "24/7 emergency service vehicles",
        description_ar: "مركبات خدمات طوارئ على مدار الساعة"
    },
    pedestrian_access: {
        requirement: "Space for emergency walking and maintenance access",
        description_ar: "مساحة للمشي في حالات الطوارئ والوصول للصيانة"
    },
    min_walkway_width: 0.9
};

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================
const SUMMARY = {
    total_articles: TUNNEL_ARTICLES.length,
    total_rules: TUNNEL_ARTICLES.reduce((sum, article) => sum + article.rules.length, 0),
    sources: [
        "TR-514: Road Geometric Design Manual, Second Edition - January 2022",
        "TR-541-1: Standard Drawing Guideline Part 1, Third Edition - June 2024"
    ],
    categories: [
        "Vertical Clearances",
        "Cross Section",
        "Alignment",
        "Traffic Operations",
        "Emergency and Maintenance",
        "Special Types"
    ]
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    TUNNEL_ARTICLES,
    RULE_TYPES,
    VERTICAL_CLEARANCES,
    TUNNEL_STANDARDS,
    TUNNEL_TYPES,
    LANE_CONFIGURATIONS,
    PROHIBITED_OPERATIONS,
    EMERGENCY_REQUIREMENTS,
    SUMMARY
};
