// ============================================
// Site Editor — Beachside Circle Boats template
// ============================================

var _editorSections = [];
var _editorSectionIdCounter = 0;
var _activeEditorSection = null;
var _editorCssVisible = false;
var _editorCss = '';
var _previewMode = 'desktop';

function loadSiteEditor() {
  if (_editorSections.length === 0) {
    _editorSections = [
      {
        id: 1,
        name: 'Header / Navigation',
        html: '<header style="background:#fff;padding:16px 40px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e5e5;">\n  <h1 style="margin:0;font-size:22px;color:#1a1a1a;font-family:Titillium Web,sans-serif;">{{business_name}}</h1>\n  <nav style="display:flex;gap:24px;">\n    <a href="#fleet" style="color:#333;text-decoration:none;font-size:15px;">Fleet</a>\n    <a href="#pricing" style="color:#333;text-decoration:none;font-size:15px;">Pricing</a>\n    <a href="#addons" style="color:#333;text-decoration:none;font-size:15px;">Add-ons</a>\n    <a href="#contact" style="color:#333;text-decoration:none;font-size:15px;">Contact</a>\n  </nav>\n  <a href="tel:{{business_phone}}" style="padding:10px 24px;background:#00ada8;color:white;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Call Now</a>\n</header>'
      },
      {
        id: 2,
        name: 'Hero Banner',
        html: '<section style="background:linear-gradient(135deg, #00ada8 0%, #009590 100%);color:white;padding:100px 40px;text-align:center;">\n  <h2 style="font-size:52px;margin:0 0 16px;font-family:Titillium Web,sans-serif;font-weight:700;">The Easiest Way to Get on the Water</h2>\n  <p style="font-size:20px;opacity:0.9;margin:0 0 36px;max-width:600px;margin-left:auto;margin-right:auto;">{{business_description}}</p>\n  <div style="display:flex;gap:16px;justify-content:center;">\n    <a href="#book" style="display:inline-block;padding:16px 36px;background:white;color:#00ada8;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Book Now</a>\n    <a href="tel:{{business_phone}}" style="display:inline-block;padding:16px 36px;background:transparent;color:white;border:2px solid white;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">{{business_phone}}</a>\n  </div>\n</section>'
      },
      {
        id: 3,
        name: 'Fleet Section',
        html: '<section style="padding:80px 40px;max-width:1000px;margin:0 auto;">\n  <h2 style="text-align:center;margin-bottom:16px;font-size:36px;font-family:Titillium Web,sans-serif;color:#1a1a1a;">Our Fleet</h2>\n  <p style="text-align:center;color:#666;margin-bottom:48px;">Portable, eco-friendly circle boats. No license needed.</p>\n  {{inventory_grid}}\n</section>'
      },
      {
        id: 4,
        name: 'Add-ons Section',
        html: '<section style="padding:80px 40px;background:#f9fafb;">\n  <div style="max-width:1000px;margin:0 auto;">\n    <h2 style="text-align:center;margin-bottom:48px;font-size:36px;font-family:Titillium Web,sans-serif;color:#1a1a1a;">Make It Yours</h2>\n    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;">{{addon_cards}}</div>\n  </div>\n</section>'
      },
      {
        id: 5,
        name: 'Contact / Footer',
        html: '<footer style="background:#1a1a1a;color:#999;padding:48px 40px;text-align:center;">\n  <h3 style="color:white;font-family:Titillium Web,sans-serif;font-size:20px;margin-bottom:16px;">{{business_name}}</h3>\n  <p style="margin:0 0 8px;">{{business_address}}</p>\n  <p style="margin:0 0 8px;">{{business_phone}} | {{business_email}}</p>\n  <p style="margin:24px 0 0;font-size:12px;opacity:0.5;">{{business_hours}}</p>\n</footer>'
      }
    ];
    _editorSectionIdCounter = 5;
    _editorCss = '/* Beachside Circle Boats - Custom CSS */\n@import url(\'https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&family=Inter:wght@400;500;600&display=swap\');\n\n:root {\n  --primary: #00ada8;\n  --primary-dark: #009590;\n}\n\nbody {\n  margin: 0;\n  font-family: Inter, -apple-system, sans-serif;\n  color: #1a1a1a;\n}\n\na { transition: opacity 0.2s; }\na:hover { opacity: 0.85; }';
  }

  renderSectionList();
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
    if (sec) sec.html = val;
  }

  clearTimeout(onEditorInput._timer);
  onEditorInput._timer = setTimeout(function() { refreshPreview(); }, 500);
}

function addSection() {
  var name = prompt('Section name:', 'New Section');
  if (!name) return;

  _editorSectionIdCounter++;
  var newSection = {
    id: _editorSectionIdCounter,
    name: name,
    html: '<section style="padding:60px 40px;">\n  <h2 style="font-family:Titillium Web,sans-serif;">' + escHtml(name) + '</h2>\n  <p>Add your content here...</p>\n</section>'
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
    if (_activeEditorSection) selectSection(_activeEditorSection);
    else document.getElementById('editor-code').value = '';
  }

  renderSectionList();
  refreshPreview();
  toast('Section deleted');
}

function toggleCssEditor() {
  _editorCssVisible = !_editorCssVisible;
  if (_editorCssVisible) selectSection('css');
  else if (_activeEditorSection === 'css' && _editorSections.length > 0) selectSection(_editorSections[0].id);
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
    { token: '{{inventory_grid}}', desc: 'Fleet / boat cards' },
    { token: '{{addon_cards}}', desc: 'Add-on cards with pricing' },
    { token: '{{booking_form}}', desc: 'Booking form widget' },
    { token: '{{staff_grid}}', desc: 'Team member cards' },
    { token: '{{social_links}}', desc: 'Social media links' },
    { token: '{{google_map}}', desc: 'Embedded Google Map' }
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

  var allHtml = _editorSections.map(function(s) { return s.html; }).join('\n');

  // Build inventory cards
  var inventoryHtml = '';
  if (typeof _inventoryItems !== 'undefined' && _inventoryItems.length > 0) {
    inventoryHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">';
    _inventoryItems.forEach(function(item) {
      inventoryHtml += '<div style="background:white;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">';
      inventoryHtml += '<div style="background:#00ada8;padding:40px;text-align:center;color:white;font-size:18px;font-weight:600;">' + item.name + '</div>';
      inventoryHtml += '<div style="padding:24px;">';
      inventoryHtml += '<p style="color:#666;font-size:14px;margin:0 0 16px;">' + (item.description || '') + '</p>';
      inventoryHtml += '<div style="display:flex;gap:12px;margin-bottom:16px;">';
      inventoryHtml += '<div style="flex:1;background:#f9fafb;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:11px;color:#999;">Half Day</div><div style="font-size:20px;font-weight:700;color:#00ada8;">$' + (item.halfDayAM || 0) + '</div></div>';
      inventoryHtml += '<div style="flex:1;background:#f9fafb;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:11px;color:#999;">All Day</div><div style="font-size:20px;font-weight:700;color:#00ada8;">$' + (item.allDay || 0) + '</div></div>';
      inventoryHtml += '</div>';
      if (item.specs) inventoryHtml += '<p style="font-size:12px;color:#999;margin:0;">' + item.specs + '</p>';
      inventoryHtml += '</div></div>';
    });
    inventoryHtml += '</div>';
  }

  // Build addon cards
  var addonHtml = '';
  if (typeof _addons !== 'undefined' && _addons.length > 0) {
    _addons.forEach(function(a) {
      addonHtml += '<div style="background:white;border:1px solid #e5e5e5;border-radius:12px;padding:20px;text-align:center;">';
      addonHtml += '<h4 style="margin:0 0 8px;font-size:16px;color:#1a1a1a;">' + a.name + '</h4>';
      addonHtml += '<p style="font-size:13px;color:#666;margin:0 0 12px;">' + (a.description || '') + '</p>';
      addonHtml += '<div style="font-size:18px;font-weight:700;color:#00ada8;">$' + Number(a.price).toFixed(0) + '</div>';
      addonHtml += '</div>';
    });
  }

  var replacements = {
    '{{business_name}}': _profileData ? _profileData.name : 'Beachside Circle Boats',
    '{{business_description}}': _profileData ? _profileData.description : 'Rent a portable, eco-friendly circle boat.',
    '{{business_phone}}': _profileData ? _profileData.phone : '(601) 325-1205',
    '{{business_email}}': _profileData ? _profileData.email : 'beachsideboats@myyahoo.com',
    '{{business_address}}': _profileData ? (_profileData.address + ', ' + _profileData.city + ', ' + _profileData.state + ' ' + _profileData.zip) : '25856 Canal Road, Orange Beach, AL',
    '{{business_hours}}': 'Mon-Sat: 8am-6pm | Sun: 9am-5pm | Weather permitting',
    '{{inventory_grid}}': inventoryHtml || '<p style="color:#999;text-align:center;">No fleet items yet.</p>',
    '{{addon_cards}}': addonHtml || '<p style="color:#999;text-align:center;">No add-ons yet.</p>',
    '{{booking_form}}': '<div style="background:#f9fafb;padding:40px;text-align:center;border-radius:12px;color:#666;border:2px dashed #e5e5e5;">[Booking Form]</div>',
    '{{staff_grid}}': '<p style="color:#999;text-align:center;">Team info here</p>',
    '{{social_links}}': '',
    '{{google_map}}': '<div style="background:#f1f5f9;padding:60px;text-align:center;border-radius:8px;color:#64748b;">[Google Map - Orange Beach, AL]</div>'
  };

  Object.keys(replacements).forEach(function(key) {
    allHtml = allHtml.split(key).join(replacements[key]);
  });

  var fullDoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>' + _editorCss + '</style></head><body>' + allHtml + '</body></html>';

  var doc = frame.contentDocument || frame.contentWindow.document;
  doc.open();
  doc.write(fullDoc);
  doc.close();
}

if (typeof escHtml === 'undefined') {
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}

onPageLoad('site-editor', loadSiteEditor);
