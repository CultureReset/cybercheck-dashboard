// ============================================
// Media Library — Upload, view, delete files
// ============================================

var _mediaItems = [];
var _mediaIdCounter = 0;
var _selectedMediaId = null;

// Placeholder images for demo
var _demoMediaFiles = [
  { name: 'restaurant-interior.jpg', type: 'image/jpeg', size: 245000 },
  { name: 'grilled-salmon.jpg', type: 'image/jpeg', size: 189000 },
  { name: 'pasta-dish.jpg', type: 'image/jpeg', size: 132000 }
];

function loadMedia() {
  // Seed demo data on first load
  if (_mediaItems.length === 0) {
    _demoMediaFiles.forEach(function(f) {
      _mediaIdCounter++;
      _mediaItems.push({
        id: _mediaIdCounter,
        name: f.name,
        type: f.type,
        size: f.size,
        url: _generatePlaceholderUrl(f.name),
        uploadedAt: new Date().toISOString()
      });
    });
  }

  renderMediaGrid();
  setupMediaDropZone();
  updateMediaStats();
}

function _generatePlaceholderUrl(name) {
  // Generate a colored SVG placeholder
  var colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  var color = colors[Math.floor(Math.random() * colors.length)];
  var label = name.replace(/\.[^.]+$/, '').substring(0, 12);
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<rect width="200" height="200" fill="' + color + '"/>' +
    '<text x="100" y="106" text-anchor="middle" fill="white" font-family="sans-serif" font-size="14">' + label + '</text>' +
    '</svg>'
  );
}

function renderMediaGrid() {
  var grid = document.getElementById('media-grid');

  if (_mediaItems.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No media files</h3><p>Upload images, videos, or documents.</p></div>';
    return;
  }

  var html = '';
  _mediaItems.forEach(function(item) {
    html += '<div class="grid-item" onclick="openMediaDetail(' + item.id + ')">';
    html += '<img src="' + item.url + '" alt="' + item.name + '">';
    html += '<div class="item-info">';
    html += '<h4>' + item.name + '</h4>';
    html += '<p>' + formatFileSize(item.size) + '</p>';
    html += '</div>';
    html += '</div>';
  });

  grid.innerHTML = html;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function setupMediaDropZone() {
  var dropZone = document.getElementById('media-drop-zone');
  if (!dropZone || dropZone._initialized) return;
  dropZone._initialized = true;

  dropZone.addEventListener('click', function() {
    document.getElementById('media-upload-input').click();
  });

  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      uploadMedia(e.dataTransfer.files);
    }
  });
}

function uploadMedia(files) {
  if (!files || files.length === 0) return;

  var count = 0;
  Array.from(files).forEach(function(file) {
    _mediaIdCounter++;
    var item = {
      id: _mediaIdCounter,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    // Read file for preview if it is an image
    if (file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function(e) {
        item.url = e.target.result;
        _mediaItems.unshift(item);
        count++;
        if (count === files.length) {
          renderMediaGrid();
          updateMediaStats();
          toast(files.length + ' file(s) uploaded');
        }
      };
      reader.readAsDataURL(file);
    } else {
      item.url = _generatePlaceholderUrl(file.name);
      _mediaItems.unshift(item);
      count++;
      if (count === files.length) {
        renderMediaGrid();
        updateMediaStats();
        toast(files.length + ' file(s) uploaded');
      }
    }
  });

  // Reset file input
  document.getElementById('media-upload-input').value = '';
}

function openMediaDetail(id) {
  var item = _mediaItems.find(function(m) { return m.id === id; });
  if (!item) return;

  _selectedMediaId = id;
  document.getElementById('media-detail-img').src = item.url;
  document.getElementById('media-detail-url').value = item.url.substring(0, 80) + '...';
  document.getElementById('media-detail-info').textContent = item.name + ' - ' + formatFileSize(item.size) + ' - Uploaded ' + new Date(item.uploadedAt).toLocaleDateString();
  document.getElementById('media-detail-id').value = id;

  openModal('modal-media-detail');
}

function deleteMedia() {
  if (!_selectedMediaId) return;

  _mediaItems = _mediaItems.filter(function(m) { return m.id !== _selectedMediaId; });
  _selectedMediaId = null;

  closeModal('modal-media-detail');
  renderMediaGrid();
  updateMediaStats();
  toast('Media file deleted');
}

function updateMediaStats() {
  var el = document.getElementById('stat-media');
  if (el) el.textContent = _mediaItems.length;
}

// Register page load callback
onPageLoad('media', function() {
  loadMedia();
});
