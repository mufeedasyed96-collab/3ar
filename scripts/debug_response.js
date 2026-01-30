const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:8289/api';
const TEST_APP_ID = 'DEBUG_APP_' + Date.now();
const TEST_USER = {
    name: 'Debug Bot',
    email: `dbot_${Date.now()}@test.com`,
    password: 'password123'
};

async function runTest() {
    try {
        const signupRes = await axios.post(`${API_URL}/auth/signup`, TEST_USER);
        const token = signupRes.data.token;

        const res = await axios.post(`${API_URL}/projects`, {
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

        console.log('FULL RESPONSE:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error(err.message);
        if (err.response) console.error(err.response.data);
    }
}

runTest();
