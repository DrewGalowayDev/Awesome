const bcrypt = require('bcryptjs');
const { supabase } = require('./config/supabase');
require('dotenv').config();

async function diagnoseAdmin() {
    console.log('==================================================');
    console.log('ADMIN LOGIN DIAGNOSTICS');
    console.log('==================================================\n');

    const expectedEmail = 'admin@awesometech.co.ke';
    const expectedPassword = 'awesometech254';

    try {
        // Check if user exists
        console.log(`1️⃣  Checking if user exists: ${expectedEmail}`);
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', expectedEmail)
            .single();

        if (fetchError || !user) {
            console.log('❌ User NOT found in database!');
            console.log('Error:', fetchError?.message || 'No user returned');
            console.log('\n📝 You need to create the admin user in Supabase.');
            console.log('   Run the SQL script: backend/database/update_admin.sql');
            return;
        }

        console.log('✅ User found!');
        console.log('   ID:', user.id);
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Password Hash (first 50 chars):', user.password.substring(0, 50) + '...');

        // Check password
        console.log(`\n2️⃣  Testing password: ${expectedPassword}`);
        const isMatch = await bcrypt.compare(expectedPassword, user.password);

        if (isMatch) {
            console.log('✅ Password matches!');
            console.log('\n🎉 DIAGNOSIS: Admin credentials are CORRECT!');
            console.log('   The login should work. Check browser console for frontend errors.');
        } else {
            console.log('❌ Password does NOT match!');
            console.log('\n🔧 SOLUTION: The password hash in the database is incorrect.');
            console.log('   You need to:');
            console.log('   1. Run: node generate_admin_hash.js');
            console.log('   2. Copy the generated hash');
            console.log('   3. Update the SQL in update_admin.sql');
            console.log('   4. Run the SQL in Supabase SQL Editor');

            // Generate correct hash
            console.log('\n🔑 Generating correct hash now...');
            const salt = await bcrypt.genSalt(10);
            const correctHash = await bcrypt.hash(expectedPassword, salt);
            console.log('\nCorrect hash for password "' + expectedPassword + '":');
            console.log(correctHash);
            console.log('\n📋 Copy this SQL and run it in Supabase:');
            console.log(`\nUPDATE users SET password = '${correctHash}' WHERE email = '${expectedEmail}';\n`);
        }

        // Also try login with username
        console.log(`\n3️⃣  Checking login with username/name field...`);
        const { data: userByName, error: nameError } = await supabase
            .from('users')
            .select('*')
            .eq('name', user.name)
            .single();

        if (userByName) {
            console.log(`✅ User can also login with name: "${user.name}"`);
        }

    } catch (error) {
        console.error('\n❌ Error during diagnosis:', error);
        console.error('\nPossible causes:');
        console.error('1. Database connection issue - check .env file');
        console.error('2. Supabase configuration problem');
        console.error('3. Network connectivity issue');
    }

    console.log('\n==================================================');
    console.log('DIAGNOSIS COMPLETE');
    console.log('==================================================');
}

diagnoseAdmin();
