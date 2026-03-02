// ============================================
// Publish — Publish/unpublish flow + revisions
// ============================================

var _publishStatus = 'draft'; // 'draft' or 'published'
var _publishLastUpdated = null;
var _revisions = [];
var _revisionIdCounter = 0;

function loadPublishStatus() {
  renderPublishStatus();
  renderRevisions();
}

function renderPublishStatus() {
  var badge = document.getElementById('publish-status-badge');
  var lastUpdated = document.getElementById('publish-last-updated');
  var unpublishBtn = document.getElementById('btn-unpublish');
  var statStatus = document.getElementById('stat-status');

  if (_publishStatus === 'published') {
    badge.className = 'badge badge-success';
    badge.textContent = 'Published';
    unpublishBtn.style.display = '';
    if (statStatus) statStatus.textContent = 'Live';
  } else {
    badge.className = 'badge badge-warning';
    badge.textContent = 'Draft';
    unpublishBtn.style.display = 'none';
    if (statStatus) statStatus.textContent = 'Draft';
  }

  if (_publishLastUpdated) {
    lastUpdated.textContent = 'Last updated: ' + new Date(_publishLastUpdated).toLocaleString();
  } else {
    lastUpdated.textContent = 'Never published';
  }
}

function publishSite() {
  _publishStatus = 'published';
  _publishLastUpdated = new Date().toISOString();

  // Add revision
  _revisionIdCounter++;
  _revisions.unshift({
    id: _revisionIdCounter,
    timestamp: _publishLastUpdated,
    label: 'Published v' + _revisionIdCounter,
    status: 'published'
  });

  renderPublishStatus();
  renderRevisions();
  toast('Site published successfully!');
}

function unpublishSite() {
  if (!confirm('This will take your site offline. Continue?')) return;

  _publishStatus = 'draft';
  _publishLastUpdated = new Date().toISOString();

  // Add revision entry for unpublish
  _revisionIdCounter++;
  _revisions.unshift({
    id: _revisionIdCounter,
    timestamp: _publishLastUpdated,
    label: 'Unpublished',
    status: 'unpublished'
  });

  renderPublishStatus();
  renderRevisions();
  toast('Site unpublished');
}

function renderRevisions() {
  var container = document.getElementById('revisions-list');
  var emptyState = document.getElementById('revisions-empty');

  if (_revisions.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  var html = '<div class="table-wrap"><table><thead><tr><th>Revision</th><th>Date</th><th>Status</th></tr></thead><tbody>';

  _revisions.forEach(function(rev) {
    var statusBadge = rev.status === 'published'
      ? '<span class="badge badge-success">Published</span>'
      : '<span class="badge badge-warning">Unpublished</span>';

    html += '<tr>';
    html += '<td><strong>' + escHtml(rev.label) + '</strong></td>';
    html += '<td style="color:var(--text-muted);font-size:13px;">' + new Date(rev.timestamp).toLocaleString() + '</td>';
    html += '<td>' + statusBadge + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function previewSite() {
  // Build the preview in a new window/tab
  if (typeof _editorSections !== 'undefined' && _editorSections.length > 0) {
    var allHtml = _editorSections.map(function(s) { return s.html; }).join('\n');

    // Replace tokens
    var replacements = {
      '{{business_name}}': typeof _profileData !== 'undefined' ? _profileData.name : 'Demo Restaurant',
      '{{business_description}}': typeof _profileData !== 'undefined' ? _profileData.description : '',
      '{{business_phone}}': typeof _profileData !== 'undefined' ? _profileData.phone : '',
      '{{business_email}}': typeof _profileData !== 'undefined' ? _profileData.email : '',
      '{{business_address}}': typeof _profileData !== 'undefined' ? (_profileData.address + ', ' + _profileData.city + ', ' + _profileData.state + ' ' + _profileData.zip) : '',
      '{{business_hours}}': '<p>Mon-Fri: 9am-9pm | Sat: 10am-11pm | Sun: Closed</p>',
      '{{menu_items}}': typeof buildDemoMenuHtml === 'function' ? buildDemoMenuHtml() : '',
      '{{specials}}': '<p>Check back for daily specials!</p>',
      '{{staff_grid}}': '<p>Meet our team</p>',
      '{{social_links}}': '',
      '{{google_map}}': '<div style="background:#e2e8f0;padding:60px;text-align:center;border-radius:8px;color:#64748b;">[Google Map]</div>',
      '{{inventory_grid}}': '',
      '{{booking_form}}': ''
    };

    Object.keys(replacements).forEach(function(key) {
      allHtml = allHtml.split(key).join(replacements[key]);
    });

    var css = typeof _editorCss !== 'undefined' ? _editorCss : '';
    var fullDoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Site Preview</title><style>' + css + '</style></head><body>' + allHtml + '</body></html>';

    var win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(fullDoc);
      win.document.close();
    } else {
      toast('Pop-up blocked. Please allow pop-ups for preview.', 'error');
    }
  } else {
    toast('No site content to preview. Add sections in Site Editor first.', 'info');
  }
}

// Helper guard
if (typeof escHtml === 'undefined') {
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}

// Register page load callback
onPageLoad('publish', loadPublishStatus);
