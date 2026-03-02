// ============================================
// OAuth — Connection card handlers
// ============================================

var _connections = {
  stripe: { connected: false, label: 'Stripe', desc: 'Accept credit card payments', icon: 'S', color: '#635bff' },
  square: { connected: false, label: 'Square', desc: 'POS and payment processing', icon: 'Sq', color: '#006aff' },
  paypal: { connected: false, label: 'PayPal', desc: 'Accept PayPal payments', icon: 'PP', color: '#003087' },
  google_analytics: { connected: false, label: 'Google Analytics', desc: 'Track site visitors and behavior', icon: 'GA', color: '#e37400' },
  google_business: { connected: false, label: 'Google Business', desc: 'Manage your Google listing', icon: 'GB', color: '#4285f4' },
  google_maps: { connected: false, label: 'Google Maps', desc: 'Show your location on a map', icon: 'GM', color: '#34a853' }
};

function loadConnections() {
  renderPaymentConnections();
  renderGoogleConnections();
}

function renderPaymentConnections() {
  var container = document.getElementById('payment-connections');
  var paymentKeys = ['stripe', 'square', 'paypal'];

  var html = '';
  paymentKeys.forEach(function(key) {
    html += buildConnectionCard(key);
  });

  container.innerHTML = html;
}

function renderGoogleConnections() {
  var container = document.getElementById('google-connections');
  var googleKeys = ['google_analytics', 'google_business', 'google_maps'];

  var html = '';
  googleKeys.forEach(function(key) {
    html += buildConnectionCard(key);
  });

  container.innerHTML = html;
}

function buildConnectionCard(key) {
  var conn = _connections[key];
  var statusBadge = conn.connected
    ? '<span class="badge badge-success">Connected</span>'
    : '<span class="badge badge-warning">Not connected</span>';
  var btnLabel = conn.connected ? 'Disconnect' : 'Connect';
  var btnClass = conn.connected ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm';

  var html = '<div class="oauth-card">';
  html += '<div class="provider-icon" style="background:' + conn.color + ';color:white;font-weight:700;font-size:14px;">' + conn.icon + '</div>';
  html += '<div class="provider-info">';
  html += '<h4>' + conn.label + '</h4>';
  html += '<p>' + conn.desc + '</p>';
  html += '<div style="margin-top:8px;display:flex;align-items:center;gap:8px;">';
  html += statusBadge;
  html += '<button class="' + btnClass + '" onclick="toggleConnection(\'' + key + '\')">' + btnLabel + '</button>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  return html;
}

function toggleConnection(key) {
  var conn = _connections[key];
  if (!conn) return;

  if (conn.connected) {
    // Disconnect
    if (!confirm('Disconnect ' + conn.label + '?')) return;
    conn.connected = false;
    toast(conn.label + ' disconnected');
  } else {
    // Simulate OAuth flow
    conn.connected = true;
    toast(conn.label + ' connected successfully');
  }

  // Re-render both sections
  renderPaymentConnections();
  renderGoogleConnections();
}

// Register page load callback
onPageLoad('connections', loadConnections);
