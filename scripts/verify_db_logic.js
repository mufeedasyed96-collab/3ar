const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.mongodb_url || 'mongodb://localhost:27017/miyar';
const TEST_APP_ID = 'VERIFY_APP_' + Date.now();

async function verify() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();
        const projects = db.collection('projects');

        console.log('=== VERIFYING DB LOGIC ===');

        // Simulate Project 1 Creation Logic
        const createProject = async (appId) => {
            let version = 1;
            if (appId) {
                const latestProject = await projects.findOne(
                    { applicationId: appId },
                    { sort: { version: -1 } }
                );
                if (latestProject && latestProject.version) {
                    version = latestProject.version + 1;
                }
            }

            const newProject = {
                applicationId: appId,
                version: version,
                createdAt: new Date(),
                test: true
            };

            const result = await projects.insertOne(newProject);
            return { id: result.insertedId, version: version };
        };

        const p1 = await createProject(TEST_APP_ID);
        console.log('Project 1 Created:', p1.id, 'Version:', p1.version);

        const p2 = await createProject(TEST_APP_ID);
        console.log('Project 2 Created:', p2.id, 'Version:', p2.version);

        if (p1.version === 1 && p2.version === 2) {
            console.log('✅ DB LOGIC VERIFIED: Versioning works.');
        } else {
            console.error('❌ DB LOGIC FAILED: Expected v1 and v2, got v' + p1.version + ' and v' + p2.version);
        }

        // Cleanup
        await projects.deleteMany({ applicationId: TEST_APP_ID });
        console.log('Cleanup done.');

    } finally {
        await client.close();
    }
}

verify().catch(console.error);
