// ============================================
// Inventory — Rental inventory item CRUD
// ============================================

var _inventoryItems = [];
var _invIdCounter = 0;

function loadInventory() {
  // Seed demo data
  if (_inventoryItems.length === 0) {
    _inventoryItems = [
      { id: 1, name: 'Single Kayak', description: 'Stable recreational kayak for beginners', hourly: 25, daily: 75, weekly: 350, deposit: 100, qty: 8, photos: [] },
      { id: 2, name: 'Tandem Kayak', description: 'Two-person touring kayak', hourly: 40, daily: 120, weekly: 550, deposit: 150, qty: 4, photos: [] },
      { id: 3, name: 'Stand-Up Paddleboard', description: 'All-around inflatable SUP', hourly: 20, daily: 60, weekly: 280, deposit: 75, qty: 12, photos: [] },
      { id: 4, name: 'Canoe', description: '16ft aluminum canoe, fits 3 people', hourly: 35, daily: 100, weekly: 450, deposit: 125, qty: 6, photos: [] }
    ];
    _invIdCounter = 4;
  }

  renderInventory();
  updateInventoryStats();
}

function renderInventory() {
  var grid = document.getElementById('inventory-grid');
  var emptyState = document.getElementById('inventory-empty');

  if (_inventoryItems.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';
  var html = '';

  _inventoryItems.forEach(function(item) {
    var colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#ef4444'];
    var color = colors[item.id % colors.length];
    var placeholderImg = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="200" height="200" fill="' + color + '"/>' +
      '<text x="100" y="100" text-anchor="middle" fill="white" font-family="sans-serif" font-size="14">' + (item.name.substring(0, 15)) + '</text>' +
      '</svg>'
    );
    var imgSrc = (item.photos && item.photos.length > 0) ? item.photos[0] : placeholderImg;

    html += '<div class="grid-item" onclick="editInventoryItem(' + item.id + ')">';
    html += '<img src="' + imgSrc + '" alt="' + escHtml(item.name) + '">';
    html += '<div class="item-info">';
    html += '<h4>' + escHtml(item.name) + '</h4>';
    html += '<p>$' + Number(item.daily).toFixed(2) + '/day - Qty: ' + item.qty + '</p>';
    html += '</div>';
    html += '</div>';
  });

  grid.innerHTML = html;
}

function openInventoryModal(id) {
  document.getElementById('inv-form-name').value = '';
  document.getElementById('inv-form-desc').value = '';
  document.getElementById('inv-form-hourly').value = '';
  document.getElementById('inv-form-daily').value = '';
  document.getElementById('inv-form-weekly').value = '';
  document.getElementById('inv-form-deposit').value = '';
  document.getElementById('inv-form-qty').value = '1';
  document.getElementById('inv-form-id').value = '';
  document.getElementById('inv-modal-title').textContent = 'Add Inventory Item';

  if (id) {
    var item = _inventoryItems.find(function(i) { return i.id === id; });
    if (item) {
      document.getElementById('inv-modal-title').textContent = 'Edit Inventory Item';
      document.getElementById('inv-form-name').value = item.name;
      document.getElementById('inv-form-desc').value = item.description || '';
      document.getElementById('inv-form-hourly').value = item.hourly || '';
      document.getElementById('inv-form-daily').value = item.daily || '';
      document.getElementById('inv-form-weekly').value = item.weekly || '';
      document.getElementById('inv-form-deposit').value = item.deposit || '';
      document.getElementById('inv-form-qty').value = item.qty || 1;
      document.getElementById('inv-form-id').value = item.id;
    }
  }

  openModal('modal-inventory');
}

function saveInventoryItem() {
  var name = document.getElementById('inv-form-name').value.trim();
  if (!name) { toast('Item name is required', 'error'); return; }

  var desc = document.getElementById('inv-form-desc').value.trim();
  var hourly = parseFloat(document.getElementById('inv-form-hourly').value) || 0;
  var daily = parseFloat(document.getElementById('inv-form-daily').value) || 0;
  var weekly = parseFloat(document.getElementById('inv-form-weekly').value) || 0;
  var deposit = parseFloat(document.getElementById('inv-form-deposit').value) || 0;
  var qty = parseInt(document.getElementById('inv-form-qty').value) || 1;

  // Handle photo upload
  var photos = [];
  var photoInput = document.getElementById('inv-form-photos');
  var id = document.getElementById('inv-form-id').value;

  if (photoInput.files && photoInput.files.length > 0) {
    var processed = 0;
    var total = photoInput.files.length;
    Array.from(photoInput.files).forEach(function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        photos.push(e.target.result);
        processed++;
        if (processed === total) {
          finishSaveInventory(id, name, desc, hourly, daily, weekly, deposit, qty, photos);
        }
      };
      reader.readAsDataURL(file);
    });
  } else {
    // No new photos
    if (id) {
      var existing = _inventoryItems.find(function(i) { return i.id === parseInt(id); });
      photos = existing ? existing.photos : [];
    }
    finishSaveInventory(id, name, desc, hourly, daily, weekly, deposit, qty, photos);
  }
}

function finishSaveInventory(id, name, desc, hourly, daily, weekly, deposit, qty, photos) {
  if (id) {
    var item = _inventoryItems.find(function(i) { return i.id === parseInt(id); });
    if (item) {
      item.name = name;
      item.description = desc;
      item.hourly = hourly;
      item.daily = daily;
      item.weekly = weekly;
      item.deposit = deposit;
      item.qty = qty;
      if (photos.length > 0) item.photos = photos;
    }
    toast('Inventory item updated');
  } else {
    _invIdCounter++;
    _inventoryItems.push({
      id: _invIdCounter,
      name: name,
      description: desc,
      hourly: hourly,
      daily: daily,
      weekly: weekly,
      deposit: deposit,
      qty: qty,
      photos: photos
    });
    toast('Inventory item added');
  }

  closeModal('modal-inventory');
  renderInventory();
  updateInventoryStats();
  // Also refresh availability dropdown
  if (typeof loadAvailabilityItems === 'function') loadAvailabilityItems();
}

function editInventoryItem(id) {
  openInventoryModal(id);
}

function deleteInventoryItem(id) {
  if (!confirm('Delete this inventory item?')) return;
  _inventoryItems = _inventoryItems.filter(function(i) { return i.id !== id; });
  renderInventory();
  updateInventoryStats();
  toast('Inventory item deleted');
}

function updateInventoryStats() {
  var el = document.getElementById('stat-items');
  if (el && _business && _business.type === 'rental') {
    el.textContent = _inventoryItems.length;
  }
}

// Register page load callback
onPageLoad('inventory', loadInventory);
