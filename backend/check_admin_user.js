require('dotenv').config();
const { supabase, supabaseAdmin } = require('./config/supabase');

console.log('SUPABASE_URL set:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY set:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_KEY set:', !!process.env.SUPABASE_SERVICE_KEY);

(async () => {
  try {
    const email = 'admin@awesometech.co.ke';
    console.log('Querying users table for:', email);

    // Try using the admin client first (service role key). Falls back to anon if not present.
    const client = supabaseAdmin || supabase;

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error.message || JSON.stringify(error));
      process.exit(1);
    }

    if (!data) {
      console.log('No user found with that email.');
      process.exit(0);
    }

    // Print fields we can see (hide long password partially)
    const safe = { ...data };
    if (safe.password) {
      safe.password = `${safe.password.slice(0, 10)}... (len=${safe.password.length})`;
    }

    console.log('User record found:');
    console.log(JSON.stringify(safe, null, 2));
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
