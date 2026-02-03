"""
Test Article 6 Validator with Missing Setback Data
This script simulates a DXF file without plot/building vertices to verify
that Article 6 correctly returns failed results.
"""

import sys
import json
from pathlib import Path

# Add path to find modules
sys.path.insert(0, str(Path(__file__).parent))

from validators.article6_validator import validate_article6_geopandas

# Mock data: Empty plot and building vertices (simulating missing setback data)
mock_elements = []
mock_metadata = {
    "plot_vertices": [],  # Empty - no plot data
    "building_vertices": [],  # Empty - no building data
    "plot_area_m2": None,
    "building_area_m2": None,
    "insunits": 4  # millimeters
}
mock_schema = {
    "article_id": "6",
    "rules": [
        {
            "rule_id": "6.1",
            "constraints": [
                {"boundary_type": "street_facing", "min_setback_m": 2.0},
                {"boundary_type": "other_boundaries", "min_setback_m": 1.5}
            ]
        }
    ]
}

print("=" * 80)
print("TEST: Article 6 Validator with Missing Setback Data")
print("=" * 80)
print("\nInput:")
print(f"  Plot vertices: {mock_metadata['plot_vertices']}")
print(f"  Building vertices: {mock_metadata['building_vertices']}")
print()

# Run validator
results = validate_article6_geopandas(mock_elements, mock_metadata, mock_schema)

print(f"Results count: {len(results)}")
print()

# Analyze results
passed_count = 0
failed_count = 0
unknown_count = 0

for r in results:
    rule_id = r.get('rule_id')
    passed = r.get('pass')
    status = r.get('details', {}).get('status', 'N/A')
    note = r.get('details', {}).get('note', 'N/A')
    
    if status.upper() in ['UNKNOWN', 'NOT_CHECKED']:
        unknown_count += 1
    elif passed:
        passed_count += 1
    else:
        failed_count += 1
    
    print(f"Rule {rule_id}:")
    print(f"  Pass: {passed}")
    print(f"  Status: {status}")
    print(f"  Note: {note}")
    print()

print("=" * 80)
print("SUMMARY:")
print(f"  Total rules: {len(results)}")
print(f"  Passed: {passed_count}")
print(f"  Failed: {failed_count}")
print(f"  Unknown/Not Checked: {unknown_count}")
print()

# Expected behavior
print("EXPECTED BEHAVIOR:")
print("  ✓ All rules should have pass=False")
print("  ✓ All rules should have status='FAIL'")
print("  ✓ Frontend should display '0/6' (non-compliant)")
print()

# Verify
all_failed = all(not r.get('pass') for r in results)
all_fail_status = all(
    r.get('details', {}).get('status', '').upper() == 'FAIL' 
    for r in results
)

if all_failed and all_fail_status:
    print("✅ TEST PASSED: All rules correctly marked as FAILED")
else:
    print("❌ TEST FAILED: Some rules not marked correctly")
    if not all_failed:
        print("  - Not all rules have pass=False")
    if not all_fail_status:
        print("  - Not all rules have status='FAIL'")

print("=" * 80)
