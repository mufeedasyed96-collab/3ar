const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:8289/api';
const TEST_APP_ID = 'APP_UNIFIED_' + Date.now();
const TEST_USER = {
    name: 'Unified Bot',
    email: `ubot_${Date.now()}@test.com`,
    password: 'password123'
};

async function runTest() {
    console.log('=== STARTING TEST: UNIFIED APPLICATION ID AS PROJECT ID ===');

    try {
        // 0. Signup
        console.log('Signing up test user...');
        const signupRes = await axios.post(`${API_URL}/auth/signup`, TEST_USER);
        const token = signupRes.data.token;
        console.log('Signup successful.');

        // 1. First Project Creation (Version 1)
        console.log(`Creating project with App ID: ${TEST_APP_ID}`);
        const res1 = await axios.post(`${API_URL}/projects`, {
            applicationId: TEST_APP_ID,
            projectType: 'villa',
            ownerName: 'Test Owner',
            consultantName: 'Test Consultant',
            plotNo: '123',
            zone: 'Zone A',
            city: 'Dubai'
        }, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        console.log('Project 1 Result:', res1.data.id, '(Version ' + res1.data.project.version + ')');
        if (res1.data.id !== TEST_APP_ID) {
            throw new Error(`Expected Project ID ${TEST_APP_ID}, got ${res1.data.id}`);
        }
        if (res1.data.project.version !== 1) {
            throw new Error('Expected version 1, got ' + res1.data.project.version);
        }

        // 2. Second Project Creation (Version 2)
        console.log(`Re-submitting with same App ID: ${TEST_APP_ID}`);
        const res2 = await axios.post(`${API_URL}/projects`, {
            applicationId: TEST_APP_ID,
            projectType: 'villa',
            ownerName: 'Test Owner (Updated)',
            consultantName: 'Test Consultant',
            plotNo: '123',
            zone: 'Zone A',
            city: 'Dubai'
        }, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        console.log('Project 2 Result:', res2.data.id, '(Version ' + res2.data.project.version + ')');
        if (res2.data.id !== TEST_APP_ID) {
            throw new Error(`Expected Project ID ${TEST_APP_ID}, got ${res2.data.id}`);
        }
        if (res2.data.project.version !== 2) {
            throw new Error('Expected version 2, got ' + res2.data.project.version);
        }

        console.log('✅ TEST PASSED: Application ID correctly used as Project ID with versioning.');
    } catch (err) {
        console.error('❌ TEST FAILED:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err);
        }
    }
}

runTest();
