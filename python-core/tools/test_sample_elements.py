"""
Lightweight test runner for python_standalone validation (no Node validator).

Reads sample elements from `miyar_backend/test/sample_elements.json` and runs validation.
Exit code:
  0 => schema_pass true
  1 => schema_pass false OR unexpected error
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure local imports resolve
ROOT = Path(__file__).resolve().parents[1]  # python-core/
sys.path.insert(0, str(ROOT))

from main_validator import SchemaValidator  # noqa: E402


def main() -> int:
    sample_path = (ROOT.parent / "test" / "sample_elements.json").resolve()
    if not sample_path.exists():
        print(f"[test_sample_elements] Missing: {sample_path}", file=sys.stderr)
        return 1

    with open(sample_path, "r", encoding="utf-8") as f:
        elements = json.load(f)

    validator = SchemaValidator()
    result = validator.validate_schema(elements, metadata={})

    schema_pass = bool(result.get("schema_pass"))
    print(json.dumps({"schema_pass": schema_pass, "summary": result.get("summary")}, ensure_ascii=False, indent=2))
    return 0 if schema_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())


