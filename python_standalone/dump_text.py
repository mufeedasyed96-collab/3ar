import sys
from dxf_extractor import DXFExtractor

def dump_all_text(dxf_path):
    try:
        if sys.platform == "win32":
            sys.stdout.reconfigure(encoding='utf-8')
            
        extractor = DXFExtractor()
        blobs = extractor._extract_all_text_blobs(dxf_path)
        
        print(f"Dumping {len(blobs)} text blobs from {dxf_path}...")
        
        for i, b in enumerate(blobs):
            print(f"[{i}] Layer='{b['layer']}' Text='{b['text']}' Pos=({b['x']:.1f}, {b['y']:.1f})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    dump_all_text(sys.argv[1])
