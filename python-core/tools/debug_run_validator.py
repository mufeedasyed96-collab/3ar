from main_validator import SchemaValidator
from report_formatter import ReportFormatter
import traceback

path = "uploads\\Faisal_Abdallah_Ali_-_Tender_Drawing-_24.10.2024.dxf"
print("Running validator for:", path)
try:
    v = SchemaValidator()
    result = v.validate_from_dxf(path)
    print("Validation result keys:", list(result.keys()))
    # Print Article 18 kitchen rule results
    articles = result.get('articles', [])
    for art in articles:
        if art.get('article_id') == '18':
            print('\nArticle 18 results:')
            for r in art.get('rules', []):
                if r.get('rule_type') == 'kitchen':
                    print(r.get('rule_id'), r.get('validation', {}))
    # Print Article 13 stair rule results
    for art in articles:
        if art.get('article_id') == '13':
            print('\nArticle 13 results:')
            for r in art.get('rules', []):
                print(r.get('rule_id'), r.get('validation', {}))
    formatter = ReportFormatter(result)
    report = formatter.format_report()
    print('\n--- Report snippet ---\n')
    print(report[:1200])
except BaseException as e:
    print("BaseException:", type(e), e)
    traceback.print_exc()
