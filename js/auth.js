// js/auth.js
// Nextour Authentication & Role-Based Access Control

const Auth = {
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('nextour_current_user')) || null;
    },

    login(username, password) {
        const users = DB.getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return { success: false, message: 'Invalid username or password.' };
        }

        if (user.status === 'pending') {
            return { success: false, message: 'Your vendor account is pending admin approval. Please check back later.' };
        }

        if (user.status === 'suspended') {
            return { success: false, message: 'Your account has been suspended. Contact support.' };
        }

        // Save session
        localStorage.setItem('nextour_current_user', JSON.stringify(user));
        return { success: true, user };
    },

    register(username, email, password, role) {
        const users = DB.getUsers();

        // Check if user already exists
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: 'Username is already taken.' };
        }
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'Email is already registered.' };
        }

        const newUser = {
            id: 'user_' + Date.now(),
            username,
            email,
            password,
            role,
            status: role === 'vendor' ? 'pending' : 'approved', // Vendor accounts require admin approval
            profile: {
                phone: '',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // placeholder
                bio: '',
                address: ''
            }
        };

        users.push(newUser);
        DB.saveUsers(users);

        if (role === 'vendor') {
            return { success: true, message: 'Registration successful! Your account is pending admin approval.' };
        }

        // Auto login for customers
        localStorage.setItem('nextour_current_user', JSON.stringify(newUser));
        return { success: true, message: 'Registration successful!', user: newUser };
    },

    logout(redirectUrl = 'index.html') {
        localStorage.removeItem('nextour_current_user');
        window.location.href = redirectUrl;
    },

    // Guard page access
    requireRole(allowedRoles, redirectUrl = 'index.html') {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = redirectUrl;
            return false;
        }
        if (!allowedRoles.includes(user.role)) {
            alert('Access Denied: You do not have permissions for this page.');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
};

window.Auth = Auth;
