/**
 * MIGRATION SCRIPT: Fix Duplicate File Groups
 * 
 * Usage: node scripts/migrate_file_groups.js
 * 
 * Logic:
 * 1. Find all file_groups.
 * 2. Group them by (projectId + type).
 * 3. Identify duplicates (buckets with > 1 group).
 * 4. For each duplicate set:
 *    - Pick MASTER group (oldest created or one with most metadata).
 *    - Move all file_versions from SLAVE groups to MASTER group.
 *    - Delete SLAVE groups.
 *    - Re-sequence all versions in MASTER group by created_at.
 *    - Ensure only the LATEST version is is_active=true.
 * 5. Create Unique Indexes to prevent recurrence.
 */

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const MONGO_URI = process.env.mongodb_url || process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME; // Let the URI determine the DB, or fallback to client.db() default

async function migrate() {
    console.log('=== STARTING MIGRATION: FIX FILE GROUPS ===');
    console.log(`DB: ${MONGO_URI} / ${DB_NAME}`);

    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB.');
        // Use database from URI
        const db = client.db();
        const groupsColl = db.collection('file_groups');
        const versionsColl = db.collection('file_versions');

        // 1. Fetch all groups
        const allGroups = await groupsColl.find({}).toArray();
        console.log(`Found ${allGroups.length} total file groups.`);

        // 2. Group by key
        const buckets = {};
        allGroups.forEach(g => {
            // Key integrity check
            if (!g.projectId || !g.type) return;

            const key = `${g.projectId}::${g.type}`;
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(g);
        });

        const keys = Object.keys(buckets);
        console.log(`Found ${keys.length} unique Project+Type pairs.`);

        let mergedCount = 0;

        // 3. Process duplicates
        for (const key of keys) {
            const groupSet = buckets[key];
            if (groupSet.length < 2) continue; // No duplicates

            console.log(`\nProcessing duplicate set for [${key}] (${groupSet.length} groups)...`);
            mergedCount++;

            // Sort by createdAt ascending (keep oldest as master typically, or logic choice)
            // If createdAt missing, rely on _id (timestamp embedded)
            groupSet.sort((a, b) => {
                const tA = a.created_at ? new Date(a.created_at).getTime() : a._id.getTimestamp().getTime();
                const tB = b.created_at ? new Date(b.created_at).getTime() : b._id.getTimestamp().getTime();
                return tA - tB;
            });

            const master = groupSet[0];
            const slaves = groupSet.slice(1);

            console.log(` -> Master: ${master._id} (Created: ${master.created_at})`);
            console.log(` -> Slaves to merge: ${slaves.map(s => s._id).join(', ')}`);

            // A. Move Versions
            const slaveIds = slaves.map(s => s._id.toString());
            // Need to match string vs ObjectId carefully. Usually group_id is string in versions based on backend code viewed.
            // Let's check format. Code uses: group_id: group._id.toString()
            const updateResult = await versionsColl.updateMany(
                { group_id: { $in: slaveIds } },
                { $set: { group_id: master._id.toString() } }
            );
            console.log(`    Moved ${updateResult.modifiedCount} versions to master.`);

            // B. Delete Slaves
            await groupsColl.deleteMany({ _id: { $in: slaves.map(s => s._id) } });
            console.log(`    Deleted ${slaves.length} duplicate groups.`);

            // C. Re-sequence Master
            const allVersions = await versionsColl.find({ group_id: master._id.toString() }).toArray();

            // Sort by created_at (oldest first = v1)
            allVersions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            console.log(`    Resequencing ${allVersions.length} versions...`);

            for (let i = 0; i < allVersions.length; i++) {
                const ver = allVersions[i];
                const newVerNum = i + 1;
                const isLast = (i === allVersions.length - 1);

                await versionsColl.updateOne(
                    { _id: ver._id },
                    {
                        $set: {
                            version_number: newVerNum,
                            is_active: isLast // Only last one active
                        }
                    }
                );
            }

            // D. Update Master Group Metadata
            await groupsColl.updateOne(
                { _id: master._id },
                {
                    $set: {
                        current_version: allVersions.length,
                        updated_at: new Date()
                    }
                }
            );
            console.log(`    Master updated. Current Version: ${allVersions.length}`);
        }

        console.log(`\n=== MIGRATION COMPLETE ===`);
        console.log(`Merged ${mergedCount} duplicate sets.`);

        // 3.5 Fix Multiple Active Versions (even in non-duplicate groups)
        console.log('\nScanning for multiple active versions in unique groups...');
        let fixedActiveCount = 0;

        for (const grp of allGroups) {
            const activeVers = await versionsColl.find({ group_id: grp._id.toString(), is_active: true }).toArray();
            if (activeVers.length > 1) {
                // Sort by version desc (keep latest)
                activeVers.sort((a, b) => b.version_number - a.version_number);
                const winner = activeVers[0];
                const losers = activeVers.slice(1);

                await versionsColl.updateMany(
                    { _id: { $in: losers.map(l => l._id) } },
                    { $set: { is_active: false } }
                );
                console.log(`    Fixed Group ${grp._id}: Deactivated ${losers.length} old active versions.`);
                fixedActiveCount++;
            }
        }
        console.log(`Fixed active flags in ${fixedActiveCount} groups.`);

        // 4. Create Indexes
        console.log('\nCreating Constraints (Indexes)...');

        // Unique Group per Project+Type
        try {
            await groupsColl.createIndex(
                { projectId: 1, type: 1 },
                { unique: true, name: 'unique_project_type_group' }
            );
            console.log(' [x] Created Unique Index on file_groups (projectId + type)');
        } catch (e) {
            console.error(' [!] Failed to create group index (duplicates might still exist?):', e.message);
        }

        // Unique Version per Group
        try {
            await versionsColl.createIndex(
                { group_id: 1, version_number: 1 },
                { unique: true, name: 'unique_group_version' }
            );
            console.log(' [x] Created Unique Index on file_versions (group_id + version_number)');
        } catch (e) {
            console.error(' [!] Failed to create version index:', e.message);
        }

        // Single Active Version
        try {
            await versionsColl.createIndex(
                { group_id: 1, is_active: 1 },
                {
                    unique: true,
                    partialFilterExpression: { is_active: true },
                    name: 'single_active_version'
                }
            );
            console.log(' [x] Created Partial Unique Index on active versions');
        } catch (e) {
            console.error(' [!] Failed to create active index:', e.message);
        }

    } catch (err) {
        console.error('FATAL ERROR:', err);
    } finally {
        await client.close();
        console.log('DB Connection Closed.');
    }
}

migrate();
