// Authentication check - protects pages from unauthorized access
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userId = localStorage.getItem('userId');
    
    // Check if user is authenticated
    if (!isLoggedIn || !userId) {
        // Redirect to auth page
        window.location.href = 'auth/auth.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

// Add logout button to navigation if user is logged in
function addLogoutButton() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn) {
        const navTabs = document.querySelector('.nav-tabs');
        if (navTabs && !document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'tab logout-btn';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = logout;
            navTabs.appendChild(logoutBtn);
        }
    }
}

// Get current user ID
function getCurrentUserId() {
    return localStorage.getItem('userId');
}

// Check if on index page
function isIndexPage() {
    const path = window.location.pathname;
    return path.endsWith('index.html') || path === '/' || path.endsWith('/');
}

// Initialize auth check
if (!isIndexPage()) {
    // Protect all pages except index
    checkAuth();
    addLogoutButton();
}
