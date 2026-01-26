import sys
import json
from config import get_article
from validators.article6_validator import validate_article6_geopandas

elements = []
metadata = {}
article_schema = get_article("6")

results = validate_article6_geopandas(elements, metadata, article_schema)
print(json.dumps(results, indent=2))
