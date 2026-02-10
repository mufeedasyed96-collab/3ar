

/**
 * Municipality-grade Upload + Versioning + Validation Server
 *
 * Main entry point - keeps configuration and route setup simple.
 * All business logic is in controllers/ and utils/
 */

const express = require("express");
const path = require("path");
const fs = require("fs");

// Database
const { connectToDatabase } = require("./database");
connectToDatabase().catch((err) =>
  console.error("[Backend] DB failed to start:", err)
);

// Middleware
const {
  correlationMiddleware,
  httpLogger,
} = require("./middleware/observability.middleware");

// Routes
const authRoutes = require("./routes/auth.routes");
const historyRoutes = require("./routes/history.routes");
const projectsRoutes = require("./routes/projects.routes");
const fileGroupsRoutes = require("./routes/file-groups.routes");
const fileVersionsRoutes = require("./routes/file-versions.routes");
const healthRoutes = require("./routes/health.routes");
const validationRoutes = require("./routes/validation.routes");
const documentsRoutes = require("./routes/documents.routes");
const clientRoutes = require("./routes/client.routes");



// App setup
const app = express();
const PORT = process.env.PORT || 9000;

// CORS (safer defaults; still allows your frontend)
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
  // Important so browser can read headers like Content-Disposition when downloading PDFs
  res.header("Access-Control-Expose-Headers", "Content-Disposition");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Middleware
app.use(correlationMiddleware);
app.use(httpLogger);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/health", healthRoutes); // if your healthRoutes uses /health (non-api)
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/file-groups", fileGroupsRoutes);
app.use("/api/file-versions", fileVersionsRoutes);
app.use("/api", validationRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/structural", require("./routes/structural.routes"));
app.use("/api/fire-safety", require("./routes/fireSafety.routes"));
app.use("/api", require("./routes/certificates.routes"));
app.use("/api/bridge", require("./routes/bridge.routes"));

// ✅ IMPORTANT: Always return JSON for missing /api routes
// This prevents "Unexpected token '<'" when frontend calls res.json() on an HTML 404 page.
app.use("/api", (req, res) => {
  return res.status(404).json({
    error: "API route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// ✅ Optional: a friendly root message
app.get("/", (req, res) => {
  res.json({ ok: true, service: "miyar-backend", port: PORT });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ API running on port ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
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
