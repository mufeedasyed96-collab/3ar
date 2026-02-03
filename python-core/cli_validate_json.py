"""
Machine-friendly CLI for python-core validation.

Goals:
- Print ONLY JSON to stdout (so Node.js can JSON.parse reliably)
- Print logs/errors to stderr

Usage:
  python cli_validate_json.py --dxf path/to/file.dxf
  python cli_validate_json.py --elements-json path/to/elements.json
  cat payload.json | python cli_validate_json.py --stdin

Accepted JSON payloads for --elements-json/--stdin:
  - {"elements": [...], "metadata": {...}}
  - [...]  (treated as elements list, metadata = {})
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure local imports resolve when executed from other working directories
sys.path.insert(0, str(Path(__file__).parent))

from main_validator import SchemaValidator  # noqa: E402


def _eprint(*args: Any) -> None:
    print(*args, file=sys.stderr, flush=True)


def _load_elements_payload(payload: Any) -> Tuple[List[Dict], Dict]:
    if isinstance(payload, dict):
        elements = payload.get("elements")
        metadata = payload.get("metadata") or {}
        if not isinstance(elements, list):
            raise ValueError('Expected JSON object with key "elements" as a list')
        if not isinstance(metadata, dict):
            raise ValueError('Expected JSON object with key "metadata" as an object')
        return elements, metadata
    if isinstance(payload, list):
        return payload, {}
    raise ValueError("Expected JSON to be either an object or an array")


def main() -> int:
    parser = argparse.ArgumentParser(description="python_standalone validator (JSON stdout)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dxf", help="Path to DXF file to validate")
    group.add_argument(
        "--elements-json",
        help='Path to JSON payload ({"elements":[...], "metadata":{...}} or a raw array of elements)',
    )
    group.add_argument("--stdin", action="store_true", help="Read JSON payload from stdin")

    args = parser.parse_args()
    validator = SchemaValidator()

    try:
        if args.dxf:
            dxf_path = Path(args.dxf)
            if not dxf_path.exists():
                raise FileNotFoundError(f"DXF file not found: {dxf_path}")
            result = validator.validate_from_dxf(str(dxf_path))
        else:
            if args.stdin:
                payload = json.load(sys.stdin)
            else:
                p = Path(args.elements_json)
                if not p.exists():
                    raise FileNotFoundError(f"Elements JSON file not found: {p}")
                with open(p, "r", encoding="utf-8") as f:
                    payload = json.load(f)

            elements, metadata = _load_elements_payload(payload)
            result = validator.validate_schema(elements, metadata)

        sys.stdout.write(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
        return 0
    except Exception as e:
        _eprint(f"[cli_validate_json] Error: {e}")
        # Helpful stack trace for Node logs while keeping stdout clean
        import traceback

        traceback.print_exc(file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())


