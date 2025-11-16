class AuthManager {
    constructor() {
        this.backendBaseUrl = 'http://localhost:5000';
        this.isLoginMode = true;
        this.isLoading = false;
        this.init();
        this.bindEvents();
    }

    init() {
        console.log('AuthManager initialized');
        this.updateUI();
    }

    bindEvents() {
        // Form submission
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Switch between login/signup
        const switchLink = document.getElementById('switchAuthLink');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        this.updateUI();
        this.clearForm();
    }

    updateUI() {
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const switchText = document.getElementById('switchText');
        const switchLink = document.getElementById('switchAuthLink');
        const signupFields = document.getElementById('signupFields');

        if (this.isLoginMode) {
            formTitle.textContent = 'Log in to your account';
            submitBtn.textContent = 'Sign In';
            switchText.innerHTML = 'Don\'t have an account? ';
            switchLink.textContent = 'Sign up';
            signupFields.style.display = 'none';
        } else {
            formTitle.textContent = 'Create your account';
            submitBtn.textContent = 'Sign Up';
            switchText.innerHTML = 'Already have an account? ';
            switchLink.textContent = 'Log in';
            signupFields.style.display = 'block';
        }
    }

    clearForm() {
        document.getElementById('authForm').reset();
        this.clearMessages();
    }

    clearMessages() {
        const errorMessages = document.querySelectorAll('.error-message, .success-message');
        errorMessages.forEach(msg => msg.remove());
        
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => input.classList.remove('error'));
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const fullName = document.getElementById('fullName').value;

        // Validation
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showError('Please enter your password');
            return;
        }

        if (!this.isLoginMode) {
            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }

            if (password.length < 6) {
                this.showError('Password must be at least 6 characters long');
                return;
            }

            if (!fullName) {
                this.showError('Please enter your full name');
                return;
            }
        }

        this.setLoading(true);

        try {
            if (this.isLoginMode) {
                await this.handleLogin(email, password);
            } else {
                await this.handleSignup(email, password, fullName);
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showError('An error occurred. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleLogin(email, password) {
        console.log('Attempting login for:', email);
        
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
            this.showSuccess('Login successful! Redirecting...');
            
            // Store user data
            if (data.userId) {
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userEmail', email);
            }
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
        } else {
            this.showError(data.error || 'Login failed. Please check your credentials.');
        }
    }

    async handleSignup(email, password, fullName) {
        console.log('Attempting signup for:', email);
        
        // You'll need to create a signup endpoint in your backend
        const response = await fetch(`${this.backendBaseUrl}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email, 
                password: password,
                fullName: fullName
            })
        });

        const data = await response.json();
        console.log('Signup response:', data);

        if (response.ok) {
            this.showSuccess('Account created successfully! You can now log in.');
            
            // Switch back to login mode
            setTimeout(() => {
                this.isLoginMode = true;
                this.updateUI();
                this.clearForm();
            }, 2000);
        } else {
            this.showError(data.error || 'Signup failed. Please try again.');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(loading) {
        this.isLoading = loading;
        const submitBtn = document.getElementById('submitBtn');
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading-spinner"></div> Loading...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = this.isLoginMode ? 'Sign In' : 'Sign Up';
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

        document.body.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});