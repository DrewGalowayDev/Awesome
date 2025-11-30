/**
 * Login Redirect Script
 * Add this to index.html login modal success handler
 * 
 * Usage: Include this script and call handleLoginSuccess(user, token) after successful login
 */

function handleLoginSuccess(user, token) {
    // Save to localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Redirect based on role
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Example login function (add to your existing login modal)
async function performLogin(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            handleLoginSuccess(data.user, data.token);
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

/* 
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Find your login modal in index.html
 * 2. Add this script before the closing </body> tag
 * 3. In your login form submit handler, call performLogin(email, password)
 * 
 * OR manually call handleLoginSuccess(user, token) after your existing login logic
 */
