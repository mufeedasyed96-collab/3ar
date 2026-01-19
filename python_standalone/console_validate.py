"""
Console script for validating DXF files
Usage: python console_validate.py <dxf_file> [output_json]
"""

import sys
import json
from pathlib import Path
from main_validator import SchemaValidator
from report_formatter import ReportFormatter


def main():
    if len(sys.argv) < 2:
        print("Usage: python console_validate.py <DXF_FILE> [OUTPUT_FILE]")
        print("\nExample:")
        print("  python console_validate.py plan.dxf")
        print("  python console_validate.py plan.dxf result.json")
        print("  python console_validate.py plan.dxf result.txt")
        sys.exit(1)
    
    dxf_file = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    dxf_path = Path(dxf_file)
    if not dxf_path.exists():
        # Try in uploads/
        if (Path("uploads") / dxf_file).exists():
            dxf_path = Path("uploads") / dxf_file
            dxf_file = str(dxf_path)
        else:
            print(f"Error: DXF file not found: {dxf_file}", file=sys.stderr)
            sys.exit(1)
    
    print(f"Validating DXF file: {dxf_file}", file=sys.stderr)
    
    try:
        validator = SchemaValidator()
        result = validator.validate_from_dxf(dxf_file)
        
        # Always generate the formatted report for console or .txt use
        formatter = ReportFormatter(result)
        formatted_report = formatter.format_report()
        
        # If output_path is provided, handle based on extension
        if output_path:
            if output_path.lower().endswith('.json'):
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                print(f"Results (JSON) saved to: {output_path}", file=sys.stderr)
            else:
                # Default to text report for .txt or other extensions
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(formatted_report)
                print(f"Results (Text) saved to: {output_path}", file=sys.stderr)
        else:
            # Otherwise print the pretty report to stdout
            print(formatted_report)
        
        # Determine if any rules failed
        any_failed = False
        for article in result.get('articles', []):
            for rule in article.get('rules', []):
                if rule.get('validation', {}).get('status') == "FAILED":
                    any_failed = True
                    break
            if any_failed: break
        
        sys.exit(1 if any_failed else 0)
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

