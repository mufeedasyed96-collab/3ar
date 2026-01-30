// /**
//  * API Example: Express.js endpoint for schema validation
//  * Provides Postman-ready JSON response
//  */

// const express = require('express');
// const { exec, spawn } = require('child_process');
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const axios = require('axios');
// const FormData = require('form-data');

// const app = express();
// const PORT = process.env.PORT || 8287;

// // MongoDB setup
// const { connectToDatabase } = require('./db');
// connectToDatabase().catch(err => console.error('[Backend] DB failed to start:', err));

// // Auth routes & middleware
// const authRoutes = require('./routes/auth');
// const historyRoutes = require('./routes/history');
// const projectsRoutes = require('./routes/projects');
// const authMiddleware = require('./middleware/authMiddleware');

// // CORS Middleware - Allow requests from frontend
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

//   // Handle preflight requests
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }

//   next();
// });

// // Middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/history', historyRoutes);
// app.use('/api/projects', projectsRoutes);
// app.use('/api/file-groups', require('./routes/file_groups'));
// app.use('/api/file-versions', require('./routes/file_versions'));

// // Configure multer for file uploads
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDir);
//   },
//   filename: (req, file, cb) => {
//     // Keep original filename, add timestamp only if file exists to avoid conflicts
//     const originalName = file.originalname;
//     let finalName = originalName;
//     let counter = 1;
//     while (fs.existsSync(path.join(uploadsDir, finalName))) {
//       const ext = path.extname(originalName);
//       const name = path.basename(originalName, ext);
//       finalName = `${name}_${counter}${ext}`;
//       counter++;
//     }
//     cb(null, finalName);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024 // 100MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     // Accept only DWG files
//     if (file.mimetype === 'application/acad' ||
//       file.mimetype === 'application/x-autocad' ||
//       file.originalname.toLowerCase().endsWith('.dwg')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only DWG files are allowed'), false);
//     }
//   }
// });

// // Separate uploader for PDF (used for external webhook processing)
// const uploadPdf = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024 // 100MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype === 'application/pdf' ||
//       file.originalname.toLowerCase().endsWith('.pdf')
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only PDF files are allowed'), false);
//     }
//   }
// });

// // Serve static files (for uploaded DWG files)
// app.use('/uploads', express.static('uploads'));

// // -----------------------------------------------------------------------------
// // Python orchestration helpers (Node.js is HTTP wrapper only)
// // -----------------------------------------------------------------------------
// const DEFAULT_VENV_PYTHON = path.join(__dirname, 'python_standalone', 'venv', 'Scripts', 'python.exe');
// const DEFAULT_VENV_CFG = path.join(__dirname, 'python_standalone', 'venv', 'pyvenv.cfg');
// const FALLBACK_SYSTEM_PYTHON = "C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";

// function resolvePythonExe() {
//   const envPy = process.env.PYTHON_EXE;
//   if (envPy) {
//     if (fs.existsSync(envPy)) return envPy;
//     console.warn(`[Python] WARNING: PYTHON_EXE is set but path does not exist: ${envPy}`);
//   }

//   // The repo may contain a venv created on another machine (pyvenv.cfg points to a non-existent base python).
//   // Only use it if it appears valid on this machine.
//   if (fs.existsSync(DEFAULT_VENV_PYTHON)) {
//     try {
//       if (fs.existsSync(DEFAULT_VENV_CFG)) {
//         const cfg = fs.readFileSync(DEFAULT_VENV_CFG, 'utf8');
//         const m = cfg.match(/^\s*executable\s*=\s*(.+)\s*$/mi);
//         if (m && m[1]) {
//           const baseExe = m[1].trim();
//           if (!fs.existsSync(baseExe)) {
//             console.warn(`[Python] WARNING: Skipping bundled venv because base python is missing: ${baseExe}`);
//           } else {
//             return DEFAULT_VENV_PYTHON;
//           }
//         } else {
//           // If we can't detect the base executable, still try to use it (best effort)
//           return DEFAULT_VENV_PYTHON;
//         }
//       } else {
//         return DEFAULT_VENV_PYTHON;
//       }
//     } catch (e) {
//       // If anything goes wrong reading cfg, don't block startup—just try the venv.
//       return DEFAULT_VENV_PYTHON;
//     }
//   }
//   if (fs.existsSync(FALLBACK_SYSTEM_PYTHON)) return FALLBACK_SYSTEM_PYTHON;

//   // Last resort: let spawn try "python" from PATH
//   return 'python';
// }

// // Prefer:
// // 1) PYTHON_EXE env var (if it exists)
// // 2) Bundled python_standalone venv (ships GeoPandas etc.)
// // 3) Fallback system python path
// // 4) python from PATH
// const PYTHON_EXE = resolvePythonExe();
// console.log(`[Python] Using interpreter: ${PYTHON_EXE}`);

// const ODA_PATH =
//   process.env.ODA_PATH ||
//   "C:\\Program Files\\ODA\\ODAFileConverter 26.10.0\\ODAFileConverter.exe";

// if (!fs.existsSync(ODA_PATH)) {
//   console.warn(`[ODA] WARNING: ODA_PATH does not exist: ${ODA_PATH}`);
//   console.warn(`[ODA] Set ODA_PATH env var to your ODAFileConverter.exe full path.`);
// } else {
//   console.log(`[ODA] Using converter: ${ODA_PATH}`);
// }

// function spawnPythonJson({ scriptPath, args = [], cwd, stdinJson }) {
//   return new Promise((resolve, reject) => {
//     const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
//       cwd: cwd || __dirname,
//       stdio: ['pipe', 'pipe', 'pipe'],
//     });

//     let stdout = '';
//     let stderr = '';

//     child.stdout.on('data', (data) => {
//       stdout += data.toString();
//     });

//     child.stderr.on('data', (data) => {
//       stderr += data.toString();
//       // Keep backend logs useful, but don't spam successful output
//       const s = data.toString();
//       if (s.trim()) console.error('[Python]', s.trim());
//     });

//     child.on('error', (err) => reject(err));

//     child.on('close', (code) => {
//       if (code !== 0) {
//         return reject(new Error(`Python exited with code ${code}. stderr=${stderr || '(empty)'} stdout=${stdout || '(empty)'}`));
//       }
//       try {
//         // Some Python modules may accidentally print to stdout (or emit a BOM),
//         // which breaks JSON.parse. Be resilient: attempt to extract the JSON object.
//         const raw = (stdout || '').trim();
//         let parsed;
//         try {
//           parsed = JSON.parse(raw);
//         } catch (_e) {
//           const start = raw.indexOf('{');
//           const end = raw.lastIndexOf('}');
//           if (start >= 0 && end > start) {
//             const sliced = raw.slice(start, end + 1);
//             parsed = JSON.parse(sliced);
//           } else {
//             throw _e;
//           }
//         }
//         return resolve({ json: parsed, stdout, stderr });
//       } catch (e) {
//         return reject(new Error(`Failed to parse Python JSON output: ${e.message}. stdout=${stdout || '(empty)'} stderr=${stderr || '(empty)'}`));
//       }
//     });

//     if (stdinJson !== undefined) {
//       try {
//         child.stdin.write(JSON.stringify(stdinJson));
//       } catch (e) {
//         // ignore
//       }
//     }
//     child.stdin.end();
//   });
// }

// function spawnPython({ scriptPath, args = [], cwd }) {
//   return new Promise((resolve, reject) => {
//     const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
//       cwd: cwd || __dirname,
//       stdio: ['ignore', 'pipe', 'pipe'],
//     });

//     let stdout = '';
//     let stderr = '';

//     child.stdout.on('data', (data) => {
//       stdout += data.toString();
//     });

//     child.stderr.on('data', (data) => {
//       stderr += data.toString();
//       const s = data.toString();
//       if (s.trim()) console.error('[Python]', s.trim());
//     });

//     child.on('error', (err) => reject(err));

//     child.on('close', (code) => {
//       resolve({ code, stdout, stderr, success: code === 0 });
//     });
//   });
// }

// /**
//  * POST /api/pdf-compliance
//  * Proxy endpoint: uploads PDF to n8n webhook and returns its response.
//  *
//  * This avoids browser CORS issues by doing server-to-server request.
//  *
//  * Env:
//  * - PDF_COMPLIANCE_WEBHOOK_URL: production webhook (recommended)
//  *   Example: https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance
//  * Fallback (test):
//  * - https://malakmalak01.app.n8n.cloud/webhook-test/architectural-compliance
//  */
// // Import Validation Logic
// const { validateFile } = require('./utils/fileValidation');

// app.post('/api/pdf-compliance', uploadPdf.single('file'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No PDF uploaded. Please upload a file with field name "file".' });
//   }

//   const pdfPath = req.file.path;

//   // --- SECURITY VALIDATION LAYER ---
//   const validCheck = await validateFile(pdfPath, req.file.originalname, 'pdf');
//   if (!validCheck.isValid) {
//     console.error(`[Security] PDF Rejected: ${validCheck.error}`);
//     try { fs.unlinkSync(pdfPath); } catch (e) { }
//     return res.status(400).json({ error: validCheck.error });
//   }
//   // ---------------------------------

//   const webhookTestUrl = 'https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance';
//   const webhookProdUrl = 'https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance';

//   // Priority:
//   // 1) PDF_COMPLIANCE_WEBHOOK_URL (explicit override)
//   // 2) PDF_COMPLIANCE_WEBHOOK_MODE=test|prod
//   // 3) NODE_ENV: production => prod, otherwise => test
//   const mode =
//     (process.env.PDF_COMPLIANCE_WEBHOOK_MODE || '').toLowerCase() ||
//     (process.env.NODE_ENV === 'production' ? 'prod' : 'test');

//   const webhookUrl =
//     process.env.PDF_COMPLIANCE_WEBHOOK_URL ||
//     (mode === 'prod' ? webhookProdUrl : webhookTestUrl);

//   try {
//     console.log(`[PDF Compliance] Forwarding "${req.file.originalname}" to webhook: ${webhookUrl}`);
//     const form = new FormData();
//     form.append('file', fs.createReadStream(pdfPath), {
//       filename: req.file.originalname,
//       contentType: req.file.mimetype || 'application/pdf',
//     });

//     // Optional metadata (ignored if workflow doesn't use it)
//     if (req.body && req.body.language) form.append('language', String(req.body.language));
//     form.append('file_name', req.file.originalname);
//     form.append('file_type', req.file.mimetype || 'application/pdf');

//     const response = await axios.post(webhookUrl, form, {
//       headers: form.getHeaders(),
//       maxBodyLength: Infinity,
//       maxContentLength: Infinity,
//       timeout: 5 * 60 * 1000, // 5 minutes
//       validateStatus: () => true,
//     });

//     console.log(`[PDF Compliance] Webhook responded with status: ${response.status}`);

//     if (response.status < 200 || response.status >= 300) {
//       const hint =
//         response.status === 404 && webhookUrl.includes('/webhook-test/')
//           ? 'n8n test webhook is not active. Open the workflow and click "Listen for test event", or use the production webhook URL (/webhook/...).'
//           : undefined;

//       return res.status(502).json({
//         error: `Webhook returned ${response.status}`,
//         hint,
//         details: response.data,
//       });
//     }

//     // If the workflow returns a details URL, fetch it server-to-server to avoid browser CORS issues
//     let data = response.data;
//     try {
//       const detailsUrl = data?.details_url || data?.detailsUrl;
//       if (detailsUrl && typeof detailsUrl === 'string') {
//         const detailsRes = await axios.get(detailsUrl, {
//           timeout: 5 * 60 * 1000,
//           validateStatus: () => true,
//         });
//         if (detailsRes.status >= 200 && detailsRes.status < 300 && detailsRes.data && typeof detailsRes.data === 'object') {
//           data = { ...data, ...detailsRes.data };
//         }
//       }
//     } catch (e) {
//       // Ignore details fetch failures; return primary response
//     }

//     return res.json(data);
//   } catch (error) {
//     return res.status(500).json({
//       error: error.message || 'Failed to call PDF compliance webhook',
//     });
//   } finally {
//     // Cleanup uploaded file
//     try {
//       if (pdfPath && fs.existsSync(pdfPath)) {
//         fs.unlinkSync(pdfPath);
//       }
//     } catch (e) {
//       // ignore
//     }
//   }
// });

// /**
//  * POST /api/validate
//  * Validates architectural schema from extracted JSON
//  * 
//  * Body: { "json_path": "path/to/elements.json" }
//  * Or: { "elements": [...] } (direct element array)
//  */
// app.post('/api/validate', async (req, res) => {
//   try {
//     let validationResult;

//     const cli = path.join(__dirname, 'python_standalone', 'cli_validate_json.py');

//     if (req.body.elements) {
//       // Validate via python_standalone from elements payload
//       const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
//       const out = await spawnPythonJson({ scriptPath: cli, args: ['--stdin'], cwd: path.join(__dirname, 'python_standalone'), stdinJson: payload });
//       validationResult = out.json;
//     } else if (req.body.json_path) {
//       // Validate via python_standalone from elements.json file path
//       const out = await spawnPythonJson({ scriptPath: cli, args: ['--elements-json', req.body.json_path], cwd: path.join(__dirname, 'python_standalone') });
//       validationResult = out.json;
//     } else {
//       return res.status(400).json({
//         error: 'Either "json_path" or "elements" must be provided',
//         schema_pass: false,
//         element_results: []
//       });
//     }

//     // Postman-friendly minimal response
//     res.json({
//       schema_pass: validationResult.schema_pass,
//       article_11_results: validationResult.article_11_results || []
//     });

//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//       schema_pass: false,
//       element_results: []
//     });
//   }
// });

// /**
//  * POST /api/validate-full
//  * Full pipeline: accepts JSON from Python extraction
//  * Returns complete validation with summary
//  */
// app.post('/api/validate-full', async (req, res) => {
//   try {
//     let validationResult;
//     const cli = path.join(__dirname, 'python_standalone', 'cli_validate_json.py');

//     if (req.body.elements) {
//       const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
//       const out = await spawnPythonJson({ scriptPath: cli, args: ['--stdin'], cwd: path.join(__dirname, 'python_standalone'), stdinJson: payload });
//       validationResult = out.json;
//     } else if (req.body.json_path) {
//       const out = await spawnPythonJson({ scriptPath: cli, args: ['--elements-json', req.body.json_path], cwd: path.join(__dirname, 'python_standalone') });
//       validationResult = out.json;
//     } else {
//       return res.status(400).json({
//         error: 'Either "json_path" or "elements" must be provided',
//         schema_pass: false,
//         element_results: [],
//         summary: null
//       });
//     }

//     res.json(validationResult);

//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//       schema_pass: false,
//       element_results: [],
//       summary: null
//     });
//   }
// });

// /**
//  * GET /api/health
//  * Health check endpoint
//  */
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'ok',
//     service: 'Architectural Schema Validator',
//     version: '1.0.0'
//   });
// });

// /**
//  * POST /api/validate-dwg
//  * Upload DWG file and validate schema
//  * Accepts multipart/form-data with 'dwg' field
//  * Protected by authMiddleware
//  */
// /**
//  * POST /api/validate-dwg
//  * Upload DWG file, Version it, and Validate schema.
//  * 
//  * Flow:
//  * 1. Upload file (temp name)
//  * 2. Resolve Project & File Group
//  * 3. Calculate new version (v+1)
//  * 4. Rename file to versioned filename (immutable)
//  * 5. Record version in DB
//  * 6. Process/Validate
//  */
// app.post('/api/validate-dwg', authMiddleware, upload.single('dwg'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({
//       error: 'No DWG file uploaded. Please upload a file with field name "dwg"',
//       schema_pass: false,
//       element_results: []
//     });
//   }

//   // Inputs
//   let projectId = req.body.projectId; // Optional, will try to resolve if missing
//   const groupType = req.body.fileType || 'villa_plan';
//   const userId = req.user.userId;

//   const tempPath = req.file.path;
//   const uploadsDir = path.dirname(tempPath);

//   let finalDwgPath = tempPath;
//   let versionRecord = null;
//   let validationResult = {};

//   const { getDb } = require('./db');

//   try {
//     const db = getDb();

//     // ---------------------------------------------------------
//     // AUTO-PROJECT RESOLUTION
//     // ---------------------------------------------------------
//     if (!projectId && db) {
//       console.log('[Versioning] No projectId provided. Attempting to resolve via filename...');
//       const projectsColl = db.collection('projects');

//       // 1. Try to find existing project by sourceFilename for this user
//       const existingProject = await projectsColl.findOne({
//         createdBy: userId,
//         sourceFilename: req.file.originalname
//       });

//       if (existingProject) {
//         projectId = existingProject._id.toString();
//         console.log(`[Versioning] Found existing project: ${projectId} for file: ${req.file.originalname}`);
//       } else {
//         // 2. Create new project if not found
//         const newProject = {
//           projectType: 'Villa', // Default
//           ownerName: 'Auto-Created',
//           title: req.file.originalname,
//           sourceFilename: req.file.originalname,
//           status: 'New',
//           statusHistory: [{
//             status: 'New',
//             changedBy: userId,
//             changedByEmail: req.user.email,
//             changedAt: new Date(),
//             reason: 'Project auto-created from upload'
//           }],
//           createdBy: userId,
//           createdByEmail: req.user.email,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };

//         const pResult = await projectsColl.insertOne(newProject);
//         projectId = pResult.insertedId.toString();
//         console.log(`[Versioning] Created new project: ${projectId} for file: ${req.file.originalname}`);
//       }
//     }

//     // ---------------------------------------------------------
//     // VERSIONING LOGIC (Atomic & Safe)
//     // ---------------------------------------------------------
//     if (db && projectId) {
//       const fileGroups = db.collection('file_groups');
//       const fileVersions = db.collection('file_versions');

//       // 1. Find or Create File Group (Atomic)
//       // Uses findOneAndUpdate with upsert to prevent duplicates
//       const groupResult = await fileGroups.findOneAndUpdate(
//         { projectId, type: groupType },
//         {
//           $setOnInsert: {
//             projectId,
//             type: groupType,
//             current_version: 0,
//             status: 'draft',
//             created_at: new Date(),
//             createdBy: userId
//           },
//           $set: { updated_at: new Date() } // Update timestamp on existing
//         },
//         { upsert: true, returnDocument: 'after' }
//       );

//       const group = groupResult; // MongoDB driver v4+ returns the doc directly or inside .value depending on version. 
//       // Safe check: 
//       const groupDoc = group.value || group; // Handle both driver versions

//       if (!groupDoc || !groupDoc._id) throw new Error('Failed to resolve File Group');

//       // 2. Reserve Version (Atomic Increment)
//       // Increment current_version to reserve the spot
//       const incrementResult = await fileGroups.findOneAndUpdate(
//         { _id: groupDoc._id },
//         { $inc: { current_version: 1 } },
//         { returnDocument: 'after' }
//       );
//       const updatedGroup = incrementResult.value || incrementResult;
//       const nextVersion = updatedGroup.current_version;

//       // 3. Rename File (Immutable naming)
//       // Format: [ProjectId]_[Type]_v[Ver]_[Timestamp].dwg
//       const safeProj = projectId.replace(/[^a-zA-Z0-9]/g, '');
//       const safeType = groupType.replace(/[^a-zA-Z0-9]/g, '');
//       const timestamp = Date.now();
//       const ext = path.extname(req.file.originalname);
//       const newFilename = `${safeProj}_${safeType}_v${nextVersion}_${timestamp}${ext}`;
//       const newPath = path.join(uploadsDir, newFilename);

//       fs.renameSync(tempPath, newPath);
//       finalDwgPath = newPath;

//       // Calculate Hash
//       const crypto = require('crypto');
//       const fileBuffer = fs.readFileSync(finalDwgPath);
//       const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

//       // 5. Create Version Record
//       // Strategy: Insert as inactive first to avoid unique index/race conditions immediately on insert.
//       // Then perform an atomic "Activate" sequence.
//       const newVersionRecord = {
//         group_id: groupDoc._id.toString(),
//         project_id: projectId,
//         version_number: nextVersion,
//         file_metadata: {
//           original_name: req.file.originalname,
//           stored_filename: newFilename,
//           size_bytes: req.file.size,
//           mime_type: req.file.mimetype,
//           file_hash: fileHash
//         },
//         uploaded_by: {
//           user_id: userId
//         },
//         upload_reason: req.body.uploadReason || 'Initial Upload',
//         is_active: false, // Start false
//         created_at: new Date()
//       };

//       const vResult = await fileVersions.insertOne(newVersionRecord);
//       const insertedId = vResult.insertedId;
//       versionRecord = { ...newVersionRecord, _id: insertedId, is_active: true }; // Optimistic for response

//       console.log(`[Versioning] Created v${nextVersion} for Project ${projectId}.`);

//       // 6. Safe Activation (Last Writer Wins)
//       try {
//         // A. Deactivate all others
//         await fileVersions.updateMany(
//           { group_id: groupDoc._id.id.toString(), is_active: true },
//           { $set: { is_active: false } }
//         );
//         // B. Activate this one
//         await fileVersions.updateOne(
//           { _id: insertedId },
//           { $set: { is_active: true } }
//         );
//       } catch (activateError) {
//         // If we hit a unique index race (very rare with this order), 
//         // it means another upload just became active. 
//         // We can accept this (we are saved as a version, just not active)
//         // OR retry. For now, log and swallow (file is saved).
//         console.warn(`[Versioning] Could not activate v${nextVersion} immediately due to race:`, activateError.message);
//         versionRecord.is_active = false;
//       }

//       // Audit log (optional but robust)
//       const historyColl = db.collection('history');
//       await historyColl.insertOne({
//         action: 'UPLOAD_VERSION',
//         projectId,
//         groupId: groupDoc._id,
//         versionId: vResult.insertedId,
//         versionNumber: nextVersion,
//         userId,
//         timestamp: new Date()
//       }).catch(err => console.error('Audit log failed', err));

//     } else {
//       console.log('[Versioning] Skipping versioning (no projectId or DB)');
//     }

//     // ---------------------------------------------------------
//     // VALIDATION (Standard)
//     // ---------------------------------------------------------
//     const convertedDir = path.join(__dirname, 'converted');
//     if (!fs.existsSync(convertedDir)) {
//       fs.mkdirSync(convertedDir, { recursive: true });
//     }

//     // Step 1: DWG -> DXF
//     const baseName = path.basename(finalDwgPath, path.extname(finalDwgPath));
//     const expectedDxfPath = path.join(convertedDir, `${baseName}.dxf`);

//     const dwgConverterScript = path.join(__dirname, 'python_standalone', 'dwg_converter.py');
//     if (!fs.existsSync(ODA_PATH)) {
//       throw new Error(`ODA File Converter not found at: ${ODA_PATH}.`);
//     }
//     const conv = await spawnPython({
//       scriptPath: dwgConverterScript,
//       args: [ODA_PATH, finalDwgPath, convertedDir],
//       cwd: __dirname,
//     });

//     if (!conv.success) {
//       throw new Error(`DWG->DXF conversion failed. ${conv.stderr || conv.stdout || ''}`);
//     }

//     // Locate DXF
//     let dxfPath = expectedDxfPath;
//     if (!fs.existsSync(dxfPath)) {
//       // Fallback search
//       const dxfs = fs.readdirSync(convertedDir)
//         .filter((f) => f.toLowerCase().endsWith('.dxf'))
//         .map((f) => ({ p: path.join(convertedDir, f), mtime: fs.statSync(path.join(convertedDir, f)).mtimeMs }))
//         .sort((a, b) => b.mtime - a.mtime);
//       if (dxfs.length > 0) dxfPath = dxfs[0].p;
//     }

//     // Step 2: Validate
//     const standaloneCli = path.join(__dirname, 'python_standalone', 'cli_validate_json.py');
//     const out = await spawnPythonJson({
//       scriptPath: standaloneCli,
//       args: ['--dxf', dxfPath],
//       cwd: path.join(__dirname, 'python_standalone'),
//     });

//     validationResult = out.json || {};
//     validationResult.file_name = req.file.originalname;

//     // Attach version info to result
//     if (versionRecord) {
//       validationResult.file_version = versionRecord.version_number;
//       validationResult.file_version_id = versionRecord._id.toString();

//       // Optionally: Link validation result back to version in DB?
//       // We could do an update to fileVersions if we want to store result summary there immediately.
//       // For now, History.js saves the full result separately, which is fine.
//     }

//     return res.json(validationResult);

//   } catch (error) {
//     console.error('\n=== UPLOAD/VALIDATION ERROR ===');
//     console.error(error);

//     // Cleanup
//     try {
//       if (finalDwgPath && fs.existsSync(finalDwgPath)) {
//         // Only delete if it wasn't a successful versioned save? 
//         // Actually for audit, we might want to keep failed files too, but usually we delete invalid uploads.
//         // If versioning succeeded but validation failed, we might want to keep the file?
//         // For now, simplistic cleanup on error.
//         fs.unlinkSync(finalDwgPath);
//       }
//     } catch (cleanupError) { }

//     if (!res.headersSent) {
//       res.status(500).json({
//         error: error.message,
//         schema_pass: false,
//         element_results: []
//       });
//     }
//   }
// });

// /**
//  * GET /api/config
//  * Returns current validation configuration
//  */
// app.get('/api/config', (req, res) => {
//   (async () => {
//     try {
//       const script = path.join(__dirname, 'python_standalone', 'cli_dump_config_json.py');
//       const out = await spawnPythonJson({
//         scriptPath: script,
//         args: [],
//         cwd: path.join(__dirname, 'python_standalone'),
//       });

//       return res.json(out.json);
//     } catch (error) {
//       return res.status(500).json({
//         error: error.message,
//         status: 'error',
//       });
//     }
//   })();
// });

// // Start server
// const server = app.listen(PORT, () => {
//   console.log(`Architectural Schema Validator API running on port ${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/api/health`);
//   console.log(`Validation endpoint: http://localhost:${PORT}/api/validate`);
//   console.log(`DWG upload endpoint: http://localhost:${PORT}/api/validate-dwg`);
// });

// // Handle port conflicts gracefully
// server.on('error', (err) => {
//   if (err.code === 'EADDRINUSE') {
//     console.error(`\n❌ Port ${PORT} is already in use.`);
//     console.error(`Please either:`);
//     console.error(`  1. Stop the existing server (Ctrl+C if running in terminal)`);
//     console.error(`  2. Kill the process: Get-NetTCPConnection -LocalPort ${PORT} | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`);
//     console.error(`  3. Use a different port: PORT=3001 npm run api`);
//     process.exit(1);
//   } else {
//     throw err;
//   }
// });

// module.exports = app;


/**
 * Municipality-grade Upload + Versioning + Validation Server
 * - Atomic version allocation (MongoDB transaction)
 * - No overwrites (immutable artifacts)
 * - Per-version artifact folders (no collisions)
 * - Correct active version switching
 * - Never delete successfully versioned uploads on validation failure
 */

const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");

// MongoDB setup
const { connectToDatabase, getDb } = require("./db");
connectToDatabase().catch((err) =>
  console.error("[Backend] DB failed to start:", err)
);

// Auth routes & middleware
const authRoutes = require("./routes/auth");
const historyRoutes = require("./routes/history");
const projectsRoutes = require("./routes/projects");
const authMiddleware = require("./middleware/authMiddleware");

const { validateFile } = require("./utils/fileValidation");

const app = express();
const PORT = process.env.PORT || 8289;

// -------------------- CORS (keep simple; ideally use "cors" package) --------------------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/file-groups", require("./routes/file_groups"));
app.use("/api/file-versions", require("./routes/file_versions"));

// -------------------- Upload storage --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function sanitizeName(name) {
  return String(name || "")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 200);
}

// TEMP upload filename only (we will rename to versioned immutable name later)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "file", ext);
    const safe = sanitizeName(base);
    cb(null, `${safe}_${Date.now()}${ext || ""}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const okExt = (file.originalname || "").toLowerCase().endsWith(".dwg");
    const okMime =
      file.mimetype === "application/acad" ||
      file.mimetype === "application/x-autocad" ||
      file.mimetype === "application/octet-stream";
    if (okExt || okMime) return cb(null, true);
    cb(new Error("Only DWG files are allowed"), false);
  },
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okExt = (file.originalname || "").toLowerCase().endsWith(".pdf");
    const okMime = file.mimetype === "application/pdf";
    if (okExt || okMime) return cb(null, true);
    cb(new Error("Only PDF files are allowed"), false);
  },
});

app.use("/uploads", express.static("uploads"));

// -------------------- Python orchestration --------------------
const DEFAULT_VENV_PYTHON = path.join(
  __dirname,
  "python_standalone",
  "venv",
  "Scripts",
  "python.exe"
);
const DEFAULT_VENV_CFG = path.join(
  __dirname,
  "python_standalone",
  "venv",
  "pyvenv.cfg"
);
const FALLBACK_SYSTEM_PYTHON =
  "C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";

function resolvePythonExe() {
  const envPy = process.env.PYTHON_EXE;
  if (envPy && fs.existsSync(envPy)) return envPy;

  if (fs.existsSync(DEFAULT_VENV_PYTHON)) {
    try {
      if (fs.existsSync(DEFAULT_VENV_CFG)) {
        const cfg = fs.readFileSync(DEFAULT_VENV_CFG, "utf8");
        const m = cfg.match(/^\s*executable\s*=\s*(.+)\s*$/mi);
        if (m && m[1] && fs.existsSync(m[1].trim())) return DEFAULT_VENV_PYTHON;
      } else {
        return DEFAULT_VENV_PYTHON;
      }
    } catch {
      return DEFAULT_VENV_PYTHON;
    }
  }
  if (fs.existsSync(FALLBACK_SYSTEM_PYTHON)) return FALLBACK_SYSTEM_PYTHON;
  return "python";
}

const PYTHON_EXE = resolvePythonExe();
console.log(`[Python] Using interpreter: ${PYTHON_EXE}`);

const ODA_PATH =
  process.env.ODA_PATH ||
  "C:\\Program Files\\ODA\\ODAFileConverter 26.10.0\\ODAFileConverter.exe";

if (!fs.existsSync(ODA_PATH)) {
  console.warn(`[ODA] WARNING: ODA_PATH does not exist: ${ODA_PATH}`);
} else {
  console.log(`[ODA] Using converter: ${ODA_PATH}`);
}

function spawnPythonJson({ scriptPath, args = [], cwd, stdinJson, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
      cwd: cwd || __dirname,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer =
      timeoutMs && timeoutMs > 0
        ? setTimeout(() => {
          killed = true;
          child.kill("SIGKILL");
        }, timeoutMs)
        : null;

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      if (s.trim()) console.error("[Python]", s.trim());
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (killed) {
        return reject(new Error(`Python timed out after ${timeoutMs}ms`));
      }
      if (code !== 0) {
        return reject(
          new Error(
            `Python exited with code ${code}. stderr=${stderr || "(empty)"}`
          )
        );
      }
      try {
        const raw = (stdout || "").trim();
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          const start = raw.indexOf("{");
          const end = raw.lastIndexOf("}");
          if (start >= 0 && end > start) parsed = JSON.parse(raw.slice(start, end + 1));
          else throw e;
        }
        resolve({ json: parsed, stdout, stderr });
      } catch (e) {
        reject(
          new Error(
            `Failed to parse Python JSON output: ${e.message}. stdout=${stdout || "(empty)"}`
          )
        );
      }
    });

    if (stdinJson !== undefined) child.stdin.write(JSON.stringify(stdinJson));
    child.stdin.end();
  });
}

function spawnPython({ scriptPath, args = [], cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
      cwd: cwd || __dirname,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer =
      timeoutMs && timeoutMs > 0
        ? setTimeout(() => {
          killed = true;
          child.kill("SIGKILL");
        }, timeoutMs)
        : null;

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      if (s.trim()) console.error("[Python]", s.trim());
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code, stdout, stderr, success: code === 0, killed });
    });
  });
}

// Streaming SHA256 (no memory blow)
async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const s = fs.createReadStream(filePath);
    s.on("error", reject);
    s.on("data", (d) => h.update(d));
    s.on("end", () => resolve(h.digest("hex")));
  });
}

// Per-version artifact dir (prevents collisions)
function artifactDir({ projectId, groupType, versionNumber }) {
  const safeProj = String(projectId).replace(/[^a-zA-Z0-9]/g, "");
  const safeType = String(groupType).replace(/[^a-zA-Z0-9_]/g, "");
  return path.join(__dirname, "artifacts", safeProj, safeType, `v${versionNumber}`);
}

// -------------------- PDF Compliance (kept mostly same) --------------------
app.post("/api/pdf-compliance", uploadPdf.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded (field "file")' });

  const pdfPath = req.file.path;

  const validCheck = await validateFile(pdfPath, req.file.originalname, "pdf");
  if (!validCheck.isValid) {
    try { fs.unlinkSync(pdfPath); } catch { }
    return res.status(400).json({ error: validCheck.error });
  }

  const webhookTestUrl = "https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance";
  const webhookProdUrl = "https://malakmalak01.app.n8n.cloud/webhook/architectural-compliance";

  const mode =
    (process.env.PDF_COMPLIANCE_WEBHOOK_MODE || "").toLowerCase() ||
    (process.env.NODE_ENV === "production" ? "prod" : "test");

  const webhookUrl =
    process.env.PDF_COMPLIANCE_WEBHOOK_URL ||
    (mode === "prod" ? webhookProdUrl : webhookTestUrl);

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(pdfPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype || "application/pdf",
    });

    const response = await axios.post(webhookUrl, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 5 * 60 * 1000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return res.status(502).json({
        error: `Webhook returned ${response.status}`,
        details: response.data,
      });
    }

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Webhook call failed" });
  } finally {
    try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch { }
  }
});

// -------------------- Validate JSON endpoints (kept) --------------------
app.post("/api/validate", async (req, res) => {
  try {
    const cli = path.join(__dirname, "python_standalone", "cli_validate_json.py");

    let validationResult;
    if (req.body.elements) {
      const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
      const out = await spawnPythonJson({
        scriptPath: cli,
        args: ["--stdin"],
        cwd: path.join(__dirname, "python_standalone"),
        stdinJson: payload,
        timeoutMs: 5 * 60 * 1000,
      });
      validationResult = out.json;
    } else if (req.body.json_path) {
      const out = await spawnPythonJson({
        scriptPath: cli,
        args: ["--elements-json", req.body.json_path],
        cwd: path.join(__dirname, "python_standalone"),
        timeoutMs: 5 * 60 * 1000,
      });
      validationResult = out.json;
    } else {
      return res.status(400).json({ error: 'Either "json_path" or "elements" required' });
    }

    res.json({
      schema_pass: validationResult.schema_pass,
      article_11_results: validationResult.article_11_results || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message, schema_pass: false, article_11_results: [] });
  }
});

app.post("/api/validate-full", async (req, res) => {
  try {
    const cli = path.join(__dirname, "python_standalone", "cli_validate_json.py");

    let validationResult;
    if (req.body.elements) {
      const payload = { elements: req.body.elements, metadata: req.body.metadata || {} };
      const out = await spawnPythonJson({
        scriptPath: cli,
        args: ["--stdin"],
        cwd: path.join(__dirname, "python_standalone"),
        stdinJson: payload,
        timeoutMs: 10 * 60 * 1000,
      });
      validationResult = out.json;
    } else if (req.body.json_path) {
      const out = await spawnPythonJson({
        scriptPath: cli,
        args: ["--elements-json", req.body.json_path],
        cwd: path.join(__dirname, "python_standalone"),
        timeoutMs: 10 * 60 * 1000,
      });
      validationResult = out.json;
    } else {
      return res.status(400).json({ error: 'Either "json_path" or "elements" required' });
    }

    res.json(validationResult);
  } catch (error) {
    res.status(500).json({ error: error.message, schema_pass: false, summary: null, element_results: [] });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Architectural Schema Validator", version: "1.0.0" });
});

// ============================================================================
// ✅ Municipality-grade DWG upload + Versioning + Validate
// ============================================================================
app.post("/api/validate-dwg", authMiddleware, upload.single("dwg"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No DWG uploaded (field "dwg")' });
  }

  const tempPath = req.file.path;
  const originalName = req.file.originalname;
  const userId = req.user.userId;
  const userEmail = req.user.email;

  // Inputs
  let projectId = req.body.projectId || null;
  const groupType = req.body.fileType || "villa_plan";

  const db = getDb();
  if (!db) {
    // If DB down: do NOT proceed to municipality versioning
    try { fs.unlinkSync(tempPath); } catch { }
    return res.status(500).json({ error: "Database connection failed" });
  }

  // Security validation for DWG too (defense-in-depth)
  const dwgCheck = await validateFile(tempPath, originalName, "dwg");
  if (!dwgCheck.isValid) {
    try { fs.unlinkSync(tempPath); } catch { }
    return res.status(400).json({ error: dwgCheck.error });
  }

  let versionDoc = null;
  let groupDoc = null;

  // We will never delete versioned uploads on validation failure.
  let finalDwgPath = null;

  const session = db.client?.startSession ? db.client.startSession() : null;
  // NOTE: If your db.js doesn't expose db.client, you should modify db.js to export the MongoClient.
  // If you cannot, you can run without session but you lose strict atomicity.

  try {
    // ------------------ Resolve or create project (optional) ------------------
    if (!projectId) {
      const projectsColl = db.collection("projects");

      const existing = await projectsColl.findOne({
        createdBy: userId,
        sourceFilename: originalName,
      });

      if (existing) {
        projectId = existing._id.toString();
      } else {
        const newProject = {
          projectType: "Villa",
          ownerName: "Auto-Created",
          consultantName: "Auto-Created",
          title: originalName,
          sourceFilename: originalName,
          status: "New",
          statusHistory: [
            {
              status: "New",
              changedBy: userId,
              changedByEmail: userEmail,
              changedAt: new Date(),
              reason: "Project auto-created from upload",
            },
          ],
          createdBy: userId,
          createdByEmail: userEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const pr = await projectsColl.insertOne(newProject);
        projectId = pr.insertedId.toString();
      }
    }

    // ------------------ Atomic versioning ------------------
    const fileGroups = db.collection("file_groups");
    const fileVersions = db.collection("file_versions");
    const historyColl = db.collection("history");

    const runInTx = async (fn) => {
      if (!session) return fn(); // fallback if no session available
      return session.withTransaction(fn, {
        readConcern: { level: "majority" },
        writeConcern: { w: "majority" },
      });
    };

    await runInTx(async () => {
      // 1) Find or create File Group
      const gr = await fileGroups.findOneAndUpdate(
        { projectId, type: groupType },
        {
          $setOnInsert: {
            projectId,
            type: groupType,
            current_version: 0,
            status: "draft",
            created_at: new Date(),
            createdBy: userId,
          },
          $set: { updated_at: new Date() },
        },
        { upsert: true, returnDocument: "after", session: session || undefined }
      );

      groupDoc = gr.value || gr;
      if (!groupDoc || !groupDoc._id) throw new Error("Failed to resolve file group");

      // 2) Reserve next version
      const inc = await fileGroups.findOneAndUpdate(
        { _id: groupDoc._id },
        { $inc: { current_version: 1 }, $set: { updated_at: new Date() } },
        { returnDocument: "after", session: session || undefined }
      );

      const updatedGroup = inc.value || inc;
      const nextVersion = updatedGroup.current_version;

      // 3) Move DWG into immutable per-version folder
      const dir = artifactDir({ projectId, groupType, versionNumber: nextVersion });
      await fsp.mkdir(dir, { recursive: true });

      const ext = path.extname(originalName || ".dwg") || ".dwg";
      const ts = Date.now();
      const immutableName = `${sanitizeName(projectId)}_${sanitizeName(groupType)}_v${nextVersion}_${ts}${ext}`;
      finalDwgPath = path.join(dir, immutableName);

      // Move file now (still within tx logic)
      fs.renameSync(tempPath, finalDwgPath);

      // 4) Hash
      const fileHash = await sha256File(finalDwgPath);

      // 5) Insert version record
      const vDoc = {
        group_id: groupDoc._id.toString(),
        project_id: projectId,
        version_number: nextVersion,
        file_metadata: {
          original_name: originalName,
          stored_filename: immutableName,
          size_bytes: req.file.size,
          mime_type: req.file.mimetype,
          hash_sha256: fileHash,
        },
        uploaded_by: {
          user_id: userId,
          email: userEmail,
        },
        upload_reason: req.body.uploadReason || "Upload",
        is_active: true,
        processing_status: "queued", // queued|processing|done|failed
        created_at: new Date(),
      };

      // Deactivate old active versions (same group) then insert this as active
      await fileVersions.updateMany(
        { group_id: groupDoc._id.toString(), is_active: true },
        { $set: { is_active: false } },
        { session: session || undefined }
      );

      const vr = await fileVersions.insertOne(vDoc, { session: session || undefined });
      versionDoc = { ...vDoc, _id: vr.insertedId };

      await historyColl.insertOne(
        {
          action: "UPLOAD_VERSION",
          projectId,
          groupId: groupDoc._id.toString(),
          versionId: vr.insertedId.toString(),
          versionNumber: nextVersion,
          userId,
          timestamp: new Date(),
        },
        { session: session || undefined }
      );
    });

    // ------------------ Processing / Validation (outside transaction) ------------------
    // Mark processing
    await db.collection("file_versions").updateOne(
      { _id: versionDoc._id },
      { $set: { processing_status: "processing" } }
    );

    if (!fs.existsSync(ODA_PATH)) throw new Error(`ODA converter not found: ${ODA_PATH}`);

    const vDir = artifactDir({
      projectId,
      groupType,
      versionNumber: versionDoc.version_number,
    });

    // Step 1: DWG -> DXF (write inside same version folder)
    const dwgConverterScript = path.join(__dirname, "python_standalone", "dwg_converter.py");
    const conv = await spawnPython({
      scriptPath: dwgConverterScript,
      args: [ODA_PATH, finalDwgPath, vDir],
      cwd: __dirname,
      timeoutMs: 10 * 60 * 1000,
    });

    if (!conv.success) {
      await db.collection("file_versions").updateOne(
        { _id: versionDoc._id },
        { $set: { processing_status: "failed", processing_error: conv.stderr || conv.stdout } }
      );
      // Keep DWG (audit)
      throw new Error(`DWG->DXF conversion failed: ${conv.stderr || conv.stdout || ""}`);
    }

    // Locate newest DXF in vDir
    const dxfs = fs
      .readdirSync(vDir)
      .filter((f) => f.toLowerCase().endsWith(".dxf"))
      .map((f) => ({ p: path.join(vDir, f), m: fs.statSync(path.join(vDir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (!dxfs.length) throw new Error("No DXF produced by conversion");

    const dxfPath = dxfs[0].p;

    // Step 2: Validate
    const standaloneCli = path.join(__dirname, "python_standalone", "cli_validate_json.py");
    const out = await spawnPythonJson({
      scriptPath: standaloneCli,
      args: ["--dxf", dxfPath],
      cwd: path.join(__dirname, "python_standalone"),
      timeoutMs: 15 * 60 * 1000,
    });

    const validationResult = out.json || {};

    // Save validation result record (recommended)
    const valRes = await db.collection("validation_results").insertOne({
      file_version_id: versionDoc._id.toString(),
      project_id: projectId,
      group_id: versionDoc.group_id,
      version_number: versionDoc.version_number,
      summary: validationResult.summary || null,
      schema_pass: validationResult.schema_pass ?? null,
      payload: validationResult,
      run_at: new Date(),
    });

    // Link latest validation id + artifacts
    await db.collection("file_versions").updateOne(
      { _id: versionDoc._id },
      {
        $set: {
          processing_status: "done",
          latest_validation_result_id: valRes.insertedId.toString(),
          artifacts: {
            dwg_path: finalDwgPath,
            dxf_path: dxfPath,
            artifact_dir: vDir,
          },
        },
      }
    );

    // Response includes version info
    return res.json({
      ...validationResult,
      project_id: projectId,
      file_group_type: groupType,
      file_version: versionDoc.version_number,
      file_version_id: versionDoc._id.toString(),
      validation_result_id: valRes.insertedId.toString(),
    });
  } catch (error) {
    console.error("[validate-dwg] ERROR:", error);

    // If we failed BEFORE moving into versioned storage, delete temp
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch { }

    // If we already created a version record, mark it failed (keep files!)
    try {
      if (versionDoc?._id) {
        await db.collection("file_versions").updateOne(
          { _id: versionDoc._id },
          { $set: { processing_status: "failed", processing_error: error.message } }
        );
      }
    } catch { }

    return res.status(500).json({
      error: error.message,
      schema_pass: false,
      element_results: [],
      file_version_id: versionDoc?._id ? versionDoc._id.toString() : null,
    });
  } finally {
    try { if (session) session.endSession(); } catch { }
  }
});

// Config endpoint
app.get("/api/config", async (req, res) => {
  try {
    const script = path.join(__dirname, "python_standalone", "cli_dump_config_json.py");
    const out = await spawnPythonJson({
      scriptPath: script,
      args: [],
      cwd: path.join(__dirname, "python_standalone"),
      timeoutMs: 60 * 1000,
    });
    return res.json(out.json);
  } catch (error) {
    return res.status(500).json({ error: error.message, status: "error" });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

// Handle port conflicts
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} already in use.`);
    process.exit(1);
  }
  throw err;
});

module.exports = app;

