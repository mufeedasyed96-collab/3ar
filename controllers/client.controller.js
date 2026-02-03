/**
 * Client Controller
 * Handles client metadata storage and retrieval
 */

const { getDb } = require("../database");

/**
 * Extract first name from full name
 */
function extractFirstName(fullName) {
    if (!fullName) return null;
    const parts = String(fullName).trim().split(/\s+/);
    return parts[0] || null;
}

/**
 * Compare names (case-insensitive)
 */
function compareNames(name1, name2) {
    if (!name1 || !name2) return false;
    return String(name1).toLowerCase().trim() === String(name2).toLowerCase().trim();
}

/**
 * Save client metadata
 * POST /api/client
 */
async function saveClientMetadata(req, res) {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: "Database connection failed" });
    }

    const { applicationId, projectId, passport, emiratesId } = req.body;

    if (!applicationId) {
        return res.status(400).json({ error: "applicationId is required" });
    }

    try {
        const collection = db.collection("client_metadata");

        // Extract first names
        const passportFirstName = passport?.given_names
            ? extractFirstName(passport.given_names)
            : extractFirstName(passport?.full_name);

        const eidFirstName = extractFirstName(emiratesId?.full_name);

        // Compare names
        const namesMatch = compareNames(passportFirstName, eidFirstName);

        const metadata = {
            applicationId,
            projectId: projectId || null,
            passport: passport ? {
                full_name: passport.full_name || null,
                first_name: passportFirstName,
                surname: passport.surname || null,
                given_names: passport.given_names || null,
                nationality: passport.nationality || null,
                nationality_code: passport.nationality_code || null,
                data_source: passport.data_source || null,
            } : null,
            emiratesId: emiratesId ? {
                full_name: emiratesId.full_name || null,
                first_name: eidFirstName,
                eid_number: emiratesId.eid_number || null,
                nationality: emiratesId.nationality || null,
            } : null,
            namesMatch,
            updatedAt: new Date(),
        };

        // Upsert by applicationId
        const result = await collection.findOneAndUpdate(
            { applicationId },
            {
                $set: metadata,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, returnDocument: "after" }
        );

        const doc = result.value || result;

        return res.json({
            success: true,
            data: {
                firstName: eidFirstName || passportFirstName,
                eidNumber: emiratesId?.eid_number || null,
                nationality: emiratesId?.nationality || passport?.nationality || null,
                namesMatch,
                applicationId,
            },
        });
    } catch (error) {
        console.error("[Client] Save error:", error);
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Get client metadata by applicationId
 * GET /api/client/:applicationId
 */
async function getClientMetadata(req, res) {
    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: "Database connection failed" });
    }

    const { applicationId } = req.params;

    if (!applicationId) {
        return res.status(400).json({ error: "applicationId is required" });
    }

    try {
        const collection = db.collection("client_metadata");
        const doc = await collection.findOne({ applicationId });

        if (!doc) {
            return res.status(404).json({ error: "Client not found" });
        }

        // Return simplified view for frontend
        return res.json({
            success: true,
            data: {
                firstName: doc.emiratesId?.first_name || doc.passport?.first_name || null,
                eidNumber: doc.emiratesId?.eid_number || null,
                nationality: doc.emiratesId?.nationality || doc.passport?.nationality || null,
                namesMatch: doc.namesMatch,
                applicationId: doc.applicationId,
                passport: doc.passport,
                emiratesId: doc.emiratesId,
            },
        });
    } catch (error) {
        console.error("[Client] Get error:", error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    saveClientMetadata,
    getClientMetadata,
    extractFirstName,
    compareNames,
};
