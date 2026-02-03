/**
 * Client Routes
 * Routes for client metadata management
 */

const express = require("express");
const router = express.Router();

const { saveClientMetadata, getClientMetadata } = require("../controllers/client.controller");

// Save/update client metadata
router.post("/", saveClientMetadata);

// Get client metadata by applicationId
router.get("/:applicationId", getClientMetadata);

module.exports = router;
