/**
 * Admin Authentication Module
 * Handles admin role verification and redirects
 */

/**
 * Admin Authentication & API Configuration Module
 * Handles admin authentication, API requests, and error handling
 */

// ============================================
// CONFIGURATION
// ============================================

const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
};

// ============================================
// AUTHENTICATION
// ============================================

// Check if user is authenticated and is admin
function checkAdminAuth() {
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user || user.role !== 'admin') {
        // Redirect to homepage if not admin
        console.warn('Unauthorized access attempt - redirecting to homepage');
        window.location.href = 'index.html';
        return false;
    }

    // Update UI with user info
    if (user.name) {
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
    }

    return true;
}

// Logout function
function logout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    });
}

// ============================================
// API REQUEST HANDLER
// ============================================

let activeRequests = 0;

// Show/hide global loading indicator
function setGlobalLoading(isLoading) {
    activeRequests += isLoading ? 1 : -1;

    // Optional: Add global loading indicator
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = activeRequests > 0 ? 'block' : 'none';
    }
}

// Main API request function
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        console.error('No authentication token found');
        window.location.href = 'index.html';
        throw new Error('Authentication required');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    setGlobalLoading(true);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            ...config,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            // Handle different error types
            if (response.status === 401) {
                // Unauthorized - token expired or invalid
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                throw new Error('Session expired. Please login again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Insufficient permissions.');
            } else if (response.status === 404) {
                throw new Error('Resource not found.');
            } else if (response.status === 500) {
                throw new Error('Server error. Please try again later.');
            }

            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        setGlobalLoading(false);
        return data;

    } catch (error) {
        setGlobalLoading(false);

        if (error.name === 'AbortError') {
            console.error('Request timeout:', endpoint);
            throw new Error('Request timeout. Please check your connection.');
        }

        console.error('API Error:', {
            endpoint,
            error: error.message,
            timestamp: new Date().toISOString()
        });

        throw error;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format currency (Kenyan Shillings)
function formatCurrency(amount) {
    return `KSh ${Number(amount).toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Toast notification (using existing showToast from dashboard)
function showAPIError(error) {
    const message = error.message || 'An error occurred';

    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'error',
            title: message
        });
    } else {
        alert(message);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAdminAuth();

    // Log API configuration (development only)
    if (window.location.hostname === 'localhost') {
        console.log('Admin Dashboard - API Config:', {
            baseURL: API_CONFIG.BASE_URL,
            authenticated: !!localStorage.getItem('auth_token')
        });
    }
});
