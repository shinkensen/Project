document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('authForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchAuthLink = document.getElementById('switchAuthLink');
    const signupFields = document.getElementById('signupFields');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const fullNameInput = document.getElementById('fullName');

    let isLoginMode = true;

    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Switch between login and signup modes
    switchAuthLink.addEventListener('click', function(e) {
        e.preventDefault();
        toggleAuthMode();
    });

    function toggleAuthMode() {
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            // Switch to login mode
            formTitle.textContent = 'Log in to your account';
            submitBtn.textContent = 'Sign In';
            switchText.innerHTML = 'Don\'t have an account? <a href="#" id="switchAuthLink">Sign up</a>';
            signupFields.style.display = 'none';
            
            // Remove required attribute from signup fields
            confirmPasswordInput.removeAttribute('required');
            fullNameInput.removeAttribute('required');
        } else {
            // Switch to signup mode
            formTitle.textContent = 'Create your account';
            submitBtn.textContent = 'Sign Up';
            switchText.innerHTML = 'Already have an account? <a href="#" id="switchAuthLink">Sign in</a>';
            signupFields.style.display = 'block';
            
            // Add required attribute to signup fields
            confirmPasswordInput.setAttribute('required', 'true');
            fullNameInput.setAttribute('required', 'true');
        }

        // Re-attach event listener to the new link
        const newLink = document.getElementById('switchAuthLink');
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAuthMode();
        });
    }

    // Show toast message
    function showToast(title, message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);

        toastContainer.appendChild(toast);
    }

    // Handle form submission
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (isLoginMode) {
            // Login logic
            console.log('Logging in:', { email, password });
            loginUser(email, password);
        } else {
            // Signup logic
            const confirmPassword = confirmPasswordInput.value;
            const fullName = fullNameInput.value;

            if (password !== confirmPassword) {
                showToast('Password Mismatch', 'Passwords do not match! Please try again.');
                return;
            }

            if (password.length < 6) {
                showToast('Weak Password', 'Password should be at least 6 characters long.');
                return;
            }

            console.log('Signing up:', { email, password, fullName });
            registerUser(email, password, fullName);
        }
    });

    // Login user
    async function loginUser(email, password) {
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>Signing in...';
            
            const res = await fetch('https://project-iqv0.onrender.com/loginEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                showToast('Login Failed', data.error || 'Invalid email or password. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                return;
            }
            
            // Store user session
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isLoggedIn', 'true');
            
            showToast('Welcome Back!', 'Login successful! Redirecting...', 'success');
            
            // Redirect to chatbot page after a short delay
            setTimeout(() => {
                window.location.href = '../chatbot.html';
            }, 1500);
            
        } catch (error) {
            showToast('Network Error', 'Unable to connect to server. Please check your connection.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    }

    // SignUp user
    async function registerUser(email, password, fullName) {
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>Creating account...';
            
            const res = await fetch('https://project-iqv0.onrender.com/sign-up', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password, fullName })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                showToast('Registration Failed', data.error || 'Unable to create account. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
                return;
            }
            
            showToast('Success!', 'Account created! Please check your email to verify your account.', 'success');
            
            // Switch to login mode after successful registration
            setTimeout(() => {
                toggleAuthMode();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }, 2000);
            
        } catch (error) {
            showToast('Network Error', 'Unable to connect to server. Please check your connection.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    }
});