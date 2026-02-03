const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUrl = process.env.mongodb_url || process.env.MONGO_URI;
const jwtSecret = process.env.jwt_secret;
const API_BASE = 'http://localhost:8289/api';

async function run() {
    const client = new MongoClient(mongoUrl);
    try {
        await client.connect();
        const db = client.db();
        console.log('Connected to DB:', db.databaseName);

        const projects = db.collection('projects');
        const decisions = db.collection('project_decisions');

        const projectId = '9997';
        const version = 1;

        // 1. Ensure Project
        await projects.updateOne(
            { _id: projectId },
            {
                $set: {
                    ownerName: 'Test Idempotency Owner',
                    version: 1,
                    applicationId: '9997',
                    createdBy: 'test_officer'
                }
            },
            { upsert: true }
        );
        console.log('Project 9999 upserted.');

        // 2. Ensure Decision
        await decisions.updateOne(
            { project_id: projectId, version_number: version },
            {
                $set: {
                    decision: 'approved',
                    notes: 'Auto-approved by test script',
                    officer_id: 'test_officer',
                    created_at: new Date()
                }
            },
            { upsert: true }
        );
        console.log('Decision for 9999 upserted.');

        // 3. Generate Token
        const token = jwt.sign(
            { userId: 'test_officer', email: 'test@example.com', role: 'officer' },
            jwtSecret,
            { expiresIn: '1h' }
        );
        console.log('Generated Test Token.');

        // 3.5 Check Project Connectivity
        const projectUrl = `${API_BASE}/projects/${projectId}`;
        console.log('Checking connectivity:', projectUrl);
        try {
            const pRes = await axios.get(projectUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Project GET Status:', pRes.status);
        } catch (e) {
            console.error('Project GET Failed:', e.response ? e.response.status : e.message);
        }

        // 3.6 Check Decision Route
        const decisionUrl = `${API_BASE}/projects/${projectId}/versions/${version}/decision`;
        console.log('Checking decision route:', decisionUrl);
        try {
            // Send a dummy decision just to see if route exists
            const dRes = await axios.post(decisionUrl,
                { decision_type: 'rejected', remarks: 'Test rejection report generation' },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            console.log('Decision POST Status:', dRes.status);
        } catch (e) {
            console.error('Decision POST Failed:', e.response ? e.response.status : e.message);
        }

        // 4. Call API
        const url = `${API_BASE}/projects/${projectId}/versions/${version}/certificate`;
        console.log('Calling:', url);

        try {
            const res = await axios.post(url, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Response Status:', res.status);
            console.log('Response Data:', res.data);
        } catch (apiErr) {
            if (apiErr.response) {
                console.error('API Error:', apiErr.response.status, apiErr.response.data);
            } else {
                console.error('API Call Failed:', apiErr.message);
            }
        }

        console.log('--- Calling again to test Idempotency ---');
        try {
            const res2 = await axios.post(url, { discipline: 'architectural' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Second Call Status:', res2.status);
            console.log('Second Call Message:', res2.data.message);
        } catch (apiErr) {
            console.error('Second Call Failed:', apiErr.response ? apiErr.response.status : apiErr.message);
        }

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await client.close();
    }
}

run();
