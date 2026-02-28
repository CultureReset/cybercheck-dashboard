// ============================================
// Profile — Beachside Circle Boats
// ============================================

var _profileData = {
  name: 'Beachside Circle Boat Rentals and Sales LLC',
  phone: '(601) 325-1205',
  email: 'beachsideboats@myyahoo.com',
  website: '',
  description: 'Rent a portable, eco-friendly circle boat. No license needed, no experience required. Just show up and cruise.',
  logo: '',
  address: '25856 Canal Road, Unit A',
  city: 'Orange Beach',
  state: 'AL',
  zip: '36561',
  socials: {
    facebook: '',
    instagram: '',
    tiktok: '',
    yelp: '',
    google: '',
    twitter: ''
  },
  hours: {
    monday:    { open: '08:00', close: '18:00', closed: false },
    tuesday:   { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday:  { open: '08:00', close: '18:00', closed: false },
    friday:    { open: '08:00', close: '18:00', closed: false },
    saturday:  { open: '08:00', close: '18:00', closed: false },
    sunday:    { open: '09:00', close: '17:00', closed: false }
  }
};

async function loadProfile() {
  // Load from Supabase via CC — returns { business, content }
  var apiData = await CC.dashboard.getProfile();
  if (apiData) {
    var biz = apiData.business || {};
    var content = apiData.content || {};
    if (biz.name) _profileData.name = biz.name;
    if (biz.logo_url) _profileData.logo = biz.logo_url;
    if (content.contact_phone) _profileData.phone = content.contact_phone;
    if (content.contact_email) _profileData.email = content.contact_email;
    if (content.website_url) _profileData.website = content.website_url;
    if (content.about_text) _profileData.description = content.about_text;
    if (content.logo_url) _profileData.logo = content.logo_url;
    if (content.address) _profileData.address = content.address;
    if (content.city) _profileData.city = content.city;
    if (content.state) _profileData.state = content.state;
    if (content.zip) _profileData.zip = content.zip;
    if (content.social_links) _profileData.socials = Object.assign({}, _profileData.socials, content.social_links);
    if (content.hours) _profileData.hours = content.hours;
  }

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

  document.getElementById('prof-social-facebook').value = p.socials.facebook || '';
  document.getElementById('prof-social-instagram').value = p.socials.instagram || '';
  document.getElementById('prof-social-tiktok').value = p.socials.tiktok || '';
  document.getElementById('prof-social-yelp').value = p.socials.yelp || '';
  document.getElementById('prof-social-google').value = p.socials.google || '';
  document.getElementById('prof-social-twitter').value = p.socials.twitter || '';

  if (p.logo) {
    var preview = document.getElementById('prof-logo-preview');
    preview.src = p.logo;
    preview.style.display = 'block';
  }

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
    html += '<td><input type="time" id="hours-' + day + '-open" value="' + (h.open || '08:00') + '" style="padding:6px 10px;background:var(--bg);border:1px solid var(--card-border);border-radius:var(--radius);color:var(--text);font-size:13px;"' + (h.closed ? ' disabled' : '') + '></td>';
    html += '<td><input type="time" id="hours-' + day + '-close" value="' + (h.close || '18:00') + '" style="padding:6px 10px;background:var(--bg);border:1px solid var(--card-border);border-radius:var(--radius);color:var(--text);font-size:13px;"' + (h.closed ? ' disabled' : '') + '></td>';
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

async function saveProfile() {
  _profileData.name = document.getElementById('prof-name').value;
  _profileData.phone = document.getElementById('prof-phone').value;
  _profileData.email = document.getElementById('prof-email').value;
  _profileData.website = document.getElementById('prof-website').value;
  _profileData.description = document.getElementById('prof-description').value;
  _profileData.address = document.getElementById('prof-address').value;
  _profileData.city = document.getElementById('prof-city').value;
  _profileData.state = document.getElementById('prof-state').value;
  _profileData.zip = document.getElementById('prof-zip').value;

  _profileData.socials.facebook = document.getElementById('prof-social-facebook').value;
  _profileData.socials.instagram = document.getElementById('prof-social-instagram').value;
  _profileData.socials.tiktok = document.getElementById('prof-social-tiktok').value;
  _profileData.socials.yelp = document.getElementById('prof-social-yelp').value;
  _profileData.socials.google = document.getElementById('prof-social-google').value;
  _profileData.socials.twitter = document.getElementById('prof-social-twitter').value;

  var days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  days.forEach(function(day) {
    _profileData.hours[day] = {
      open: document.getElementById('hours-' + day + '-open').value,
      close: document.getElementById('hours-' + day + '-close').value,
      closed: document.getElementById('hours-' + day + '-closed').checked
    };
  });

  document.getElementById('sidebar-biz-name').textContent = _profileData.name || 'My Business';

  // Save to Supabase — business table + site_content table
  var saved = await CC.dashboard.updateProfile({
    business: { name: _profileData.name, logo_url: _profileData.logo },
    content: {
      contact_phone: _profileData.phone,
      contact_email: _profileData.email,
      website_url: _profileData.website,
      about_text: _profileData.description,
      address: _profileData.address,
      city: _profileData.city,
      state: _profileData.state,
      zip: _profileData.zip,
      social_links: _profileData.socials,
      hours: _profileData.hours
    }
  });

  toast(saved ? 'Profile saved to database' : 'Save failed — check connection', saved ? 'success' : 'error');
}

async function uploadLogo(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }

  toast('Uploading logo...');
  var url = await uploadToSupabase(file, 'logos');
  if (url) {
    _profileData.logo = url;
    var preview = document.getElementById('prof-logo-preview');
    preview.src = url;
    preview.style.display = 'block';
    // Save logo URL to business record
    await CC.dashboard.updateProfile({ business: { logo_url: url } });
    toast('Logo uploaded and saved');
  } else {
    toast('Logo upload failed', 'error');
  }
}

onPageLoad('profile', loadProfile);
