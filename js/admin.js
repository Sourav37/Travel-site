// js/admin.js
// Nextour Admin Panel Controller

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initAdminPortal();
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

function initAdminPortal() {
    currentUser = Auth.getCurrentUser();

    if (!currentUser) {
        // Show Auth panel
        document.getElementById('auth-panel').style.display = 'block';
        document.getElementById('portal-panel').style.display = 'none';
    } else {
        // Redirect if not admin
        if (currentUser.role !== 'admin') {
            alert('Access denied: Admins only.');
            Auth.logout('admin.html');
            return;
        }

        // Show Dashboard panel
        document.getElementById('auth-panel').style.display = 'none';
        document.getElementById('portal-panel').style.display = 'flex';

        // Load content panes
        refreshDashboard();
    }
}

// Admin Login Form Submit
function handleLoginSubmit(event) {
    event.preventDefault();
    const userVal = document.getElementById('login-username').value;
    const passVal = document.getElementById('login-password').value;

    const res = Auth.login(userVal, passVal);
    if (res.success) {
        if (res.user.role !== 'admin') {
            showToast('Invalid admin credentials.', 'error');
            Auth.logout('admin.html');
            return;
        }
        showToast('Login successful!');
        setTimeout(() => {
            initAdminPortal();
        }, 1000);
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
    if (paneId === 'packages-pane') renderPackages();
    if (paneId === 'homestays-pane') renderHomestaysApprovalQueue();
    if (paneId === 'bookings-pane') renderBookingsLedger();
    if (paneId === 'users-pane') renderUsersList();
    if (paneId === 'reviews-pane') renderReviewsModerationQueue();
}

function refreshDashboard() {
    const bks = DB.getBookings();
    const users = DB.getUsers();
    const stays = DB.getHomestays();

    // Stats
    const totalRev = bks.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.details.totalPrice, 0);
    const activeBookings = bks.filter(b => b.status === 'confirmed').length;
    const approvedStays = stays.filter(s => s.status === 'approved').length;

    document.getElementById('stats-revenue').innerText = `₹${totalRev.toLocaleString()}`;
    document.getElementById('stats-active-bookings').innerText = activeBookings;
    document.getElementById('stats-total-users').innerText = users.length;
    document.getElementById('stats-homestays').innerText = approvedStays;

    // Badges update
    updateAdminBadges();

    // Render Audit logs (using global notifications log)
    const notifs = DB.getNotifications();
    const tbody = document.getElementById('admin-audit-log-body');
    tbody.innerHTML = '';

    const audits = notifs.slice().reverse().slice(0, 10); // latest 10
    if (audits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">No action logs found in system.</td></tr>`;
        return;
    }

    audits.forEach(log => {
        tbody.innerHTML += `
            <tr>
                <td>${log.dateCreated}</td>
                <td><strong>${log.title}</strong></td>
                <td style="color:var(--text-secondary); font-size:0.8rem;">${log.message}</td>
            </tr>
        `;
    });
}

function updateAdminBadges() {
    const pendingStays = DB.getHomestays().filter(s => s.status === 'pending').length;
    const pendingVendors = DB.getUsers().filter(u => u.role === 'vendor' && u.status === 'pending').length;
    const pendingReviews = DB.getReviews().filter(r => r.status === 'pending').length;

    const staysBadge = document.getElementById('badge-homestay-approvals');
    if (pendingStays > 0) {
        staysBadge.innerText = pendingStays;
        staysBadge.style.display = 'inline-block';
    } else {
        staysBadge.style.display = 'none';
    }

    const vendorsBadge = document.getElementById('badge-vendor-approvals');
    if (pendingVendors > 0) {
        vendorsBadge.innerText = pendingVendors;
        vendorsBadge.style.display = 'inline-block';
    } else {
        vendorsBadge.style.display = 'none';
    }

    const reviewsBadge = document.getElementById('badge-review-moderations');
    if (pendingReviews > 0) {
        reviewsBadge.innerText = pendingReviews;
        reviewsBadge.style.display = 'inline-block';
    } else {
        reviewsBadge.style.display = 'none';
    }
}

// Packages Management
function renderPackages() {
    const pkgs = DB.getPackages();
    const tbody = document.getElementById('admin-packages-table-body');
    tbody.innerHTML = '';

    pkgs.forEach(pkg => {
        tbody.innerHTML += `
            <tr>
                <td><code style="background:var(--bg-tertiary); padding:0.2rem; border-radius:4px;">${pkg.id}</code></td>
                <td><span class="status-pill status-approved">${pkg.category}</span></td>
                <td>📍 ${pkg.destination.split(',')[0]}</td>
                <td><strong>${pkg.name}</strong></td>
                <td>${pkg.duration}</td>
                <td><strong>₹${pkg.price.toLocaleString()}</strong></td>
                <td>
                    <button class="btn btn-outline btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);" onclick="deletePackage('${pkg.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deletePackage(id) {
    if (!confirm('Are you sure you want to delete this holiday package?')) return;

    let pkgs = DB.getPackages();
    pkgs = pkgs.filter(p => p.id !== id);
    DB.savePackages(pkgs);

    DB.addNotification('user_admin', 'Package Deleted 🗑️', `Admin deleted holiday package ID: ${id}`);

    showToast('Package deleted successfully.');
    renderPackages();
}

function openNewPackageModal() {
    document.getElementById('pkg-name').value = '';
    document.getElementById('pkg-category').value = '';
    document.getElementById('pkg-price').value = '';
    document.getElementById('pkg-duration').value = '';
    document.getElementById('pkg-destination').value = '';
    document.getElementById('pkg-highlights').value = '';
    document.getElementById('pkg-image').value = '';
    document.getElementById('pkg-includes').value = '';
    document.getElementById('pkg-excludes').value = '';
    document.getElementById('package-modal').classList.add('show');
}

function handlePackageSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('pkg-name').value;
    const cat = document.getElementById('pkg-category').value;
    const isDomestic = document.getElementById('pkg-region').value === 'domestic';
    const price = parseInt(document.getElementById('pkg-price').value) || 0;
    const dur = document.getElementById('pkg-duration').value;
    const dest = document.getElementById('pkg-destination').value;
    const highlights = document.getElementById('pkg-highlights').value.split(',').map(h => h.trim());
    const img = document.getElementById('pkg-image').value;
    const incl = document.getElementById('pkg-includes').value.split(',').map(i => i.trim());
    const excl = document.getElementById('pkg-excludes').value.split(',').map(e => e.trim());
    
    // Day details
    const d1 = document.getElementById('pkg-d1').value;
    const d2 = document.getElementById('pkg-d2').value;
    const d3 = document.getElementById('pkg-d3').value;

    const pkgs = DB.getPackages();
    const newPkg = {
        id: 'pkg_' + Date.now(),
        name: name,
        category: cat,
        isDomestic: isDomestic,
        duration: dur,
        destination: dest,
        price: price,
        highlights: highlights,
        itinerary: [
            { day: 1, title: 'Day 1 Outline', desc: d1 },
            { day: 2, title: 'Day 2 Outline', desc: d2 },
            { day: 3, title: 'Day 3 Outline', desc: d3 }
        ],
        includes: incl,
        excludes: excl,
        image: img,
        faqs: [
            { q: 'What is included in this holiday pack?', a: incl.join(', ') }
        ]
    };

    pkgs.push(newPkg);
    DB.savePackages(pkgs);

    DB.addNotification('user_admin', 'New Package Created ✈️', `Admin published new tour package "${name}" for ₹${price}.`);

    closeModal('package-modal');
    showToast('Holiday package created successfully!');
    renderPackages();
}

// Homestay approvals
function renderHomestaysApprovalQueue() {
    const stays = DB.getHomestays().filter(h => h.status === 'pending');
    const tbody = document.getElementById('admin-homestay-approvals-body');
    const users = DB.getUsers();
    tbody.innerHTML = '';

    if (stays.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-secondary);">No pending homestay approval requests.</td></tr>`;
        return;
    }

    stays.forEach(stay => {
        const ownerName = users.find(u => u.id === stay.ownerId)?.username || 'Host';
        tbody.innerHTML += `
            <tr>
                <td><code style="background:var(--bg-tertiary); padding:0.2rem; border-radius:4px;">${stay.id}</code></td>
                <td><strong>${ownerName}</strong></td>
                <td><strong>${stay.name}</strong></td>
                <td>📍 ${stay.location}</td>
                <td>${stay.rooms?.length || 0} room categories</td>
                <td>
                    <button class="btn btn-primary btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="approveHomestay('${stay.id}')">Approve</button>
                    <button class="btn btn-outline btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);" onclick="declineHomestay('${stay.id}')">Decline</button>
                </td>
            </tr>
        `;
    });
}

function approveHomestay(id) {
    const stays = DB.getHomestays();
    const stay = stays.find(s => s.id === id);
    if (!stay) return;

    stay.status = 'approved';
    DB.saveHomestays(stays);

    // Notify vendor
    DB.addNotification(
        stay.ownerId,
        'Property Approved! 🏠',
        `Your listing "${stay.name}" has been approved by the admin and is now live for guest bookings.`
    );

    // Notify admin activity
    DB.addNotification('user_admin', 'Homestay Approved', `Approved homestay listing "${stay.name}".`);

    showToast('Homestay approved and listed!');
    renderHomestaysApprovalQueue();
    updateAdminBadges();
}

function declineHomestay(id) {
    if (!confirm('Are you sure you want to decline this homestay listing?')) return;

    let stays = DB.getHomestays();
    const stay = stays.find(s => s.id === id);
    if (!stay) return;

    stays = stays.filter(s => s.id !== id);
    DB.saveHomestays(stays);

    // Notify vendor
    DB.addNotification(
        stay.ownerId,
        'Listing Request Declined',
        `Unfortunately, your property listing "${stay.name}" was declined. Contact admin for details.`
    );

    showToast('Homestay request declined.', 'error');
    renderHomestaysApprovalQueue();
    updateAdminBadges();
}

// Global bookings ledger
function renderBookingsLedger() {
    const bks = DB.getBookings();
    const tbody = document.getElementById('admin-bookings-body');
    tbody.innerHTML = '';

    if (bks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-secondary);">No bookings placed on platform.</td></tr>`;
        return;
    }

    bks.slice().reverse().forEach(bk => {
        let actionBtn = '';
        if (bk.status !== 'cancelled' && bk.status !== 'completed') {
            actionBtn += `<button class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem; border-color:var(--danger); color:var(--danger);" onclick="cancelBookingAdmin('${bk.id}')">Cancel</button>`;
        }
        if (bk.paymentStatus === 'pending') {
            actionBtn += ` <button class="btn btn-primary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="markPaidAdmin('${bk.id}')">Mark Paid</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><code>${bk.id}</code></td>
                <td><span class="status-pill ${bk.type === 'package' ? 'status-approved' : 'status-pending'}">${bk.type.toUpperCase()}</span></td>
                <td><strong>${bk.details.name}</strong></td>
                <td style="font-size:0.8rem;">${bk.details.dates}</td>
                <td><strong>₹${bk.details.totalPrice.toLocaleString()}</strong></td>
                <td><span class="status-pill ${bk.paymentStatus === 'paid' ? 'status-approved' : 'status-pending'}">${bk.paymentStatus.toUpperCase()}</span></td>
                <td><span class="status-pill status-${bk.status}">${bk.status.toUpperCase()}</span></td>
                <td>${actionBtn || '<span style="color:var(--text-secondary); font-size:0.75rem;">None</span>'}</td>
            </tr>
        `;
    });
}

function cancelBookingAdmin(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    const bks = DB.getBookings();
    const bk = bks.find(b => b.id === id);
    if (!bk) return;

    bk.status = 'cancelled';
    DB.saveBookings(bks);

    DB.addNotification(bk.userId, 'Reservation Cancelled by Admin', `Your booking ${id} has been cancelled by the system administrator.`);
    DB.addNotification('user_admin', 'Booking Cancelled', `Admin overridden cancel on reservation ${id}.`);

    showToast('Booking cancelled.');
    renderBookingsLedger();
}

function markPaidAdmin(id) {
    const bks = DB.getBookings();
    const bk = bks.find(b => b.id === id);
    if (!bk) return;

    bk.paymentStatus = 'paid';
    DB.saveBookings(bks);

    DB.addNotification(bk.userId, 'Payment Verified', `Admin verified the payment of ₹${bk.details.totalPrice} for booking ${id}.`);
    DB.addNotification('user_admin', 'Booking Paid Override', `Admin marked reservation ${id} as PAID.`);

    showToast('Payment verified successfully.');
    renderBookingsLedger();
}

// User accounts ledger
function renderUsersList() {
    const users = DB.getUsers();
    const tbody = document.getElementById('admin-users-body');
    tbody.innerHTML = '';

    users.forEach(usr => {
        let act = '';
        if (usr.role === 'vendor' && usr.status === 'pending') {
            act = `<button class="btn btn-primary btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="approveVendor('${usr.id}')">Approve Host</button>`;
        } else if (usr.status === 'approved' && usr.role !== 'admin') {
            act = `<button class="btn btn-outline btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);" onclick="toggleSuspendUser('${usr.id}', 'suspended')">Suspend</button>`;
        } else if (usr.status === 'suspended') {
            act = `<button class="btn btn-primary btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="toggleSuspendUser('${usr.id}', 'approved')">Unsuspend</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><code>${usr.id}</code></td>
                <td><strong>${usr.username}</strong></td>
                <td>${usr.email}</td>
                <td><span class="status-pill ${usr.role === 'admin' ? 'status-approved' : (usr.role === 'vendor' ? 'status-pending' : '')}">${usr.role.toUpperCase()}</span></td>
                <td><span class="status-pill status-${usr.status}">${usr.status.toUpperCase()}</span></td>
                <td>${act || '<span style="color:var(--text-secondary); font-size:0.75rem;">None</span>'}</td>
            </tr>
        `;
    });
}

function approveVendor(id) {
    const users = DB.getUsers();
    const u = users.find(usr => usr.id === id);
    if (!u) return;

    u.status = 'approved';
    DB.saveUsers(users);

    DB.addNotification(
        u.id,
        'Account Approved! 🧑‍💼',
        'Your host vendor account registration is approved! You can now log in, list properties, and accept reservations.'
    );
    DB.addNotification('user_admin', 'Vendor Approved', `Approved vendor login access for "${u.username}".`);

    showToast('Vendor approved successfully.');
    renderUsersList();
    updateAdminBadges();
}

function toggleSuspendUser(id, newStatus) {
    const users = DB.getUsers();
    const u = users.find(usr => usr.id === id);
    if (!u) return;

    u.status = newStatus;
    DB.saveUsers(users);

    DB.addNotification('user_admin', `User Account ${newStatus.toUpperCase()}`, `Admin updated status for "${u.username}" to ${newStatus}.`);

    showToast(`User status set to ${newStatus}.`);
    renderUsersList();
}

// Reviews moderation
function renderReviewsModerationQueue() {
    const revs = DB.getReviews().filter(r => r.status === 'pending');
    const tbody = document.getElementById('admin-reviews-body');
    const users = DB.getUsers();
    tbody.innerHTML = '';

    if (revs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-secondary);">No reviews pending moderation.</td></tr>`;
        return;
    }

    revs.forEach(rev => {
        const author = users.find(u => u.id === rev.userId)?.username || 'User';
        tbody.innerHTML += `
            <tr>
                <td><code>${rev.id}</code></td>
                <td><strong>${author}</strong></td>
                <td><span class="status-pill status-approved">${rev.type.toUpperCase()}</span></td>
                <td><span style="color:var(--accent-gold);">${'★'.repeat(rev.rating)}</span></td>
                <td style="font-size:0.85rem; color:var(--text-secondary); max-width: 300px;">"${rev.comment}"</td>
                <td>
                    <button class="btn btn-primary btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem;" onclick="approveReview('${rev.id}')">Approve</button>
                    <button class="btn btn-outline btn-sm" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);" onclick="rejectReview('${rev.id}')">Reject</button>
                </td>
            </tr>
        `;
    });
}

function approveReview(id) {
    const revs = DB.getReviews();
    const rev = revs.find(r => r.id === id);
    if (!rev) return;

    rev.status = 'approved';
    DB.saveReviews(revs);

    DB.addNotification(rev.userId, 'Review Approved', 'Your submitted review was approved and is now showing on our site testimonies.');
    DB.addNotification('user_admin', 'Review Approved', `Approved review ID: ${id}`);

    showToast('Review approved!');
    renderReviewsModerationQueue();
    updateAdminBadges();
}

function rejectReview(id) {
    let revs = DB.getReviews();
    revs = revs.filter(r => r.id !== id);
    DB.saveReviews(revs);

    DB.addNotification('user_admin', 'Review Rejected', `Rejected and deleted review ID: ${id}`);

    showToast('Review declined and removed.', 'error');
    renderReviewsModerationQueue();
    updateAdminBadges();
}

// Blogs & Offers CMS
function handleBlogSubmit(event) {
    event.preventDefault();
    const title = document.getElementById('blog-title').value;
    const author = document.getElementById('blog-author').value;
    const tags = document.getElementById('blog-tags').value.split(',').map(t => t.trim());
    const img = document.getElementById('blog-img').value;
    const content = document.getElementById('blog-content').value;

    const blogs = DB.getBlogs();
    const newBlog = {
        id: 'blog_' + Date.now(),
        title: title,
        content: content,
        author: author,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
        image: img,
        tags: tags
    };

    blogs.push(newBlog);
    DB.saveBlogs(blogs);

    DB.addNotification('user_admin', 'New Blog Article Published 📝', `Admin published blog: "${title}"`);

    showToast('Blog article published successfully!');
    event.target.reset();
    document.getElementById('blog-author').value = 'Ronit Das';
}

function handleOfferSubmit(event) {
    event.preventDefault();
    const code = document.getElementById('off-code').value.toUpperCase();
    const discount = parseInt(document.getElementById('off-discount').value) || 10;
    const expiry = document.getElementById('off-expiry').value;
    const desc = document.getElementById('off-desc').value;

    const offers = DB.getOffers();
    const newOffer = {
        id: 'off_' + Date.now(),
        code: code,
        discount: discount,
        description: desc,
        expiryDate: expiry
    };

    offers.push(newOffer);
    DB.saveOffers(offers);

    DB.addNotification('user_admin', 'New Promo Offer Created 🎟️', `Admin generated promo code "${code}" with ${discount}% discount.`);

    showToast('Promo coupon code generated!');
    event.target.reset();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
