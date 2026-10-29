export const MODULE_KEYS = [
  "quick_actions", "catalog", "menu", "specials", "events", "booking",
  "shop", "reviews", "lead_forms", "gallery", "sms_opt_in", "analytics",
  "live_session", "tips", "content_wall", "loyalty", "ai_media", "team"
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const moduleRegistry: Record<ModuleKey, { name: string; description: string }> = {
  quick_actions: { name: "Quick actions", description: "Call, text, directions, booking, or custom actions." },
  catalog: { name: "Catalog", description: "Universal cards for services, listings, products, and packages." },
  menu: { name: "Menu", description: "Restaurant categories, menu items, dietary fields, and modifiers." },
  specials: { name: "Specials & happy hour", description: "Time-bound pricing and promotions." },
  events: { name: "Events", description: "Shows, open houses, recurring schedules, and RSVPs." },
  booking: { name: "Booking", description: "Services, availability, booking requests, and source links." },
  shop: { name: "Shop", description: "Products, variants, inventory, carts, orders, pickup, and shipping." },
  reviews: { name: "Reviews", description: "Verified review requests, moderation, and public reviews." },
  lead_forms: { name: "Lead forms", description: "Contact, quote, catering, valuation, and booking inquiries." },
  gallery: { name: "Gallery", description: "Photos, videos, embeds, and captions." },
  sms_opt_in: { name: "SMS opt-in", description: "Consent-aware text-message signup." },
  analytics: { name: "Analytics", description: "Views, scans, clicks, submissions, and conversion events." },
  live_session: { name: "Live session", description: "QR event rooms, requests, queues, and voting." },
  tips: { name: "Tips", description: "Tips and payout records through Stripe Connect." },
  content_wall: { name: "Content wall", description: "Posts, member-only content, and subscriptions." },
  loyalty: { name: "Loyalty", description: "Points, rewards, and cross-business Trip Pass participation." },
  ai_media: { name: "AI media", description: "Credit-metered marketing asset generation." },
  team: { name: "Team", description: "Multiple profiles, staff roles, and shared management." }
};
