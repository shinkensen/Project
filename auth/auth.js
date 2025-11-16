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

        // Re-attach event listener to the new link (FIXED: use event delegation instead)
        const newLink = document.getElementById('switchAuthLink');
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAuthMode();
        });
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
                alert('Passwords do not match!');
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
            submitBtn.textContent = 'Signing in...';
            
            const res = await fetch('https://project-iqv0.onrender.com/loginEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                alert("Login failed: " + (data.error || 'Invalid credentials'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                return;
            }
            
            // Store user session
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to chatbot page
            window.location.href = '../chatbot.html';
        } catch (error) {
            alert('Network error: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    }

    // SignUp user
    async function registerUser(email, password, fullName) {
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            const res = await fetch('https://project-iqv0.onrender.com/sign-up', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password, fullName })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                alert("Registration failed: " + (data.error || 'Unable to create account'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
                return;
            }
            
            alert('Registration successful! Please check your email to verify your account, then log in.');
            toggleAuthMode();
            submitBtn.disabled = false;
        } catch (error) {
            alert('Network error: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    }
});