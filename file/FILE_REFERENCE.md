# Document Parsing System - File Reference

## Passport Parsing

| File | Purpose |
|------|---------|
| `index.js` | Main entry point for passport processing. Exports `processPassport()` |
| `mrz-parser.js` | MRZ (Machine Readable Zone) parsing with checksum validation |
| `ocr-engine.js` | OCR extraction using Tesseract.js |
| `parser-engine.js` | Visual text parsing fallback |
| `server.js` | Express API server with `/api/passport/parse` endpoint |

### Usage
```bash
# CLI
node index.js passport.pdf

# API
POST http://localhost:3000/api/passport/parse
```

### Output Fields
- `full_name`, `surname`, `given_names`
- `nationality`, `nationality_code`
- `document_type`, `issuing_country`

---

## Emirates ID Parsing

| File | Purpose |
|------|---------|
| `eid-index.js` | Main entry point for EID processing. Exports `processEmiratesID()` |
| `eid-parser.js` | EID field extraction (name, nationality, EID number) |
| `ocr-engine.js` | Shared OCR engine |

### Usage
```bash
node eid-index.js eid/eid.pdf
node eid-index.js eid/eid-image.jpg
```

### Output Fields
- `full_name`
- `nationality`, `nationality_code`
- `eid_number` (format: 784-XXXX-XXXXXXX-X)

---

## Shared Dependencies

| File | Purpose |
|------|---------|
| `ocr-engine.js` | Tesseract.js wrapper for PDF and image OCR |
| `lib/country-codes.js` | ISO-3166 alpha-3 country code mapping (240+ countries) |
| `lib/name-normalizer.js` | Name cleanup and smart splitting |

---

## Supported File Formats

| Format | Passport | Emirates ID |
|--------|----------|-------------|
| PDF | ✅ | ✅ |
| JPG/JPEG | ✅ | ✅ |
| PNG | ✅ | ✅ |
