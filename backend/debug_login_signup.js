// Add this to your backend temporarily to debug
// Run this in the backend folder

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { supabase } = require('./config/supabase');

const app = express();
app.use(cors());
app.use(express.json());

// Debug endpoint to check admin user
app.get('/debug/check-admin', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'admin@awesometech.co.ke')
            .single();

        if (error || !user) {
            return res.json({
                exists: false,
                error: error?.message || 'User not found',
                message: 'Admin user does NOT exist in database'
            });
        }

        const testPassword = 'awesometech254';
        const passwordMatch = await bcrypt.compare(testPassword, user.password);

        res.json({
            exists: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            passwordHash: user.password.substring(0, 60),
            passwordMatches: passwordMatch,
            message: passwordMatch ? 'Password is CORRECT' : 'Password does NOT match'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to test login
app.post('/debug/test-login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},name.eq.${email}`)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                details: error?.message
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        res.json({
            success: isMatch,
            message: isMatch ? 'Login would succeed' : 'Password does not match',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5001, () => {
    console.log('Debug server running on http://localhost:5001');
    console.log('Check admin: http://localhost:5001/debug/check-admin');
    console.log('');
    console.log('Test login with:');
    console.log('curl -X POST http://localhost:5001/debug/test-login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@awesometech.co.ke\\",\\"password\\":\\"awesometech254\\"}"');
});
