const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Test credentials
const credentials = [
    { email: 'admin@awesometech.co.ke', password: 'awesometech254' },
    { email: 'awesometech', password: 'awesometech254' }
];

async function testLogin(email, password) {
    console.log(`\n🔐 Testing login with email: ${email}`);
    console.log(`   Password: ${'*'.repeat(password.length)}`);

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email,
            password
        });

        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Login failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('❌ Server not responding. Is the server running?');
            console.log('Error:', error.message);
        } else {
            console.log('Error:', error.message);
        }
        return false;
    }
}

async function checkHealth() {
    console.log('🏥 Checking server health...');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Server is not responding!');
        if (error.code === 'ECONNREFUSED') {
            console.log('   Please start the server with: npm start');
        }
        return false;
    }
}

async function runTests() {
    console.log('==================================================');
    console.log('ADMIN LOGIN TEST');
    console.log('==================================================');
    console.log(`API Base URL: ${BASE_URL}`);

    // Check if server is running
    const serverRunning = await checkHealth();

    if (!serverRunning) {
        console.log('\n⚠️  Server is not running. Please start it first.');
        process.exit(1);
    }

    // Test login attempts
    for (const creds of credentials) {
        await testLogin(creds.email, creds.password);
    }

    console.log('\n==================================================');
    console.log('TEST COMPLETED');
    console.log('==================================================');
}

runTests();
