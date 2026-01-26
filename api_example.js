/**
 * API Example: Express.js endpoint for schema validation
 * Provides Postman-ready JSON response
 */

const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 8225;

// CORS Middleware - Allow requests from frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename, add timestamp only if file exists to avoid conflicts
    const originalName = file.originalname;
    let finalName = originalName;
    let counter = 1;
    while (fs.existsSync(path.join(uploadsDir, finalName))) {
      const ext = path.extname(originalName);
      const name = path.basename(originalName, ext);
      finalName = `${name}_${counter}${ext}`;
      counter++;
    }
    cb(null, finalName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only DWG files
    if (file.mimetype === 'application/acad' ||
      file.mimetype === 'application/x-autocad' ||
      file.originalname.toLowerCase().endsWith('.dwg')) {
      cb(null, true);
    } else {
      cb(new Error('Only DWG files are allowed'), false);
    }
  }
});

// Separate uploader for PDF (used for external webhook processing)
const uploadPdf = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Serve static files (for uploaded DWG files)
app.use('/uploads', express.static('uploads'));

// -----------------------------------------------------------------------------
// Python orchestration helpers (Node.js is HTTP wrapper only)
// -----------------------------------------------------------------------------
const DEFAULT_VENV_PYTHON = path.join(__dirname, 'python_standalone', 'venv', 'Scripts', 'python.exe');
const DEFAULT_VENV_CFG = path.join(__dirname, 'python_standalone', 'venv', 'pyvenv.cfg');
const FALLBACK_SYSTEM_PYTHON = "C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";

function resolvePythonExe() {
  const envPy = process.env.PYTHON_EXE;
  if (envPy) {
    if (fs.existsSync(envPy)) return envPy;
    console.warn(`[Python] WARNING: PYTHON_EXE is set but path does not exist: ${envPy}`);
  }

  // The repo may contain a venv created on another machine (pyvenv.cfg points to a non-existent base python).
  // Only use it if it appears valid on this machine.
  if (fs.existsSync(DEFAULT_VENV_PYTHON)) {
    try {
      if (fs.existsSync(DEFAULT_VENV_CFG)) {
        const cfg = fs.readFileSync(DEFAULT_VENV_CFG, 'utf8');
        const m = cfg.match(/^\s*executable\s*=\s*(.+)\s*$/mi);
        if (m && m[1]) {
          const baseExe = m[1].trim();
          if (!fs.existsSync(baseExe)) {
            console.warn(`[Python] WARNING: Skipping bundled venv because base python is missing: ${baseExe}`);
          } else {
            return DEFAULT_VENV_PYTHON;
          }
        } else {
          // If we can't detect the base executable, still try to use it (best effort)
          return DEFAULT_VENV_PYTHON;
        }
      } else {
        return DEFAULT_VENV_PYTHON;
      }
    } catch (e) {
      // If anything goes wrong reading cfg, don't block startup—just try the venv.
      return DEFAULT_VENV_PYTHON;
    }
  }
  if (fs.existsSync(FALLBACK_SYSTEM_PYTHON)) return FALLBACK_SYSTEM_PYTHON;

  // Last resort: let spawn try "python" from PATH
  return 'python';
}

// Prefer:
// 1) PYTHON_EXE env var (if it exists)
// 2) Bundled python_standalone venv (ships GeoPandas etc.)
// 3) Fallback system python path
// 4) python from PATH
const PYTHON_EXE = resolvePythonExe();
console.log(`[Python] Using interpreter: ${PYTHON_EXE}`);

const ODA_PATH =
  process.env.ODA_PATH ||
  "C:\\Program Files\\ODA\\ODAFileConverter 26.10.0\\ODAFileConverter.exe";

if (!fs.existsSync(ODA_PATH)) {
  console.warn(`[ODA] WARNING: ODA_PATH does not exist: ${ODA_PATH}`);
  console.warn(`[ODA] Set ODA_PATH env var to your ODAFileConverter.exe full path.`);
} else {
  console.log(`[ODA] Using converter: ${ODA_PATH}`);
}

function spawnPythonJson({ scriptPath, args = [], cwd, stdinJson }) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
      cwd: cwd || __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      // Keep backend logs useful, but don't spam successful output
      const s = data.toString();
      if (s.trim()) console.error('[Python]', s.trim());
    });

    child.on('error', (err) => reject(err));

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python exited with code ${code}. stderr=${stderr || '(empty)'} stdout=${stdout || '(empty)'}`));
      }
      try {
        // Some Python modules may accidentally print to stdout (or emit a BOM),
        // which breaks JSON.parse. Be resilient: attempt to extract the JSON object.
        const raw = (stdout || '').trim();
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (_e) {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          if (start >= 0 && end > start) {
            const sliced = raw.slice(start, end + 1);
            parsed = JSON.parse(sliced);
          } else {
            throw _e;
          }
        }
        return resolve({ json: parsed, stdout, stderr });
      } catch (e) {
        return reject(new Error(`Failed to parse Python JSON output: ${e.message}. stdout=${stdout || '(empty)'} stderr=${stderr || '(empty)'}`));
      }
    });

    if (stdinJson !== undefined) {
      try {
        child.stdin.write(JSON.stringify(stdinJson));
      } catch (e) {
        // ignore
      }
    }
    child.stdin.end();
  });
}

function spawnPython({ scriptPath, args = [], cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
      cwd: cwd || __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      const s = data.toString();
      if (s.trim()) console.error('[Python]', s.trim());
    });

    child.on('error', (err) => reject(err));

    child.on('close', (code) => {
      resolve({ code, stdout, stderr, success: code === 0 });
    });
  });
}

/**
 * POST /api/pdf-compliance
 * Proxy endpoint: uploads PDF to n8n webhook and returns its response.
 *
 * This avoids browser CORS issues by doing server-to-server request.
 *
 * Env:
 * - PDF_COMPLIANCE_WEBHOOK_URL: production webhook (recommended)
 *   Example: https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance
 * Fallback (test):
 * - https://malakmalak01.app.n8n.cloud/webhook-test/architectural-compliance
 */
app.post('/api/pdf-compliance', uploadPdf.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF uploaded. Please upload a file with field name "file".' });
  }

  const webhookTestUrl = 'https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance';
  const webhookProdUrl = 'https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance';

  // Priority:
  // 1) PDF_COMPLIANCE_WEBHOOK_URL (explicit override)
  // 2) PDF_COMPLIANCE_WEBHOOK_MODE=test|prod
  // 3) NODE_ENV: production => prod, otherwise => test
  const mode =
    (process.env.PDF_COMPLIANCE_WEBHOOK_MODE || '').toLowerCase() ||
    (process.env.NODE_ENV === 'production' ? 'prod' : 'test');

  const webhookUrl =
    process.env.PDF_COMPLIANCE_WEBHOOK_URL ||
    (mode === 'prod' ? webhookProdUrl : webhookTestUrl);

  const pdfPath = req.file.path;

  try {
    console.log(`[PDF Compliance] Forwarding "${req.file.originalname}" to webhook: ${webhookUrl}`);
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype || 'application/pdf',
    });

    // Optional metadata (ignored if workflow doesn't use it)
    if (req.body && req.body.language) form.append('language', String(req.body.language));
    form.append('file_name', req.file.originalname);
    form.append('file_type', req.file.mimetype || 'application/pdf');

    const response = await axios.post(webhookUrl, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 5 * 60 * 1000, // 5 minutes
      validateStatus: () => true,
    });

    console.log(`[PDF Compliance] Webhook responded with status: ${response.status}`);

    if (response.status < 200 || response.status >= 300) {
      const hint =
        response.status === 404 && webhookUrl.includes('/webhook-test/')
          ? 'n8n test webhook is not active. Open the workflow and click "Listen for test event", or use the production webhook URL (/webhook/...).'
          : undefined;

      return res.status(502).json({
        error: `Webhook returned ${response.status}`,
        hint,
        details: response.data,
      });
    }

    // If the workflow returns a details URL, fetch it server-to-server to avoid browser CORS issues
    let data = response.data;
    try {
      const detailsUrl = data?.details_url || data?.detailsUrl;
      if (detailsUrl && typeof detailsUrl === 'string') {
        const detailsRes = await axios.get(detailsUrl, {
          timeout: 5 * 60 * 1000,
          validateStatus: () => true,
        });
        if (detailsRes.status >= 200 && detailsRes.status < 300 && detailsRes.data && typeof detailsRes.data === 'object') {
          data = { ...data, ...detailsRes.data };
        }
      }
    } catch (e) {
      // Ignore details fetch failures; return primary response
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Failed to call PDF compliance webhook',
    });
  } finally {
    // Cleanup uploaded file
    try {
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    } catch (e) {
      // ignore
    }
  }
});

/**
 * POST /api/validate
 * Validates architectural schema from extracted JSON
 * 
 * Body: { "json_path": "path/to/elements.json" }
 * Or: { "elements": [...] } (direct element array)
 */
app.post('/api/validate', async (req, res) => {
  try {
    let validationResult;

    const cli = path.join(__dirname, 'python_standalone', 'cli_validate_json.py');

    if (req.body.elements) {
      // Validate via python_standalone from elements payload
      const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
      const out = await spawnPythonJson({ scriptPath: cli, args: ['--stdin'], cwd: path.join(__dirname, 'python_standalone'), stdinJson: payload });
      validationResult = out.json;
    } else if (req.body.json_path) {
      // Validate via python_standalone from elements.json file path
      const out = await spawnPythonJson({ scriptPath: cli, args: ['--elements-json', req.body.json_path], cwd: path.join(__dirname, 'python_standalone') });
      validationResult = out.json;
    } else {
      return res.status(400).json({
        error: 'Either "json_path" or "elements" must be provided',
        schema_pass: false,
        element_results: []
      });
    }

    // Postman-friendly minimal response
    res.json({
      schema_pass: validationResult.schema_pass,
      article_11_results: validationResult.article_11_results || []
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      schema_pass: false,
      element_results: []
    });
  }
});

/**
 * POST /api/validate-full
 * Full pipeline: accepts JSON from Python extraction
 * Returns complete validation with summary
 */
app.post('/api/validate-full', async (req, res) => {
  try {
    let validationResult;
    const cli = path.join(__dirname, 'python_standalone', 'cli_validate_json.py');

    if (req.body.elements) {
      const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
      const out = await spawnPythonJson({ scriptPath: cli, args: ['--stdin'], cwd: path.join(__dirname, 'python_standalone'), stdinJson: payload });
      validationResult = out.json;
    } else if (req.body.json_path) {
      const out = await spawnPythonJson({ scriptPath: cli, args: ['--elements-json', req.body.json_path], cwd: path.join(__dirname, 'python_standalone') });
      validationResult = out.json;
    } else {
      return res.status(400).json({
        error: 'Either "json_path" or "elements" must be provided',
        schema_pass: false,
        element_results: [],
        summary: null
      });
    }

    res.json(validationResult);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      schema_pass: false,
      element_results: [],
      summary: null
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Architectural Schema Validator',
    version: '1.0.0'
  });
});

/**
 * POST /api/validate-dwg
 * Upload DWG file and validate schema
 * Accepts multipart/form-data with 'dwg' field
 */
app.post('/api/validate-dwg', upload.single('dwg'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No DWG file uploaded. Please upload a file with field name "dwg"',
      schema_pass: false,
      element_results: []
    });
  }

  const dwgFile = req.file.path;
  const convertedDir = path.join(__dirname, 'converted');
  if (!fs.existsSync(convertedDir)) {
    fs.mkdirSync(convertedDir, { recursive: true });
  }

  try {
    // Step 1: DWG -> DXF (Python converter; Node only orchestrates)
    const baseName = path.basename(dwgFile, path.extname(dwgFile));
    const expectedDxfPath = path.join(convertedDir, `${baseName}.dxf`);

    const dwgConverterScript = path.join(__dirname, 'python_standalone', 'dwg_converter.py');
    if (!fs.existsSync(ODA_PATH)) {
      throw new Error(`ODA File Converter not found at: ${ODA_PATH}. Set ODA_PATH env var to your ODAFileConverter.exe path.`);
    }
    const conv = await spawnPython({
      scriptPath: dwgConverterScript,
      args: [ODA_PATH, dwgFile, convertedDir],
      cwd: __dirname,
    });

    if (!conv.success) {
      throw new Error(`DWG->DXF conversion failed. ${conv.stderr || conv.stdout || ''}`);
    }

    // Locate DXF (prefer expected)
    let dxfPath = expectedDxfPath;
    if (!fs.existsSync(dxfPath)) {
      // Fallback: find newest DXF in convertedDir
      const dxfs = fs
        .readdirSync(convertedDir)
        .filter((f) => f.toLowerCase().endsWith('.dxf'))
        .map((f) => {
          const p = path.join(convertedDir, f);
          const st = fs.statSync(p);
          return { p, mtime: st.mtimeMs, size: st.size };
        })
        .filter((x) => x.size > 0)
        .sort((a, b) => b.mtime - a.mtime);

      if (!dxfs.length) {
        throw new Error(`DXF file not found after conversion. Expected: ${expectedDxfPath}`);
      }
      dxfPath = dxfs[0].p;
    }

    // Step 2: Validate + extract via python_standalone (prints JSON only)
    const standaloneCli = path.join(__dirname, 'python_standalone', 'cli_validate_json.py');
    const out = await spawnPythonJson({
      scriptPath: standaloneCli,
      args: ['--dxf', dxfPath],
      cwd: path.join(__dirname, 'python_standalone'),
    });

    // Cleanup uploaded DWG file
    try {
      if (fs.existsSync(dwgFile)) fs.unlinkSync(dwgFile);
    } catch (e) {
      // ignore
    }

    const result = out.json || {};
    // Ensure the original upload filename is surfaced for frontend reference codes
    result.file_name = req.file.originalname;

    return res.json(result);

  } catch (error) {
    // Log upload/initialization error to console
    console.error('\n=== UPLOAD/INITIALIZATION ERROR ===');
    console.error('[Upload Error]', error);
    console.error('[Upload Error] Message:', error.message);
    if (error.stack) {
      console.error('[Upload Error] Stack:', error.stack);
    }
    console.error('====================================\n');

    // Cleanup uploaded file
    try {
      if (dwgFile && fs.existsSync(dwgFile)) {
        fs.unlinkSync(dwgFile);
      }
    } catch (cleanupError) {
      console.error('[Cleanup Error]', cleanupError);
    }

    // Check if response already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message,
        schema_pass: false,
        element_results: []
      });
    }
  }
});

/**
 * GET /api/config
 * Returns current validation configuration
 */
app.get('/api/config', (req, res) => {
  (async () => {
    try {
      const script = path.join(__dirname, 'python_standalone', 'cli_dump_config_json.py');
      const out = await spawnPythonJson({
        scriptPath: script,
        args: [],
        cwd: path.join(__dirname, 'python_standalone'),
      });

      return res.json(out.json);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        status: 'error',
      });
    }
  })();
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Architectural Schema Validator API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Validation endpoint: http://localhost:${PORT}/api/validate`);
  console.log(`DWG upload endpoint: http://localhost:${PORT}/api/validate-dwg`);
});

// Handle port conflicts gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`Please either:`);
    console.error(`  1. Stop the existing server (Ctrl+C if running in terminal)`);
    console.error(`  2. Kill the process: Get-NetTCPConnection -LocalPort ${PORT} | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`);
    console.error(`  3. Use a different port: PORT=3001 npm run api`);
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = app;

