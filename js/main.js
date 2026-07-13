// js/main.js
// Nextour Homepage Frontend Controller

let currentActiveSearchTab = 'packages';
let selectedPackage = null;
let selectedHomestay = null;
let selectedRoom = null;
let currentPromoDiscount = 0;
let pendingBookingData = null; // Staged for Razorpay simulation

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Nav bar profile actions
    renderNavbar();

    // 2. Render Packages
    renderPackages();

    // 3. Render Homestays
    renderHomestays();

    // 4. Render Offers
    renderOffers();

    // 5. Render Blogs
    renderBlogs();

    // 6. Render Testimonials
    renderTestimonials();

    // Set default dates in search to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const dateInput = document.getElementById('search-date');
    if (dateInput) {
        dateInput.value = dateStr;
        dateInput.min = dateStr;
    }
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

// Navbar Authentication rendering
function renderNavbar() {
    const navActions = document.getElementById('nav-actions-container');
    const currentUser = Auth.getCurrentUser();

    if (currentUser) {
        let portalUrl = 'portal.html';
        let portalName = 'My Portal';

        if (currentUser.role === 'admin') {
            portalUrl = 'admin.html';
            portalName = 'Admin Panel';
        } else if (currentUser.role === 'vendor') {
            portalUrl = 'owner.html';
            portalName = 'Owner Panel';
        }

        navActions.innerHTML = `
            <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Day / Night Mode">
                <div class="theme-toggle-thumb">🌙</div>
            </div>
            <div class="avatar-menu" onclick="toggleAvatarDropdown(event)">
                <img src="${currentUser.profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="Avatar" class="nav-avatar">
                <div class="dropdown-menu" id="nav-dropdown">
                    <div style="padding: 0.5rem 1.2rem; border-bottom: 1px solid var(--border-color); font-weight:600; font-size:0.85rem;">
                        Hi, ${currentUser.username}
                    </div>
                    <a href="${portalUrl}">🖥️ ${portalName}</a>
                    <button onclick="Auth.logout()">🚪 Logout</button>
                </div>
            </div>
        `;
    } else {
        navActions.innerHTML = `
            <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Day / Night Mode">
                <div class="theme-toggle-thumb">🌙</div>
            </div>
            <a href="portal.html" class="btn btn-outline">Sign In</a>
            <a href="owner.html" class="btn btn-primary">Host Homestay</a>
        `;
    }

    // Sync the theme toggle icon after DOM replacement
    if (typeof updateToggleIcons === 'function') {
        updateToggleIcons();
    } else {
        // Fallback: read the current theme and update manually
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.querySelectorAll('.theme-toggle-thumb').forEach(thumb => {
            thumb.textContent = isLight ? '☀️' : '🌙';
        });
    }
}

function toggleAvatarDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('nav-dropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown on click outside
window.addEventListener('click', () => {
    const dropdown = document.getElementById('nav-dropdown');
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

// Search Tab Switches
function switchSearchTab(tab) {
    currentActiveSearchTab = tab;
    const buttons = document.querySelectorAll('.search-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase().includes(tab));
    if (activeBtn) activeBtn.classList.add('active');

    const durationSelect = document.getElementById('search-duration');
    const labelDate = document.getElementById('search-date-label');

    durationSelect.innerHTML = '<option value="">Any</option>';
    if (tab === 'packages') {
        labelDate.innerText = 'Start Date';
        durationSelect.innerHTML += `
            <option value="5">Up to 5 Days</option>
            <option value="7">6 to 8 Days</option>
            <option value="10">9+ Days</option>
        `;
    } else {
        labelDate.innerText = 'Check-in Date';
        durationSelect.innerHTML += `
            <option value="villa">Attic & Cabin</option>
            <option value="cottage">Cottage</option>
        `;
    }
}

// Handle Home Search submit
function handleSearch(event) {
    event.preventDefault();
    const dest = document.getElementById('search-destination').value.toLowerCase();
    const duration = document.getElementById('search-duration').value;

    if (currentActiveSearchTab === 'packages') {
        const pkgs = DB.getPackages().filter(p => {
            const matchesDest = p.destination.toLowerCase().includes(dest) || p.name.toLowerCase().includes(dest);
            let matchesDur = true;
            if (duration) {
                const days = parseInt(p.duration.split(' ')[0]);
                if (duration === '5') matchesDur = days <= 5;
                if (duration === '7') matchesDur = days > 5 && days <= 8;
                if (duration === '10') matchesDur = days >= 9;
            }
            return matchesDest && matchesDur;
        });
        displayPackages(pkgs);
        document.getElementById('packages').scrollIntoView({ behavior: 'smooth' });
    } else {
        const stays = DB.getHomestays().filter(h => {
            if (h.status !== 'approved') return false;
            const matchesDest = h.location.toLowerCase().includes(dest) || h.name.toLowerCase().includes(dest);
            let matchesType = true;
            if (duration) {
                matchesType = h.rooms.some(r => r.type.toLowerCase().includes(duration));
            }
            return matchesDest && matchesType;
        });
        displayHomestays(stays);
        document.getElementById('homestays').scrollIntoView({ behavior: 'smooth' });
    }
}

// Redirect trigger details
function triggerRedirect(serviceName) {
    const modal = document.getElementById('redirect-modal');
    document.getElementById('redirect-title').innerText = `Book ${serviceName} on Click2Pays`;
    modal.classList.add('show');
}

// Render Packages
function renderPackages() {
    const pkgs = DB.getPackages();
    displayPackages(pkgs);
}

function displayPackages(pkgs) {
    const container = document.getElementById('packages-container');
    const countDisplay = document.getElementById('pkg-count-display');
    
    countDisplay.innerText = `Showing ${pkgs.length} packages`;
    container.innerHTML = '';

    if (pkgs.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No packages match your search. Try another query.</div>`;
        return;
    }

    pkgs.forEach(pkg => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${pkg.image}" alt="${pkg.name}" class="card-img">
                <span class="card-badge">${pkg.isDomestic ? 'Domestic' : 'International'}</span>
                <span class="card-price-badge">₹${pkg.price} <span style="font-size:0.7rem; font-weight:normal;">/ Person</span></span>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span>📍 ${pkg.destination.split(',')[0]}</span>
                    <span>⏱️ ${pkg.duration}</span>
                </div>
                <h3 class="card-title">${pkg.name}</h3>
                <p class="card-desc">${pkg.highlights.join(' • ')}</p>
                <div class="card-footer">
                    <span class="card-rating">★ 4.8 <span style="color:var(--text-secondary); font-size:0.8rem;">(12 reviews)</span></span>
                    <button class="btn btn-primary" onclick="openPackageDetails('${pkg.id}')">View Details</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterPackages(type) {
    const buttons = document.querySelectorAll('#pkg-filter-group .filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    let pkgs = DB.getPackages();
    if (type === 'domestic') {
        pkgs = pkgs.filter(p => p.isDomestic);
    } else if (type === 'international') {
        pkgs = pkgs.filter(p => !p.isDomestic);
    }
    displayPackages(pkgs);
}

// Render Homestays
function renderHomestays() {
    const stays = DB.getHomestays().filter(h => h.status === 'approved');
    displayHomestays(stays);
}

function displayHomestays(stays) {
    const container = document.getElementById('homestays-container');
    const countDisplay = document.getElementById('homestay-count-display');
    
    countDisplay.innerText = `Showing ${stays.length} homestays`;
    container.innerHTML = '';

    if (stays.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No homestays found in this location.</div>`;
        return;
    }

    stays.forEach(stay => {
        // get average price
        const minPrice = stay.rooms.reduce((min, r) => r.price < min ? r.price : min, stay.rooms[0]?.price || 0);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${stay.images[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'}" alt="${stay.name}" class="card-img">
                <span class="card-badge">Local Stay</span>
                <span class="card-price-badge">From ₹${minPrice} <span style="font-size:0.7rem; font-weight:normal;">/ Night</span></span>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span>📍 ${stay.location}</span>
                </div>
                <h3 class="card-title">${stay.name}</h3>
                <p class="card-desc">${stay.description.substr(0, 110)}...</p>
                <div class="card-footer">
                    <span class="card-rating">★ 4.9 <span style="color:var(--text-secondary); font-size:0.8rem;">(5 reviews)</span></span>
                    <button class="btn btn-primary" onclick="openHomestayDetails('${stay.id}')">Explore Stay</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterHomestays() {
    const query = document.getElementById('homestay-search-input').value.toLowerCase();
    const stays = DB.getHomestays().filter(h => h.status === 'approved' && (h.location.toLowerCase().includes(query) || h.name.toLowerCase().includes(query)));
    displayHomestays(stays);
}

// Render Offers
function renderOffers() {
    const offers = DB.getOffers();
    const container = document.getElementById('offers-container');
    if (!container) return;
    container.innerHTML = '';

    offers.forEach(off => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <span style="font-size:1.8rem; font-weight:700; color:var(--accent-gold); display:block; margin-bottom:0.5rem;">${off.discount}% OFF</span>
            <h3>Use Code: <span style="font-family:monospace; background:var(--bg-tertiary); padding: 0.2rem 0.6rem; border-radius: 4px; border:1px dashed var(--accent-gold);">${off.code}</span></h3>
            <p>${off.description}</p>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom: 1rem;">Expires: ${off.expiryDate}</p>
            <button class="btn btn-outline btn-sm" onclick="copyPromoCode('${off.code}')">Copy Coupon</button>
        `;
        container.appendChild(card);
    });
}

function copyPromoCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast(`Promo Code "${code}" copied to clipboard!`);
    });
}

// Render Blogs
function renderBlogs() {
    const blogs = DB.getBlogs();
    const container = document.getElementById('blogs-container');
    if (!container) return;
    container.innerHTML = '';

    blogs.forEach(blog => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-wrapper" style="height: 180px;">
                <img src="${blog.image}" alt="${blog.title}" class="card-img">
            </div>
            <div class="card-content" style="padding: 1.2rem;">
                <div style="font-size:0.75rem; color:var(--accent-emerald); font-weight:700; margin-bottom:0.5rem;">
                    ${blog.tags.map(t => '#' + t).join(' ')}
                </div>
                <h3 class="card-title" style="font-size:1.1rem; margin-bottom:0.5rem;">${blog.title}</h3>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">By ${blog.author} | ${blog.date}</p>
                <button class="btn btn-outline" style="width:100%;" onclick="openBlogModal('${blog.id}')">Read Full Story</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openBlogModal(id) {
    const blog = DB.getBlogs().find(b => b.id === id);
    if (!blog) return;

    // reuse redirect-modal structure for blog popup
    const modal = document.getElementById('redirect-modal');
    const header = modal.querySelector('h3');
    const icon = modal.querySelector('.modal-body div');
    const title = modal.querySelector('#redirect-title');
    const desc = modal.querySelector('.modal-body p');
    const footer = modal.querySelector('.modal-body div:last-child');

    header.innerText = 'Nextour Blog';
    icon.innerHTML = `<img src="${blog.image}" style="width:100%; height:180px; object-fit:cover; border-radius:10px; margin-bottom:1rem;">`;
    title.innerText = blog.title;
    title.style.fontSize = '1.3rem';
    desc.innerText = blog.content;
    desc.style.textAlign = 'left';
    footer.innerHTML = `
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">Written by <strong>${blog.author}</strong> on ${blog.date}</div>
        <button class="btn btn-primary" onclick="closeModal('redirect-modal')">Close Article</button>
    `;
    modal.classList.add('show');
}

// Testimonials (from approved reviews in DB)
function renderTestimonials() {
    const revs = DB.getReviews().filter(r => r.status === 'approved').slice(0, 4);
    const container = document.getElementById('testimonials-container');
    if (!container) return;
    container.innerHTML = '';

    if (revs.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); text-align:center; grid-column: 1/-1;">No reviews verified yet.</p>`;
        return;
    }

    const users = DB.getUsers();

    revs.forEach(rev => {
        const user = users.find(u => u.id === rev.userId) || { username: 'Anonymous', profile: { avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' } };
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '1.5rem';
        card.style.flexDirection = 'row';
        card.style.gap = '1rem';
        card.style.alignItems = 'center';
        card.innerHTML = `
            <img src="${user.profile.avatar}" alt="${user.username}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-emerald);">
            <div>
                <div style="font-weight:700; color:#fff; font-size:1rem;">${user.username}</div>
                <div style="color:var(--accent-gold); font-size:0.85rem; margin-bottom:0.3rem;">${'★'.repeat(rev.rating)}</div>
                <p style="font-style:italic; font-size:0.85rem; color:var(--text-secondary);">"${rev.comment}"</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// Modal handling
function openPackageDetails(id) {
    const pkg = DB.getPackages().find(p => p.id === id);
    if (!pkg) return;

    selectedPackage = pkg;
    currentPromoDiscount = 0;

    document.getElementById('pkg-modal-title').innerText = pkg.name;
    document.getElementById('pkg-modal-image').src = pkg.image;

    // Highlights
    const hlContainer = document.getElementById('pkg-modal-highlights');
    hlContainer.innerHTML = pkg.highlights.map(hl => `<li>${hl}</li>`).join('');

    // Description
    document.getElementById('pkg-modal-desc').innerText = `Destination: ${pkg.destination} | Duration: ${pkg.duration}`;

    // Itinerary
    const itinContainer = document.getElementById('pkg-modal-itinerary-list');
    itinContainer.innerHTML = pkg.itinerary.map(it => `
        <div style="background:var(--bg-tertiary); padding:1rem; border-radius:8px; border-left:3px solid var(--accent-emerald);">
            <div style="font-weight:700; color:#fff;">Day ${it.day}: ${it.title}</div>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.3rem;">${it.desc}</div>
        </div>
    `).join('');

    // Inclusions & Exclusions
    document.getElementById('pkg-modal-includes').innerHTML = pkg.includes.map(inc => `<li>${inc}</li>`).join('');
    document.getElementById('pkg-modal-excludes').innerHTML = pkg.excludes.map(exc => `<li>${exc}</li>`).join('');

    // FAQs
    const faqContainer = document.getElementById('pkg-modal-faq-list');
    faqContainer.innerHTML = pkg.faqs.map(f => `
        <div class="faq-item">
            <div style="font-weight:700; padding:0.8rem 1rem; color:#fff; font-size:0.9rem;">Q: ${f.q}</div>
            <div style="font-size:0.85rem; padding:0 1rem 0.8rem; color:var(--text-secondary);">A: ${f.a}</div>
        </div>
    `).join('');

    // Reset date in Form to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('pkg-book-date');
    dateInput.value = tomorrow.toISOString().split('T')[0];
    dateInput.min = tomorrow.toISOString().split('T')[0];

    // Reset Promo Input
    document.getElementById('pkg-book-promo').value = '';
    
    // Initial Price Calculation
    calculatePkgPrice();

    // Default to Overview tab
    const tabs = document.querySelectorAll('#package-detail-modal .modal-tab-btn');
    switchModalTab('pkg-overview', tabs[0]);

    document.getElementById('package-detail-modal').classList.add('show');
}

function calculatePkgPrice() {
    if (!selectedPackage) return;
    const guests = parseInt(document.getElementById('pkg-book-guests').value) || 1;
    const promo = document.getElementById('pkg-book-promo').value.toUpperCase();
    
    let baseTotal = selectedPackage.price * guests;
    let discountAmt = 0;

    // Check discount code
    const matchingOffer = DB.getOffers().find(o => o.code === promo);
    if (matchingOffer) {
        discountAmt = (baseTotal * matchingOffer.discount) / 100;
        currentPromoDiscount = matchingOffer.discount;
    } else {
        currentPromoDiscount = 0;
    }

    const netPrice = baseTotal - discountAmt;
    document.getElementById('pkg-booking-total').innerText = `₹${netPrice.toLocaleString()}`;
}

// Submitting Package booking triggers Razorpay simulation
function handlePkgBookingSubmit(event) {
    event.preventDefault();
    const currentUser = Auth.getCurrentUser();
    
    if (!currentUser) {
        showToast('Please login to book a package.', 'error');
        setTimeout(() => {
            window.location.href = 'portal.html';
        }, 1500);
        return;
    }

    if (currentUser.role !== 'customer') {
        showToast('Only Customer accounts can book packages.', 'error');
        return;
    }

    const date = document.getElementById('pkg-book-date').value;
    const guests = parseInt(document.getElementById('pkg-book-guests').value) || 1;
    const phone = document.getElementById('pkg-book-phone').value;
    const promo = document.getElementById('pkg-book-promo').value.toUpperCase();

    let basePrice = selectedPackage.price;
    let baseTotal = basePrice * guests;
    let discountPercent = 0;

    const matchingOffer = DB.getOffers().find(o => o.code === promo);
    if (matchingOffer) {
        discountPercent = matchingOffer.discount;
    }

    const netPrice = baseTotal - (baseTotal * discountPercent / 100);

    // Save temporary booking details to load after payment
    pendingBookingData = {
        userId: currentUser.id,
        type: 'package',
        itemId: selectedPackage.id,
        details: {
            name: selectedPackage.name,
            dates: date,
            guests: guests,
            basePrice: basePrice,
            totalPrice: netPrice,
            contactPhone: phone,
            promoApplied: promo || 'None'
        }
    };

    // Open Razorpay Simulator
    closeModal('package-detail-modal');
    document.getElementById('rp-amount-display').innerText = `₹${netPrice.toLocaleString()}`;
    document.getElementById('razorpay-modal').classList.add('show');
}

function completeSimulatedPayment() {
    if (!pendingBookingData) return;

    const bookings = DB.getBookings();
    const newBooking = {
        id: 'bk_' + Date.now(),
        userId: pendingBookingData.userId,
        type: pendingBookingData.type,
        itemId: pendingBookingData.itemId,
        details: pendingBookingData.details,
        paymentStatus: 'paid',
        status: 'confirmed', // package bookings are immediately confirmed once paid
        dateCreated: new Date().toISOString().split('T')[0]
    };

    bookings.push(newBooking);
    DB.saveBookings(bookings);

    // Add customer notifications
    DB.addNotification(
        pendingBookingData.userId,
        'Booking Confirmed! 🎉',
        `Your booking for "${pendingBookingData.details.name}" on ${pendingBookingData.details.dates} has been successfully paid and confirmed.`
    );

    // Add admin notification (to admin user ID)
    DB.addNotification(
        'user_admin',
        'New Package Booking Paid',
        `Customer logged a new paid booking for ${pendingBookingData.details.name}. Revenue: ₹${pendingBookingData.details.totalPrice}.`
    );

    closeModal('razorpay-modal');
    showToast('Payment Successful! Check your customer dashboard.');
    pendingBookingData = null;
}

// Homestay Details Modals
function openHomestayDetails(id) {
    const stay = DB.getHomestays().find(h => h.id === id);
    if (!stay) return;

    selectedHomestay = stay;

    document.getElementById('hs-modal-title').innerText = stay.name;
    document.getElementById('hs-modal-image').src = stay.images[0] || '';
    document.getElementById('hs-modal-desc').innerText = stay.description;

    // Amenities
    const amContainer = document.getElementById('hs-modal-amenities');
    amContainer.innerHTML = stay.amenities.map(a => `
        <span style="background:var(--bg-tertiary); border:1px solid var(--border-color); padding:0.3rem 0.8rem; border-radius:20px; font-size:0.75rem;">${a}</span>
    `).join('');

    document.getElementById('hs-modal-location').innerText = `Location: ${stay.location} | GPS Coordinates: ${stay.latLng}`;

    // Rules
    document.getElementById('hs-modal-rules-list').innerHTML = stay.rules.map(r => `<li>${r}</li>`).join('');

    // Rooms & Booking
    const roomsList = document.getElementById('hs-modal-rooms-list');
    roomsList.innerHTML = stay.rooms.map(room => `
        <div style="background:var(--bg-tertiary); padding:1rem; border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:700; color:#fff;">${room.type}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary);">Max Capacity: ${room.capacity} Guests</div>
                <div style="font-size:1rem; font-weight:700; color:var(--accent-emerald); margin-top:0.3rem;">₹${room.price} / Night</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="selectRoomForBooking('${room.id}', '${room.type}', ${room.price})">Select Room</button>
        </div>
    `).join('');

    // Reviews list
    const reviewsList = document.getElementById('hs-modal-reviews-list');
    const stayReviews = DB.getReviews().filter(r => r.type === 'homestay' && r.itemId === id && r.status === 'approved');
    const users = DB.getUsers();

    if (stayReviews.length === 0) {
        reviewsList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-secondary);">No reviews listed for this homestay yet.</p>`;
    } else {
        reviewsList.innerHTML = stayReviews.map(r => {
            const u = users.find(usr => usr.id === r.userId) || { username: 'Guest' };
            return `
                <div style="border-bottom:1px solid var(--border-color); padding-bottom:0.8rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.2rem;">
                        <span style="font-weight:700; color:#fff;">${u.username}</span>
                        <span style="color:var(--accent-gold);">${'★'.repeat(r.rating)}</span>
                    </div>
                    <p style="font-size:0.8rem; color:var(--text-secondary); font-style:italic;">"${r.comment}"</p>
                </div>
            `;
        }).join('');
    }

    // Hide booking form initially until a room is clicked
    document.getElementById('hs-booking-form-wrapper').style.display = 'none';

    // Tabs
    const tabs = document.querySelectorAll('#homestay-detail-modal .modal-tab-btn');
    switchModalTab('hs-overview', tabs[0]);

    document.getElementById('homestay-detail-modal').classList.add('show');
}

function selectRoomForBooking(roomId, roomType, price) {
    selectedRoom = { id: roomId, type: roomType, price: price };

    document.getElementById('hs-book-room-id').value = roomId;
    document.getElementById('hs-book-room-name').innerText = roomType;
    
    // Set default dates
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    document.getElementById('hs-book-checkin').value = today.toISOString().split('T')[0];
    document.getElementById('hs-book-checkin').min = today.toISOString().split('T')[0];
    document.getElementById('hs-book-checkout').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('hs-book-checkout').min = tomorrow.toISOString().split('T')[0];

    document.getElementById('hs-booking-form-wrapper').style.display = 'block';
    
    calculateHsPrice();
}

function calculateHsPrice() {
    if (!selectedRoom) return;

    const inDate = new Date(document.getElementById('hs-book-checkin').value);
    const outDate = new Date(document.getElementById('hs-book-checkout').value);

    let nights = 1;
    if (outDate > inDate) {
        const diffTime = Math.abs(outDate - inDate);
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    const total = selectedRoom.price * nights;
    document.getElementById('hs-booking-form').querySelector('#hs-booking-total').innerText = `₹${total.toLocaleString()} (${nights} Nights)`;
}

// Homestay Booking request (option B: pay at property, vendor must confirm)
function handleHsBookingSubmit(event) {
    event.preventDefault();
    const currentUser = Auth.getCurrentUser();

    if (!currentUser) {
        showToast('Please login to book a homestay.', 'error');
        setTimeout(() => {
            window.location.href = 'portal.html';
        }, 1500);
        return;
    }

    if (currentUser.role !== 'customer') {
        showToast('Only Customer accounts can make homestay requests.', 'error');
        return;
    }

    const checkin = document.getElementById('hs-book-checkin').value;
    const checkout = document.getElementById('hs-book-checkout').value;
    const guests = parseInt(document.getElementById('hs-book-guests').value) || 1;
    const phone = document.getElementById('hs-book-phone').value;

    const inDate = new Date(checkin);
    const outDate = new Date(checkout);
    let nights = 1;
    if (outDate > inDate) {
        const diffTime = Math.abs(outDate - inDate);
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
    const totalPrice = selectedRoom.price * nights;

    const bookings = DB.getBookings();
    const newBooking = {
        id: 'bk_' + Date.now(),
        userId: currentUser.id,
        type: 'homestay',
        itemId: selectedHomestay.id,
        details: {
            name: selectedHomestay.name,
            roomType: selectedRoom.type,
            roomId: selectedRoom.id,
            dates: `${checkin} to ${checkout}`,
            guests: guests,
            nights: nights,
            basePrice: selectedRoom.price,
            totalPrice: totalPrice,
            contactPhone: phone
        },
        paymentStatus: 'pending', // paid on spot
        status: 'pending', // requires vendor confirmation
        dateCreated: new Date().toISOString().split('T')[0]
    };

    bookings.push(newBooking);
    DB.saveBookings(bookings);

    // Notify Customer
    DB.addNotification(
        currentUser.id,
        'Booking Request Submitted',
        `Your request for "${selectedHomestay.name} (${selectedRoom.type})" has been sent to the host. You will receive an alert once approved.`
    );

    // Notify Vendor (Owner of Homestay)
    DB.addNotification(
        selectedHomestay.ownerId,
        'New Booking Request! 🏠',
        `A customer requested a booking for your room "${selectedRoom.type}" from ${checkin} to ${checkout}. Check owner portal to approve.`
    );

    closeModal('homestay-detail-modal');
    showToast('Booking request submitted to host! Check status in My Portal.');
}

// Modal Tabs Toggle helper
function switchModalTab(contentId, tabBtn) {
    const parentModal = tabBtn.closest('.modal');
    const tabBtns = parentModal.querySelectorAll('.modal-tab-btn');
    const contents = parentModal.querySelectorAll('.modal-tab-content');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === contentId) {
            content.classList.add('active');
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// FAQ toggle
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    item.classList.toggle('active');
    const icon = item.querySelector('.faq-icon');
    if (item.classList.contains('active')) {
        icon.innerText = '-';
    } else {
        icon.innerText = '+';
    }
}

// Contact form submission
function handleContactSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;

    // Save notifications to admin
    DB.addNotification(
        'user_admin',
        'New Contact Enquiry 📩',
        `Enquiry from ${name} (${email}) - Subject: ${subject}. Message: "${message}"`
    );

    showToast('Thank you! Your enquiry has been received. Our team will contact you soon.');
    event.target.reset();
}
