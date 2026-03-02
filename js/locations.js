// ============================================
// Locations — Pickup / Dropoff location CRUD
// ============================================

var _locations = [];
var _locIdCounter = 0;

function loadLocations() {
  // Seed demo data
  if (_locations.length === 0) {
    _locations = [
      { id: 1, name: 'Main Office', address: '456 Harbor Drive, Marina Bay, CA 94101' },
      { id: 2, name: 'Beach Launch Point', address: '789 Shoreline Blvd, Marina Bay, CA 94101' },
      { id: 3, name: 'Lake Entrance', address: '1200 Lake Road, Pine Valley, CA 94105' }
    ];
    _locIdCounter = 3;
  }

  renderLocations();
}

function renderLocations() {
  var container = document.getElementById('locations-list');
  var emptyState = document.getElementById('locations-empty');

  if (_locations.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  var html = '<div class="table-wrap"><table><thead><tr><th>Location</th><th>Address</th><th>Actions</th></tr></thead><tbody>';

  _locations.forEach(function(loc) {
    html += '<tr>';
    html += '<td><strong>' + escHtml(loc.name) + '</strong></td>';
    html += '<td style="color:var(--text-muted);">' + escHtml(loc.address) + '</td>';
    html += '<td><div style="display:flex;gap:6px;">';
    html += '<button class="btn btn-outline btn-sm" onclick="editLocation(' + loc.id + ')">Edit</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="deleteLocation(' + loc.id + ')">Delete</button>';
    html += '</div></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function openLocationModal(id) {
  document.getElementById('loc-form-name').value = '';
  document.getElementById('loc-form-address').value = '';
  document.getElementById('loc-form-id').value = '';

  if (id) {
    var loc = _locations.find(function(l) { return l.id === id; });
    if (loc) {
      document.getElementById('loc-form-name').value = loc.name;
      document.getElementById('loc-form-address').value = loc.address;
      document.getElementById('loc-form-id').value = loc.id;
    }
  }

  openModal('modal-location');
}

function saveLocation() {
  var name = document.getElementById('loc-form-name').value.trim();
  if (!name) { toast('Location name is required', 'error'); return; }

  var address = document.getElementById('loc-form-address').value.trim();
  var id = document.getElementById('loc-form-id').value;

  if (id) {
    var loc = _locations.find(function(l) { return l.id === parseInt(id); });
    if (loc) {
      loc.name = name;
      loc.address = address;
    }
    toast('Location updated');
  } else {
    _locIdCounter++;
    _locations.push({
      id: _locIdCounter,
      name: name,
      address: address
    });
    toast('Location added');
  }

  closeModal('modal-location');
  renderLocations();
}

function editLocation(id) {
  openLocationModal(id);
}

function deleteLocation(id) {
  if (!confirm('Delete this location?')) return;
  _locations = _locations.filter(function(l) { return l.id !== id; });
  renderLocations();
  toast('Location deleted');
}

// Register page load callback
onPageLoad('locations', loadLocations);
