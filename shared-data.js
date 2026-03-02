/**
 * CyberCheck Shared Data Store
 *
 * All apps read/write through this.
 * In production this talks to Supabase. For now it uses localStorage
 * so data persists between page loads and flows between apps.
 *
 * Apps access this via window.parent.CyberCheck (since they're in iframes)
 * Dashboard accesses it via window.CyberCheck directly
 */

window.CyberCheck = (function() {
    const STORAGE_KEY = 'cybercheck_data';

    // Default data - used on first load or reset
    const DEFAULT_DATA = {
        business: {
            id: 'maggie-bakery',
            name: "Maggie's Cakes and More",
            tagline: 'Fresh baked goods made with love',
            type: 'restaurant',
            email: 'maggie@maggiescakes.com',
            phone: '(251) 555-2847',
            address: '1234 Beach Blvd, Gulf Shores, AL 36542',
            website: 'https://maggiescakes.com',
            logo_emoji: '🧁',
            accent_color: '#667eea',
            rating: 4.8,
            hours: {
                monday: { open: '7:00 AM', close: '6:00 PM', closed: false },
                tuesday: { open: '7:00 AM', close: '6:00 PM', closed: false },
                wednesday: { open: '7:00 AM', close: '6:00 PM', closed: false },
                thursday: { open: '7:00 AM', close: '6:00 PM', closed: false },
                friday: { open: '7:00 AM', close: '7:00 PM', closed: false },
                saturday: { open: '8:00 AM', close: '5:00 PM', closed: false },
                sunday: { open: '', close: '', closed: true }
            }
        },

        user: {
            id: 'user_demo_001',
            name: 'Maggie Thompson',
            email: 'maggie@maggiescakes.com',
            role: 'owner'
        },

        installed_apps: ['booking', 'menu', 'sms', 'loyalty', 'ordering', 'social', 'biopage', 'sms-automation', 'ai-training', 'business-details'],

        connected_tools: {
            stripe: { connected: true, account_id: 'acct_demo_stripe' },
            square: { connected: true, account_id: 'acct_demo_square' },
            clover: { connected: true, account_id: 'acct_demo_clover' },
            google_calendar: { connected: true, account_id: 'acct_demo_gcal' },
            gmail: { connected: true, account_id: 'acct_demo_gmail' },
            instagram: { connected: true, handle: '@maggiescakes' },
            facebook: { connected: true, page: "Maggie's Cakes and More" },
            google_business: { connected: true, name: "Maggie's Cakes" },
            twilio: { connected: true, phone: '+12515552847' },
            twitter: { connected: false },
            tiktok: { connected: false }
        },

        menu_items: [
            { id: 1, name: 'Individual Cupcake', category: 'cupcakes', price: 3.82, description: 'Single cupcake - Choose your favorite flavor!', emoji: '🧁', tags: ['popular'], available: true, voice_recorded: false, voice_text: '' },
            { id: 2, name: 'Half Dozen Cupcakes', category: 'cupcakes', price: 19.62, description: '6 cupcakes - Mix and match your favorite flavors!', emoji: '🧁', tags: ['popular'], available: true, voice_recorded: false, voice_text: '' },
            { id: 3, name: 'Dozen Cupcakes', category: 'cupcakes', price: 39.24, description: '12 cupcakes - Perfect for parties and events!', emoji: '🧁', tags: ['popular'], available: true, voice_recorded: false, voice_text: '' },
            { id: 4, name: 'Chocolate Chip Cookies', category: 'cookies', price: 2.50, description: 'Classic chocolate chip cookies baked fresh daily', emoji: '🍪', tags: ['popular'], available: true, voice_recorded: false, voice_text: '' },
            { id: 5, name: 'Sugar Cookies', category: 'cookies', price: 2.25, description: 'Soft and sweet sugar cookies', emoji: '🍪', tags: [], available: true, voice_recorded: false, voice_text: '' },
            { id: 6, name: 'Custom Birthday Cake', category: 'cakes', price: 75.00, description: 'Custom designed birthday cake - 8 inch round', emoji: '🎂', tags: ['custom'], available: true, voice_recorded: false, voice_text: '' },
            { id: 7, name: 'Coffee', category: 'extras', price: 3.00, description: 'Freshly brewed coffee', emoji: '☕', tags: [], available: true, voice_recorded: false, voice_text: '' },
            { id: 8, name: 'Red Velvet Cupcake', category: 'cupcakes', price: 4.50, description: 'Rich red velvet with cream cheese frosting', emoji: '🧁', tags: ['popular'], available: false, voice_recorded: false, voice_text: '' },
            { id: 9, name: 'Apple Pie', category: 'cakes', price: 18.00, description: 'Homemade apple pie with flaky crust', emoji: '🥧', tags: [], available: true, voice_recorded: false, voice_text: '' },
            { id: 10, name: 'Cinnamon Rolls', category: 'extras', price: 4.50, description: 'Fresh cinnamon rolls with cream cheese frosting', emoji: '🥐', tags: ['popular'], available: true, voice_recorded: false, voice_text: '' },
            { id: 11, name: 'Brownies (6 pack)', category: 'cookies', price: 12.00, description: 'Fudgy chocolate brownies', emoji: '🍫', tags: [], available: true, voice_recorded: false, voice_text: '' }
        ],

        customers: [
            { id: 1, name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+12515551001', tier: 'gold', points: 1250, lifetime_spent: 2450, join_date: '2025-01-15' },
            { id: 2, name: 'Mike Davis', email: 'mike@email.com', phone: '+12515551002', tier: 'gold', points: 890, lifetime_spent: 1840, join_date: '2025-02-03' },
            { id: 3, name: 'Jennifer Smith', email: 'jennifer@email.com', phone: '+12515551003', tier: 'silver', points: 520, lifetime_spent: 980, join_date: '2025-01-22' },
            { id: 4, name: 'Tom Wilson', email: 'tom@email.com', phone: '+12515551004', tier: 'silver', points: 450, lifetime_spent: 765, join_date: '2024-12-10' },
            { id: 5, name: 'Emily Brown', email: 'emily@email.com', phone: '+12515551005', tier: 'bronze', points: 180, lifetime_spent: 320, join_date: '2026-02-08' },
            { id: 6, name: 'David Lee', email: 'david@email.com', phone: '+12515551006', tier: 'bronze', points: 95, lifetime_spent: 145, join_date: '2026-02-12' }
        ],

        bookings: [
            { id: 1, customer_id: 1, service: 'Custom Birthday Cake Consultation', date: '2026-02-17', time: '10:00 AM', duration: 30, status: 'confirmed', price: 75.00, people: 1, notes: '' },
            { id: 2, customer_id: 2, service: 'Catering Tasting', date: '2026-02-17', time: '2:00 PM', duration: 60, status: 'confirmed', price: 150.00, people: 2, notes: 'Wedding cake tasting' },
            { id: 3, customer_id: 3, service: 'Cookie Decorating Class', date: '2026-02-17', time: '4:00 PM', duration: 90, status: 'pending', price: 45.00, people: 6, notes: 'Birthday party for kids' },
            { id: 4, customer_id: 5, service: 'Custom Birthday Cake Consultation', date: '2026-02-18', time: '11:00 AM', duration: 30, status: 'confirmed', price: 75.00, people: 1, notes: '' },
            { id: 5, customer_id: 4, service: 'Cupcake Pickup', date: '2026-02-18', time: '3:00 PM', duration: 15, status: 'confirmed', price: 39.24, people: 1, notes: '1 dozen assorted' }
        ],

        orders: [
            { id: 1001, customer_id: 1, items: [{ menu_id: 3, qty: 2 }, { menu_id: 9, qty: 1 }], total: 96.48, status: 'pending', type: 'pickup', created_at: '2026-02-17T14:55:00', pickup_time: '2026-02-17T15:30:00' },
            { id: 1002, customer_id: 2, items: [{ menu_id: 6, qty: 1 }], total: 75.00, status: 'preparing', type: 'pickup', created_at: '2026-02-17T14:48:00', pickup_time: '2026-02-17T16:00:00' },
            { id: 1003, customer_id: 3, items: [{ menu_id: 2, qty: 1 }, { menu_id: 4, qty: 6 }], total: 34.62, status: 'ready', type: 'pickup', created_at: '2026-02-17T14:35:00', pickup_time: '2026-02-17T15:00:00' },
            { id: 1004, customer_id: 4, items: [{ menu_id: 11, qty: 1 }, { menu_id: 10, qty: 2 }], total: 21.00, status: 'completed', type: 'pickup', created_at: '2026-02-17T13:00:00', pickup_time: '2026-02-17T13:30:00' }
        ],

        sms_templates: {
            booking_confirmation: {
                enabled: true,
                template: "Hi {customer_name}! Your {service} at {business_name} is confirmed for {date} at {time}. Reply CHANGE to reschedule.",
                sent_count: 127
            },
            day_of_reminder: {
                enabled: true,
                template: "Reminder: Your {service} is today at {time}! We look forward to seeing you at {business_name}. Reply HELP for directions.",
                sent_count: 98
            },
            day_after_review: {
                enabled: true,
                template: "Hi {customer_name}! How was your {service} yesterday? We'd love your feedback: {review_link}",
                sent_count: 85
            },
            digital_receipt: {
                enabled: true,
                template: "Receipt from {business_name}\n{items}\nTotal: {total}\nThank you, {customer_name}!",
                sent_count: 234
            }
        },

        ai_training: {
            business_type: 'restaurant',
            completion: 65,
            answers: [
                { category: 'basics', question: 'Tell me about your business', answer: "We're a family-owned bakery in Gulf Shores specializing in cupcakes, custom cakes, and fresh-baked cookies. Everything is made from scratch daily with high-quality ingredients.", completed: true },
                { category: 'basics', question: 'What is your business known for?', answer: 'Our cupcakes are our signature item. The red velvet with cream cheese frosting is the most popular. We also do amazing custom birthday and wedding cakes.', completed: true },
                { category: 'products', question: 'What are your most popular items?', answer: 'Individual cupcakes, dozen cupcakes for parties, custom birthday cakes, and our chocolate chip cookies.', completed: true },
                { category: 'products', question: 'Do you offer dietary accommodations?', answer: 'Yes! We have vegan cupcake options and can do gluten-free cookies. Just ask when ordering.', completed: true },
                { category: 'policies', question: 'What is your refund policy?', answer: '', completed: false },
                { category: 'policies', question: 'How far in advance do custom cakes need to be ordered?', answer: '', completed: false },
                { category: 'faqs', question: 'Do you deliver?', answer: '', completed: false },
                { category: 'personality', question: 'How should the AI greet customers?', answer: '', completed: false }
            ]
        },

        biopage: {
            accent_color: '#667eea',
            about_text: "We're a family-owned bakery in Gulf Shores specializing in cupcakes, custom cakes, and fresh-baked cookies. Everything is made from scratch daily with high-quality ingredients.",
            team_members: [],
            gallery_photos: [
                { id: 1, emoji: '🧁', caption: 'Our signature cupcakes' },
                { id: 2, emoji: '🎂', caption: 'Custom birthday cake' },
                { id: 3, emoji: '🍪', caption: 'Fresh cookies daily' },
                { id: 4, emoji: '🥐', caption: 'Cinnamon rolls' },
                { id: 5, emoji: '☕', caption: 'Fresh brewed coffee' },
                { id: 6, emoji: '🍫', caption: 'Fudgy brownies' }
            ],
            custom_links: {},
            social_feed_settings: {
                instagram: { show_feed: true, display: 'grid', count: 6 },
                facebook: { show_feed: true, display: 'list', count: 3 },
                google: { show_feed: true, display: 'list', count: 6 },
                tiktok: { show_feed: false, display: 'grid', count: 3 }
            },
            links: [
                { id: 'about', label: 'About Us', icon: 'ℹ️', enabled: true, type: 'modal' },
                { id: 'menu', label: 'View Menu', icon: '📋', enabled: true, type: 'app', app: 'menu' },
                { id: 'order', label: 'Order Online', icon: '🛒', enabled: true, type: 'app', app: 'ordering' },
                { id: 'booking', label: 'Book Appointment', icon: '📅', enabled: true, type: 'app', app: 'booking' },
                { id: 'photos', label: 'View Photos', icon: '📸', enabled: true, type: 'modal' },
                { id: 'call', label: 'Call Now', icon: '📞', enabled: true, type: 'tel' },
                { id: 'directions', label: 'Get Directions', icon: '🗺️', enabled: true, type: 'maps' },
                { id: 'website', label: 'Visit Website', icon: '🌐', enabled: true, type: 'url' },
                { id: 'loyalty', label: 'Loyalty Rewards', icon: '⭐', enabled: false, type: 'app', app: 'loyalty' }
            ]
        },

        social_posts: [
            { id: 1, text: "New Valentine's cupcakes are here! Red velvet with cream cheese hearts. Order yours before they're gone! Link in bio.", platforms: ['instagram', 'facebook'], scheduled_at: '2026-02-17T17:00:00', status: 'scheduled', image: '🧁' },
            { id: 2, text: 'Weekend special: Order a dozen cupcakes, get 2 free! Use code SWEET12 at checkout.', platforms: ['instagram', 'facebook', 'google_business'], scheduled_at: '2026-02-18T10:00:00', status: 'scheduled', image: '🎂' },
            { id: 3, text: 'Fresh batch of chocolate chip cookies coming out of the oven!', platforms: ['instagram', 'facebook'], scheduled_at: '2026-02-16T14:00:00', status: 'posted', image: '🍪' }
        ]
    };

    // Load from localStorage or use defaults
    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('CyberCheck: Could not load stored data, using defaults');
        }
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    // Save to localStorage
    function save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('CyberCheck: Could not save data');
        }
        // Notify all iframes that data changed
        broadcast('data_updated');
    }

    // Broadcast message to all iframes
    function broadcast(type, payload) {
        const frames = document.querySelectorAll('iframe');
        frames.forEach(frame => {
            try {
                frame.contentWindow.postMessage({ type: type, payload: payload }, '*');
            } catch (e) {}
        });
    }

    let _data = load();

    return {
        // Get any data path: CyberCheck.get('business.name') or CyberCheck.get('menu_items')
        get: function(path) {
            if (!path) return _data;
            const keys = path.split('.');
            let val = _data;
            for (const key of keys) {
                if (val === undefined || val === null) return undefined;
                val = val[key];
            }
            return val;
        },

        // Set any data path: CyberCheck.set('business.name', 'New Name')
        set: function(path, value) {
            const keys = path.split('.');
            let obj = _data;
            for (let i = 0; i < keys.length - 1; i++) {
                if (obj[keys[i]] === undefined) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
            save(_data);
            return value;
        },

        // Get full data object
        getAll: function() {
            return _data;
        },

        // Menu helpers
        getMenuItems: function(category) {
            if (category && category !== 'all') {
                return _data.menu_items.filter(i => i.category === category);
            }
            return _data.menu_items;
        },

        addMenuItem: function(item) {
            item.id = Math.max(..._data.menu_items.map(i => i.id), 0) + 1;
            _data.menu_items.push(item);
            save(_data);
            return item;
        },

        updateMenuItem: function(id, updates) {
            const idx = _data.menu_items.findIndex(i => i.id === id);
            if (idx !== -1) {
                Object.assign(_data.menu_items[idx], updates);
                save(_data);
            }
        },

        deleteMenuItem: function(id) {
            _data.menu_items = _data.menu_items.filter(i => i.id !== id);
            save(_data);
        },

        // Customer helpers
        getCustomer: function(id) {
            return _data.customers.find(c => c.id === id);
        },

        getCustomersByTier: function(tier) {
            return _data.customers.filter(c => c.tier === tier);
        },

        // Booking helpers
        getBookingsForDate: function(date) {
            return _data.bookings.filter(b => b.date === date);
        },

        addBooking: function(booking) {
            booking.id = Math.max(..._data.bookings.map(b => b.id), 0) + 1;
            _data.bookings.push(booking);
            save(_data);
            return booking;
        },

        // Order helpers
        getOrdersByStatus: function(status) {
            if (status === 'all') return _data.orders;
            return _data.orders.filter(o => o.status === status);
        },

        addOrder: function(order) {
            order.id = Math.max(..._data.orders.map(o => o.id), 0) + 1;
            _data.orders.push(order);
            save(_data);
            return order;
        },

        updateOrderStatus: function(id, status) {
            const order = _data.orders.find(o => o.id === id);
            if (order) {
                order.status = status;
                save(_data);
            }
        },

        // SMS template helpers
        getSMSTemplate: function(type) {
            return _data.sms_templates[type];
        },

        updateSMSTemplate: function(type, template) {
            _data.sms_templates[type] = template;
            save(_data);
        },

        // AI training helpers
        getTrainingAnswers: function(category) {
            if (category) {
                return _data.ai_training.answers.filter(a => a.category === category);
            }
            return _data.ai_training.answers;
        },

        saveTrainingAnswer: function(question, answer) {
            const item = _data.ai_training.answers.find(a => a.question === question);
            if (item) {
                item.answer = answer;
                item.completed = true;
            }
            // Recalculate completion
            const total = _data.ai_training.answers.length;
            const done = _data.ai_training.answers.filter(a => a.completed).length;
            _data.ai_training.completion = Math.round((done / total) * 100);
            save(_data);
        },

        // Bio page helpers
        getBioLinks: function() {
            return _data.biopage.links.filter(l => l.enabled);
        },

        toggleBioLink: function(id, enabled) {
            const link = _data.biopage.links.find(l => l.id === id);
            if (link) {
                link.enabled = enabled;
                save(_data);
            }
        },

        // App helpers
        isAppInstalled: function(appId) {
            return _data.installed_apps.includes(appId);
        },

        isToolConnected: function(toolId) {
            return _data.connected_tools[toolId]?.connected || false;
        },

        // Reset to defaults
        reset: function() {
            _data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            save(_data);
            broadcast('data_reset');
        },

        // For iframes to get data from parent
        _broadcast: broadcast
    };
})();

// Helper for iframe apps to access shared data
// They call: const data = getCyberCheck()
function getCyberCheck() {
    if (window.CyberCheck) return window.CyberCheck;
    if (window.parent && window.parent.CyberCheck) return window.parent.CyberCheck;
    console.warn('CyberCheck shared data not available');
    return null;
}
