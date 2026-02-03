from dxf_extractor import DXFExtractor
from validators.article18_validator import validate_article18
from config import get_article

path = "uploads\\Faisal_Abdallah_Ali_-_Tender_Drawing-_24.10.2024.dxf"
ex = DXFExtractor()
elements = ex.parse_dxf(path)

# Replicate kitchen detection logic
import re
main_kitchens = []
specialized_kitchens = []
for e in elements:
    label = (e.get('original_label') or '').lower()
    name = e.get('name')
    if name == 'kitchen':
        if any(x in label for x in ['dirty', 'frying', 'cold', 'prep', 'specialized']):
            specialized_kitchens.append(e)
        else:
            main_kitchens.append(e)
        continue
    if label and re.search(r'\bkitchen\b', label):
        if any(x in label for x in ['sink', 'tap', 'ks']):
            continue
        if any(x in label for x in ['dirty', 'frying', 'cold', 'prep', 'specialized']):
            specialized_kitchens.append(e)
        else:
            main_kitchens.append(e)

print('Total main_kitchens found:', len(main_kitchens))
for k in main_kitchens[:10]:
    print(k.get('original_label'), 'area=', k.get('area'))
print('Total specialized_kitchens found:', len(specialized_kitchens))
for k in specialized_kitchens[:10]:
    print(k.get('original_label'), 'area=', k.get('area'))
