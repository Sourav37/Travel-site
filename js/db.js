// js/db.js
// Nextour Mock Database Manager using LocalStorage

const DB_KEYS = {
    USERS: 'nextour_users',
    PACKAGES: 'nextour_packages',
    HOMESTAYS: 'nextour_homestays',
    BOOKINGS: 'nextour_bookings',
    BLOGS: 'nextour_blogs',
    OFFERS: 'nextour_offers',
    REVIEWS: 'nextour_reviews',
    NOTIFICATIONS: 'nextour_notifications',
    CURRENT_USER: 'nextour_current_user'
};

// Seed Data
const defaultUsers = [
    {
        id: 'user_admin',
        username: 'admin',
        email: 'admin@nextour.com',
        password: 'admin123',
        role: 'admin',
        status: 'approved',
        profile: { phone: '9876543210', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }
    },
    {
        id: 'user_owner1',
        username: 'homestay_owner',
        email: 'owner@nextour.com',
        password: 'owner123',
        role: 'vendor',
        status: 'approved',
        profile: { phone: '8765432109', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' }
    },
    {
        id: 'user_owner2',
        username: 'pending_owner',
        email: 'pending_owner@nextour.com',
        password: 'owner123',
        role: 'vendor',
        status: 'pending',
        profile: { phone: '7654321098', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }
    },
    {
        id: 'user_customer1',
        username: 'john_doe',
        email: 'john@example.com',
        password: 'user123',
        role: 'customer',
        status: 'approved',
        profile: { phone: '9876123450', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }
    }
];

const defaultPackages = [
    {
        id: 'pkg_1',
        name: 'Kerala Backwaters Serenade',
        category: 'Leisure & Nature',
        isDomestic: true,
        duration: '5 Days / 4 Nights',
        destination: 'Alleppey, Munnar & Cochin',
        price: 14999,
        highlights: ['Houseboat cruise in Alleppey', 'Tea plantation walk in Munnar', 'Cochin sightseeing'],
        itinerary: [
            { day: 1, title: 'Arrival in Cochin & Drive to Munnar', desc: 'Transfer to Munnar, scenic hills, tea estates check-in.' },
            { day: 2, title: 'Munnar Sightseeing', desc: 'Visit Eravikulam National Park, Mattupetty Dam, Echo Point.' },
            { day: 3, title: 'Munnar to Alleppey Houseboat', desc: 'Check into luxury houseboat. Overnight cruise in Vembanad Lake.' },
            { day: 4, title: 'Alleppey to Cochin', desc: 'Relax at Cochin beach. Visit Fort Kochi and Chinese Fishing Nets.' },
            { day: 5, title: 'Departure', desc: 'Departure transfer to Cochin airport/railway station.' }
        ],
        includes: ['4-star Hotel Stay', 'Daily Breakfast', 'Houseboat Lunch & Dinner', 'Private Cab for Transfers'],
        excludes: ['Airfare/Train ticket', 'Entrance fees at monuments', 'Personal expenses'],
        image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800',
        faqs: [
            { q: 'Is this package suitable for families?', a: 'Yes, it is highly family-friendly with minimal trekking.' },
            { q: 'Can we customize the itinerary?', a: 'Yes, you can request custom changes through our support desk.' }
        ]
    },
    {
        id: 'pkg_2',
        name: 'Mystical Bali Island Escape',
        category: 'Adventure & Beaches',
        isDomestic: false,
        duration: '7 Days / 6 Nights',
        destination: 'Ubud & Kuta, Bali',
        price: 44999,
        highlights: ['Ubud Sacred Monkey Forest tour', 'Kuta Beach sunset dinner', 'Mount Batur Sunrise Trek'],
        itinerary: [
            { day: 1, title: 'Arrive in Bali', desc: 'Warm welcome at Ngurah Rai Airport, transfer to Ubud hotel.' },
            { day: 2, title: 'Ubud Culture Tour', desc: 'Visit Tegallalang Rice Terraces, Monkey Forest, Ubud Palace.' },
            { day: 3, title: 'Water Sports & Beachfront dinner', desc: 'Para-sailing, Banana boat at Tanjung Benoa. Sunset seafood dinner at Jimbaran.' },
            { day: 4, title: 'Mount Batur Trekking', desc: 'Early morning climb for sunrise. Breakfast on top. Relax in hot springs.' },
            { day: 5, title: 'Nusa Penida Day Trip', desc: 'Speedboat to Nusa Penida, visit Kelingking beach & Angel’s Billabong.' },
            { day: 6, title: 'Leisure Day', desc: 'Day at leisure for shopping or luxury spa treatment.' },
            { day: 7, title: 'Departure', desc: 'Check out and transfer back to Airport.' }
        ],
        includes: ['6 Nights Villa accommodation', 'All transfers via AC Coach', 'Entrance tickets', 'English-speaking guide'],
        excludes: ['Visa on arrival fee', 'Flights', 'Lunch and dinners not mentioned'],
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        faqs: [
            { q: 'What is the visa requirement for Indians?', a: 'Visa on Arrival is available for 30 days.' },
            { q: 'Is Indian food available in Bali?', a: 'Yes, there are several authentic Indian restaurants in Kuta and Seminyak.' }
        ]
    },
    {
        id: 'pkg_3',
        name: 'Himachal Snow Paradise',
        category: 'Hills & Adventure',
        isDomestic: true,
        duration: '6 Days / 5 Nights',
        destination: 'Shimla, Manali & Solang Valley',
        price: 17999,
        highlights: ['Snow sports at Solang Valley', 'Stroll along Shimla Mall Road', 'Hadimba Temple visit'],
        itinerary: [
            { day: 1, title: 'Delhi to Shimla Drive', desc: 'Pickup from Delhi, overnight drive to Shimla.' },
            { day: 2, title: 'Shimla Ridge & Kufri Tour', desc: 'Visit Kufri amusement park, ride horses, walk on Mall Road.' },
            { day: 3, title: 'Shimla to Manali via Kullu', desc: 'Scenic drive, river rafting in Kullu valley, reach Manali.' },
            { day: 4, title: 'Manali Local Tour', desc: 'Hadimba temple, Vashisht hot springs, Club house.' },
            { day: 5, title: 'Solang Valley Snow Point', desc: 'Trekking, skiing, paragliding options at Solang Valley.' },
            { day: 6, title: 'Manali to Delhi Return', desc: 'Drive back to Delhi. Drop off at railway station/airport.' }
        ],
        includes: ['Standard AC Cab', 'Hotel Stay (3-Star)', 'Breakfast & Dinner', 'Driver allowances'],
        excludes: ['Adventure sports cost', 'Room heater charges', 'Rohtang Pass permission charges'],
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
        faqs: [
            { q: 'When is snow found in Manali?', a: 'Snow is common from mid-December to early February.' }
        ]
    }
];

const defaultHomestays = [
    {
        id: 'hs_1',
        ownerId: 'user_owner1',
        name: 'Hilltop Pine Crest Homestay',
        location: 'Shimla, Himachal Pradesh',
        latLng: '31.1048, 77.1734',
        description: 'Enjoy a cozy, traditional stay tucked inside dense pine forests. Wake up to majestic snow peaks and enjoy home-cooked Himalayan meals.',
        amenities: ['Free WiFi', 'Fireplace', 'Heated Rooms', 'Kitchen access', 'Parking', 'Bonfire yard'],
        images: [
            'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
        ],
        rooms: [
            { id: 'rm_1_1', type: 'Deluxe Pine Room', capacity: 2, price: 3000, quantity: 3 },
            { id: 'rm_1_2', type: 'Family Attic Suite', capacity: 4, price: 5500, quantity: 1 }
        ],
        status: 'approved',
        rules: ['No pets allowed inside bedrooms', 'Quiet hours after 10 PM', 'Smoking in balcony only'],
        reviews: []
    },
    {
        id: 'hs_2',
        ownerId: 'user_owner1',
        name: 'The Coconut Grove Homestay',
        location: 'Alleppey, Kerala',
        latLng: '9.4981, 76.3388',
        description: 'Beautiful homestay situated right on the banks of Pamba river. Ideal for a slow life escape with direct backwater views.',
        amenities: ['Free WiFi', 'AC Bedrooms', 'Direct Backwater view', 'Bicycle rental', 'Traditional Kerala Breakfast'],
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
        ],
        rooms: [
            { id: 'rm_2_1', type: 'Riverview AC Cottage', capacity: 2, price: 2800, quantity: 2 }
        ],
        status: 'approved',
        rules: ['Footwear to be left outside the house', 'Eco-friendly disposal of plastics'],
        reviews: []
    }
];

const defaultBlogs = [
    {
        id: 'blog_1',
        title: 'How to Pack Like a Pro for a 5-Day Himalayan Trek',
        content: 'Packing for high-altitude treks can be intimidating. You need layers of clothing, emergency medicines, proper footwear, and to keep it all under 8kg. In this blog, we detail how to select your trekking gear, organize your backpack, and prepare for unexpected cold conditions. First, invest in lightweight woolens, thermal innerwear, and a robust waterproof shell jacket. Do not miss to pack a good water filter bottle, electrolyte sachets, and blister pads. Travel light, travel safe!',
        author: 'Ronit Das',
        date: 'July 10, 2026',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        tags: ['Trekking', 'Travel Guide', 'Himalayas']
    },
    {
        id: 'blog_2',
        title: '5 Exquisite Dishes You Must Try in Kerala',
        content: 'Kerala’s cuisine is a celebration of coconut, seafood, and rich spices. When visiting, bypass standard menus and try these authentic delights: 1. Karimeen Pollichathu (pearl spot fish baked in banana leaves), 2. Puttu and Kadala Curry (steamed rice logs with spiced black chickpeas), 3. Kerala Parotta with Beef Fry (layered soft bread with roasted beef), 4. Appam with Stew (fluffy pancakes with coconut milk-based stew), 5. Palada Payasam (sweet rice pudding served during festivals). Bon appétit!',
        author: 'Ananya Sharma',
        date: 'July 05, 2026',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
        tags: ['Food', 'Kerala', 'Local Culture']
    }
];

const defaultOffers = [
    {
        id: 'off_1',
        code: 'NEXTOURNEW',
        discount: 15,
        description: 'Get flat 15% discount on all domestic and international holiday packages.',
        expiryDate: '2026-12-31'
    },
    {
        id: 'off_2',
        code: 'STAYSAFE',
        discount: 10,
        description: 'Get flat 10% off on premium homestays across India.',
        expiryDate: '2026-10-31'
    }
];

const defaultReviews = [
    {
        id: 'rev_1',
        userId: 'user_customer1',
        type: 'homestay',
        itemId: 'hs_1',
        rating: 5,
        comment: 'Amazing place! The view from the pine room is stunning. The food was so fresh and delicious. Definitely coming back.',
        status: 'approved',
        dateCreated: '2026-07-01'
    },
    {
        id: 'rev_2',
        userId: 'user_customer1',
        type: 'package',
        itemId: 'pkg_1',
        rating: 4,
        comment: 'Very well organized tour. The houseboat stay in Alleppey was the highlight of the trip. Munnar was beautiful too.',
        status: 'approved',
        dateCreated: '2026-07-05'
    }
];

const defaultBookings = [
    {
        id: 'bk_1',
        userId: 'user_customer1',
        type: 'package',
        itemId: 'pkg_1',
        details: {
            name: 'Kerala Backwaters Serenade',
            dates: '2026-08-15 to 2026-08-20',
            guests: 2,
            basePrice: 14999,
            totalPrice: 29998,
            contactPhone: '9876123450'
        },
        paymentStatus: 'paid',
        status: 'confirmed',
        dateCreated: '2026-07-10'
    }
];

// Database Functions
const DB = {
    init() {
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(defaultUsers));
        }
        if (!localStorage.getItem(DB_KEYS.PACKAGES)) {
            localStorage.setItem(DB_KEYS.PACKAGES, JSON.stringify(defaultPackages));
        }
        if (!localStorage.getItem(DB_KEYS.HOMESTAYS)) {
            localStorage.setItem(DB_KEYS.HOMESTAYS, JSON.stringify(defaultHomestays));
        }
        if (!localStorage.getItem(DB_KEYS.BOOKINGS)) {
            localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(defaultBookings));
        }
        if (!localStorage.getItem(DB_KEYS.BLOGS)) {
            localStorage.setItem(DB_KEYS.BLOGS, JSON.stringify(defaultBlogs));
        }
        if (!localStorage.getItem(DB_KEYS.OFFERS)) {
            localStorage.setItem(DB_KEYS.OFFERS, JSON.stringify(defaultOffers));
        }
        if (!localStorage.getItem(DB_KEYS.REVIEWS)) {
            localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify(defaultReviews));
        }
        if (!localStorage.getItem(DB_KEYS.NOTIFICATIONS)) {
            localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify([]));
        }
    },

    getData(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Users CRUD
    getUsers() { return this.getData(DB_KEYS.USERS); },
    saveUsers(users) { this.saveData(DB_KEYS.USERS, users); },

    // Packages CRUD
    getPackages() { return this.getData(DB_KEYS.PACKAGES); },
    savePackages(pkgs) { this.saveData(DB_KEYS.PACKAGES, pkgs); },

    // Homestays CRUD
    getHomestays() { return this.getData(DB_KEYS.HOMESTAYS); },
    saveHomestays(stays) { this.saveData(DB_KEYS.HOMESTAYS, stays); },

    // Bookings CRUD
    getBookings() { return this.getData(DB_KEYS.BOOKINGS); },
    saveBookings(bks) { this.saveData(DB_KEYS.BOOKINGS, bks); },

    // Blogs CRUD
    getBlogs() { return this.getData(DB_KEYS.BLOGS); },
    saveBlogs(blogs) { this.saveData(DB_KEYS.BLOGS, blogs); },

    // Offers CRUD
    getOffers() { return this.getData(DB_KEYS.OFFERS); },
    saveOffers(offers) { this.saveData(DB_KEYS.OFFERS, offers); },

    // Reviews CRUD
    getReviews() { return this.getData(DB_KEYS.REVIEWS); },
    saveReviews(revs) { this.saveData(DB_KEYS.REVIEWS, revs); },

    // Notifications
    getNotifications() { return this.getData(DB_KEYS.NOTIFICATIONS); },
    saveNotifications(notifs) { this.saveData(DB_KEYS.NOTIFICATIONS, notifs); },
    addNotification(userId, title, message) {
        const notifs = this.getNotifications();
        notifs.push({
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            userId,
            title,
            message,
            read: false,
            dateCreated: new Date().toISOString().split('T')[0]
        });
        this.saveNotifications(notifs);
    }
};

// Initialize DB immediately when this script is loaded
DB.init();
window.DB = DB; // expose to window for ease of use across dashboard scripts
