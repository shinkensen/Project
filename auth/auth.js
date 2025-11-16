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

        // Re-attach event listener to the new link
        document.getElementById('switchAuthLink').addEventListener('click', function(e) {
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
            // Add your login API call here
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
            // Add your signup API call here
            registerUser(email, password, fullName);
        }
    });

    // Mock functions for authentication - replace with actual API calls
    function loginUser(email, password) {
        // Simulate API call
        console.log('Making login request...');
        fetch("")
        // Example fetch:
        /*
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/dashboard.html';
            } else {
                alert('Login failed: ' + data.message);
            }
        });
        */
    }

    //signUp user
     async function registerUser(email, password, fullName) {
        console.log('Making registration request...');
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({email,password,fullName})
        })
        if (!res.ok){
            const error = await res.text();
            alert("Server Error: " + error);
        }
        const data = res.json();
        if(data.success){
            toggleAuthMode();
        }
        else{
            alert("Registration failed: " + data.message);
        }
        // Example fetch:
        /*
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Registration successful! Please log in.');
                toggleAuthMode(); // Switch back to login
            } else {
                alert('Registration failed: ' + data.message);
            }
        });
        */
    }
});