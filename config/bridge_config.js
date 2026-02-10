/**
 * Configuration module for Bridge geometry validation rules (VERIFIED FINAL)
 * Source: TR-514 Road Geometric Design Manual (Second Edition - 2022)
 *         TR-541-1: Standard Drawing Guideline Part 1
 * 
 * Rules included:
 * - Bridge Clearances & Dimensions (Verified in TR-514 Sec 7.4)
 * - Signage & Gantries (Verified in TR-541 Standards)
 */

// ============================================================================
// BRIDGE ARTICLES (VERIFIED TR-514)
// ============================================================================
const BRIDGE_ARTICLES = [
    // ============================================================================
    // SECTION 1: BRIDGE VERTICAL CLEARANCES
    // Source: TR-514 Section 7.4.9 (Page 353 Absolute)
    // ============================================================================
    {
        article_id: "B1",
        title_ar: "الخلوص الرأسي للجسور",
        title_en: "Bridge Vertical Clearances",
        rules: [
            {
                rule_id: "B1.1",
                description_ar: "الخلوص الرأسي للمنشآت العلوية على الطرق السريعة",
                description_en: "Highway overhead structures vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_highway_overhead",
                min_clearance_m: 6.5,
                source_ref: "TR-514 Sec 7.4.9",
                page_ref: "353",
                dwg_checkable: true,
                requires: ["elevation_data", "structure_profile"]
            },
            {
                rule_id: "B1.2",
                description_ar: "الخلوص الرأسي لجسور السكك الحديدية",
                description_en: "Railroad overpasses vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_railroad",
                min_clearance_m: 7.5,
                source_ref: "TR-514 Sec 7.4.9",
                page_ref: "353",
                dwg_checkable: true,
                requires: ["elevation_data", "structure_profile"]
            },
            {
                rule_id: "B1.3",
                description_ar: "الخلوص الرأسي لهياكل اللافتات",
                description_en: "Sign trusses/gantries vertical clearance",
                rule_type: "dimension_min",
                element: "vertical_clearance_sign_gantry",
                min_clearance_m: 6.5,
                source_ref: "TR-514 Sec 7.4.9",
                page_ref: "353",
                dwg_checkable: true,
                requires: ["elevation_data", "sign_positions"]
            }
        ],
        evidence: ["TR-514 Section 7.4.9 - Vertical Clearance"]
    },

    // ============================================================================
    // SECTION 2: BRIDGE HORIZONTAL CLEARANCES
    // Source: TR-514 Section 7.4.10 (Page 354 Absolute)
    // ============================================================================
    {
        article_id: "B2",
        title_ar: "الخلوص الأفقي للجسور",
        title_en: "Bridge Horizontal Clearances",
        rules: [
            {
                rule_id: "B2.1",
                description_ar: "الخلوص الأفقي للدعامات والجدران الاستنادية",
                description_en: "Retaining walls/piers horizontal clearance from shoulder edge",
                rule_type: "dimension_min",
                element: "horizontal_clearance_structure",
                min_clearance_m: 0.6,
                source_ref: "TR-514 Sec 7.4.10",
                page_ref: "354",
                notes: "Measured from outer edge of shoulder",
                dwg_checkable: true,
                requires: ["plan_geometry", "structure_layout"]
            },
            {
                rule_id: "B2.2",
                description_ar: "منطقة الاسترداد (Clear Zone) على الطرق السريعة",
                description_en: "Clear recovery area (Clear Zone)",
                rule_type: "dimension_min",
                element: "clear_zone_width",
                min_clearance_m: 9.0,
                source_ref: "TR-514 Sec 7.4.10",
                page_ref: "128",
                notes: "Approximately 9m traversable width",
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Section 7.4.10 - Roadside Design"]
    },

    // ============================================================================
    // SECTION 3: BRIDGE ROADWAY WIDTH
    // Source: TR-514 Section 7.4.8 (Page 354), Section 7.4.4 (Page 352)
    // ============================================================================
    {
        article_id: "B3",
        title_ar: "عرض طريق الجسر",
        title_en: "Bridge Roadway Width",
        rules: [
            {
                rule_id: "B3.1",
                description_ar: "استمرارية عرض الجسر",
                description_en: "Bridge clear width must equal approach roadway width",
                rule_type: "matching_dimension",
                element: "bridge_width_continuity",
                condition: "Equal to approach roadway",
                source_ref: "TR-514 Sec 7.4.8",
                page_ref: "354",
                dwg_checkable: true,
                requires: ["plan_geometry", "cross_section"]
            },
            {
                rule_id: "B3.2",
                description_ar: "عرض حارة المرور",
                description_en: "Through-traffic lane width",
                rule_type: "dimension",
                element: "lane_width",
                min_width_m: 3.65,
                source_ref: "TR-514 Sec 7.4.4",
                page_ref: "352",
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "B3.3",
                description_ar: "عرض الكتف الأيمن المرصوف",
                description_en: "Right paved shoulder width",
                rule_type: "dimension_min",
                element: "Right_shoulder_width",
                min_width_m: 3.0,
                notes: "3.65m if truck volume > 250 veh/h",
                source_ref: "TR-514 Sec 7.4.4",
                page_ref: "353",
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 7.4.4 - Travelled Way", "TR-514 Section 7.4.8 - Structures"]
    },

    // ============================================================================
    // SECTION 4: BARRIERS
    // Source: TR-514 Section 7.4.10 (Page 354)
    // ============================================================================
    {
        article_id: "B4",
        title_ar: "حواجز الجسور",
        title_en: "Bridge Barriers",
        rules: [
            {
                rule_id: "B4.1",
                description_ar: "متطلبات حاجز (انحدار شديد)",
                description_en: "Barrier warranted if slope > 1V:3H",
                rule_type: "design_rule",
                element: "barrier_warrant",
                condition: "Slope steeper than 1V:3H",
                source_ref: "TR-514 Sec 7.4.10",
                page_ref: "354",
                dwg_checkable: true,
                requires: ["cross_section"]
            }
        ],
        evidence: ["TR-514 Section 7.4.10 - Roadside Design"]
    },

    // ============================================================================
    // SECTION 5: BRIDGE GRADES
    // Source: TR-514 Section 7.4.6 (Page 353), Section 7.4.7 (Page 353)
    // ============================================================================
    {
        article_id: "B5",
        title_ar: "ميول الجسور",
        title_en: "Bridge Grades & Superelevation",
        rules: [
            {
                rule_id: "B5.1",
                description_ar: "الميل الجانبي (Cross Slope)",
                description_en: "Pavement cross slope",
                rule_type: "slope",
                element: "cross_slope",
                slope_percent: 2.0,
                source_ref: "TR-514 Sec 7.4.4",
                page_ref: "352",
                notes: "Sloping away from median",
                dwg_checkable: true,
                requires: ["cross_section"]
            },
            {
                rule_id: "B5.2",
                description_ar: "معدل الارتفاع الفائق (Superelevation)",
                description_en: "Superelevation Rate",
                rule_type: "slope_range",
                element: "superelevation",
                min_percent: 4.0,
                max_percent: 6.0,
                source_ref: "TR-514 Sec 7.4.6",
                page_ref: "353",
                notes: "Desirable 4%, Max 6%",
                dwg_checkable: true,
                requires: ["plan_geometry"]
            }
        ],
        evidence: ["TR-514 Section 7.4.6 - Superelevation"]
    }
];

// ============================================================================
// RULE TYPES FOR BRIDGES
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
        validation_method: "value === required_value"
    },
    matching_dimension: {
        description: "Dimension must match another element",
        validation_method: "value1 === value2"
    },
    slope: {
        description: "Fixed slope percentage",
        validation_method: "slope === target_slope"
    },
    slope_range: {
        description: "Slope must be within range",
        validation_method: "min <= slope <= max"
    },
    design_rule: {
        description: "Design requirement to be verified manually",
        validation_method: "manual_review"
    },
    structural: {
        description: "Structural requirement",
        validation_method: "structural_analysis"
    }
};

// ============================================================================
// LOOKUP TABLES
// ============================================================================
const VERTICAL_CLEARANCES = {
    highway_overhead: 6.5,
    urban_overhead: 6.0,
    signs_ventilation: 6.5,
    railroad_overpass: 7.5,
    sign_gantry_highway: 6.5
};

const HORIZONTAL_CLEARANCES = {
    structure_from_shoulder: 0.6,
    clear_zone_high_speed: 9.0
};

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================
const SUMMARY = {
    total_bridge_articles: BRIDGE_ARTICLES.length,
    total_rules: BRIDGE_ARTICLES.reduce((sum, article) => sum + article.rules.length, 0),
    sources: [
        "TR-514: Road Geometric Design Manual, Second Edition - January 2022 (Verified)",
        "TR-541-1: Standard Drawing Guideline Part 1 (Verified Standards)"
    ],
    categories: {
        bridges: [
            "Vertical Clearances",
            "Horizontal Clearances",
            "Roadway Width",
            "Barrier and Parapet",
            "Grades"
        ]
    }
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
    BRIDGE_ARTICLES,
    RULE_TYPES,
    VERTICAL_CLEARANCES,
    HORIZONTAL_CLEARANCES,
    SUMMARY
};
