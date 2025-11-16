// Authentication handler for IntelliNotes
class AuthManager {
    constructor() {
        this.backendBaseUrl = 'http://localhost:5000'; // Adjust if your backend runs on different port
        this.init();
        this.bindEvents();
    }

    init() {
        this.isLoading = false;
        console.log('AuthManager initialized');
    }

    bindEvents() {
        // Email/Password form submission
        const emailForm = document.getElementById('emailLoginForm');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => this.handleEmailLogin(e));
        }

        // Google OAuth button
        const googleBtn = document.getElementById('googleSignIn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        // Sign up link
        const signUpLink = document.getElementById('signUpLink');
        if (signUpLink) {
            signUpLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSignUp();
            });
        }
    }

    async handleEmailLogin(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Basic validation
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showError('Please enter your password');
            return;
        }

        this.setLoading(true);

        try {
            console.log('Attempting email login for:', email);
            
            const response = await fetch(`${this.backendBaseUrl}/loginEmail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email, 
                    password: password 
                })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                this.showSuccess('Login successful!');
                // Store user data
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('userEmail', email);
                }
                // Redirect to dashboard or main page
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                this.showError(data.error || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check if the backend server is running.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleGoogleLogin() {
        if (this.isLoading) return;
        
        this.setLoading(true);

        try {
            console.log('Initiating Google OAuth login');
            
            // You can use either endpoint - both seem to do Google OAuth
            const response = await fetch(`${this.backendBaseUrl}/loginGoogle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            console.log('Google OAuth response:', data);

            if (response.ok && data.url) {
                // Redirect to Google OAuth URL
                this.showMessage('Redirecting to Google...');
                window.location.href = data.url;
            } else {
                // If no URL returned, try the sign-up endpoint
                await this.tryAlternativeGoogleAuth();
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Failed to connect to authentication service.');
        } finally {
            this.setLoading(false);
        }
    }

    async tryAlternativeGoogleAuth() {
        try {
            console.log('Trying alternative Google auth endpoint...');
            const response = await fetch(`${this.backendBaseUrl}/sign-up`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (response.ok && data.url) {
                this.showMessage('Redirecting to Google...');
                window.location.href = data.url;
            } else {
                this.showError('Google authentication is currently unavailable.');
            }
        } catch (error) {
            console.error('Alternative Google auth error:', error);
            this.showError('Authentication service error.');
        }
    }

    handleSignUp() {
        // For now, we'll show a message since your backend doesn't have email signup yet
        this.showMessage('Email signup coming soon! For now, please use Google Sign-In.');
        
        // Optional: Clear form and switch to signup mode
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.querySelector('h2').textContent = 'Create your account';
        document.querySelector('.btn-primary').textContent = 'Sign Up';
        document.getElementById('signUpLink').innerHTML = 'Already have an account? <a href="#" id="loginLink">Log in</a>';
        
        // Rebind the login link
        setTimeout(() => {
            const loginLink = document.getElementById('loginLink');
            if (loginLink) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchToLogin();
                });
            }
        }, 100);
    }

    switchToLogin() {
        document.querySelector('h2').textContent = 'Log in to your account';
        document.querySelector('.btn-primary').textContent = 'Sign In';
        document.getElementById('signUpLink').innerHTML = 'Don\'t have an account? <a href="#" id="signUpLink">Sign up</a>';
        
        // Rebind the signup link
        setTimeout(() => {
            const signUpLink = document.getElementById('signUpLink');
            if (signUpLink) {
                signUpLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSignUp();
                });
            }
        }, 100);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(loading) {
        this.isLoading = loading;
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (loading) {
                btn.disabled = true;
                btn.style.opacity = '0.7';
                btn.style.cursor = 'not-allowed';
                
                // Add loading text to primary button
                if (btn.classList.contains('btn-primary')) {
                    const originalText = btn.textContent;
                    btn.setAttribute('data-original-text', originalText);
                    btn.innerHTML = '<div class="loading-spinner"></div> Loading...';
                }
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                
                // Restore original text
                if (btn.classList.contains('btn-primary')) {
                    const originalText = btn.getAttribute('data-original-text');
                    if (originalText) {
                        btn.textContent = originalText;
                    }
                }
            }
        });

        if (loading) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.message-popup');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message-popup message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            ${type === 'error' ? 'background: #e74c3c;' : ''}
            ${type === 'success' ? 'background: #27ae60;' : ''}
            ${type === 'info' ? 'background: #3498db;' : ''}
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        document.body.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// Add loading spinner CSS
const loadStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .btn-google .loading-spinner {
            border: 2px solid #666;
            border-top-color: transparent;
        }
    `;
    document.head.appendChild(style);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadStyles();
    new AuthManager();
    
    // Check if user is already logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
        console.log('User already logged in:', userId);
        // Optional: Auto-redirect or show welcome back message
    }
});

// Export for use in other files if needed
window.AuthManager = AuthManager;