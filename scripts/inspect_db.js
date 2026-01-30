const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.mongodb_url || 'mongodb://localhost:27017/miyar';

async function verify() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();
        const projects = db.collection('projects');

        console.log('=== LATEST PROJECTS ===');
        const latest = await projects.find().sort({ createdAt: -1 }).limit(3).toArray();
        console.log(JSON.stringify(latest, null, 2));

    } finally {
        await client.close();
    }
}

verify().catch(console.error);
