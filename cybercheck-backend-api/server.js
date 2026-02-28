require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    credentials: true
}));

// Webhooks need raw body for signature verification — must be before express.json()
app.use('/api/webhooks', require('./routes/webhooks'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (dev)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Domain resolution - resolves hostname to site_id for public routes
const { resolveDomain } = require('./middleware/domain');

// ============================================
// API ROUTES
// ============================================

// Auth (login, signup, logout, refresh, reset)
app.use('/api/auth', require('./routes/auth'));

// Dashboard routes (authenticated business owner)
app.use('/api/dashboard', require('./routes/dashboard'));

// Public API (customer-facing, per domain)
app.use('/api/public', resolveDomain, require('./routes/public'));

// Admin routes (platform admin only)
app.use('/api/admin', require('./routes/admin'));

// GCR routes (platform-wide search & discovery)
app.use('/api/gcr', require('./routes/gcr'));

// Stripe Connect + Payments
app.use('/api/stripe', require('./routes/stripe'));

// Analytics (page views, conversions, tracking)
app.use('/api/analytics', require('./routes/analytics'));

// Webhooks registered above (before express.json for raw body access)

// ============================================
// STATIC SITE SERVING
// ============================================

// Serve business websites from /sites/{slug}/
app.use('/sites', express.static(path.join(__dirname, '..', 'sites')));

// Serve beachside customer website
app.use('/beachside-site', express.static(path.join(__dirname, '..', 'beachside-site')));

// Serve dashboard app (beachside-dashboard is the working one)
app.use('/dashboard', express.static(path.join(__dirname, '..', 'beachside-dashboard')));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Serve beachside demo dashboard (direct path too)
app.use('/beachside-dashboard', express.static(path.join(__dirname, '..', 'beachside-dashboard')));

// Serve marketing pages at /public/* (matches HTML link paths)
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Also serve at root so homepage works at /
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// ============================================
// PERIODIC CLEANUP
// ============================================

// Clean up expired booking holds every 2 minutes
const supabase = require('./db');
setInterval(async () => {
    try {
        const { count } = await supabase
            .from('booking_holds')
            .delete()
            .lt('expires_at', new Date().toISOString())
            .select('id', { count: 'exact', head: true });
        if (count > 0) console.log(`Cleaned up ${count} expired booking hold(s)`);
    } catch (err) {
        // Non-critical — holds also get cleaned up on each new hold creation
    }
}, 2 * 60 * 1000);

// ============================================
// START
// ============================================

app.listen(PORT, () => {
    console.log(`CyberCheck API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
