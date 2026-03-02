// CyberCheck Dashboard - User Configuration
// This file controls which apps appear in the dashboard for this user
// For V1: Manually edit this file per user
// For V2: This will be loaded from backend API

const USER_CONFIG = {
    // User info
    user_id: 'user_demo_001',
    user_name: 'Maggie Thompson',
    user_email: 'maggie@maggiesbakery.com',

    // Business info
    business_id: 'maggie-bakery',
    business_name: "Maggie's Cakes and More",
    business_type: 'restaurant', // restaurant, salon, fitness, services, retail, etc.

    // Installed apps (determines which tabs appear in dashboard)
    // Available apps: booking, menu, sms, loyalty, analytics, social, ordering
    installed_apps: [
        'booking',    // Booking/Calendar app
        'menu',       // QR Menu Pro app
        'sms',        // SMS Marketing app
        'loyalty'     // Loyalty Rewards app
    ],

    // Connected OAuth tools (for OAuth Connections tab)
    connected_tools: [
        'stripe',
        'square',
        'google-calendar',
        'gmail',
        'instagram',
        'twilio'
    ],

    // Subscription plan
    plan: 'professional', // starter, professional, enterprise
    plan_price: 49.99,

    // Feature flags (what features user has access to)
    features: {
        voice_ai: true,
        workflows: true,
        landing_page: true,
        custom_domain: true,
        white_label: false,
        api_access: true,
        webhooks: true
    },

    // Notification settings
    notifications: {
        email: true,
        sms: false,
        in_app: true
    }
};

// Example configs for different business types:

/*
// Restaurant Example (Maggie's Bakery)
const USER_CONFIG = {
    business_name: "Maggie's Bakery",
    business_type: 'restaurant',
    installed_apps: ['menu', 'ordering', 'sms', 'loyalty'],
    connected_tools: ['stripe', 'square', 'instagram', 'twilio']
};

// Fishing Charter Example
const USER_CONFIG = {
    business_name: "Captain Joe's Charters",
    business_type: 'services',
    installed_apps: ['booking', 'sms', 'loyalty'],
    connected_tools: ['stripe', 'google-calendar', 'twilio']
};

// Hair Salon Example
const USER_CONFIG = {
    business_name: "Bella's Hair Studio",
    business_type: 'salon',
    installed_apps: ['booking', 'sms', 'loyalty', 'social'],
    connected_tools: ['stripe', 'square', 'google-calendar', 'instagram', 'facebook']
};

// Fitness Studio Example
const USER_CONFIG = {
    business_name: "PowerFit Gym",
    business_type: 'fitness',
    installed_apps: ['booking', 'sms', 'loyalty', 'analytics'],
    connected_tools: ['stripe', 'google-calendar', 'mailchimp', 'instagram']
};

// Retail Store Example
const USER_CONFIG = {
    business_name: "Green Leaf Market",
    business_type: 'retail',
    installed_apps: ['menu', 'ordering', 'loyalty', 'analytics', 'social'],
    connected_tools: ['shopify', 'stripe', 'instagram', 'facebook', 'mailchimp']
};
*/
