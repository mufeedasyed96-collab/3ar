/**
 * Python Orchestration Utilities
 * Handles spawning Python processes for DWG/DXF processing
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Python path resolution
const DEFAULT_VENV_PYTHON = path.join(
    __dirname,
    "..",
    "python-core",
    "venv",
    "Scripts",
    "python.exe"
);
const DEFAULT_VENV_CFG = path.join(
    __dirname,
    "..",
    "python-core",
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

/**
 * Spawn Python script and parse JSON output
 */
function spawnPythonJson({ scriptPath, args = [], cwd, stdinJson, timeoutMs }) {
    return new Promise((resolve, reject) => {
        const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
            cwd: cwd || path.join(__dirname, ".."),
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
                    new Error(`Python exited with code ${code}. stderr=${stderr || "(empty)"}`)
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
                    new Error(`Failed to parse Python JSON output: ${e.message}. stdout=${stdout || "(empty)"}`)
                );
            }
        });

        if (stdinJson !== undefined) child.stdin.write(JSON.stringify(stdinJson));
        child.stdin.end();
    });
}

/**
 * Spawn Python script without JSON parsing
 */
function spawnPython({ scriptPath, args = [], cwd, timeoutMs }) {
    return new Promise((resolve) => {
        const child = spawn(PYTHON_EXE, [scriptPath, ...args], {
            cwd: cwd || path.join(__dirname, ".."),
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

// ODA Path resolution
const ODA_PATH =
    process.env.ODA_PATH ||
    "C:\\Program Files\\ODA\\ODAFileConverter 26.10.0\\ODAFileConverter.exe";

module.exports = {
    PYTHON_EXE,
    ODA_PATH,
    spawnPython,
    spawnPythonJson,
    resolvePythonExe,
};
