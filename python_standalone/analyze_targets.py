import sys
import re
import math
from dxf_extractor import DXFExtractor

def analyze_dxf(dxf_path):
    try:
        extractor = DXFExtractor()
        blobs = extractor._extract_all_text_blobs(dxf_path)
        
        print(f"Analyzing {dxf_path} with {len(blobs)} text blobs...")
        
        # 1. Search for specific numbers
        targets = ["1062.6", "446.4", "394", "138.8", "Faisal", "5.5", "x", "X"]
        
        print("\n--- Searching for Targets ---")
        for b in blobs:
            text = b['text']
            layer = b['layer']
            
            for t in targets:
                if t in text:
                    print(f"FOUND {t}: '{text}' in Layer '{layer}'")
                    
        # 2. Look for Room Dimensions pattern (Number x Number)
        print("\n--- Looking for Room Dimensions ---")
        dim_pattern = re.compile(r'(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)')
        
        count = 0
        for b in blobs:
            text = b['text']
            if dim_pattern.search(text):
                print(f"DIMENSION FOUND: '{text.strip()}' at ({b['x']}, {b['y']}) Layer '{b['layer']}'")
                count += 1
                if count > 20: break

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')
    import sys
    analyze_dxf(sys.argv[1])
