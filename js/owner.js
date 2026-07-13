// js/owner.js
// Nextour Homestay Owner Dashboard Controller

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initOwnerPortal();
});

// Toast Alert System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
        <span>${type === 'error' ? '❌' : '✓'}</span>
        <div>${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function initOwnerPortal() {
    currentUser = Auth.getCurrentUser();

    if (!currentUser) {
        // Show Auth panel
        document.getElementById('auth-panel').style.display = 'block';
        document.getElementById('portal-panel').style.display = 'none';
        switchAuthTab('login');
    } else {
        // Redirect if not vendor
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
            return;
        } else if (currentUser.role === 'customer') {
            window.location.href = 'portal.html';
            return;
        }

        // Show Dashboard panel
        document.getElementById('auth-panel').style.display = 'none';
        document.getElementById('portal-panel').style.display = 'flex';

        // Render user stats
        document.getElementById('user-avatar-display').src = currentUser.profile.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150';
        document.getElementById('user-name-display').innerText = currentUser.username;

        // Load content panes
        refreshDashboard();
    }
}

// Switch between login/register tabs
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));

    const loginWrapper = document.getElementById('login-form-wrapper');
    const registerWrapper = document.getElementById('register-form-wrapper');

    if (tab === 'login') {
        tabs[0].classList.add('active');
        loginWrapper.classList.add('active');
        registerWrapper.classList.remove('active');
    } else {
        tabs[1].classList.add('active');
        loginWrapper.classList.remove('active');
        registerWrapper.classList.add('active');
    }
}

// Host Login Form Submit
function handleLoginSubmit(event) {
    event.preventDefault();
    const userVal = document.getElementById('login-username').value;
    const passVal = document.getElementById('login-password').value;

    const res = Auth.login(userVal, passVal);
    if (res.success) {
        if (res.user.role !== 'vendor') {
            showToast('Invalid host credentials. Use traveler portal.', 'error');
            Auth.logout('owner.html');
            return;
        }
        showToast('Login successful!');
        setTimeout(() => {
            initOwnerPortal();
        }, 1000);
    } else {
        showToast(res.message, 'error');
    }
}

// Host Register Form Submit
function handleRegisterSubmit(event) {
    event.preventDefault();
    const userVal = document.getElementById('reg-username').value;
    const emailVal = document.getElementById('reg-email').value;
    const passVal = document.getElementById('reg-password').value;

    const res = Auth.register(userVal, emailVal, passVal, 'vendor');
    if (res.success) {
        showToast(res.message);
        
        // Notify admin about vendor signup
        DB.addNotification(
            'user_admin',
            'New Vendor Signup Pending Approval 🧑‍💼',
            `Vendor "${userVal}" registered and is pending approval.`
        );

        // Reset
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';
        switchAuthTab('login');
    } else {
        showToast(res.message, 'error');
    }
}

// Switch Sidebar tabs
function switchDashboardTab(paneId, btn) {
    const buttons = document.querySelectorAll('.sidebar-menu button');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => {
        p.classList.remove('active');
        if (p.id === paneId) {
            p.classList.add('active');
        }
    });

    if (paneId === 'overview-pane') refreshDashboard();
    if (paneId === 'properties-pane') renderProperties();
    if (paneId === 'requests-pane') renderRequests();
}

function refreshDashboard() {
    const stays = DB.getHomestays().filter(h => h.ownerId === currentUser.id);
    const staysIds = stays.map(s => s.id);
    const bks = DB.getBookings().filter(b => b.type === 'homestay' && staysIds.includes(b.itemId));

    // Stats
    const earnings = bks.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + b.details.totalPrice, 0);
    const activeListings = stays.filter(s => s.status === 'approved').length;
    const pendingReqs = bks.filter(b => b.status === 'pending');

    document.getElementById('stats-earnings').innerText = `₹${earnings.toLocaleString()}`;
    document.getElementById('stats-properties').innerText = activeListings;
    document.getElementById('stats-requests').innerText = bks.filter(b => b.status === 'pending').length;
    document.getElementById('stats-requests-desc').innerText = `${pendingReqs.length} Pending Approval`;

    // Badge count
    const badge = document.getElementById('requests-badge-count');
    if (pendingReqs.length > 0) {
        badge.innerText = pendingReqs.length;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    // Recent Bookings Table
    const tbody = document.getElementById('recent-bookings-body');
    tbody.innerHTML = '';
    
    const recent = bks.slice().reverse().slice(0, 5); // latest 5
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">No booking reservations found yet.</td></tr>`;
        return;
    }

    recent.forEach(bk => {
        const stayName = stays.find(s => s.id === bk.itemId)?.name || 'My Homestay';
        tbody.innerHTML += `
            <tr>
                <td><strong>${bk.details.contactPhone}</strong></td>
                <td>${bk.details.dates}</td>
                <td>${bk.details.roomType}</td>
                <td>${bk.details.guests} Guests</td>
                <td><strong>₹${bk.details.totalPrice.toLocaleString()}</strong></td>
                <td><span class="status-pill ${bk.paymentStatus === 'paid' ? 'status-approved' : 'status-pending'}">${bk.paymentStatus.toUpperCase()}</span></td>
                <td><span class="status-pill status-${bk.status}">${bk.status.toUpperCase()}</span></td>
            </tr>
        `;
    });

    // Populate profile inputs
    document.getElementById('profile-phone').value = currentUser.profile.phone || '';
    document.getElementById('profile-avatar').value = currentUser.profile.avatar || '';
}

// Render Properties list
function renderProperties() {
    const stays = DB.getHomestays().filter(h => h.ownerId === currentUser.id);
    const container = document.getElementById('owner-properties-list');
    container.innerHTML = '';

    if (stays.length === 0) {
        container.innerHTML = `<div class="card" style="padding:2.5rem; text-align:center; color:var(--text-secondary);">You have not listed any properties yet. Click "+ Add New Property" to start.</div>`;
        return;
    }

    stays.forEach(stay => {
        const item = document.createElement('div');
        item.className = 'card';
        item.style.padding = '2rem';
        
        let roomsHtml = '';
        if (!stay.rooms || stay.rooms.length === 0) {
            roomsHtml = `<p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">No room configurations added yet.</p>`;
        } else {
            roomsHtml = `
                <table class="db-table" style="margin-bottom:1rem; background:var(--bg-tertiary); border-radius:8px;">
                    <thead>
                        <tr>
                            <th>Room Type</th>
                            <th>Capacity</th>
                            <th>Price / Night</th>
                            <th>Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stay.rooms.map(r => `
                            <tr>
                                <td><strong>${r.type}</strong></td>
                                <td>${r.capacity} Guests</td>
                                <td>₹${r.price}</td>
                                <td>${r.quantity} rooms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1.5rem;">
                <div>
                    <h3 style="font-size:1.4rem; color:#fff; margin-bottom:0.3rem;">${stay.name}</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem;">📍 ${stay.location} | GPS: ${stay.latLng}</p>
                </div>
                <span class="status-pill status-${stay.status}">${stay.status.toUpperCase()}</span>
            </div>
            
            <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1.5rem;">${stay.description}</p>
            
            <div style="margin-bottom:1.5rem;">
                <h4 style="font-size:1rem; color:#fff; margin-bottom:0.5rem;">Room Categories</h4>
                ${roomsHtml}
            </div>

            <div style="display:flex; gap:1rem;">
                <button class="btn btn-outline" onclick="openAddRoomModal('${stay.id}')">+ Add Room Type</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Render booking requests
function renderRequests() {
    const stays = DB.getHomestays().filter(h => h.ownerId === currentUser.id);
    const staysIds = stays.map(s => s.id);
    const bks = DB.getBookings().filter(b => b.type === 'homestay' && staysIds.includes(b.itemId) && b.status === 'pending');
    
    const tbody = document.getElementById('pending-requests-body');
    tbody.innerHTML = '';

    if (bks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-secondary);">No pending booking requests.</td></tr>`;
        return;
    }

    bks.forEach(bk => {
        const stayName = stays.find(s => s.id === bk.itemId)?.name || 'Homestay';
        tbody.innerHTML += `
            <tr>
                <td><code style="background:var(--bg-tertiary); padding:0.2rem; border-radius:4px;">${bk.id}</code></td>
                <td><strong>${stayName}</strong></td>
                <td>${bk.details.roomType}</td>
                <td>${bk.details.dates}</td>
                <td>${bk.details.guests} Guests</td>
                <td><strong>₹${bk.details.totalPrice.toLocaleString()}</strong></td>
                <td>
                    <button class="btn btn-primary btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="approveRequest('${bk.id}')">Approve</button>
                    <button class="btn btn-outline btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);" onclick="rejectRequest('${bk.id}')">Reject</button>
                </td>
            </tr>
        `;
    });
}

function approveRequest(id) {
    const bks = DB.getBookings();
    const bk = bks.find(b => b.id === id);
    if (!bk) return;

    bk.status = 'confirmed';
    DB.saveBookings(bks);

    // Notify customer
    const stays = DB.getHomestays();
    const stay = stays.find(s => s.id === bk.itemId);
    DB.addNotification(
        bk.userId,
        'Booking Approved! 🏠',
        `Your reservation request for "${stay.name} (${bk.details.roomType})" from ${bk.details.dates} has been approved by the host. You can pay on check-in or prepay online.`
    );

    // Notify admin
    DB.addNotification('user_admin', 'Booking Approved', `Vendor approved reservation ${bk.id} for ${stay.name}.`);

    showToast('Booking request approved!');
    renderRequests();
    refreshDashboard();
}

function rejectRequest(id) {
    if (!confirm('Are you sure you want to decline this booking request?')) return;

    const bks = DB.getBookings();
    const bk = bks.find(b => b.id === id);
    if (!bk) return;

    bk.status = 'rejected';
    DB.saveBookings(bks);

    // Notify customer
    const stays = DB.getHomestays();
    const stay = stays.find(s => s.id === bk.itemId);
    DB.addNotification(
        bk.userId,
        'Booking Declined',
        `Unfortunately, the host declined your booking request for "${stay.name}" from ${bk.details.dates}.`
    );

    showToast('Booking request declined.', 'error');
    renderRequests();
    refreshDashboard();
}

// Modals Trigger
function openNewPropertyModal() {
    document.getElementById('prop-name').value = '';
    document.getElementById('prop-location').value = '';
    document.getElementById('prop-gps').value = '';
    document.getElementById('prop-desc').value = '';
    document.getElementById('prop-amenities').value = '';
    document.getElementById('prop-rules').value = '';
    document.getElementById('prop-image').value = '';
    document.getElementById('property-modal').classList.add('show');
}

function handlePropertySubmit(event) {
    event.preventDefault();
    const name = document.getElementById('prop-name').value;
    const loc = document.getElementById('prop-location').value;
    const gps = document.getElementById('prop-gps').value;
    const desc = document.getElementById('prop-desc').value;
    const amenities = document.getElementById('prop-amenities').value.split(',').map(a => a.trim());
    const rules = document.getElementById('prop-rules').value.split(',').map(r => r.trim());
    const img = document.getElementById('prop-image').value;

    const stays = DB.getHomestays();
    const newStay = {
        id: 'hs_' + Date.now(),
        ownerId: currentUser.id,
        name: name,
        location: loc,
        latLng: gps,
        description: desc,
        amenities: amenities,
        images: [img],
        rooms: [],
        status: 'pending', // subject to admin approval
        rules: rules,
        reviews: []
    };

    stays.push(newStay);
    DB.saveHomestays(stays);

    // Notify Admin
    DB.addNotification(
        'user_admin',
        'New Homestay Pending Moderation 🏠',
        `Host "${currentUser.username}" added property "${name}" at "${loc}". Admin approval required.`
    );

    closeModal('property-modal');
    showToast('Property created successfully! Pending admin approval.');
    renderProperties();
}

function openAddRoomModal(propertyId) {
    document.getElementById('room-property-id').value = propertyId;
    document.getElementById('rm-type').value = '';
    document.getElementById('rm-price').value = '';
    document.getElementById('rm-quantity').value = '1';
    document.getElementById('room-modal').classList.add('show');
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const propId = document.getElementById('room-property-id').value;
    const type = document.getElementById('rm-type').value;
    const capacity = parseInt(document.getElementById('rm-capacity').value) || 2;
    const price = parseInt(document.getElementById('rm-price').value) || 0;
    const qty = parseInt(document.getElementById('rm-quantity').value) || 1;

    const stays = DB.getHomestays();
    const stay = stays.find(s => s.id === propId);

    if (stay) {
        if (!stay.rooms) stay.rooms = [];
        stay.rooms.push({
            id: 'rm_' + Date.now(),
            type: type,
            capacity: capacity,
            price: price,
            quantity: qty
        });

        DB.saveHomestays(stays);
        closeModal('room-modal');
        showToast('Room category added!');
        renderProperties();
    }
}

// Profile update
function handleProfileUpdate(event) {
    event.preventDefault();
    const phone = document.getElementById('profile-phone').value;
    const avatar = document.getElementById('profile-avatar').value;

    const users = DB.getUsers();
    const dbUser = users.find(u => u.id === currentUser.id);

    if (dbUser) {
        dbUser.profile.phone = phone;
        dbUser.profile.avatar = avatar;

        DB.saveUsers(users);

        currentUser = dbUser;
        localStorage.setItem('nextour_current_user', JSON.stringify(dbUser));

        document.getElementById('user-avatar-display').src = avatar;
        showToast('Host profile updated successfully!');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
