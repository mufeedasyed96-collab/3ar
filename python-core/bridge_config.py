"""
Configuration module for Bridge / Structure geometry validation rules (DWG-checkable)
Source: Road Geometric Design Manual (First Edition - Dec 2016) – values extracted from PDF
"""

BRIDGE_ARTICLES = [
  {
    "article_id": "B1",
    "title_ar": "الخلوص الرأسي للمنشآت فوق الطرق",
    "title_en": "Minimum Vertical Clearances (Structures Over Roadways)",
    "rules": [
      {
        "rule_id": "B1.1",
        "description_ar": "الخلوص الرأسي الأدنى للطرق تحت الجسور/جسور المشاة/لوحات الإرشاد (عام)",
        "description_en": "Minimum vertical clearance for roadways passing under roadway structures, pedestrian overpasses, and sign structures (general)",
        "rule_type": "dimension_min_by_context",
        "element": "vertical_clearance_under_structure",
        "min_height_m": {
          "general": 6.5,
          "urban": 6.0
        },
        "dwg_checkable": "partial",
        "requires": ["section_or_profile_or_3d_model"],
        "notes": "Applies over the entire roadway width including auxiliary lanes and shoulders."
      },
      {
        "rule_id": "B1.2",
        "description_ar": "الخلوص الرأسي الأدنى للطرق داخل الأنفاق",
        "description_en": "Minimum vertical clearance for roadways within tunnels",
        "rule_type": "dimension_min_by_context",
        "element": "vertical_clearance_in_tunnel",
        "min_height_m": {
          "general": 6.5,
          "urban": 6.0
        },
        "dwg_checkable": "partial",
        "requires": ["section_or_profile_or_3d_model"],
        "notes": "Add allowance for future resurfacing."
      },
      {
        "rule_id": "B1.3",
        "description_ar": "الخلوص الرأسي الأدنى للأنفاق الخاصة بالمشاة",
        "description_en": "Minimum vertical clearance for pedestrian tunnels",
        "rule_type": "dimension_min",
        "element": "vertical_clearance_pedestrian_tunnel",
        "min_height_m": 3.5,
        "dwg_checkable": "partial",
        "requires": ["section_or_profile_or_3d_model"]
      },
      {
        "rule_id": "B1.4",
        "description_ar": "الخلوص الرأسي الأدنى لممرات الجِمال (Underpasses)",
        "description_en": "Minimum vertical clearance for camel underpasses",
        "rule_type": "dimension_min",
        "element": "vertical_clearance_camel_underpass",
        "min_height_m": 6.5,
        "dwg_checkable": "partial",
        "requires": ["section_or_profile_or_3d_model"]
      },
      {
        "rule_id": "B1.5",
        "description_ar": "الخلوص الرأسي المؤقت لمسارات التحويلة (Detours)",
        "description_en": "Temporary minimum vertical clearance for detour routes",
        "rule_type": "dimension_min",
        "element": "vertical_clearance_detour",
        "min_height_m": 6.0,
        "dwg_checkable": "partial",
        "requires": ["section_or_profile_or_3d_model"]
      }
    ],
    "evidence": [
      "6.5 Minimum Vertical Clearances section (structures/pedestrian overpasses/signs, tunnels, pedestrian tunnels, camel underpasses, detours)"
    ]
  },

  {
    "article_id": "B2",
    "title_ar": "الخلوص الرأسي فوق السكك الحديدية",
    "title_en": "Railroad Overpasses – Minimum Vertical Clearance",
    "rules": [
      {
        "rule_id": "B2.1",
        "description_ar": "الخلوص الأدنى فوق السكك الحديدية",
        "description_en": "Minimum clearance over railways (from top of rail)",
        "rule_type": "dimension_min",
        "element": "vertical_clearance_over_rail",
        "min_height_m": 7.5,
        "dwg_checkable": "partial",
        "requires": ["section_or_profile_or_3d_model"],
        "notes": "Additional allowance may be needed for future track adjustments."
      }
    ],
    "evidence": [
      "Railroad Overpasses minimum 7.5 m from top of rail"
    ]
  },

  {
    "article_id": "B3",
    "title_ar": "الخلوص فوق القنوات الملاحية",
    "title_en": "Bridges Over Channels – Navigable Overhead Clearance",
    "rules": [
      {
        "rule_id": "B3.1",
        "description_ar": "الخلوص الأدنى فوق القنوات الملاحية (فوق منسوب المد العالي)",
        "description_en": "Minimum overhead clearance within navigable shipping channels (above high-tide water level)",
        "rule_type": "dimension_min",
        "element": "navigable_channel_overhead_clearance",
        "min_height_m": 8.5,
        "dwg_checkable": "partial",
        "requires": ["hydraulic_levels", "section_or_3d_model"],
        "notes": "Navigable width is as required by applicable authorities."
      }
    ],
    "evidence": [
      "Channel Crossings minimum overhead clearance > 8.5 m above high-tide water level"
    ]
  },

  {
    "article_id": "B4",
    "title_ar": "عرض المسار الصافي على الجسر",
    "title_en": "Bridge Clear Roadway Width (Deck Width Used by Traffic)",
    "rules": [
      {
        "rule_id": "B4.1",
        "description_ar": "عرض المسار الصافي على الجسر يجب أن يساوي عرض الطريق المقترب (Approach Roadway Width)",
        "description_en": "Bridge clear roadway width shall match the full approach roadway width",
        "rule_type": "dimension_match",
        "element": "bridge_clear_roadway_width",
        "match_target": "approach_roadway_width",
        "dwg_checkable": True,
        "requires": ["plan_or_section_geometry"],
        "notes": "Several design-criteria tables state: 'Clear Roadway Width = Full Approach Roadway Width' or refer to Table 8-6."
      }
    ],
    "evidence": [
      "Design-criteria tables referencing bridge clear roadway width (approach roadway width / see Table 8-6)"
    ]
  },

  {
    "article_id": "B5",
    "title_ar": "تصميم الدعامات والجدران الاستنادية",
    "title_en": "Abutment and Retaining Wall Design",
    "rules": [
      {
        "rule_id": "B5.1",
        "description_ar": "الخلوص الأفقي الأدنى بين حافة الطريق والدعامات",
        "description_en": "Minimum horizontal clearance between roadway edge and abutments",
        "rule_type": "dimension_min",
        "element": "horizontal_clearance_abutment",
        "min_dist_m": 1.5,
        "dwg_checkable": "partial",
        "requires": ["plan_geometry"]
      }
    ],
    "evidence": ["Section 8.7 Abutment setbacks"]
  },

  {
    "article_id": "B6",
    "title_ar": "إنارة الجسر واللوحات الإرشادية",
    "title_en": "Bridge Lighting and Signage Requirements",
    "rules": [
      {
        "rule_id": "B6.1",
        "description_ar": "انتظام الإنارة على سطح الجسر",
        "description_en": "Uniformity of lighting on bridge deck surface",
        "rule_type": "boolean",
        "element": "lighting_uniformity",
        "dwg_checkable": False,
        "requires": ["electrical_lighting_plan"]
      }
    ],
    "evidence": ["Section 12.3 Lighting for bridge structures"]
  }
]
