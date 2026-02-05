const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.MONGO_URI || process.env.mongodb_url;
if (!url) {
    console.warn('[MongoDB] WARNING: MONGO_URI or mongodb_url is not set in .env. MongoDB functionality will be limited.');
}

const client = new MongoClient(url || 'mongodb://localhost:27017/miyar');

let db = null;

async function connectToDatabase() {
    if (db) return db;

    try {
        if (!url) {
            console.warn('[MongoDB] Using local fallback URL: mongodb://localhost:27017/miyar');
        }
        await client.connect();
        console.log('[MongoDB] Connected successfully to server');
        // If the URL has a DB name, client.db() will use it, otherwise falls back to 'miyar'
        db = client.db();

        // Create index for unique emails
        const users = db.collection('users');
        await users.createIndex({ email: 1 }, { unique: true });

        // Certificates: Unique certificate number, and unique version per project
        const certificates = db.collection('certificates');
        await certificates.createIndex({ certificate_number: 1 }, { unique: true });
        await certificates.createIndex({ project_id: 1, version_number: 1 }, { unique: true });

        // Project Versions: Unique version per project
        const versions = db.collection('project_versions');
        await versions.createIndex({ project_id: 1, version_number: 1 }, { unique: true });

        // Projects: Unique application number (prefixed)
        const projects = db.collection('projects');
        await projects.createIndex({ applicationNo: 1 }, { unique: true, sparse: true });

        return db;
    } catch (error) {
        console.error('[MongoDB] Connection error:', error);
        // throw error;
        return null;
    }
}

function getDb() {
    return db;
}

module.exports = { connectToDatabase, getDb };
