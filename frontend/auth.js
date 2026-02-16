// Authentication System
const API_BASE = 'http://localhost:3001/api';

// Tab switching
function switchTab(tab) {
    // Remove active class from all tabs and forms
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    
    // Add active class to selected tab and form
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
    
    // Clear message
    showMessage('', '');
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showMessage('Logging in...', 'info');
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Login successful! Redirecting...', 'success');
            
            // Store user data
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'customer-dashboard.html';
                }
            }, 1000);
            
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!username || !email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        showMessage('Creating account...', 'info');
        
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            
            // Clear form and switch to login
            document.getElementById('register-form').querySelector('form').reset();
            setTimeout(() => {
                switchTab('login');
            }, 1500);
            
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    if (message) {
        messageDiv.style.display = 'block';
    } else {
        messageDiv.style.display = 'none';
    }
}

// Check if user is already logged in
function checkExistingLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'customer-dashboard.html';
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Check for existing login when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only check on login page
    if (window.location.pathname.includes('login.html')) {
        checkExistingLogin();
    }
});