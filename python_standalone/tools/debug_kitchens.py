from dxf_extractor import DXFExtractor
from pprint import pprint

path = "uploads\\Faisal_Abdallah_Ali_-_Tender_Drawing-_24.10.2024.dxf"
print("Parsing DXF:", path)
ex = DXFExtractor()
elements = ex.parse_dxf(path)

kitchens = [e for e in elements if e.get("name") == "kitchen" or (e.get("original_label") and "kitchen" in e.get("original_label", "").lower())]
print(f"Found kitchens: {len(kitchens)}")
for i, k in enumerate(kitchens, start=1):
    pprint({
        "idx": i,
        "name": k.get("name"),
        "label": k.get("original_label"),
        "area": k.get("area"),
        "floor": k.get("floor"),
        "layer": k.get("layer")
    })
