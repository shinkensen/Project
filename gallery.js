// Gallery functionality
const galleryGrid = document.getElementById('galleryGrid');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const sortSelect = document.getElementById('sortSelect');
const subjectFilters = document.getElementById('subjectFilters');
const resultCount = document.getElementById('resultCount');

let allNotes = [];
let filteredNotes = [];
let currentSubject = 'all';

// Load notes on page load
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);
    
    // Clear search button
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        handleSearch();
    });
    
    // Sort select
    sortSelect.addEventListener('change', handleSort);
    
    // Subject filters
    subjectFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            handleFilterClick(e.target);
        }
    });
}

function loadNotes() {
    // Load from localStorage
    allNotes = JSON.parse(localStorage.getItem('uploadedNotes') || '[]');
    filteredNotes = [...allNotes];
    renderNotes();
}

function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    // Show/hide clear button
    clearSearch.style.display = query ? 'flex' : 'none';
    
    // Filter notes
    filteredNotes = allNotes.filter(note => {
        const matchesSearch = !query || note.name.toLowerCase().includes(query);
        const matchesSubject = currentSubject === 'all' || note.subject === currentSubject;
        return matchesSearch && matchesSubject;
    });
    
    handleSort();
}

function handleFilterClick(button) {
    // Update active state
    subjectFilters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Get selected subject
    currentSubject = button.getAttribute('data-subject');
    
    // Filter notes
    const query = searchInput.value.trim().toLowerCase();
    filteredNotes = allNotes.filter(note => {
        const matchesSearch = !query || note.name.toLowerCase().includes(query);
        const matchesSubject = currentSubject === 'all' || note.subject === currentSubject;
        return matchesSearch && matchesSubject;
    });
    
    handleSort();
}

function handleSort() {
    const sortBy = sortSelect.value;
    
    switch(sortBy) {
        case 'newest':
            filteredNotes.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
            break;
        case 'oldest':
            filteredNotes.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
            break;
        case 'name':
            filteredNotes.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'subject':
            filteredNotes.sort((a, b) => a.subject.localeCompare(b.subject));
            break;
    }
    
    renderNotes();
}

function renderNotes() {
    // Update result count
    resultCount.textContent = filteredNotes.length;
    
    if (filteredNotes.length === 0) {
        galleryGrid.innerHTML = `
            <div class="gallery-empty">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p>${searchInput.value.trim() ? 'No notes match your search' : 'No notes found'}</p>
                <a href="upload.html" class="btn btn-primary" style="margin-top: 1rem;">Upload Notes</a>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = filteredNotes.map((note, index) => createNoteCard(note, index)).join('');
}

function createNoteCard(note, index) {
    const date = new Date(note.uploadDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    const subjectEmojis = {
        'mathematics': '📐',
        'science': '🔬',
        'history': '📜',
        'literature': '📖',
        'computer-science': '💻',
        'languages': '🌍',
        'arts': '🎨',
        'other': '📌'
    };
    
    const subjectLabels = {
        'mathematics': 'Mathematics',
        'science': 'Science',
        'history': 'History',
        'literature': 'Literature',
        'computer-science': 'Computer Science',
        'languages': 'Languages',
        'arts': 'Arts',
        'other': 'Other'
    };
    
    return `
        <div class="gallery-card" data-index="${index}">
            <div class="gallery-card-header">
                <div class="gallery-file-icon" style="background: ${getFileColor(note.type)}">
                    ${getFileIcon(note.type)}
                </div>
                <span class="subject-badge ${note.subject}">
                    ${subjectEmojis[note.subject]} ${subjectLabels[note.subject]}
                </span>
            </div>
            <div class="gallery-card-body">
                <h3 class="gallery-card-title">${escapeHtml(note.name)}</h3>
                <div class="gallery-card-meta">
                    <span>📅 ${date}</span>
                    <span>📦 ${formatFileSize(note.size)}</span>
                </div>
            </div>
            <div class="gallery-card-footer">
                <button class="gallery-action-btn" onclick="viewNote(${index})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View
                </button>
                <button class="gallery-action-btn" onclick="downloadNote(${index})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
                </button>
                <button class="gallery-action-btn danger" onclick="deleteNote(${index})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `;
}

function viewNote(index) {
    const note = filteredNotes[index];
    alert(`Viewing: ${note.name}\n\nIn a full implementation, this would open the PDF viewer or document reader.`);
}

function downloadNote(index) {
    const note = filteredNotes[index];
    alert(`Downloading: ${note.name}\n\nIn a full implementation, this would trigger a file download.`);
}

function deleteNote(index) {
    const note = filteredNotes[index];
    
    if (!confirm(`Are you sure you want to delete "${note.name}"?`)) {
        return;
    }
    
    // Find index in allNotes
    const allIndex = allNotes.findIndex(n => 
        n.name === note.name && 
        n.uploadDate === note.uploadDate
    );
    
    if (allIndex !== -1) {
        allNotes.splice(allIndex, 1);
        localStorage.setItem('uploadedNotes', JSON.stringify(allNotes));
    }
    
    // Reload notes
    loadNotes();
    handleSearch();
}

function getFileIcon(ext) {
    const icons = {
        'pdf': 'PDF',
        'txt': 'TXT',
        'docx': 'DOC',
        'doc': 'DOC',
        'md': 'MD'
    };
    return icons[ext] || 'FILE';
}

function getFileColor(ext) {
    const colors = {
        'pdf': '#ef4444',
        'txt': '#10b981',
        'docx': '#3b82f6',
        'doc': '#3b82f6',
        'md': '#8b5cf6'
    };
    return colors[ext] || '#6366f1';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
