// ============================================
// Profile — Business profile CRUD
// ============================================

// Demo data
var _profileData = {
  name: 'Demo Restaurant',
  phone: '(555) 123-4567',
  email: 'hello@demorestaurant.com',
  website: 'https://demorestaurant.com',
  description: 'A cozy neighborhood restaurant serving farm-to-table cuisine.',
  logo: '',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  socials: {
    facebook: '',
    instagram: '',
    tiktok: '',
    yelp: '',
    google: '',
    twitter: ''
  },
  hours: {
    monday:    { open: '09:00', close: '21:00', closed: false },
    tuesday:   { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday:  { open: '09:00', close: '22:00', closed: false },
    friday:    { open: '09:00', close: '23:00', closed: false },
    saturday:  { open: '10:00', close: '23:00', closed: false },
    sunday:    { open: '10:00', close: '20:00', closed: true }
  }
};

function loadProfile() {
  var p = _profileData;
  document.getElementById('prof-name').value = p.name || '';
  document.getElementById('prof-phone').value = p.phone || '';
  document.getElementById('prof-email').value = p.email || '';
  document.getElementById('prof-website').value = p.website || '';
  document.getElementById('prof-description').value = p.description || '';
  document.getElementById('prof-address').value = p.address || '';
  document.getElementById('prof-city').value = p.city || '';
  document.getElementById('prof-state').value = p.state || '';
  document.getElementById('prof-zip').value = p.zip || '';

  // Social links
  document.getElementById('prof-social-facebook').value = p.socials.facebook || '';
  document.getElementById('prof-social-instagram').value = p.socials.instagram || '';
  document.getElementById('prof-social-tiktok').value = p.socials.tiktok || '';
  document.getElementById('prof-social-yelp').value = p.socials.yelp || '';
  document.getElementById('prof-social-google').value = p.socials.google || '';
  document.getElementById('prof-social-twitter').value = p.socials.twitter || '';

  // Logo preview
  if (p.logo) {
    var preview = document.getElementById('prof-logo-preview');
    preview.src = p.logo;
    preview.style.display = 'block';
  }

  // Build hours editor
  renderHoursEditor();
}

function renderHoursEditor() {
  var container = document.getElementById('hours-editor');
  var days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  var html = '<table><thead><tr><th>Day</th><th>Open</th><th>Close</th><th>Closed</th></tr></thead><tbody>';

  days.forEach(function(day) {
    var h = _profileData.hours[day];
    var label = day.charAt(0).toUpperCase() + day.slice(1);
    html += '<tr>';
    html += '<td style="font-weight:500;">' + label + '</td>';
    html += '<td><input type="time" id="hours-' + day + '-open" value="' + (h.open || '09:00') + '" style="padding:6px 10px;background:var(--bg);border:1px solid var(--card-border);border-radius:var(--radius);color:var(--text);font-size:13px;"' + (h.closed ? ' disabled' : '') + '></td>';
    html += '<td><input type="time" id="hours-' + day + '-close" value="' + (h.close || '17:00') + '" style="padding:6px 10px;background:var(--bg);border:1px solid var(--card-border);border-radius:var(--radius);color:var(--text);font-size:13px;"' + (h.closed ? ' disabled' : '') + '></td>';
    html += '<td><label class="toggle"><input type="checkbox" id="hours-' + day + '-closed"' + (h.closed ? ' checked' : '') + ' onchange="toggleDayClosed(\'' + day + '\')"><span class="toggle-slider"></span></label></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function toggleDayClosed(day) {
  var closed = document.getElementById('hours-' + day + '-closed').checked;
  document.getElementById('hours-' + day + '-open').disabled = closed;
  document.getElementById('hours-' + day + '-close').disabled = closed;
}

function saveProfile() {
  _profileData.name = document.getElementById('prof-name').value;
  _profileData.phone = document.getElementById('prof-phone').value;
  _profileData.email = document.getElementById('prof-email').value;
  _profileData.website = document.getElementById('prof-website').value;
  _profileData.description = document.getElementById('prof-description').value;
  _profileData.address = document.getElementById('prof-address').value;
  _profileData.city = document.getElementById('prof-city').value;
  _profileData.state = document.getElementById('prof-state').value;
  _profileData.zip = document.getElementById('prof-zip').value;

  // Social links
  _profileData.socials.facebook = document.getElementById('prof-social-facebook').value;
  _profileData.socials.instagram = document.getElementById('prof-social-instagram').value;
  _profileData.socials.tiktok = document.getElementById('prof-social-tiktok').value;
  _profileData.socials.yelp = document.getElementById('prof-social-yelp').value;
  _profileData.socials.google = document.getElementById('prof-social-google').value;
  _profileData.socials.twitter = document.getElementById('prof-social-twitter').value;

  // Hours
  var days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  days.forEach(function(day) {
    _profileData.hours[day] = {
      open: document.getElementById('hours-' + day + '-open').value,
      close: document.getElementById('hours-' + day + '-close').value,
      closed: document.getElementById('hours-' + day + '-closed').checked
    };
  });

  // Update sidebar name
  document.getElementById('sidebar-biz-name').textContent = _profileData.name || 'My Business';

  toast('Profile saved successfully');
}

function uploadLogo(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];

  if (!file.type.startsWith('image/')) {
    toast('Please select an image file', 'error');
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    _profileData.logo = e.target.result;
    var preview = document.getElementById('prof-logo-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    toast('Logo uploaded');
  };
  reader.readAsDataURL(file);
}

// Register page load callback
onPageLoad('profile', loadProfile);
