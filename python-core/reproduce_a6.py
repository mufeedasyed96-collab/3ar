
import sys
import json
import os

# Add path to find modules
sys.path.insert(0, r"c:\Users\HP\Desktop\backend\mi3ar\miyar_backend\python-core")

from validators.article6_validator import validate_article6_geopandas

# Mock Data
mock_elements = []  # Empty elements
mock_metadata = {
    "plot_vertices": [], # Empty plot
    "building_vertices": []
}
mock_schema = {} # Empty schema

print("Running validate_article6_geopandas...")
results = validate_article6_geopandas(mock_elements, mock_metadata, mock_schema)

print(f"\nResults count: {len(results)}")
for r in results:
    print(f"Rule {r.get('rule_id')}: Pass={r.get('pass')}, Status={r.get('details', {}).get('status')}")

# Simulate main_validator logic
def _is_unknown(item):
    d = item.get("details") or {}
    status = str(d.get("status") or "").upper().strip()
    return status in ("UNKNOWN", "NOT_CHECKED")

def _article_counts(items):
    effective = [it for it in items if not _is_unknown(it)]
    passed = sum(1 for it in effective if it.get("pass") is True)
    failed = sum(1 for it in effective if it.get("pass") is not True)
    return {"total": len(effective), "passed": passed, "failed": failed}

counts = _article_counts(results)
print(f"\nCounts: {counts}")
