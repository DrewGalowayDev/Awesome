const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing login to http://localhost:5000/api/auth/login');
        console.log('Credentials: admin@awesometech.co.ke / awesometech254\n');

        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@awesometech.co.ke',
                password: 'awesometech254'
            })
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log('User:', data.user);
            console.log('Token:', data.token ? 'Token received' : 'No token');
        } else {
            console.log('\n❌ LOGIN FAILED!');
            console.log('Error:', data.message);
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Make sure the backend server is running on http://localhost:5000');
    }
}

// Also test with username
async function testLoginWithUsername() {
    try {
        console.log('\n\nTesting login with username: awesometech\n');

        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'awesometech',  // Using username instead of email
                password: 'awesometech254'
            })
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ LOGIN WITH USERNAME SUCCESSFUL!');
        } else {
            console.log('\n❌ LOGIN WITH USERNAME FAILED!');
            console.log('Error:', data.message);
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

// Run tests
testLogin().then(() => testLoginWithUsername());
