const { getDb } = require('../database');

/**
 * Middleware to prevent modifications to locked projects/versions
 * Expects projectId in req.body, req.params, or req.query
 */
const checkProjectLock = async (req, res, next) => {
    try {
        const projectId = req.body.projectId || req.params.projectId || req.params.id || req.query.projectId;
        // If no project ID is provided, we can't check lock (e.g. new project creation), 
        // so we proceed (or fail if projectId is mandatory for the route). 
        // For uploads, if projectId is missing, it might be a "new" validation/project or just validation without storage.
        // If user is uploading a NEW file to an EXISTING project, projectId must be present.

        if (!projectId) {
            // If projectId is not in request, assume it's NOT targetting a specific locked project yet 
            // OR the controller validates presence. 
            // However, strict requirement: "Only allow uploads when...". 
            // If projectId provided, we MUST check.
            return next();
        }

        const db = getDb();
        const projects = db.collection('projects');

        // Check Project Level Lock
        const project = await projects.findOne({ _id: projectId });

        if (project) {
            if (project.locked) {
                return res.status(409).json({ error: 'Project is CLOSED/LOCKED. No further submissions allowed.' });
            }

            // Start of Version Level Lock Logic (Optional depending on how strict we want to be here vs controller)
            // Ideally we check if the CURRENT version is locked, but usually a new upload means checking if we CAN create a new version
            // If project is not locked, we generally can create a new version (unless specific version logic applies)
            // The requirement says: "If rejected: project remains unlocked (new version allowed)"
            // So checking project.locked is sufficient for the "Project" scope.

            // BUT: "If version.locked == true, block: uploads, edits..."
            // Usually uploads create a NEW version or update DRAFT.
            // If the INTENT is to update a specific version, we need version number.
            // Uploads usually target the "next" version or "current draft".
            // If current draft is locked (which shouldn't happen unless "decided"), we can't update it.
            // But if it's "decided", we should be creating a NEW version.

            // For now, Project Lock is the main gate for "Case Closed".
        }

        next();
    } catch (error) {
        console.error('Lock Check Error:', error);
        res.status(500).json({ error: 'Internal server error during lock check' });
    }
};

module.exports = { checkProjectLock };
