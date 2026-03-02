// ============================================
// cc.js — CyberCheck API Client
// ============================================
//
// Thin wrapper around fetch() that talks to the Express backend.
// Every dashboard module calls cc.get/post/put/delete instead of
// hitting Supabase directly or using hardcoded data.
//
// If the API is unreachable (backend not running), returns null
// so modules can fall back to their existing hardcoded data.
//

const CC = (function() {
  const API_BASE = window.CC_API_BASE || 'http://localhost:3000';
  let _token = null;
  let _session = null;

  // ---- Auth Token Management ----

  function getToken() {
    if (_token) return _token;
    // Check URL param (for admin impersonation)
    const params = new URLSearchParams(window.location.search);
    const impersonate = params.get('impersonate');
    if (impersonate) {
      _token = impersonate;
      sessionStorage.setItem('cc_token', impersonate);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      return _token;
    }
    // Check storage
    _token = localStorage.getItem('cc_token') || sessionStorage.getItem('cc_token');
    return _token;
  }

  function setToken(token, remember) {
    _token = token;
    if (remember) {
      localStorage.setItem('cc_token', token);
    } else {
      sessionStorage.setItem('cc_token', token);
    }
  }

  function clearToken() {
    _token = null;
    _session = null;
    localStorage.removeItem('cc_token');
    sessionStorage.removeItem('cc_token');
  }

  // ---- Core Fetch ----

  async function request(method, path, body) {
    const token = getToken();
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      if (res.status === 401) {
        clearToken();
        window.location.href = 'login.html';
        return null;
      }
      const data = await res.json();
      if (!res.ok) {
        console.warn(`CC API ${method} ${path}:`, data.error || res.statusText);
        return null;
      }
      return data;
    } catch (e) {
      // API unreachable — backend not running
      console.warn(`CC API unreachable (${method} ${path}):`, e.message);
      return null;
    }
  }

  // ---- Convenience Methods ----

  function get(path)       { return request('GET', path); }
  function post(path, body) { return request('POST', path, body); }
  function put(path, body)  { return request('PUT', path, body); }
  function del(path)        { return request('DELETE', path); }

  // ---- Auth ----

  async function login(email, password, remember) {
    const data = await post('/api/auth/login', { email, password });
    if (data && data.token) {
      setToken(data.token, remember);
      _session = data;
    }
    return data;
  }

  async function signup(payload) {
    // payload: { businessName, businessType, name, email, password }
    const data = await post('/api/auth/signup', payload);
    if (data && data.token) {
      setToken(data.token, true);
      _session = data;
    }
    return data;
  }

  async function logout() {
    await post('/api/auth/logout', {}).catch(() => {});
    clearToken();
    window.location.href = 'login.html';
  }

  async function getSession() {
    if (_session) return _session;
    const data = await get('/api/auth/session');
    if (data) _session = data;
    return data;
  }

  // ---- Dashboard API Shortcuts ----
  // These map 1:1 to the /api/dashboard/* routes

  const dashboard = {
    // Profile & Content
    getProfile:     () => get('/api/dashboard/profile'),
    updateProfile:  (d) => put('/api/dashboard/profile', d),
    getHours:       () => get('/api/dashboard/hours'),
    updateHours:    (d) => put('/api/dashboard/hours', d),

    // Services
    getServices:    () => get('/api/dashboard/services'),
    createService:  (d) => post('/api/dashboard/services', d),
    updateService:  (id, d) => put(`/api/dashboard/services/${id}`, d),
    deleteService:  (id) => del(`/api/dashboard/services/${id}`),

    // Gallery / Media
    getGallery:     () => get('/api/dashboard/gallery'),
    uploadMedia:    (d) => post('/api/dashboard/gallery', d),
    deleteMedia:    (id) => del(`/api/dashboard/gallery/${id}`),

    // FAQs
    getFaqs:        () => get('/api/dashboard/faqs'),
    createFaq:      (d) => post('/api/dashboard/faqs', d),
    updateFaq:      (id, d) => put(`/api/dashboard/faqs/${id}`, d),
    deleteFaq:      (id) => del(`/api/dashboard/faqs/${id}`),

    // Social Links
    getSocial:      () => get('/api/dashboard/social'),
    updateSocial:   (d) => put('/api/dashboard/social', d),

    // Staff
    getStaff:       () => get('/api/dashboard/staff'),
    createStaff:    (d) => post('/api/dashboard/staff', d),
    updateStaff:    (id, d) => put(`/api/dashboard/staff/${id}`, d),
    deleteStaff:    (id) => del(`/api/dashboard/staff/${id}`),

    // Menu Items
    getMenu:        () => get('/api/dashboard/menu'),
    createMenuItem: (d) => post('/api/dashboard/menu', d),
    updateMenuItem: (id, d) => put(`/api/dashboard/menu/${id}`, d),
    deleteMenuItem: (id) => del(`/api/dashboard/menu/${id}`),

    // Fleet (rentals)
    getFleetTypes:  () => get('/api/dashboard/fleet-types'),
    createFleetType:(d) => post('/api/dashboard/fleet-types', d),
    updateFleetType:(id, d) => put(`/api/dashboard/fleet-types/${id}`, d),
    deleteFleetType:(id) => del(`/api/dashboard/fleet-types/${id}`),
    getFleetItems:  () => get('/api/dashboard/fleet-items'),
    createFleetItem:(d) => post('/api/dashboard/fleet-items', d),
    updateFleetItem:(id, d) => put(`/api/dashboard/fleet-items/${id}`, d),
    deleteFleetItem:(id) => del(`/api/dashboard/fleet-items/${id}`),

    // Time Slots
    getTimeSlots:   () => get('/api/dashboard/time-slots'),
    createTimeSlot: (d) => post('/api/dashboard/time-slots', d),
    updateTimeSlot: (id, d) => put(`/api/dashboard/time-slots/${id}`, d),
    deleteTimeSlot: (id) => del(`/api/dashboard/time-slots/${id}`),

    // Pricing
    getPricing:     () => get('/api/dashboard/pricing'),
    setPricing:     (d) => post('/api/dashboard/pricing', d),

    // Addons
    getAddons:      () => get('/api/dashboard/addons'),
    createAddon:    (d) => post('/api/dashboard/addons', d),
    updateAddon:    (id, d) => put(`/api/dashboard/addons/${id}`, d),
    deleteAddon:    (id) => del(`/api/dashboard/addons/${id}`),

    // Bookings
    getBookings:    (params) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get(`/api/dashboard/bookings${qs}`);
    },
    createBooking:  (d) => post('/api/dashboard/bookings', d),
    updateBooking:  (id, d) => put(`/api/dashboard/bookings/${id}`, d),
    deleteBooking:  (id) => del(`/api/dashboard/bookings/${id}`),

    // Orders
    getOrders:      (params) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get(`/api/dashboard/orders${qs}`);
    },
    updateOrder:    (id, d) => put(`/api/dashboard/orders/${id}`, d),

    // Customers
    getCustomers:   (params) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get(`/api/dashboard/customers${qs}`);
    },
    getCustomer:    (id) => get(`/api/dashboard/customers/${id}`),
    createCustomer: (d) => post('/api/dashboard/customers', d),
    updateCustomer: (id, d) => put(`/api/dashboard/customers/${id}`, d),

    // Reviews
    getReviews:     () => get('/api/dashboard/reviews'),
    updateReview:   (id, d) => put(`/api/dashboard/reviews/${id}`, d),

    // Waivers
    getWaivers:     () => get('/api/dashboard/waivers'),

    // Coupons
    getCoupons:     () => get('/api/dashboard/coupons'),
    createCoupon:   (d) => post('/api/dashboard/coupons', d),
    updateCoupon:   (id, d) => put(`/api/dashboard/coupons/${id}`, d),
    deleteCoupon:   (id) => del(`/api/dashboard/coupons/${id}`),

    // Specials
    getSpecials:    () => get('/api/dashboard/specials'),
    createSpecial:  (d) => post('/api/dashboard/specials', d),
    updateSpecial:  (id, d) => put(`/api/dashboard/specials/${id}`, d),
    deleteSpecial:  (id) => del(`/api/dashboard/specials/${id}`),

    // Connections (OAuth)
    getConnections: () => get('/api/dashboard/connections'),
    connect:        (d) => post('/api/dashboard/connections', d),
    disconnect:     (id) => del(`/api/dashboard/connections/${id}`),

    // Pages
    getPages:       () => get('/api/dashboard/pages'),
    createPage:     (d) => post('/api/dashboard/pages', d),
    updatePage:     (id, d) => put(`/api/dashboard/pages/${id}`, d),
    deletePage:     (id) => del(`/api/dashboard/pages/${id}`),

    // Theme
    getTheme:       () => get('/api/dashboard/theme'),
    updateTheme:    (d) => put('/api/dashboard/theme', d),

    // SEO
    getSeo:         () => get('/api/dashboard/seo'),
    updateSeo:      (d) => put('/api/dashboard/seo', d),

    // Domain
    getDomain:      () => get('/api/dashboard/domain'),
    updateDomain:   (d) => put('/api/dashboard/domain', d),

    // Billing
    getBilling:     () => get('/api/dashboard/billing'),

    // Apps
    getApps:        () => get('/api/dashboard/apps'),
    installApp:     (d) => post('/api/dashboard/apps/install', d),
    uninstallApp:   (d) => post('/api/dashboard/apps/uninstall', d),

    // Notifications
    getNotifications: () => get('/api/dashboard/notifications'),
    markAllRead:    () => put('/api/dashboard/notifications/read-all', {}),

    // SMS Log
    getSmsLog:      () => get('/api/dashboard/sms-log'),

    // Activity
    getActivity:    () => get('/api/dashboard/activity'),

    // Availability
    getAvailability:(date) => get(`/api/dashboard/availability?date=${date}`),

    // Publish
    publish:        () => post('/api/dashboard/publish', {}),

    // Export
    exportData:     () => get('/api/dashboard/export')
  };

  // ---- Public API ----

  return {
    get, post, put, del,
    login, signup, logout, getSession,
    getToken, setToken, clearToken,
    dashboard,
    API_BASE
  };
})();
