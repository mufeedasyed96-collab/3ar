const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.mongodb_url || process.env.MONGO_URI;
console.log('Connecting to:', url);

async function run() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db();
        console.log('Connected to DB:', db.databaseName);

        const projects = db.collection('projects');
        const decisions = db.collection('project_decisions');
        const certificates = db.collection('certificates');

        // 1. Get latest project
        const latestProject = await projects.find().sort({ createdAt: -1 }).limit(1).next();
        if (!latestProject) {
            console.log('No projects found.');
            return;
        }

        console.log('Latest Project:', {
            id: latestProject._id.toString(),
            applicationId: latestProject.applicationId || 'N/A',
            ownerName: latestProject.ownerName,
            version: latestProject.version,
            status: latestProject.status
        });

        const realProjectId = latestProject._id.toString();
        const searchId = latestProject.applicationId || realProjectId;

        // 2. Check Decisions
        console.log(`Checking decisions for Project ID: ${realProjectId}...`);
        const projectDecisions = await decisions.find({ project_id: realProjectId }).toArray();
        console.log('Decisions found:', projectDecisions.length);
        projectDecisions.forEach(d => {
            console.log(` - Ver: ${d.version_number}, Decision: ${d.decision}, Created: ${d.created_at}`);
        });

        // 3. Check Certificates
        console.log(`Checking certificates for Project ID: ${realProjectId}...`);
        const projectCerts = await certificates.find({ project_id: realProjectId }).toArray();
        console.log('Certificates found:', projectCerts.length);
        projectCerts.forEach(c => {
            console.log(` - CertNum: ${c.certificate_number}, Path: ${c.pdf_path}`);
        });

        // 4. Check ANY certificates
        const allCerts = await certificates.countDocuments();
        console.log('Total certificates in collection:', allCerts);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

run();
