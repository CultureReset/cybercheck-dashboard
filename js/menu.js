// ============================================
// Menu — Category + Item CRUD for restaurants
// ============================================

var _menuCategories = [];
var _menuItems = [];
var _menuCatIdCounter = 0;
var _menuItemIdCounter = 0;

function loadMenu() {
  // Seed demo data on first load
  if (_menuCategories.length === 0) {
    _menuCategories = [
      { id: 1, name: 'Appetizers', sortOrder: 0 },
      { id: 2, name: 'Entrees', sortOrder: 1 },
      { id: 3, name: 'Desserts', sortOrder: 2 },
      { id: 4, name: 'Beverages', sortOrder: 3 }
    ];
    _menuCatIdCounter = 4;

    _menuItems = [
      { id: 1, categoryId: 1, name: 'Bruschetta', price: 9.99, description: 'Toasted bread with fresh tomatoes, basil, and balsamic glaze', tags: ['vegetarian'], modifiers: [], photo: '' },
      { id: 2, categoryId: 1, name: 'Calamari', price: 12.99, description: 'Crispy fried squid with marinara sauce', tags: [], modifiers: [{ name: 'Extra Sauce', price: 1.00 }], photo: '' },
      { id: 3, categoryId: 2, name: 'Grilled Salmon', price: 24.99, description: 'Atlantic salmon with lemon butter, seasonal vegetables', tags: ['gluten-free'], modifiers: [{ name: 'Add Rice', price: 3.00 }], photo: '' },
      { id: 4, categoryId: 2, name: 'Ribeye Steak', price: 32.99, description: '12oz prime ribeye, garlic mashed potatoes', tags: [], modifiers: [{ name: 'Add Shrimp', price: 8.00 }], photo: '' },
      { id: 5, categoryId: 3, name: 'Tiramisu', price: 8.99, description: 'Classic Italian coffee-flavored dessert', tags: ['vegetarian'], modifiers: [], photo: '' },
      { id: 6, categoryId: 4, name: 'House Lemonade', price: 4.99, description: 'Freshly squeezed with mint', tags: ['vegan'], modifiers: [], photo: '' }
    ];
    _menuItemIdCounter = 6;
  }

  renderMenu();
  updateMenuStats();
}

function renderMenu() {
  var container = document.getElementById('menu-categories-list');
  var emptyState = document.getElementById('menu-empty');

  if (_menuCategories.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';
  var html = '';

  _menuCategories.sort(function(a, b) { return a.sortOrder - b.sortOrder; }).forEach(function(cat) {
    var items = _menuItems.filter(function(i) { return i.categoryId === cat.id; });

    html += '<div class="card" style="margin-bottom:12px;">';
    html += '<div class="card-header">';
    html += '<h3 style="font-size:15px;">' + escHtml(cat.name) + ' <span style="color:var(--text-dim);font-weight:400;">(' + items.length + ')</span></h3>';
    html += '<div style="display:flex;gap:6px;">';
    html += '<button class="btn btn-outline btn-sm" onclick="editCategory(' + cat.id + ')">Edit</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="deleteCategory(' + cat.id + ')">Delete</button>';
    html += '</div>';
    html += '</div>';

    if (items.length > 0) {
      html += '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Price</th><th>Tags</th><th>Actions</th></tr></thead><tbody>';
      items.forEach(function(item) {
        html += '<tr>';
        html += '<td><strong>' + escHtml(item.name) + '</strong>';
        if (item.description) html += '<br><span style="font-size:12px;color:var(--text-muted);">' + escHtml(item.description) + '</span>';
        html += '</td>';
        html += '<td>$' + Number(item.price).toFixed(2) + '</td>';
        html += '<td>' + (item.tags || []).map(function(t) { return '<span class="tag">' + escHtml(t) + '</span>'; }).join('') + '</td>';
        html += '<td><div style="display:flex;gap:6px;">';
        html += '<button class="btn btn-outline btn-sm" onclick="editMenuItem(' + item.id + ')">Edit</button>';
        html += '<button class="btn btn-danger btn-sm" onclick="deleteMenuItem(' + item.id + ')">Delete</button>';
        html += '</div></td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">No items in this category yet.</p>';
    }

    html += '</div>';
  });

  container.innerHTML = html;
}

function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Category CRUD
function openCategoryModal(id) {
  document.getElementById('cat-form-name').value = '';
  document.getElementById('cat-form-id').value = '';

  if (id) {
    var cat = _menuCategories.find(function(c) { return c.id === id; });
    if (cat) {
      document.getElementById('cat-form-name').value = cat.name;
      document.getElementById('cat-form-id').value = cat.id;
    }
  }

  openModal('modal-category');
}

function saveCategory() {
  var name = document.getElementById('cat-form-name').value.trim();
  if (!name) { toast('Category name is required', 'error'); return; }

  var id = document.getElementById('cat-form-id').value;

  if (id) {
    // Edit
    var cat = _menuCategories.find(function(c) { return c.id === parseInt(id); });
    if (cat) cat.name = name;
    toast('Category updated');
  } else {
    // Add
    _menuCatIdCounter++;
    _menuCategories.push({
      id: _menuCatIdCounter,
      name: name,
      sortOrder: _menuCategories.length
    });
    toast('Category added');
  }

  closeModal('modal-category');
  renderMenu();
}

function editCategory(id) {
  openCategoryModal(id);
}

function deleteCategory(id) {
  if (!confirm('Delete this category and all its items?')) return;
  _menuCategories = _menuCategories.filter(function(c) { return c.id !== id; });
  _menuItems = _menuItems.filter(function(i) { return i.categoryId !== id; });
  renderMenu();
  updateMenuStats();
  toast('Category deleted');
}

// Menu Item CRUD
function openMenuItemModal(id) {
  document.getElementById('mi-form-name').value = '';
  document.getElementById('mi-form-price').value = '';
  document.getElementById('mi-form-desc').value = '';
  document.getElementById('mi-form-tags').value = '';
  document.getElementById('mi-form-modifiers').value = '';
  document.getElementById('mi-form-id').value = '';
  document.getElementById('menu-item-modal-title').textContent = 'Add Menu Item';

  // Populate category dropdown
  var select = document.getElementById('mi-form-category');
  select.innerHTML = '';
  _menuCategories.forEach(function(cat) {
    var opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });

  if (_menuCategories.length === 0) {
    toast('Please create a category first', 'error');
    return;
  }

  if (id) {
    var item = _menuItems.find(function(i) { return i.id === id; });
    if (item) {
      document.getElementById('menu-item-modal-title').textContent = 'Edit Menu Item';
      document.getElementById('mi-form-name').value = item.name;
      document.getElementById('mi-form-price').value = item.price;
      document.getElementById('mi-form-desc').value = item.description || '';
      document.getElementById('mi-form-tags').value = (item.tags || []).join(', ');
      document.getElementById('mi-form-modifiers').value = (item.modifiers || []).map(function(m) { return m.name + ' | ' + m.price.toFixed(2); }).join('\n');
      document.getElementById('mi-form-id').value = item.id;
      select.value = item.categoryId;
    }
  }

  openModal('modal-menu-item');
}

function saveMenuItem() {
  var name = document.getElementById('mi-form-name').value.trim();
  var price = parseFloat(document.getElementById('mi-form-price').value);
  var categoryId = parseInt(document.getElementById('mi-form-category').value);

  if (!name) { toast('Item name is required', 'error'); return; }
  if (isNaN(price) || price < 0) { toast('Valid price is required', 'error'); return; }

  var desc = document.getElementById('mi-form-desc').value.trim();
  var tagsStr = document.getElementById('mi-form-tags').value.trim();
  var tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
  var modsStr = document.getElementById('mi-form-modifiers').value.trim();
  var modifiers = [];
  if (modsStr) {
    modsStr.split('\n').forEach(function(line) {
      var parts = line.split('|');
      if (parts.length === 2) {
        modifiers.push({ name: parts[0].trim(), price: parseFloat(parts[1].trim()) || 0 });
      }
    });
  }

  var id = document.getElementById('mi-form-id').value;

  if (id) {
    // Edit
    var item = _menuItems.find(function(i) { return i.id === parseInt(id); });
    if (item) {
      item.name = name;
      item.price = price;
      item.categoryId = categoryId;
      item.description = desc;
      item.tags = tags;
      item.modifiers = modifiers;
    }
    toast('Menu item updated');
  } else {
    // Add
    _menuItemIdCounter++;
    _menuItems.push({
      id: _menuItemIdCounter,
      categoryId: categoryId,
      name: name,
      price: price,
      description: desc,
      tags: tags,
      modifiers: modifiers,
      photo: ''
    });
    toast('Menu item added');
  }

  closeModal('modal-menu-item');
  renderMenu();
  updateMenuStats();
}

function editMenuItem(id) {
  openMenuItemModal(id);
}

function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  _menuItems = _menuItems.filter(function(i) { return i.id !== id; });
  renderMenu();
  updateMenuStats();
  toast('Menu item deleted');
}

function updateMenuStats() {
  var el = document.getElementById('stat-items');
  if (el) el.textContent = _menuItems.length;
}

// Register page load callback
onPageLoad('menu', loadMenu);
