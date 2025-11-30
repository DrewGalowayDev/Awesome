-- =================================================================
-- ADMIN ACCOUNT SETUP - Awesome Technologies
-- =================================================================

-- Credentials:
-- Name:     awesometech
-- Email:    admin@awesometech.co.ke
-- Password: awesometech254

INSERT INTO users (name, email, password, role, email_verified) 
VALUES (
    'awesometech', 
    'admin@awesometech.co.ke', 
    '$2a$10$jcGz8DaoDpOV8nK6lWbwu..f.shviTpkBlwxRIEXm7t8dPqEqYSHy', -- Pre-generated hash for 'awesometech254'
    'admin', 
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET 
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified;

-- Verify
SELECT id, name, email, role FROM users WHERE email = 'admin@awesometech.co.ke';
