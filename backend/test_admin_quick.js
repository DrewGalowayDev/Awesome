const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminLogin() {
    console.log('==================================================');
    console.log('ADMIN LOGIN TEST (HTTP)');
    console.log('==================================================\n');

    // Test credentials
    const credentials = [
        { label: 'Email', email: 'admin@awesometech.co.ke', password: 'awesometech254' },
        { label: 'Username', email: 'awesometech', password: 'awesometech254' },
        { label: 'Name variant', email: 'Awesome Tech', password: 'awesometech254' }
    ];

    for (const cred of credentials) {
        console.log(`\n📝 Testing with ${cred.label}: ${cred.email}`);
        console.log(`   Password: ${'*'.repeat(cred.password.length)}`);

        try {
            const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: cred.email,
                password: cred.password
            }, {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: () => true // Don't throw on error status
            });

            if (response.status === 200 && response.data.success) {
                console.log('✅ LOGIN SUCCESSFUL!');
                console.log('   Token:', response.data.token.substring(0, 30) + '...');
                console.log('   User:', JSON.stringify(response.data.user, null, 4));
                return;
            } else {
                console.log(`❌ Login failed (Status ${response.status})`);
                console.log('   Response:', JSON.stringify(response.data, null, 4));
            }
        } catch (error) {
            console.log('❌ Request error:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.log('   ⚠️  Server is not running!');
            }
        }
    }

    console.log('\n==================================================');
    console.log('DIAGNOSIS & SOLUTIONS');
    console.log('==================================================');
    console.log('\n🔍 All login attempts failed with 401 Unauthorized.');
    console.log('This means:');
    console.log('  1. The admin user does NOT exist in the database, OR');
    console.log('  2. The password hash in the database does NOT match\n');

    console.log('✅ SOLUTIONS:\n');
    console.log('Option A: Check if admin exists in Supabase');
    console.log('  1. Go to your Supabase dashboard');
    console.log('  2. Navigate to: Table Editor → users');
    console.log('  3. Look for email: admin@awesometech.co.ke');
    console.log('  4. If NOT found, run the SQL script\n');

    console.log('Option B: Create/Update admin user');
    console.log('  1. Run: node generate_admin_hash.js');
    console.log('  2. Copy the generated hash from hash_result.txt');
    console.log('  3. Open Supabase SQL Editor');
    console.log('  4. Paste and modify the SQL from update_admin.sql');
    console.log('  5. Replace REPLACE_WITH_HASH_FROM_NODE_SCRIPT with the copied hash');
    console.log('  6. Execute the SQL\n');

    console.log('Option C: I can generate a fresh hash for you now');
    console.log('  Let me generate it...\n');

    // Generate fresh hash
    const bcrypt = require('bcryptjs');
    const password = 'awesometech254';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    console.log('📋 COPY THIS SQL AND RUN IN SUPABASE:\n');
    console.log('---------------------------------------------------');
    console.log(`INSERT INTO users (name, email, password, role, email_verified)`);
    console.log(`VALUES (`);
    console.log(`    'Awesome Tech',`);
    console.log(`    'admin@awesometech.co.ke',`);
    console.log(`    '${hash}',`);
    console.log(`    'admin',`);
    console.log(`    TRUE`);
    console.log(`)`);
    console.log(`ON CONFLICT (email) DO UPDATE`);
    console.log(`SET password = EXCLUDED.password,`);
    console.log(`    role = EXCLUDED.role;`);
    console.log('---------------------------------------------------\n');

    console.log('\n==================================================');
    console.log('TEST COMPLETED');
    console.log('==================================================');
}

testAdminLogin().catch(console.error);
