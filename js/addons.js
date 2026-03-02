// ============================================
// Addons — Add-ons and rental policies
// ============================================

var _addons = [];
var _addonIdCounter = 0;
var _policies = {
  deposit: 25,
  cancelHours: 48,
  cancelFee: 50,
  lateFee: 15,
  agreement: 'Renter agrees to return all equipment in the same condition as received. Any damage beyond normal wear and tear will be charged to the renter. A valid credit card and government-issued ID are required at pickup.'
};

function loadAddons() {
  // Seed demo data
  if (_addons.length === 0) {
    _addons = [
      { id: 1, name: 'Delivery & Pickup', description: 'We deliver and pick up equipment at your location within 15 miles', price: 35.00 },
      { id: 2, name: 'Damage Protection', description: 'Covers accidental damage up to $500', price: 12.00 },
      { id: 3, name: 'Life Jackets (set of 2)', description: 'USCG-approved life jackets', price: 8.00 },
      { id: 4, name: 'Dry Bag', description: 'Waterproof dry bag for electronics and valuables', price: 5.00 }
    ];
    _addonIdCounter = 4;
  }

  renderAddons();
  loadPolicies();
}

function renderAddons() {
  var container = document.getElementById('addons-list');
  var emptyState = document.getElementById('addons-empty');

  if (_addons.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  var html = '<div class="table-wrap"><table><thead><tr><th>Add-on</th><th>Price</th><th>Actions</th></tr></thead><tbody>';

  _addons.forEach(function(a) {
    html += '<tr>';
    html += '<td><strong>' + escHtml(a.name) + '</strong>';
    if (a.description) html += '<br><span style="font-size:12px;color:var(--text-muted);">' + escHtml(a.description) + '</span>';
    html += '</td>';
    html += '<td>$' + Number(a.price).toFixed(2) + '</td>';
    html += '<td><div style="display:flex;gap:6px;">';
    html += '<button class="btn btn-outline btn-sm" onclick="editAddon(' + a.id + ')">Edit</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="deleteAddon(' + a.id + ')">Delete</button>';
    html += '</div></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function openAddonModal(id) {
  document.getElementById('addon-form-name').value = '';
  document.getElementById('addon-form-desc').value = '';
  document.getElementById('addon-form-price').value = '';
  document.getElementById('addon-form-id').value = '';

  if (id) {
    var a = _addons.find(function(x) { return x.id === id; });
    if (a) {
      document.getElementById('addon-form-name').value = a.name;
      document.getElementById('addon-form-desc').value = a.description || '';
      document.getElementById('addon-form-price').value = a.price;
      document.getElementById('addon-form-id').value = a.id;
    }
  }

  openModal('modal-addon');
}

function saveAddon() {
  var name = document.getElementById('addon-form-name').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }

  var desc = document.getElementById('addon-form-desc').value.trim();
  var price = parseFloat(document.getElementById('addon-form-price').value) || 0;
  var id = document.getElementById('addon-form-id').value;

  if (id) {
    var a = _addons.find(function(x) { return x.id === parseInt(id); });
    if (a) {
      a.name = name;
      a.description = desc;
      a.price = price;
    }
    toast('Add-on updated');
  } else {
    _addonIdCounter++;
    _addons.push({
      id: _addonIdCounter,
      name: name,
      description: desc,
      price: price
    });
    toast('Add-on added');
  }

  closeModal('modal-addon');
  renderAddons();
}

function editAddon(id) {
  openAddonModal(id);
}

function deleteAddon(id) {
  if (!confirm('Delete this add-on?')) return;
  _addons = _addons.filter(function(a) { return a.id !== id; });
  renderAddons();
  toast('Add-on deleted');
}

// Policies
function loadPolicies() {
  document.getElementById('policy-deposit').value = _policies.deposit;
  document.getElementById('policy-cancel-hours').value = _policies.cancelHours;
  document.getElementById('policy-cancel-fee').value = _policies.cancelFee;
  document.getElementById('policy-late-fee').value = _policies.lateFee;
  document.getElementById('policy-agreement').value = _policies.agreement;
}

function savePolicies() {
  _policies.deposit = parseFloat(document.getElementById('policy-deposit').value) || 0;
  _policies.cancelHours = parseInt(document.getElementById('policy-cancel-hours').value) || 0;
  _policies.cancelFee = parseFloat(document.getElementById('policy-cancel-fee').value) || 0;
  _policies.lateFee = parseFloat(document.getElementById('policy-late-fee').value) || 0;
  _policies.agreement = document.getElementById('policy-agreement').value;

  toast('Policies saved successfully');
}

// Register page load callback
onPageLoad('addons', function() {
  loadAddons();
});
