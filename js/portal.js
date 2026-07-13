// js/portal.js
// Nextour Customer Portal Controller

let currentAuthTab = 'login';
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initPortal();
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

function initPortal() {
    currentUser = Auth.getCurrentUser();

    if (!currentUser) {
        // Show Auth panel
        document.getElementById('auth-panel').style.display = 'block';
        document.getElementById('portal-panel').style.display = 'none';
        switchAuthTab('login');
    } else {
        // Redirect if not customer
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
            return;
        } else if (currentUser.role === 'vendor') {
            window.location.href = 'owner.html';
            return;
        }

        // Show Dashboard panel
        document.getElementById('auth-panel').style.display = 'none';
        document.getElementById('portal-panel').style.display = 'flex';

        // Render user stats
        document.getElementById('user-avatar-display').src = currentUser.profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
        document.getElementById('user-name-display').innerText = currentUser.username;

        // Load content panes
        renderBookings();
        renderProfileForm();
        renderNotifications();
    }
}

// Switch between login/register tabs
function switchAuthTab(tab) {
    currentAuthTab = tab;
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

// Login Form Submit
function handleLoginSubmit(event) {
    event.preventDefault();
    const userVal = document.getElementById('login-username').value;
    const passVal = document.getElementById('login-password').value;

    const res = Auth.login(userVal, passVal);
    if (res.success) {
        showToast('Login successful!');
        setTimeout(() => {
            initPortal();
        }, 1000);
    } else {
        showToast(res.message, 'error');
    }
}

// Register Form Submit
function handleRegisterSubmit(event) {
    event.preventDefault();
    const userVal = document.getElementById('reg-username').value;
    const emailVal = document.getElementById('reg-email').value;
    const passVal = document.getElementById('reg-password').value;
    const roleVal = document.getElementById('reg-role').value;

    const res = Auth.register(userVal, emailVal, passVal, roleVal);
    if (res.success) {
        showToast(res.message);
        if (roleVal === 'vendor') {
            // Keep on register screen showing instructions
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-password').value = '';
        } else {
            // Auto logged in as traveler
            setTimeout(() => {
                initPortal();
            }, 1000);
        }
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
}

// Render Bookings Table
function renderBookings() {
    const bks = DB.getBookings().filter(b => b.userId === currentUser.id);
    const tbody = document.getElementById('bookings-table-body');
    tbody.innerHTML = '';

    if (bks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color:var(--text-secondary);">You have not booked any tours or homestays yet.</td></tr>`;
        return;
    }

    bks.forEach(bk => {
        const tr = document.createElement('tr');
        
        let detailsHtml = '';
        if (bk.type === 'package') {
            detailsHtml = `
                <div><strong>Dates:</strong> ${bk.details.dates}</div>
                <div><strong>Guests:</strong> ${bk.details.guests}</div>
                <div><strong>Phone:</strong> ${bk.details.contactPhone}</div>
            `;
        } else {
            detailsHtml = `
                <div><strong>Room:</strong> ${bk.details.roomType}</div>
                <div><strong>Dates:</strong> ${bk.details.dates}</div>
                <div><strong>Nights:</strong> ${bk.details.nights} (${bk.details.guests} Guests)</div>
            `;
        }

        // Action Buttons
        let actionBtn = '';
        if (bk.status === 'confirmed' && bk.paymentStatus === 'pending') {
            actionBtn = `<button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.75rem; margin-bottom:0.3rem;" onclick="simulatePayNow('${bk.id}')">Pay Online</button>`;
        }
        if (bk.status === 'pending' || bk.status === 'confirmed') {
            actionBtn += ` <button class="btn btn-outline" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);" onclick="cancelBooking('${bk.id}')">Cancel</button>`;
        }
        if (bk.status === 'confirmed' || bk.status === 'completed') {
            actionBtn += ` <button class="btn btn-outline" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--accent-gold); color:var(--accent-gold);" onclick="openReviewModal('${bk.type}', '${bk.itemId}')">Write Review</button>`;
        }
        if (actionBtn === '') {
            actionBtn = `<span style="color:var(--text-secondary); font-size:0.8rem;">No actions</span>`;
        }

        tr.innerHTML = `
            <td><code style="background:var(--bg-tertiary); padding:0.2rem; border-radius:4px;">${bk.id}</code></td>
            <td><span class="status-pill ${bk.type === 'package' ? 'status-approved' : 'status-pending'}">${bk.type.toUpperCase()}</span></td>
            <td><strong>${bk.details.name}</strong></td>
            <td style="font-size:0.8rem; line-height:1.4;">${detailsHtml}</td>
            <td><strong>₹${bk.details.totalPrice.toLocaleString()}</strong></td>
            <td><span class="status-pill ${bk.paymentStatus === 'paid' ? 'status-approved' : 'status-pending'}">${bk.paymentStatus.toUpperCase()}</span></td>
            <td><span class="status-pill status-${bk.status}">${bk.status.toUpperCase()}</span></td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Cancel booking
function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    const bks = DB.getBookings();
    const bk = bks.find(b => b.id === id);
    if (!bk) return;

    bk.status = 'cancelled';
    DB.saveBookings(bks);

    // Notify user
    DB.addNotification(currentUser.id, 'Booking Cancelled', `Your reservation for "${bk.details.name}" has been cancelled successfully.`);

    // If it is a homestay, notify owner
    if (bk.type === 'homestay') {
        const stays = DB.getHomestays();
        const stay = stays.find(s => s.id === bk.itemId);
        if (stay) {
            DB.addNotification(stay.ownerId, 'Reservation Cancelled By Guest', `Booking ${bk.id} for "${stay.name}" was cancelled by the guest.`);
        }
    }

    // Notify admin
    DB.addNotification('user_admin', 'Booking Cancelled', `Customer cancelled reservation ${bk.id} (Value: ₹${bk.details.totalPrice}).`);

    showToast('Booking cancelled successfully.');
    renderBookings();
    renderNotifications();
}

// Pay Now simulation
function simulatePayNow(id) {
    const bks = DB.getBookings();
    const bk = bks.find(b => b.id === id);
    if (!bk) return;

    // Launch alert simulating Razorpay frame
    if (confirm(`Redirecting to payment gateway for ₹${bk.details.totalPrice.toLocaleString()}. Click OK to authorize payment.`)) {
        bk.paymentStatus = 'paid';
        DB.saveBookings(bks);

        DB.addNotification(currentUser.id, 'Payment Received!', `Online payment of ₹${bk.details.totalPrice} for reservation ${bk.id} has been registered.`);

        if (bk.type === 'homestay') {
            const stays = DB.getHomestays();
            const stay = stays.find(s => s.id === bk.itemId);
            if (stay) {
                DB.addNotification(stay.ownerId, 'Online Payment Completed by Guest', `Guest has prepaid online for Reservation ${bk.id} (₹${bk.details.totalPrice}).`);
            }
        }

        showToast('Online payment simulated successfully!');
        renderBookings();
        renderNotifications();
    }
}

// Render Profile update fields
function renderProfileForm() {
    document.getElementById('profile-phone').value = currentUser.profile.phone || '';
    document.getElementById('profile-avatar').value = currentUser.profile.avatar || '';
    document.getElementById('profile-bio').value = currentUser.profile.bio || '';
}

function handleProfileUpdate(event) {
    event.preventDefault();
    const phone = document.getElementById('profile-phone').value;
    const avatar = document.getElementById('profile-avatar').value;
    const bio = document.getElementById('profile-bio').value;

    const users = DB.getUsers();
    const dbUser = users.find(u => u.id === currentUser.id);

    if (dbUser) {
        dbUser.profile.phone = phone;
        dbUser.profile.avatar = avatar;
        dbUser.profile.bio = bio;

        DB.saveUsers(users);

        // Update current session user
        currentUser = dbUser;
        localStorage.setItem('nextour_current_user', JSON.stringify(dbUser));

        // Re-display
        document.getElementById('user-avatar-display').src = avatar;
        showToast('Profile updated successfully!');
    }
}

// Render Notifications
function renderNotifications() {
    const notifs = DB.getNotifications().filter(n => n.userId === currentUser.id);
    const container = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge-count');

    // count unread
    const unreadCount = notifs.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.innerText = unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    container.innerHTML = '';
    if (notifs.length === 0) {
        container.innerHTML = `<div class="card" style="padding:1.5rem; text-align:center; color:var(--text-secondary);">No alerts or notifications yet.</div>`;
        return;
    }

    // Sort latest first
    notifs.reverse();

    notifs.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'card';
        item.style.padding = '1.2rem 1.5rem';
        item.style.borderLeft = notif.read ? '1px solid var(--border-color)' : '4px solid var(--accent-emerald)';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <h4 style="color:#fff; font-size:1rem;">${notif.title}</h4>
                <span style="font-size:0.75rem; color:var(--text-secondary);">${notif.dateCreated}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-secondary);">${notif.message}</p>
        `;
        container.appendChild(item);
    });
}

function markAllNotificationsRead() {
    const notifs = DB.getNotifications();
    notifs.forEach(n => {
        if (n.userId === currentUser.id) {
            n.read = true;
        }
    });
    DB.saveNotifications(notifs);
    renderNotifications();
    showToast('All notifications marked as read.');
}

// Reviews
function openReviewModal(type, itemId) {
    document.getElementById('rev-type').value = type;
    document.getElementById('rev-item-id').value = itemId;
    document.getElementById('rev-comment').value = '';
    document.getElementById('review-modal').classList.add('show');
}

function handleReviewSubmit(event) {
    event.preventDefault();
    const type = document.getElementById('rev-type').value;
    const itemId = document.getElementById('rev-item-id').value;
    const rating = parseInt(document.getElementById('rev-rating').value) || 5;
    const comment = document.getElementById('rev-comment').value;

    const revs = DB.getReviews();
    const newRev = {
        id: 'rev_' + Date.now(),
        userId: currentUser.id,
        type: type,
        itemId: itemId,
        rating: rating,
        comment: comment,
        status: 'pending', // Requires admin moderation
        dateCreated: new Date().toISOString().split('T')[0]
    };

    revs.push(newRev);
    DB.saveReviews(revs);

    // Notify admin about pending review
    DB.addNotification(
        'user_admin',
        'New Review Needs Moderation 🖊️',
        `Customer "${currentUser.username}" submitted a ${rating}-star review for ${type} ${itemId}. Mod approval required.`
    );

    closeModal('review-modal');
    showToast('Review submitted! It will appear after admin review approval.');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
