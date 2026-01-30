"""
Diagnostic: Check Article 6 Backend Response
This script simulates the exact scenario and prints the raw backend response
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from validators.article6_validator import validate_article6_geopandas

# Simulate missing setback data
mock_elements = []
mock_metadata = {
    "plot_vertices": [],
    "building_vertices": [],
}
mock_schema = {"article_id": "6", "rules": []}

print("=" * 80)
print("DIAGNOSTIC: Article 6 Backend Response")
print("=" * 80)

results = validate_article6_geopandas(mock_elements, mock_metadata, mock_schema)

print("\nRAW BACKEND RESPONSE:")
print(json.dumps(results, indent=2))

print("\n" + "=" * 80)
print("ANALYSIS:")
for i, r in enumerate(results):
    print(f"\nRule {i+1}:")
    print(f"  rule_id: {r.get('rule_id')}")
    print(f"  pass: {r.get('pass')}")
    print(f"  status: {r.get('details', {}).get('status')}")
    print(f"  note: {r.get('details', {}).get('note', '')[:100]}...")

print("\n" + "=" * 80)
