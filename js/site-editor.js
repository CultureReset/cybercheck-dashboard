// ============================================
// Site Editor — HTML template editor with preview
// ============================================

var _editorSections = [];
var _editorSectionIdCounter = 0;
var _activeEditorSection = null;
var _editorCssVisible = false;
var _editorCss = '';
var _previewMode = 'desktop';

function loadSiteEditor() {
  // Seed demo sections
  if (_editorSections.length === 0) {
    _editorSections = [
      {
        id: 1,
        name: 'Header / Navigation',
        html: '<header style="background:var(--primary, #3b82f6);color:white;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;">\n  <h1 style="margin:0;font-size:24px;">{{business_name}}</h1>\n  <nav style="display:flex;gap:20px;">\n    <a href="#" style="color:white;text-decoration:none;">Home</a>\n    <a href="#" style="color:white;text-decoration:none;">Menu</a>\n    <a href="#" style="color:white;text-decoration:none;">About</a>\n    <a href="#" style="color:white;text-decoration:none;">Contact</a>\n  </nav>\n</header>'
      },
      {
        id: 2,
        name: 'Hero Banner',
        html: '<section style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);color:white;padding:80px 40px;text-align:center;">\n  <h2 style="font-size:48px;margin:0 0 16px;">Welcome to {{business_name}}</h2>\n  <p style="font-size:18px;opacity:0.9;margin:0 0 32px;">{{business_description}}</p>\n  <a href="#menu" style="display:inline-block;padding:14px 32px;background:var(--accent, #f59e0b);color:#1e293b;border-radius:8px;text-decoration:none;font-weight:600;">View Our Menu</a>\n</section>'
      },
      {
        id: 3,
        name: 'Menu Section',
        html: '<section style="padding:60px 40px;max-width:900px;margin:0 auto;">\n  <h2 style="text-align:center;margin-bottom:40px;font-size:32px;">Our Menu</h2>\n  {{menu_items}}\n</section>'
      },
      {
        id: 4,
        name: 'Contact / Footer',
        html: '<footer style="background:#1e293b;color:#94a3b8;padding:40px;text-align:center;">\n  <p style="margin:0 0 8px;">{{business_address}}</p>\n  <p style="margin:0 0 8px;">{{business_phone}} | {{business_email}}</p>\n  <p style="margin:16px 0 0;font-size:12px;opacity:0.6;">&copy; 2025 {{business_name}}. All rights reserved.</p>\n</footer>'
      }
    ];
    _editorSectionIdCounter = 4;
    _editorCss = '/* Custom CSS */\n:root {\n  --primary: #3b82f6;\n  --secondary: #10b981;\n  --accent: #f59e0b;\n}\n\nbody {\n  margin: 0;\n  font-family: Inter, -apple-system, sans-serif;\n  color: #1e293b;\n}\n\na { transition: opacity 0.2s; }\na:hover { opacity: 0.8; }';
  }

  renderSectionList();
  // Select first section
  if (_editorSections.length > 0 && !_activeEditorSection) {
    selectSection(_editorSections[0].id);
  }
  refreshPreview();
}

function renderSectionList() {
  var container = document.getElementById('editor-sections');
  var html = '';

  _editorSections.forEach(function(sec) {
    var isActive = _activeEditorSection === sec.id;
    html += '<div class="section-item' + (isActive ? ' active' : '') + '" onclick="selectSection(' + sec.id + ')">';
    html += '<span class="drag-handle">&#9776;</span>';
    html += '<span class="section-name">' + escHtml(sec.name) + '</span>';
    html += '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteSection(' + sec.id + ')" style="padding:3px 8px;font-size:11px;">X</button>';
    html += '</div>';
  });

  if (_editorCssVisible) {
    html += '<div class="section-item' + (_activeEditorSection === 'css' ? ' active' : '') + '" onclick="selectSection(\'css\')" style="border-color:var(--warning);">';
    html += '<span class="section-name" style="color:var(--warning);">Custom CSS</span>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function selectSection(id) {
  _activeEditorSection = id;
  var textarea = document.getElementById('editor-code');

  if (id === 'css') {
    textarea.value = _editorCss;
    textarea.placeholder = 'Edit your custom CSS...';
  } else {
    var sec = _editorSections.find(function(s) { return s.id === id; });
    if (sec) {
      textarea.value = sec.html;
      textarea.placeholder = 'Edit HTML for "' + sec.name + '"...';
    }
  }

  renderSectionList();
}

function onEditorInput() {
  var textarea = document.getElementById('editor-code');
  var val = textarea.value;

  if (_activeEditorSection === 'css') {
    _editorCss = val;
  } else {
    var sec = _editorSections.find(function(s) { return s.id === _activeEditorSection; });
    if (sec) {
      sec.html = val;
    }
  }

  // Auto-refresh preview with debounce
  clearTimeout(onEditorInput._timer);
  onEditorInput._timer = setTimeout(function() {
    refreshPreview();
  }, 500);
}

function addSection() {
  var name = prompt('Section name:', 'New Section');
  if (!name) return;

  _editorSectionIdCounter++;
  var newSection = {
    id: _editorSectionIdCounter,
    name: name,
    html: '<section style="padding:40px;">\n  <h2>' + escHtml(name) + '</h2>\n  <p>Add your content here...</p>\n</section>'
  };

  _editorSections.push(newSection);
  selectSection(newSection.id);
  renderSectionList();
  refreshPreview();
  toast('Section added');
}

function deleteSection(id) {
  if (!confirm('Delete this section?')) return;
  _editorSections = _editorSections.filter(function(s) { return s.id !== id; });

  if (_activeEditorSection === id) {
    _activeEditorSection = _editorSections.length > 0 ? _editorSections[0].id : null;
    if (_activeEditorSection) {
      selectSection(_activeEditorSection);
    } else {
      document.getElementById('editor-code').value = '';
    }
  }

  renderSectionList();
  refreshPreview();
  toast('Section deleted');
}

function toggleCssEditor() {
  _editorCssVisible = !_editorCssVisible;
  if (_editorCssVisible) {
    selectSection('css');
  } else if (_activeEditorSection === 'css') {
    if (_editorSections.length > 0) {
      selectSection(_editorSections[0].id);
    }
  }
  renderSectionList();
}

function insertDataToken() {
  var tokens = [
    { token: '{{business_name}}', desc: 'Business name' },
    { token: '{{business_description}}', desc: 'Business description' },
    { token: '{{business_phone}}', desc: 'Phone number' },
    { token: '{{business_email}}', desc: 'Email address' },
    { token: '{{business_address}}', desc: 'Full address' },
    { token: '{{business_hours}}', desc: 'Formatted business hours' },
    { token: '{{menu_items}}', desc: 'Auto-generated menu HTML' },
    { token: '{{specials}}', desc: 'Current specials list' },
    { token: '{{staff_grid}}', desc: 'Team member cards' },
    { token: '{{social_links}}', desc: 'Social media links' },
    { token: '{{google_map}}', desc: 'Embedded Google Map' },
    { token: '{{inventory_grid}}', desc: 'Rental inventory cards' },
    { token: '{{booking_form}}', desc: 'Rental booking form' }
  ];

  var container = document.getElementById('data-tokens-list');
  var html = '';
  tokens.forEach(function(t) {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-bottom:4px;background:var(--bg);border-radius:var(--radius);cursor:pointer;transition:background 0.15s;" onclick="insertToken(\'' + t.token + '\')" onmouseenter="this.style.background=\'var(--sidebar-hover)\'" onmouseleave="this.style.background=\'var(--bg)\'">';
    html += '<div><code style="color:var(--primary);font-size:13px;">' + t.token + '</code><br><span style="font-size:11px;color:var(--text-muted);">' + t.desc + '</span></div>';
    html += '<span style="font-size:11px;color:var(--text-dim);">Click to insert</span>';
    html += '</div>';
  });

  container.innerHTML = html;
  openModal('modal-insert-data');
}

function insertToken(token) {
  var textarea = document.getElementById('editor-code');
  var start = textarea.selectionStart;
  var end = textarea.selectionEnd;
  var val = textarea.value;

  textarea.value = val.substring(0, start) + token + val.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + token.length;
  textarea.focus();

  // Update the section data
  onEditorInput();

  closeModal('modal-insert-data');
  toast('Token inserted');
}

function setPreviewMode(mode) {
  _previewMode = mode;
  var frame = document.getElementById('editor-preview');

  if (mode === 'mobile') {
    frame.style.maxWidth = '375px';
    frame.style.margin = '0 auto';
  } else {
    frame.style.maxWidth = '';
    frame.style.margin = '';
  }

  toast('Preview: ' + mode, 'info');
}

function refreshPreview() {
  var frame = document.getElementById('editor-preview');
  if (!frame) return;

  // Build full HTML from all sections
  var allHtml = _editorSections.map(function(s) { return s.html; }).join('\n');

  // Replace tokens with demo data
  var replacements = {
    '{{business_name}}': _profileData ? _profileData.name : 'Demo Restaurant',
    '{{business_description}}': _profileData ? _profileData.description : 'A great place to eat',
    '{{business_phone}}': _profileData ? _profileData.phone : '(555) 123-4567',
    '{{business_email}}': _profileData ? _profileData.email : 'hello@demo.com',
    '{{business_address}}': _profileData ? (_profileData.address + ', ' + _profileData.city + ', ' + _profileData.state + ' ' + _profileData.zip) : '123 Main St',
    '{{business_hours}}': '<p>Mon-Fri: 9am-9pm | Sat: 10am-11pm | Sun: Closed</p>',
    '{{menu_items}}': buildDemoMenuHtml(),
    '{{specials}}': '<p>Happy Hour: Mon-Fri 4-6pm</p>',
    '{{staff_grid}}': '<p>Our talented team</p>',
    '{{social_links}}': '<p>Follow us on social media</p>',
    '{{google_map}}': '<div style="background:#e2e8f0;padding:60px;text-align:center;border-radius:8px;color:#64748b;">[Google Map Embed]</div>',
    '{{inventory_grid}}': '<p>Browse our rental inventory</p>',
    '{{booking_form}}': '<div style="background:#f1f5f9;padding:40px;text-align:center;border-radius:8px;color:#64748b;">[Booking Form]</div>'
  };

  Object.keys(replacements).forEach(function(key) {
    allHtml = allHtml.split(key).join(replacements[key]);
  });

  var fullDoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>' + _editorCss + '</style></head><body>' + allHtml + '</body></html>';

  // Write to iframe
  var doc = frame.contentDocument || frame.contentWindow.document;
  doc.open();
  doc.write(fullDoc);
  doc.close();
}

function buildDemoMenuHtml() {
  if (typeof _menuCategories === 'undefined' || _menuCategories.length === 0) {
    return '<p style="color:#94a3b8;text-align:center;">No menu items yet.</p>';
  }

  var html = '';
  _menuCategories.forEach(function(cat) {
    var items = _menuItems.filter(function(i) { return i.categoryId === cat.id; });
    if (items.length === 0) return;

    html += '<div style="margin-bottom:32px;">';
    html += '<h3 style="font-size:24px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">' + cat.name + '</h3>';
    items.forEach(function(item) {
      html += '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid #f1f5f9;">';
      html += '<div><strong>' + item.name + '</strong>';
      if (item.description) html += '<br><span style="font-size:14px;color:#64748b;">' + item.description + '</span>';
      html += '</div>';
      html += '<span style="font-weight:600;white-space:nowrap;margin-left:16px;">$' + Number(item.price).toFixed(2) + '</span>';
      html += '</div>';
    });
    html += '</div>';
  });

  return html;
}

// Helper: escHtml may already be defined in menu.js, but guard against missing
if (typeof escHtml === 'undefined') {
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}

// Register page load callback
onPageLoad('site-editor', loadSiteEditor);
