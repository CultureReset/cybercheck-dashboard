const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/auth/signup — Create account + business
// ============================================
router.post('/signup', async (req, res) => {
    // Accept both camelCase (cc.js) and snake_case (signup.html) field names
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name || req.body.owner_name;
    const businessName = req.body.businessName || req.body.business_name;
    const businessType = req.body.businessType || req.body.industry;
    const phone = req.body.phone || null;

    if (!email || !password || !name || !businessName || !businessType) {
        return res.status(400).json({ error: 'All fields required: email, password, name, businessName, businessType' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

    if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate subdomain from business name
    const subdomain = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check subdomain uniqueness
    const { data: subExists } = await supabase
        .from('businesses')
        .select('site_id')
        .eq('subdomain', subdomain)
        .single();

    const finalSubdomain = subExists ? `${subdomain}-${Date.now().toString(36)}` : subdomain;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create business
    const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
            name: businessName,
            type: businessType,
            subdomain: finalSubdomain,
            plan: 'free',
            status: 'active'
        })
        .select()
        .single();

    if (bizError) {
        return res.status(500).json({ error: 'Failed to create business: ' + bizError.message });
    }

    // Create user
    const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
            site_id: business.site_id,
            email: email.toLowerCase(),
            name,
            password_hash: passwordHash,
            role: 'owner'
        })
        .select()
        .single();

    if (userError) {
        // Rollback business creation
        await supabase.from('businesses').delete().eq('site_id', business.site_id);
        return res.status(500).json({ error: 'Failed to create user: ' + userError.message });
    }

    // Create empty site_content row
    const contentRow = { site_id: business.site_id, contact_email: email.toLowerCase() };
    if (phone) contentRow.contact_phone = phone;
    await supabase.from('site_content').insert(contentRow);

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id, siteId: business.site_id, role: 'owner' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        business: {
            site_id: business.site_id,
            name: business.name,
            type: business.type,
            subdomain: business.subdomain
        }
    });
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('id, site_id, email, password_hash, name, role')
        .eq('email', email.toLowerCase())
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check business is active
    const { data: business } = await supabase
        .from('businesses')
        .select('site_id, name, type, status, domain, subdomain, plan')
        .eq('site_id', user.site_id)
        .single();

    if (!business || business.status === 'suspended') {
        return res.status(403).json({ error: 'Account is suspended' });
    }

    const token = jwt.sign(
        { userId: user.id, siteId: user.site_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        business: {
            site_id: business.site_id,
            name: business.name,
            type: business.type,
            domain: business.domain,
            subdomain: business.subdomain,
            plan: business.plan
        }
    });
});

// ============================================
// POST /api/auth/logout — Invalidate session
// ============================================
router.post('/logout', (req, res) => {
    // JWT is stateless — client discards token
    // If needed later: add token to blacklist in Redis
    res.json({ success: true });
});

// ============================================
// POST /api/auth/refresh — Refresh JWT token
// ============================================
router.post('/refresh', authRequired, async (req, res) => {
    // Issue a fresh token with same claims
    const token = jwt.sign(
        { userId: req.userId, siteId: req.siteId, role: req.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({ token });
});

// ============================================
// GET /api/auth/session — Validate current session
// ============================================
router.get('/session', authRequired, async (req, res) => {
    const { data: user } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('id', req.userId)
        .single();

    const { data: business } = await supabase
        .from('businesses')
        .select('site_id, name, type, status, domain, subdomain, plan, logo_url')
        .eq('site_id', req.siteId)
        .single();

    if (!user || !business) {
        return res.status(401).json({ error: 'Session invalid' });
    }

    // Get installed apps
    const { data: apps } = await supabase
        .from('site_apps')
        .select('app_id, enabled, apps(name, icon, category)')
        .eq('site_id', req.siteId)
        .eq('enabled', true);

    res.json({ user, business, apps: apps || [] });
});

// ============================================
// GET /api/auth/verify — Quick token check (login.html calls this on page load)
// ============================================
router.get('/verify', authRequired, async (req, res) => {
    const { data: user } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', req.userId)
        .single();

    if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ valid: true, user });
});

// ============================================
// POST /api/auth/forgot-password — Send reset email
// ============================================
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    const { data: user } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', email.toLowerCase())
        .single();

    // Always return success (don't reveal if email exists)
    if (!user) {
        return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await supabase
        .from('users')
        .update({ reset_token: resetToken, reset_expires: resetExpires })
        .eq('id', user.id);

    // TODO: Send email via SendGrid/Resend
    // For now, log the token (remove in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// ============================================
// POST /api/auth/reset-password — Set new password
// ============================================
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const { data: user } = await supabase
        .from('users')
        .select('id, reset_token, reset_expires')
        .eq('reset_token', token)
        .single();

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (new Date(user.reset_expires) < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await supabase
        .from('users')
        .update({
            password_hash: passwordHash,
            reset_token: null,
            reset_expires: null
        })
        .eq('id', user.id);

    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
});

module.exports = router;
