const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.mongodb_url || 'mongodb://localhost:27017/miyar';

async function verify() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();
        const projects = db.collection('projects');

        console.log('Searching for projects...');
        const all = await projects.find({}).sort({ createdAt: -1 }).limit(5).toArray();
        all.forEach(p => {
            console.log(`ID: ${p._id}, AppId: ${p.applicationId}, Version: ${p.version}`);
        });

    } finally {
        await client.close();
    }
}

verify().catch(console.error);
