-- Update Admin User Credentials
-- Run this in Supabase SQL Editor

-- 1. First, ensure the user exists or update if exists
INSERT INTO users (name, email, password, role, email_verified)
VALUES (
    'Awesome Tech',                    -- Name
    'admin@awesometech.co.ke',         -- Email (Login ID)
    'REPLACE_WITH_HASH_FROM_NODE_SCRIPT', -- Password Hash
    'admin',                           -- Role
    TRUE                               -- Email Verified
)
ON CONFLICT (email) DO UPDATE
SET 
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified;

-- 2. Verify the update
SELECT id, name, email, role FROM users WHERE email = 'admin@awesometech.co.ke';
