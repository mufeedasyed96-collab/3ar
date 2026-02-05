const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.MONGO_URI || process.env.mongodb_url || 'mongodb://localhost:27017/miyar';
const client = new MongoClient(url);

const PREFIX_MAP = {
    VIL: ["villa", "all_villa", "alfalah_villa", "yas_villa"],
    RES: ["resort"],
    COM: ["commercial", "warehouse", "shopping_mall", "office_building"],
    INF: ["infrastructure", "roads_bridges", "utilities", "drainage"],
};

function getPrefix(projectType) {
    for (const [prefix, types] of Object.entries(PREFIX_MAP)) {
        if (types.includes(projectType)) return prefix;
    }
    return "OTH";
}

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();
        const projects = db.collection('projects');

        const cursor = projects.find({});
        let migratedCount = 0;
        let skippedCount = 0;

        for await (const doc of cursor) {
            if (doc.applicationNo) {
                skippedCount++;
                continue;
            }

            const rawAppId = doc.applicationId ? String(doc.applicationId).trim() : null;
            if (!rawAppId || !/^\d+$/.test(rawAppId)) {
                skippedCount++;
                continue;
            }

            const prefix = getPrefix(doc.projectType);
            const applicationNo = `${prefix}-${rawAppId}`;

            console.log(`Migrating Project ${doc._id}: ${doc.applicationId} -> ${applicationNo}`);

            await projects.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        applicationNoRaw: rawAppId,
                        applicationNo: applicationNo,
                        // Update _id IF it was the numeric ID to the new prefixed ID 
                        // Actually, we shouldn't change _id as it's immutable and used as FK.
                        // But in this system, _id often IS the applicationId.
                    }
                }
            );
            migratedCount++;
        }

        console.log(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.close();
    }
}

migrate();
