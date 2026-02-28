// ============================================
// cc.js — CyberCheck API Client (Supabase Direct)
// ============================================
//
// Same CC.dashboard.* API surface as before, but queries
// Supabase directly instead of going through Express.
// Modules call CC.dashboard.getBookings() etc. — no changes needed.
//
// Requires: supabase-client.js loaded first (provides supabase, getSiteId, etc.)
//

const CC = (function() {

  // ---- Token / Session Management ----
  // Kept for backwards compat with auth guard + modules that check CC.getToken()

  function getToken() {
    // Check Supabase session first
    var sbToken = localStorage.getItem('sb-mhafixflyffflwjhcgfn-auth-token');
    if (sbToken) return 'supabase';
    // Fallback to legacy token
    return localStorage.getItem('cc_token') || sessionStorage.getItem('cc_token') || null;
  }

  function setToken(token, remember) {
    if (remember) {
      localStorage.setItem('cc_token', token);
    } else {
      sessionStorage.setItem('cc_token', token);
    }
  }

  function clearToken() {
    localStorage.removeItem('cc_token');
    sessionStorage.removeItem('cc_token');
    if (typeof clearSupabaseCache === 'function') clearSupabaseCache();
  }

  // ---- Auth (Supabase Auth) ----

  async function login(email, password, remember) {
    if (!supabase) return null;
    var { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (error) return { error: error.message };
    if (data && data.session) {
      // Resolve business + site_id
      await getSupabaseBusiness();
      return { token: data.session.access_token, user: data.user };
    }
    return null;
  }

  async function signup(payload) {
    if (!supabase) return null;
    var { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password
    });
    if (error) return { error: error.message };

    // After signup, create business + user records
    if (data && data.user) {
      // Create business
      var { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          name: payload.businessName || payload.name,
          type: payload.businessType || 'rental',
          subdomain: (payload.businessName || 'my-business').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          plan: 'free',
          status: 'setup'
        })
        .select()
        .single();

      if (bizErr) return { error: bizErr.message };

      // Create user record linking auth to business
      await supabase
        .from('users')
        .insert({
          auth_id: data.user.id,
          site_id: biz.site_id,
          email: payload.email,
          name: payload.name || payload.businessName,
          role: 'owner'
        });

      // Create empty site_content record
      await supabase
        .from('site_content')
        .insert({ site_id: biz.site_id });

      return { token: data.session ? data.session.access_token : null, user: data.user, business: biz };
    }
    return null;
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    clearToken();
    window.location.href = 'login.html';
  }

  async function getSession() {
    var session = await getSupabaseSession();
    if (!session) return null;
    var biz = await getSupabaseBusiness();
    return { user: session.user, business: biz };
  }

  // ---- Legacy fetch (for any remaining Express calls) ----

  var API_BASE = window.CC_API_BASE || 'http://localhost:3000';

  async function request(method, path, body) {
    try {
      var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
      var token = getToken();
      if (token && token !== 'supabase') opts.headers['Authorization'] = 'Bearer ' + token;
      if (body && method !== 'GET') opts.body = JSON.stringify(body);
      var res = await fetch(API_BASE + path, opts);
      if (!res.ok) return null;
      return await res.json();
    } catch(e) { return null; }
  }

  function get(path) { return request('GET', path); }
  function post(path, body) { return request('POST', path, body); }
  function put(path, body) { return request('PUT', path, body); }
  function del(path) { return request('DELETE', path); }

  // ---- Helper: ensure site_id is resolved ----

  async function ensureSiteId() {
    if (_siteId) return _siteId;
    await getSupabaseBusiness();
    return _siteId;
  }

  // ---- Dashboard API (Supabase Direct) ----
  // Each method replicates the exact query from backend/routes/dashboard.js

  var dashboard = {

    // --- Profile & Content ---
    getProfile: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data: business } = await supabase.from('businesses').select('*').eq('site_id', siteId).single();
      var { data: content } = await supabase.from('site_content').select('*').eq('site_id', siteId).single();
      return { business: business, content: content };
    },
    updateProfile: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      if (d.business) {
        var biz = d.business;
        await supabase.from('businesses').update({ name: biz.name, type: biz.type, logo_url: biz.logo_url, cover_url: biz.cover_url, updated_at: new Date().toISOString() }).eq('site_id', siteId);
      }
      if (d.content) {
        var c = Object.assign({}, d.content); delete c.site_id;
        c.updated_at = new Date().toISOString();
        await supabase.from('site_content').upsert(Object.assign({ site_id: siteId }, c)).select();
      }
      var { data: business } = await supabase.from('businesses').select('*').eq('site_id', siteId).single();
      var { data: content } = await supabase.from('site_content').select('*').eq('site_id', siteId).single();
      return { business: business, content: content };
    },

    // --- Hours ---
    getHours: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return {};
      var { data } = await supabase.from('site_content').select('hours').eq('site_id', siteId).single();
      return (data && data.hours) || {};
    },
    updateHours: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('site_content').update({ hours: d.hours || d, updated_at: new Date().toISOString() }).eq('site_id', siteId).select('hours').single();
      return data ? data.hours : {};
    },

    // --- Services ---
    getServices: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('services').select('*').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createService: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('services').insert(obj).select().single();
      return data;
    },
    updateService: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('services').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteService: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('services').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Gallery / Media ---
    getGallery: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('media').select('*').eq('site_id', siteId).order('uploaded_at', { ascending: false });
      return data || [];
    },
    uploadMedia: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('media').insert({ site_id: siteId, url: d.url, filename: d.filename, alt_text: d.alt_text, file_size: d.file_size, file_type: d.file_type || 'image', folder: d.folder || 'gallery' }).select().single();
      return data;
    },
    deleteMedia: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('media').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- FAQs ---
    getFaqs: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('faqs').select('*').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createFaq: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('faqs').insert(obj).select().single();
      return data;
    },
    updateFaq: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('faqs').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteFaq: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('faqs').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Social Links ---
    getSocial: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return {};
      var { data } = await supabase.from('site_content').select('social_links').eq('site_id', siteId).single();
      return (data && data.social_links) || {};
    },
    updateSocial: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('site_content').update({ social_links: d, updated_at: new Date().toISOString() }).eq('site_id', siteId).select('social_links').single();
      return data ? data.social_links : {};
    },

    // --- Staff ---
    getStaff: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('staff').select('*').eq('site_id', siteId).order('created_at', { ascending: true });
      return data || [];
    },
    createStaff: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('staff').insert(obj).select().single();
      return data;
    },
    updateStaff: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('staff').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteStaff: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('staff').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Menu Items ---
    getMenu: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('menu_items').select('*').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createMenuItem: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('menu_items').insert(obj).select().single();
      return data;
    },
    updateMenuItem: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('menu_items').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteMenuItem: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('menu_items').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Fleet Types (rentals) ---
    getFleetTypes: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('fleet_types').select('*, fleet_items(id, unit_name, serial_number, condition)').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createFleetType: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id; delete obj.fleet_items;
      var { data } = await supabase.from('fleet_types').insert(obj).select().single();
      return data;
    },
    updateFleetType: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id; delete obj.fleet_items;
      var { data } = await supabase.from('fleet_types').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteFleetType: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('fleet_types').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Fleet Items ---
    getFleetItems: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('fleet_items').select('*, fleet_types(name)').eq('site_id', siteId);
      return data || [];
    },
    createFleetItem: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('fleet_items').insert(obj).select().single();
      return data;
    },
    updateFleetItem: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('fleet_items').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteFleetItem: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('fleet_items').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Time Slots ---
    getTimeSlots: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('rental_time_slots').select('*').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createTimeSlot: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('rental_time_slots').insert(obj).select().single();
      return data;
    },
    updateTimeSlot: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('rental_time_slots').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteTimeSlot: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('rental_time_slots').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Pricing ---
    getPricing: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('rental_pricing').select('*, fleet_types(name), rental_time_slots(name)').eq('site_id', siteId);
      return data || [];
    },
    setPricing: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('rental_pricing').upsert(obj).select().single();
      return data;
    },

    // --- Addons ---
    getAddons: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('rental_addons').select('*').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createAddon: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('rental_addons').insert(obj).select().single();
      return data;
    },
    updateAddon: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('rental_addons').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteAddon: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('rental_addons').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Bookings ---
    getBookings: async function(params) {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var query = supabase.from('bookings').select('*').eq('site_id', siteId).order('booking_date', { ascending: true });
      if (params) {
        if (params.status) query = query.eq('status', params.status);
        if (params.date) query = query.eq('booking_date', params.date);
        if (params.from) query = query.gte('booking_date', params.from);
        if (params.to) query = query.lte('booking_date', params.to);
      }
      var { data } = await query;
      return data || [];
    },
    createBooking: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('bookings').insert(obj).select().single();
      return data;
    },
    updateBooking: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('bookings').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteBooking: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('bookings').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Orders ---
    getOrders: async function(params) {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var query = supabase.from('orders').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
      if (params && params.status) query = query.eq('status', params.status);
      var { data } = await query;
      return data || [];
    },
    updateOrder: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('orders').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },

    // --- Customers ---
    getCustomers: async function(params) {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var query = supabase.from('customers').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
      if (params && params.search) {
        query = query.or('name.ilike.%' + params.search + '%,email.ilike.%' + params.search + '%,phone.ilike.%' + params.search + '%');
      }
      var { data } = await query;
      return data || [];
    },
    getCustomer: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('customers').select('*').eq('id', id).eq('site_id', siteId).single();
      return data;
    },
    createCustomer: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('customers').insert(obj).select().single();
      return data;
    },
    updateCustomer: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('customers').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },

    // --- Reviews ---
    getReviews: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('reviews').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
      return data || [];
    },
    updateReview: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('reviews').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },

    // --- Waivers ---
    getWaivers: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('waivers').select('*').eq('site_id', siteId).order('signed_at', { ascending: false });
      return data || [];
    },

    // --- Coupons ---
    getCoupons: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('coupons').select('*').eq('site_id', siteId).order('created_at', { ascending: false });
      return data || [];
    },
    createCoupon: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('coupons').insert(obj).select().single();
      return data;
    },
    updateCoupon: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('coupons').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteCoupon: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('coupons').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Specials ---
    getSpecials: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('specials').select('*').eq('site_id', siteId);
      return data || [];
    },
    createSpecial: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('specials').insert(obj).select().single();
      return data;
    },
    updateSpecial: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('specials').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deleteSpecial: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('specials').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Connections (OAuth) ---
    getConnections: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('connections').select('id, provider, account_name, status, connected_at').eq('site_id', siteId);
      return data || [];
    },
    connect: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId });
      var { data } = await supabase.from('connections').upsert(obj).select().single();
      return data;
    },
    disconnect: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('connections').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Pages ---
    getPages: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('site_pages').select('*').eq('site_id', siteId).order('sort_order', { ascending: true });
      return data || [];
    },
    createPage: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { site_id: siteId }); delete obj.id;
      var { data } = await supabase.from('site_pages').insert(obj).select().single();
      return data;
    },
    updatePage: async function(id, d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var obj = Object.assign({}, d, { updated_at: new Date().toISOString() }); delete obj.site_id; delete obj.id;
      var { data } = await supabase.from('site_pages').update(obj).eq('id', id).eq('site_id', siteId).select().single();
      return data;
    },
    deletePage: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('site_pages').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    // --- Theme ---
    getTheme: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return {};
      var { data } = await supabase.from('site_content').select('theme_color, theme_font, custom_css').eq('site_id', siteId).single();
      return data || {};
    },
    updateTheme: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('site_content').update({ theme_color: d.theme_color, theme_font: d.theme_font, custom_css: d.custom_css, updated_at: new Date().toISOString() }).eq('site_id', siteId).select('theme_color, theme_font, custom_css').single();
      return data;
    },

    // --- SEO ---
    getSeo: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return {};
      var { data } = await supabase.from('site_content').select('seo_title, seo_description').eq('site_id', siteId).single();
      return data || {};
    },
    updateSeo: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('site_content').update({ seo_title: d.seo_title, seo_description: d.seo_description, updated_at: new Date().toISOString() }).eq('site_id', siteId).select('seo_title, seo_description').single();
      return data;
    },

    // --- Domain ---
    getDomain: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return {};
      var { data } = await supabase.from('businesses').select('domain, subdomain').eq('site_id', siteId).single();
      return data || {};
    },
    updateDomain: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('businesses').update({ domain: d.domain, updated_at: new Date().toISOString() }).eq('site_id', siteId).select('domain, subdomain').single();
      return data;
    },

    // --- Billing ---
    getBilling: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return {};
      var { data: business } = await supabase.from('businesses').select('plan, status').eq('site_id', siteId).single();
      var { data: apps } = await supabase.from('site_apps').select('app_id, apps(name, monthly_price)').eq('site_id', siteId).eq('enabled', true);
      var appsCost = (apps || []).reduce(function(sum, a) { return sum + ((a.apps && a.apps.monthly_price) || 0); }, 0);
      return { plan: business ? business.plan : 'free', status: business ? business.status : 'active', installed_apps: apps || [], monthly_apps_cost: appsCost };
    },

    // --- Apps ---
    getApps: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data: allApps } = await supabase.from('apps').select('*').eq('status', 'active');
      var { data: installed } = await supabase.from('site_apps').select('app_id, enabled').eq('site_id', siteId);
      var installedMap = {};
      (installed || []).forEach(function(a) { installedMap[a.app_id] = a.enabled; });
      return (allApps || []).map(function(app) { return Object.assign({}, app, { installed: app.app_id in installedMap, enabled: installedMap[app.app_id] || false }); });
    },
    installApp: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('site_apps').upsert({ site_id: siteId, app_id: d.app_id, enabled: true }).select().single();
      return data;
    },
    uninstallApp: async function(d) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('site_apps').update({ enabled: false }).eq('site_id', siteId).eq('app_id', d.app_id);
      return { success: true };
    },

    // --- Notifications ---
    getNotifications: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('notifications').select('*').eq('site_id', siteId).order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    markAllRead: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('notifications').update({ read: true }).eq('site_id', siteId).eq('read', false);
      return { success: true };
    },

    // --- SMS Log ---
    getSmsLog: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('sms_log').select('*').eq('site_id', siteId).order('created_at', { ascending: false }).limit(100);
      return data || [];
    },

    // --- Activity ---
    getActivity: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('activity_log').select('*').eq('site_id', siteId).order('created_at', { ascending: false }).limit(100);
      return data || [];
    },

    // --- Availability ---
    getAvailability: async function(date) {
      var siteId = await ensureSiteId(); if (!siteId) return [];
      var { data } = await supabase.from('availability').select('*').eq('site_id', siteId);
      return data || [];
    },

    // --- Publish ---
    publish: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('businesses').update({ status: 'active', updated_at: new Date().toISOString() }).eq('site_id', siteId);
      return { success: true, message: 'Site published', published_at: new Date().toISOString() };
    },

    // --- Export ---
    exportData: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      return { site_id: siteId };
    },

    // --- Analytics ---
    getAnalytics: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;

      // Get today's stats
      var today = new Date().toISOString().split('T')[0];
      var { data: todayViews } = await supabase
        .from('page_views')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', today + ' 00:00:00');

      var { data: todayConversions } = await supabase
        .from('conversions')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', today + ' 00:00:00');

      var todayRevenue = (todayConversions || []).reduce(function(sum, c) { return sum + (parseFloat(c.revenue) || 0); }, 0);

      // Get week/month stats from traffic_sources
      var weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      var monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      var { data: weekSources } = await supabase
        .from('traffic_sources')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', weekAgo);

      var { data: monthSources } = await supabase
        .from('traffic_sources')
        .select('*')
        .eq('site_id', siteId)
        .gte('date', monthAgo);

      return {
        today: {
          visitors: new Set((todayViews || []).map(function(v) { return v.ip_address; })).size,
          pageviews: (todayViews || []).length,
          conversions: (todayConversions || []).length,
          revenue: todayRevenue
        },
        week: {
          visitors: (weekSources || []).reduce(function(s, t) { return s + t.visitors; }, 0),
          revenue: (weekSources || []).reduce(function(s, t) { return s + parseFloat(t.revenue || 0); }, 0)
        },
        month: {
          visitors: (monthSources || []).reduce(function(s, t) { return s + t.visitors; }, 0),
          revenue: (monthSources || []).reduce(function(s, t) { return s + parseFloat(t.revenue || 0); }, 0)
        },
        topPages: [],
        trafficSources: weekSources || [],
        conversionFunnel: { views: 0, clicks: 0, bookings: 0 },
        revenueChart: []
      };
    },

    // --- SEO ---
    getSEO: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data: pages } = await supabase.from('seo_meta_tags').select('*').eq('site_id', siteId);
      var { data: sitemap } = await supabase.from('sitemap_config').select('*').eq('site_id', siteId).single();
      var { data: robots } = await supabase.from('robots_config').select('*').eq('site_id', siteId).single();
      return { pages: pages || [], sitemap: sitemap || {}, robots: (robots && robots.robots_txt) || '' };
    },

    createSEOPage: async function(pageData) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.from('seo_meta_tags').insert(Object.assign({ site_id: siteId }, pageData)).select().single();
      return data;
    },

    updateSEOPage: async function(id, pageData) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      pageData.updated_at = new Date().toISOString();
      await supabase.from('seo_meta_tags').update(pageData).eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    generateSitemap: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data } = await supabase.rpc('generate_sitemap', { p_site_id: siteId });
      return { xml: data };
    },

    updateSitemapConfig: async function(config) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      config.updated_at = new Date().toISOString();
      await supabase.from('sitemap_config').upsert(Object.assign({ site_id: siteId }, config));
      return { success: true };
    },

    updateRobotsTxt: async function(robotsTxt) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('robots_config').upsert({ site_id: siteId, robots_txt: robotsTxt, updated_at: new Date().toISOString() });
      return { success: true };
    },

    // --- Social Media ---
    getSocialMedia: async function() {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var { data: accounts } = await supabase.from('social_media_accounts').select('*').eq('site_id', siteId);
      var { data: posts } = await supabase.from('social_media_posts').select('*').eq('site_id', siteId).order('created_at', { ascending: false }).limit(50);
      var { data: analytics } = await supabase.from('social_media_analytics').select('*').eq('site_id', siteId).gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      return { accounts: accounts || [], posts: posts || [], analytics: analytics || [] };
    },

    createSocialPost: async function(postData) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      var session = await getSupabaseSession();
      var { data } = await supabase.from('social_media_posts').insert(Object.assign({
        site_id: siteId,
        created_by: session ? session.user.id : null
      }, postData)).select().single();
      return data;
    },

    updateSocialPost: async function(id, postData) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      postData.updated_at = new Date().toISOString();
      await supabase.from('social_media_posts').update(postData).eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    deleteSocialPost: async function(id) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('social_media_posts').delete().eq('id', id).eq('site_id', siteId);
      return { success: true };
    },

    disconnectSocialAccount: async function(platform) {
      var siteId = await ensureSiteId(); if (!siteId) return null;
      await supabase.from('social_media_accounts').update({ is_connected: false, access_token: null, updated_at: new Date().toISOString() }).eq('site_id', siteId).eq('platform', platform);
      return { success: true };
    }
  };

  // ---- Public API ----
  return {
    get: get, post: post, put: put, del: del,
    login: login, signup: signup, logout: logout, getSession: getSession,
    getToken: getToken, setToken: setToken, clearToken: clearToken,
    dashboard: dashboard,
    API_BASE: API_BASE
  };
})();
