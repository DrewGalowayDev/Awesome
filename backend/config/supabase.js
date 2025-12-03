const { createClient } = require('@supabase/supabase-js');

// Validate environment variables and provide clearer guidance
const missing = [];
if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
if (!process.env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');

if (missing.length > 0) {
    throw new Error(`Missing Supabase env var(s): ${missing.join(', ')}.\nPlease copy backend/.env.example to backend/.env and fill in the values (do NOT commit secrets).`);
}

// Create Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Create Supabase admin client (for admin operations)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

module.exports = {
    supabase,
    supabaseAdmin
};
