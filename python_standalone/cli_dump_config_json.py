"""
Dump python_standalone validation configuration as JSON (stdout only).

Used by Node /api/config so frontend can fetch the rule catalog without any Node-based validator.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure local imports resolve when executed from other working directories
sys.path.insert(0, str(Path(__file__).parent))

from config import get_all_articles  # noqa: E402


def main() -> int:
    try:
        payload = {"articles": get_all_articles()}
        sys.stdout.write(json.dumps(payload, ensure_ascii=False))
        sys.stdout.flush()
        return 0
    except Exception as e:
        print(f"[cli_dump_config_json] Error: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc(file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())


