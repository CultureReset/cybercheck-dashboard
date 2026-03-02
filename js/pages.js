// ============================================
// Pages — Page management CRUD
// ============================================

var _pages = [];
var _pageIdCounter = 0;

function loadPages() {
  // Seed demo data
  if (_pages.length === 0) {
    _pages = [
      { id: 1, title: 'About Us', slug: 'about-us', content: 'Welcome to Demo Restaurant! We have been serving the community since 2015 with fresh, locally sourced ingredients.', seoTitle: 'About Us - Demo Restaurant', seoDesc: 'Learn about our history, our team, and our commitment to quality dining.', sortOrder: 0 },
      { id: 2, title: 'Contact', slug: 'contact', content: 'Get in touch with us for reservations, catering inquiries, or feedback.\n\nPhone: (555) 123-4567\nEmail: hello@demorestaurant.com', seoTitle: 'Contact - Demo Restaurant', seoDesc: 'Reach out for reservations, events, and catering.', sortOrder: 1 },
      { id: 3, title: 'FAQ', slug: 'faq', content: 'Q: Do you take reservations?\nA: Yes! Call us or book online.\n\nQ: Is there parking?\nA: Free lot parking available behind the building.', seoTitle: 'FAQ - Demo Restaurant', seoDesc: 'Frequently asked questions about reservations, parking, and more.', sortOrder: 2 }
    ];
    _pageIdCounter = 3;
  }

  renderPages();
  updatePageStats();
}

function renderPages() {
  var container = document.getElementById('pages-list');
  var emptyState = document.getElementById('pages-empty');

  if (_pages.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  var html = '<div class="table-wrap"><table><thead><tr><th>Page</th><th>Slug</th><th>SEO Title</th><th>Actions</th></tr></thead><tbody>';

  _pages.sort(function(a, b) { return a.sortOrder - b.sortOrder; }).forEach(function(page) {
    html += '<tr>';
    html += '<td><strong>' + escHtml(page.title) + '</strong></td>';
    html += '<td style="color:var(--text-muted);">/' + escHtml(page.slug) + '</td>';
    html += '<td style="color:var(--text-muted);font-size:12px;">' + escHtml(page.seoTitle || '-') + '</td>';
    html += '<td><div style="display:flex;gap:6px;">';
    html += '<button class="btn btn-outline btn-sm" onclick="editPage(' + page.id + ')">Edit</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="deletePage(' + page.id + ')">Delete</button>';
    html += '</div></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function openPageModal(id) {
  document.getElementById('page-form-title').value = '';
  document.getElementById('page-form-slug').value = '';
  document.getElementById('page-form-content').value = '';
  document.getElementById('page-form-seo-title').value = '';
  document.getElementById('page-form-seo-desc').value = '';
  document.getElementById('page-form-id').value = '';
  document.getElementById('page-modal-title').textContent = 'Add Page';

  if (id) {
    var page = _pages.find(function(p) { return p.id === id; });
    if (page) {
      document.getElementById('page-modal-title').textContent = 'Edit Page';
      document.getElementById('page-form-title').value = page.title;
      document.getElementById('page-form-slug').value = page.slug;
      document.getElementById('page-form-content').value = page.content;
      document.getElementById('page-form-seo-title').value = page.seoTitle || '';
      document.getElementById('page-form-seo-desc').value = page.seoDesc || '';
      document.getElementById('page-form-id').value = page.id;
    }
  }

  // Auto-generate slug from title
  var titleInput = document.getElementById('page-form-title');
  var slugInput = document.getElementById('page-form-slug');
  titleInput.oninput = function() {
    if (!id || !slugInput.value) {
      slugInput.value = titleInput.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  };

  openModal('modal-page');
}

function savePage() {
  var title = document.getElementById('page-form-title').value.trim();
  if (!title) { toast('Page title is required', 'error'); return; }

  var slug = document.getElementById('page-form-slug').value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  var content = document.getElementById('page-form-content').value;
  var seoTitle = document.getElementById('page-form-seo-title').value.trim();
  var seoDesc = document.getElementById('page-form-seo-desc').value.trim();
  var id = document.getElementById('page-form-id').value;

  if (id) {
    var page = _pages.find(function(p) { return p.id === parseInt(id); });
    if (page) {
      page.title = title;
      page.slug = slug;
      page.content = content;
      page.seoTitle = seoTitle;
      page.seoDesc = seoDesc;
    }
    toast('Page updated');
  } else {
    _pageIdCounter++;
    _pages.push({
      id: _pageIdCounter,
      title: title,
      slug: slug,
      content: content,
      seoTitle: seoTitle,
      seoDesc: seoDesc,
      sortOrder: _pages.length
    });
    toast('Page added');
  }

  closeModal('modal-page');
  renderPages();
  updatePageStats();
}

function editPage(id) {
  openPageModal(id);
}

function deletePage(id) {
  if (!confirm('Delete this page?')) return;
  _pages = _pages.filter(function(p) { return p.id !== id; });
  renderPages();
  updatePageStats();
  toast('Page deleted');
}

function updatePageStats() {
  var el = document.getElementById('stat-pages');
  if (el) el.textContent = _pages.length;
}

// Register page load callback
onPageLoad('pages', loadPages);
