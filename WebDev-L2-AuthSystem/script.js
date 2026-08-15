/**
 * AuthVault — Secure Client-Side Authentication System
 * Features: SHA-256 Web Crypto password hashing, live password validation,
 * duplicate username/email detection, generic login error handling,
 * protected dashboard routing, session management, and logout functionality.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 1. Storage Keys & Initial Setup
    // ==========================================
    const USERS_STORAGE_KEY = 'authvault_users_v1';
    const SESSION_STORAGE_KEY = 'authvault_session_v1';

    let users = [];
    let activeSession = null;

    // ==========================================
    // 2. DOM Elements
    // ==========================================
    const viewLogin = document.getElementById('view-login');
    const viewRegister = document.getElementById('view-register');
    const viewDashboard = document.getElementById('view-dashboard');

    const authStatusBadge = document.getElementById('auth-status-badge');

    // Login Form Elements
    const loginForm = document.getElementById('login-form');
    const loginIdentifierInput = document.getElementById('login-identifier');
    const loginPasswordInput = document.getElementById('login-password');
    const loginErrorAlert = document.getElementById('login-error-alert');
    const loginErrorText = document.getElementById('login-error-text');
    const rememberMeCheckbox = document.getElementById('remember-me');

    // Register Form Elements
    const registerForm = document.getElementById('register-form');
    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const registerErrorAlert = document.getElementById('register-error-alert');
    const registerErrorText = document.getElementById('register-error-text');

    const strengthFill = document.getElementById('strength-bar-fill');
    const strengthValueText = document.getElementById('strength-value');
    const ruleLengthItem = document.getElementById('rule-length');
    const ruleNumberItem = document.getElementById('rule-number');

    // Navigation Links
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');

    // Dashboard Elements
    const dashAvatar = document.getElementById('dash-avatar');
    const dashUsername = document.getElementById('dash-username');
    const dashEmail = document.getElementById('dash-email');
    const dashSessionToken = document.getElementById('dash-session-token');
    const dashCreatedAt = document.getElementById('dash-created-at');
    const dashLastLogin = document.getElementById('dash-last-login');
    const logoutBtn = document.getElementById('logout-btn');

    const toastContainer = document.getElementById('toast-container');

    // ==========================================
    // 3. Web Crypto API SHA-256 Hashing
    // ==========================================
    /**
     * Generate a random salt string
     */
    function generateSalt() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hashes a password string with a salt using native Web Crypto SHA-256
     */
    async function hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ==========================================
    // 4. Initialization & State Loading
    // ==========================================
    async function init() {
        await loadUsers();
        loadActiveSession();
        setupEventListeners();

        // Check protected access on page load
        if (activeSession) {
            showDashboardView();
        } else {
            showLoginView();
        }
    }

    async function loadUsers() {
        try {
            const stored = localStorage.getItem(USERS_STORAGE_KEY);
            if (stored) {
                users = JSON.parse(stored);
            } else {
                // Initialize default demo user (admin_demo / AdminPass123)
                const demoSalt = generateSalt();
                const demoHash = await hashPassword('AdminPass123', demoSalt);
                const demoUser = {
                    id: 'user_demo_101',
                    username: 'admin_demo',
                    email: 'admin@authvault.io',
                    salt: demoSalt,
                    passwordHash: demoHash,
                    createdAt: new Date().toISOString()
                };
                users = [demoUser];
                saveUsers();
            }
        } catch (e) {
            console.error('Error loading users:', e);
            users = [];
        }
    }

    function saveUsers() {
        try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        } catch (e) {
            console.error('Error saving users:', e);
        }
    }

    function loadActiveSession() {
        try {
            // Check localStorage or sessionStorage
            const localSession = localStorage.getItem(SESSION_STORAGE_KEY);
            const sessionStored = sessionStorage.getItem(SESSION_STORAGE_KEY);

            if (localSession) {
                activeSession = JSON.parse(localSession);
            } else if (sessionStored) {
                activeSession = JSON.parse(sessionStored);
            } else {
                activeSession = null;
            }
        } catch (e) {
            activeSession = null;
        }
    }

    function saveActiveSession(sessionData, rememberMe) {
        activeSession = sessionData;
        const serialized = JSON.stringify(sessionData);
        if (rememberMe) {
            localStorage.setItem(SESSION_STORAGE_KEY, serialized);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
            sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
            localStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }

    function clearActiveSession() {
        activeSession = null;
        localStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    // ==========================================
    // 5. Event Listeners Setup
    // ==========================================
    function setupEventListeners() {
        // Toggle view links
        linkToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            hideAlerts();
            showRegisterView();
        });

        linkToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideAlerts();
            showLoginView();
        });

        // Show/Hide password toggle buttons
        document.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const inputEl = document.getElementById(targetId);
                const eyeIcon = btn.querySelector('.eye-icon');
                const eyeOffIcon = btn.querySelector('.eye-off-icon');

                if (inputEl.type === 'password') {
                    inputEl.type = 'text';
                    eyeIcon.classList.add('hidden');
                    eyeOffIcon.classList.remove('hidden');
                } else {
                    inputEl.type = 'password';
                    eyeIcon.classList.remove('hidden');
                    eyeOffIcon.classList.add('hidden');
                }
            });
        });

        // Live Registration Password Strength Listener
        registerPasswordInput.addEventListener('input', () => {
            validatePasswordRules(registerPasswordInput.value);
        });

        // Registration Form Submit
        registerForm.addEventListener('submit', handleRegisterSubmit);

        // Login Form Submit
        loginForm.addEventListener('submit', handleLoginSubmit);

        // Logout Button Click
        logoutBtn.addEventListener('click', handleLogout);
    }

    // ==========================================
    // 6. Registration Logic & Validation
    // ==========================================
    function validatePasswordRules(password) {
        const hasMinLength = password.length >= 8;
        const hasNumber = /\d/.test(password);

        // Update length rule UI
        ruleLengthItem.classList.toggle('valid', hasMinLength);
        ruleLengthItem.classList.toggle('invalid', !hasMinLength);
        ruleLengthItem.querySelector('.rule-icon').textContent = hasMinLength ? '✓' : '✕';

        // Update number rule UI
        ruleNumberItem.classList.toggle('valid', hasNumber);
        ruleNumberItem.classList.toggle('invalid', !hasNumber);
        ruleNumberItem.querySelector('.rule-icon').textContent = hasNumber ? '✓' : '✕';

        // Strength bar score calculation
        let score = 0;
        if (password.length > 0) score++;
        if (hasMinLength) score++;
        if (hasNumber) score++;
        if (/[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

        strengthFill.className = 'strength-fill';
        strengthValueText.className = 'strength-value';

        if (password.length === 0) {
            strengthValueText.textContent = 'None';
        } else if (score <= 2) {
            strengthFill.classList.add('weak');
            strengthValueText.classList.add('weak');
            strengthValueText.textContent = 'Weak';
        } else if (score === 3) {
            strengthFill.classList.add('fair');
            strengthValueText.classList.add('fair');
            strengthValueText.textContent = 'Fair';
        } else {
            strengthFill.classList.add('strong');
            strengthValueText.classList.add('strong');
            strengthValueText.textContent = 'Strong';
        }

        return hasMinLength && hasNumber;
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();
        hideAlerts();

        const username = registerUsernameInput.value.trim();
        const email = registerEmailInput.value.trim().toLowerCase();
        const password = registerPasswordInput.value;

        // Basic empty fields check
        if (!username || !email || !password) {
            showRegisterError('Please fill in all required fields.');
            return;
        }

        // Email regex check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showRegisterError('Please enter a valid email address.');
            return;
        }

        // Password policy check: min 8 chars & at least 1 digit
        if (password.length < 8 || !/\d/.test(password)) {
            showRegisterError('Password must be at least 8 characters long and contain at least 1 number.');
            return;
        }

        // Duplicate username check
        const existingUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existingUsername) {
            showRegisterError('Username is already taken. Please choose another.');
            return;
        }

        // Duplicate email check
        const existingEmail = users.find(u => u.email.toLowerCase() === email);
        if (existingEmail) {
            showRegisterError('Email address is already registered. Please sign in.');
            return;
        }

        // Compute SHA-256 Hash with unique salt
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);

        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            username: username,
            email: email,
            salt: salt,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers();

        showToast('Account created successfully! 🎉');
        registerForm.reset();
        validatePasswordRules('');

        // Switch to login view and prefill username
        loginIdentifierInput.value = username;
        showLoginView();
    }

    // ==========================================
    // 7. Login Logic & Credentials Verification
    // ==========================================
    async function handleLoginSubmit(e) {
        e.preventDefault();
        hideAlerts();

        const identifier = loginIdentifierInput.value.trim();
        const password = loginPasswordInput.value;

        // Empty input validation
        if (!identifier || !password) {
            showLoginError('Please enter both your username/email and password.');
            return;
        }

        // Find user by username or email
        const targetUser = users.find(u => 
            u.username.toLowerCase() === identifier.toLowerCase() ||
            u.email.toLowerCase() === identifier.toLowerCase()
        );

        // Generic error message: do NOT reveal whether username or password was incorrect
        const GENERIC_LOGIN_ERROR = 'Invalid username/email or password. Please verify your credentials.';

        if (!targetUser) {
            showLoginError(GENERIC_LOGIN_ERROR);
            return;
        }

        // Compute hash of entered password using the matched user's salt
        const inputHash = await hashPassword(password, targetUser.salt);

        // Compare computed hash with stored hash
        if (inputHash !== targetUser.passwordHash) {
            showLoginError(GENERIC_LOGIN_ERROR);
            return;
        }

        // Login successful! Create session token
        const rememberMe = rememberMeCheckbox.checked;
        const sessionData = {
            userId: targetUser.id,
            username: targetUser.username,
            email: targetUser.email,
            token: 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10),
            createdAt: targetUser.createdAt,
            loginAt: new Date().toISOString()
        };

        saveActiveSession(sessionData, rememberMe);

        showToast(`Welcome back, ${targetUser.username}! 👋`);
        loginForm.reset();
        showDashboardView();
    }

    // ==========================================
    // 8. Protected Dashboard Route & Logout
    // ==========================================
    function handleLogout() {
        clearActiveSession();
        showToast('You have been logged out.');
        showLoginView();
    }

    function checkProtectedAccess() {
        if (!activeSession) {
            showToast('⚠️ Access denied. Please log in to access the dashboard.', 'error');
            showLoginView();
            return false;
        }
        return true;
    }

    // ==========================================
    // 9. View Switcher & Render Helpers
    // ==========================================
    function switchView(viewToShow) {
        if (document.startViewTransition) {
            document.startViewTransition(() => updateViewsDOM(viewToShow));
        } else {
            updateViewsDOM(viewToShow);
        }
    }

    function updateViewsDOM(viewToShow) {
        viewLogin.classList.add('hidden');
        viewRegister.classList.add('hidden');
        viewDashboard.classList.add('hidden');

        viewToShow.classList.remove('hidden');
    }

    function showLoginView() {
        switchView(viewLogin);
        updateStatusBadge(false);
    }

    function showRegisterView() {
        switchView(viewRegister);
        updateStatusBadge(false);
    }

    function showDashboardView() {
        if (!checkProtectedAccess()) return;

        switchView(viewDashboard);
        updateStatusBadge(true);

        // Render user details on Dashboard
        dashAvatar.textContent = activeSession.username.charAt(0).toUpperCase();
        dashUsername.textContent = activeSession.username;
        dashEmail.textContent = activeSession.email;
        dashSessionToken.textContent = activeSession.token;
        dashCreatedAt.textContent = formatDate(activeSession.createdAt);
        dashLastLogin.textContent = formatDate(activeSession.loginAt);
    }

    function updateStatusBadge(isLoggedIn) {
        if (isLoggedIn && activeSession) {
            authStatusBadge.className = 'status-badge logged-in';
            authStatusBadge.querySelector('.badge-text').textContent = `Logged in as ${activeSession.username}`;
        } else {
            authStatusBadge.className = 'status-badge logged-out';
            authStatusBadge.querySelector('.badge-text').textContent = 'Guest Mode';
        }
    }

    function showLoginError(msg) {
        loginErrorText.textContent = msg;
        loginErrorAlert.classList.remove('hidden');
    }

    function showRegisterError(msg) {
        registerErrorText.textContent = msg;
        registerErrorAlert.classList.remove('hidden');
    }

    function hideAlerts() {
        loginErrorAlert.classList.add('hidden');
        registerErrorAlert.classList.add('hidden');
    }

    function formatDate(isoString) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + 
               ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    // Run initialization
    await init();
});
