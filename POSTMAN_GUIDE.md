# Postman API Testing Guide

## Quick Start

### 1. Start the API Server

```bash
npm run api
# or
node api_example.js
```

The server will start on: **http://localhost:3000**

---

## API Endpoints

### 1. Health Check (GET)

**URL:** `http://localhost:3600/api/health`

**Method:** `GET`

**Headers:** None required

**Body:** None

**Response:**
```json
{
  "status": "ok",
  "service": "Architectural Schema Validator",
  "version": "1.0.0"
}
```

**Postman Setup:**
- Method: `GET`
- URL: `http://localhost:3000/api/health`
- Click **Send**

---

### 2. Get Configuration (GET)

**URL:** `http://localhost:3600/api/config`

**Method:** `GET`

**Headers:** None required

**Body:** None

**Response:**
```json
{
  "article_id": "11",
  "title_en": "Element Areas and Internal Dimensions",
  "title_ar": "مساحات العناصر والأبعاد الداخلية",
  "rules": [...],
  "required_elements": [...],
  "optional_elements": [...]
}
```

**Postman Setup:**
- Method: `GET`
- URL: `http://localhost:3000/api/config`
- Click **Send**

---

### 3. Upload and Validate DWG File (POST) - **NEW!**

**URL:** `http://localhost:3600/api/validate-dwg`

**Method:** `POST`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:**
- Select **form-data** tab
- Add a key named: `dwg`
- Set type to: **File**
- Click **Select Files** and choose your DWG file (e.g., `888MOD20.dwg`)

**Response:**
```json
{
  "schema_pass": true,
  "element_results": [...],
  "summary": {...},
  "file_name": "888MOD20.dwg"
}
```

**Postman Setup:**
1. Method: `POST`
2. URL: `http://localhost:3600/api/validate-dwg`
3. Body tab:
   - Select: **form-data**
   - Key: `dwg` (type: File)
   - Value: Click and select your DWG file
4. Click **Send**

**Note:** This endpoint automatically:
- Converts DWG → DXF
- Extracts architectural elements
- Validates against Article 11 rules
- Returns validation results

---

### 4. Validate Schema (POST) - Simple Response

**URL:** `http://localhost:3600/api/validate`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (Option 1 - Direct Elements Array):**
```json
{
  "elements": [
    {
      "name": "main_hall",
      "area": 25,
      "width": 4.2,
      "ventilation": "natural"
    },
    {
      "name": "master_bedroom",
      "area": 16.5,
      "width": 4,
      "ventilation": "natural"
    },
    {
      "name": "additional_bedroom",
      "area": 14,
      "width": 3.2,
      "ventilation": "natural"
    },
    {
      "name": "kitchen",
      "area": 12,
      "width": 3.5,
      "ventilation": "natural"
    },
    {
      "name": "bathroom",
      "area": 6,
      "width": 2.5,
      "ventilation": "mechanical"
    },
    {
      "name": "toilet",
      "area": 3,
      "width": 1.5,
      "ventilation": "mechanical"
    }
  ]
}
```

**Body (Option 2 - JSON File Path):**
```json
{
  "json_path": "C:\\Users\\HP\\Documents\\plan_cursor\\converted\\plan_elements.json"
}
```

**Response:**
```json
{
  "schema_pass": true,
  "element_results": [
    {
      "element": "main_hall",
      "pass": true,
      "details": {
        "area": 25,
        "width": 4.2,
        "ventilation": "natural"
      }
    },
    {
      "element": "master_bedroom",
      "pass": true,
      "details": {
        "area": 16.5,
        "width": 4,
        "ventilation": "natural"
      }
    }
  ]
}
```

**Postman Setup:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/validate`
3. Headers tab:
   - Key: `Content-Type`
   - Value: `application/json`
4. Body tab:
   - Select: **raw**
   - Select: **JSON** (from dropdown)
   - Paste the JSON body above
5. Click **Send**

---

### 4. Validate Schema - Full Response (POST)

**URL:** `http://localhost:3600/api/validate-full`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:** Same as `/api/validate` (use `elements` or `json_path`)

**Response (includes summary):**
```json
{
  "schema_pass": true,
  "element_results": [...],
  "summary": {
    "total_elements": 6,
    "passed_elements": 6,
    "failed_elements": 0,
    "missing_required": 0,
    "required_elements": [
      "main_hall",
      "master_bedroom",
      "additional_bedroom",
      "bathroom",
      "toilet",
      "kitchen"
    ],
    "present_required": [
      "main_hall",
      "master_bedroom",
      "additional_bedroom",
      "bathroom",
      "toilet",
      "kitchen"
    ]
  }
}
```

**Postman Setup:**
- Same as `/api/validate` but use URL: `http://localhost:3000/api/validate-full`

---

## Postman Collection Setup

### Step-by-Step for `/api/validate`

1. **Create New Request**
   - Click **New** → **HTTP Request**
   - Name it: `Validate Schema`

2. **Set Method and URL**
   - Method: `POST`
   - URL: `http://localhost:3000/api/validate`

3. **Set Headers**
   - Go to **Headers** tab
   - Add header:
     - Key: `Content-Type`
     - Value: `application/json`

4. **Set Body**
   - Go to **Body** tab
   - Select **raw**
   - Select **JSON** from dropdown
   - Paste this JSON:

```json
{
  "elements": [
    {
      "name": "main_hall",
      "area": 25,
      "width": 4.2,
      "ventilation": "natural"
    },
    {
      "name": "master_bedroom",
      "area": 16.5,
      "width": 4,
      "ventilation": "natural"
    },
    {
      "name": "additional_bedroom",
      "area": 14,
      "width": 3.2,
      "ventilation": "natural"
    },
    {
      "name": "kitchen",
      "area": 12,
      "width": 3.5,
      "ventilation": "natural"
    },
    {
      "name": "bathroom",
      "area": 6,
      "width": 2.5,
      "ventilation": "mechanical"
    },
    {
      "name": "toilet",
      "area": 3,
      "width": 1.5,
      "ventilation": "mechanical"
    }
  ]
}
```

5. **Send Request**
   - Click **Send** button
   - View response in bottom panel

---

## Complete Postman Collection JSON

Save this as `postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "Architectural Schema Validator API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "Get Config",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/config",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "config"]
        }
      }
    },
    {
      "name": "Validate Schema",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"elements\": [\n    {\n      \"name\": \"main_hall\",\n      \"area\": 25,\n      \"width\": 4.2,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"master_bedroom\",\n      \"area\": 16.5,\n      \"width\": 4,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"additional_bedroom\",\n      \"area\": 14,\n      \"width\": 3.2,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"kitchen\",\n      \"area\": 12,\n      \"width\": 3.5,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"bathroom\",\n      \"area\": 6,\n      \"width\": 2.5,\n      \"ventilation\": \"mechanical\"\n    },\n    {\n      \"name\": \"toilet\",\n      \"area\": 3,\n      \"width\": 1.5,\n      \"ventilation\": \"mechanical\"\n    }\n  ]\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/validate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "validate"]
        }
      }
    },
    {
      "name": "Validate Schema Full",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"elements\": [\n    {\n      \"name\": \"main_hall\",\n      \"area\": 25,\n      \"width\": 4.2,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"master_bedroom\",\n      \"area\": 16.5,\n      \"width\": 4,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"additional_bedroom\",\n      \"area\": 14,\n      \"width\": 3.2,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"kitchen\",\n      \"area\": 12,\n      \"width\": 3.5,\n      \"ventilation\": \"natural\"\n    },\n    {\n      \"name\": \"bathroom\",\n      \"area\": 6,\n      \"width\": 2.5,\n      \"ventilation\": \"mechanical\"\n    },\n    {\n      \"name\": \"toilet\",\n      \"area\": 3,\n      \"width\": 1.5,\n      \"ventilation\": \"mechanical\"\n    }\n  ]\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/validate-full",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "validate-full"]
        }
      }
    }
  ]
}
```

---

## Request Body Keys

### Key: `elements` (Array of Objects)

Each element object must have:
- **`name`** (string, required): Element name (e.g., "main_hall", "kitchen")
- **`area`** (number, optional): Area in square meters
- **`width`** (number, optional): Width in meters
- **`ventilation`** (string, optional): "natural", "mechanical", or "natural_or_mechanical"

### Key: `json_path` (String)

Path to JSON file containing elements array:
- Example: `"C:\\Users\\HP\\Documents\\plan_cursor\\converted\\plan_elements.json"`
- File must contain array of element objects

---

## Valid Element Names

### Required Elements:
- `main_hall`
- `master_bedroom`
- `additional_bedroom`
- `bathroom`
- `toilet`
- `kitchen`

### Optional Elements:
- `living_space_bedroom`
- `service_space_under_4sqm`
- `service_space_4_to_9sqm`
- `service_space_over_9sqm`
- `garage`
- `staff_bedroom`
- `staff_bathroom`

---

## Testing Tips

1. **Start with Health Check**: Verify server is running
2. **Check Config**: See validation rules before testing
3. **Test with Sample Data**: Use the example JSON above
4. **Test Missing Elements**: Remove a required element to see validation fail
5. **Test Invalid Data**: Use area/width below minimums to see validation fail

---

## Common Errors

### 400 Bad Request
```json
{
  "error": "Either \"json_path\" or \"elements\" must be provided",
  "schema_pass": false,
  "element_results": []
}
```
**Solution:** Include either `elements` array or `json_path` in request body

### 500 Internal Server Error
```json
{
  "error": "JSON file not found: ...",
  "schema_pass": false,
  "element_results": []
}
```
**Solution:** Check that `json_path` points to an existing file

---

## Quick Test Commands

### Using cURL (Alternative to Postman)

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Validate:**
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d @test/sample_elements.json
```

---

## Example: Testing with Real Data

1. **Extract elements from DXF:**
   ```bash
   python python/dxf_extractor.py converted/plan.dxf
   ```
   This creates: `converted/plan_elements.json`

2. **Test in Postman:**
   - Use `json_path` in body:
   ```json
   {
     "json_path": "C:\\Users\\HP\\Documents\\plan_cursor\\converted\\plan_elements.json"
   }
   ```

3. **Or copy elements from JSON file:**
   - Open `converted/plan_elements.json`
   - Copy the array
   - Use in Postman with `elements` key

