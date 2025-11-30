/**
 * create_admin.js
 *
 * Usage:
 * 1. In `backend/.env` set `SUPABASE_SERVICE_KEY` to your Supabase service role key.
 * 2. From the `backend` folder run:
 *    node create_admin.js
 *
 * This script will upsert a new admin user with:
 *  - email: admin@gmail.com
 *  - username/name: admin
 *  - password: admin123
 *  - role: admin
 *
 * It will NOT delete existing users. If a user with the email exists, the script
 * will update their role to 'admin' and reset the password to the hashed value.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('./config/supabase');

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_NAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

(async () => {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY === 'your_supabase_service_role_key') {
      console.error('\nERROR: SUPABASE_SERVICE_KEY is not set in backend/.env.\nSet it to your Supabase service-role key and re-run this script.');
      process.exit(1);
    }

    const client = supabaseAdmin || supabase;

    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Check if user exists by email
    console.log(`Checking for existing user with email: ${ADMIN_EMAIL}`);
    const { data: existing, error: selectErr } = await client
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();

    if (selectErr) {
      console.error('Error querying users table:', selectErr);
      process.exit(1);
    }

    if (existing) {
      console.log('User already exists. Updating role to admin and resetting password.');
      const { data: updated, error: updErr } = await client
        .from('users')
        .update({ password: hashed, role: 'admin', name: ADMIN_NAME })
        .eq('email', ADMIN_EMAIL)
        .select()
        .maybeSingle();

      if (updErr) {
        console.error('Error updating existing user:', updErr);
        process.exit(1);
      }

      console.log('User updated successfully:', { id: updated.id, email: updated.email, role: updated.role });
      process.exit(0);
    }

    // Insert new admin user
    console.log('Inserting new admin user...');
    const { data, error } = await client
      .from('users')
      .insert([{ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed, phone: null, role: 'admin' }])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error inserting admin user:', error);
      process.exit(1);
    }

    console.log('Admin user created:', { id: data.id, email: data.email, role: data.role });
    console.log('\nYou can now login using:');
    console.log('  email: admin@gmail.com');
    console.log('  password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  }
})();
