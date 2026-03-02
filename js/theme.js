// ============================================
// Theme — Color picker, fonts, and layout
// ============================================

var _themeData = {
  primary: '#3b82f6',
  secondary: '#10b981',
  bg: '#ffffff',
  text: '#1e293b',
  accent: '#f59e0b',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  layout: 'modern'
};

function loadTheme() {
  // Set color inputs
  setColorPair('primary', _themeData.primary);
  setColorPair('secondary', _themeData.secondary);
  setColorPair('bg', _themeData.bg);
  setColorPair('text', _themeData.text);
  setColorPair('accent', _themeData.accent);

  // Set font selects
  document.getElementById('theme-heading-font').value = _themeData.headingFont;
  document.getElementById('theme-body-font').value = _themeData.bodyFont;

  // Set layout select
  document.getElementById('theme-layout').value = _themeData.layout;

  // Bind color input events
  bindColorSync('primary');
  bindColorSync('secondary');
  bindColorSync('bg');
  bindColorSync('text');
  bindColorSync('accent');
}

function setColorPair(name, value) {
  document.getElementById('theme-' + name).value = value;
  document.getElementById('theme-' + name + '-hex').value = value;
}

function bindColorSync(name) {
  var colorInput = document.getElementById('theme-' + name);
  var hexInput = document.getElementById('theme-' + name + '-hex');

  // Skip if already bound
  if (colorInput._bound) return;
  colorInput._bound = true;

  colorInput.addEventListener('input', function() {
    hexInput.value = colorInput.value;
    updateThemePreview();
  });

  hexInput.addEventListener('input', function() {
    var val = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      colorInput.value = val;
      updateThemePreview();
    }
  });

  hexInput.addEventListener('blur', function() {
    var val = hexInput.value.trim();
    // Add # if missing
    if (/^[0-9a-fA-F]{6}$/.test(val)) {
      hexInput.value = '#' + val;
      colorInput.value = '#' + val;
      updateThemePreview();
    }
    // If invalid, reset to color input value
    if (!/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
      hexInput.value = colorInput.value;
    }
  });
}

function updateThemePreview() {
  // Update the site editor preview if it exists
  var previewFrame = document.getElementById('editor-preview');
  if (previewFrame && previewFrame.contentDocument) {
    try {
      var doc = previewFrame.contentDocument;
      var primary = document.getElementById('theme-primary').value;
      var secondary = document.getElementById('theme-secondary').value;
      var bg = document.getElementById('theme-bg').value;
      var text = document.getElementById('theme-text').value;
      var accent = document.getElementById('theme-accent').value;

      doc.documentElement.style.setProperty('--primary', primary);
      doc.documentElement.style.setProperty('--secondary', secondary);
      doc.documentElement.style.setProperty('--bg', bg);
      doc.documentElement.style.setProperty('--text', text);
      doc.documentElement.style.setProperty('--accent', accent);
    } catch (e) {
      // Cross-origin or not loaded yet
    }
  }
}

function saveTheme() {
  _themeData.primary = document.getElementById('theme-primary').value;
  _themeData.secondary = document.getElementById('theme-secondary').value;
  _themeData.bg = document.getElementById('theme-bg').value;
  _themeData.text = document.getElementById('theme-text').value;
  _themeData.accent = document.getElementById('theme-accent').value;
  _themeData.headingFont = document.getElementById('theme-heading-font').value;
  _themeData.bodyFont = document.getElementById('theme-body-font').value;
  _themeData.layout = document.getElementById('theme-layout').value;

  toast('Theme saved successfully');
}

// Register page load callback
onPageLoad('theme', loadTheme);
