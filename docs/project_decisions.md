# Database Collection: `project_decisions`

The `project_decisions` collection is a critical part of the project lifecycle and official approval process. It acts as an audit trail and state-management layer for official decisions made by reviewing officers.

## Purpose

The primary purpose of this collection is to:
1. **Record Official Reviews**: Store the final status (Approved, Rejected, etc.) for a specific version of a project.
2. **Discipline-Specific Decisions**: Support independent review cycles for different disciplines (e.g., Architectural, Structural, Fire & Safety).
3. **Prerequisite for Certificates**: The system requires a valid "Approved" decision record in this collection before a PDF certificate/report can be officially generated and issued.
4. **Audit Trail**: Track which officer made the decision, when it was made, and any accompanying notes or conditions.

## Schema Overview

| Field | Type | Description |
| :--- | :--- | :--- |
| `project_id` | String / ObjectId | Reference to the project in the `projects` collection. |
| `version_number` | Number | The specific version of the project submission being reviewed. |
| `discipline` | String | The review area (e.g., `architectural`, `structural`). |
| `decision` | String | The outcome: `approved`, `rejected`, `approved_with_conditions`, or `returned`. |
| `decision_payload` | Object | Full snapshot of the decision data (includes specific conditions if applicable). |
| `notes` | String | Optional comments from the reviewing officer. |
| `officer_id` | String / ObjectId | Reference to the user who made the decision. |
| `created_at` | ISODate | Timestamp when the decision was first recorded. |
| `updated_at` | ISODate | Timestamp of the last update to this decision. |

## Workflow Integration

1. **Submission**: User submits a project version.
2. **Review**: An officer reviews the submission via the backend.
3. **Decision**: The officer submits a decision (e.g., POST `/api/projects/:projectId/versions/:version/decision`). This creates/updates a record in `project_decisions`.
4. **Status Sync**: Recording a decision automatically updates the main project's `status` and `statusHistory`.
5. **Certificate**: When a certificate is requested, the system verifies `project_decisions` to ensure the version is approved before generating the final PDF.
