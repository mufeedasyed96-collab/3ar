import sys
from dxf_extractor import DXFExtractor

def analyze_polygons(dxf_file):
    extractor = DXFExtractor()
    insunits = extractor._read_insunits(dxf_file)
    print(f"INSUNITS: {insunits}")
    
    geometry = extractor._extract_geometry(dxf_file)
    print(f"Total geometry items: {len(geometry)}")
    
    candidates = []
    
    for geom in geometry:
        # Check closed
        is_closed = geom.get('closed', False)
        vertices = geom.get('vertices', [])
        if not is_closed and len(vertices) > 2:
            # Check dist
            d = ((vertices[0][0]-vertices[-1][0])**2 + (vertices[0][1]-vertices[-1][1])**2)**0.5
            if d < 0.1: is_closed = True
            
        if is_closed and len(vertices) > 2:
            raw_area = geom.get('area', 0)
            area_m2 = extractor._convert_area_to_m2(raw_area, insunits)
            if area_m2 > 10: # Filter tiny things
                layer = geom.get('layer', '')
                type_ = geom.get('type', '')
                candidates.append((area_m2, layer, type_))

    # Sort
    candidates.sort(key=lambda x: x[0], reverse=True)
    
    print("\nPolygons in potential Plot Area range (1060-1070 m²):")
    for area, layer, type_ in candidates:
        if 1060 <= area <= 1070:
            print(f"MATCH FOUND: Area: {area:.2f} m² | Layer: {layer}")

    print("\nScanning Title Block Text (0 < x < 10000):")
    blobs = extractor._extract_all_text_blobs(dxf_file)
    for b in blobs:
        if 0 < b['x'] < 10000 and 0 < b['y'] < 10000:
            print(f"TB Text: '{b['text']}' at ({b['x']:.1f}, {b['y']:.1f})")
    for area, layer, type_ in candidates:
        if 1000 < area < 1100:
             print(f"MATCH FOUND: Area: {area:.2f} m² | Layer: {layer} | Type: {type_}")

    print("\nLooking for ~446.4:")
    for area, layer, type_ in candidates:
        if 440 < area < 460:
             print(f"MATCH FOUND: Area: {area:.2f} m² | Layer: {layer} | Type: {type_}")

if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')
    analyze_polygons(sys.argv[1])
