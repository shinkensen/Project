// Upload functionality
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const uploadedFiles = document.getElementById('uploadedFiles');
const uploadButton = document.getElementById('uploadButton');
const uploadSuccess = document.getElementById('uploadSuccess');
const subjectSelect = document.getElementById('subjectSelect');

let selectedFiles = [];

// Click to browse
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

// File input change
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

function handleFiles(files) {
    const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['pdf', 'txt', 'docx', 'doc', 'md'].includes(ext);
    });

    if (validFiles.length === 0) {
        alert('Please select valid file types: PDF, TXT, DOCX, or MD');
        return;
    }

    selectedFiles = [...selectedFiles, ...validFiles];
    displayFiles();
}

function displayFiles() {
    if (selectedFiles.length === 0) {
        uploadedFiles.style.display = 'none';
        return;
    }

    uploadedFiles.style.display = 'block';
    fileCount.textContent = selectedFiles.length;
    filesList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = getFileIcon(ext);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon" style="background: ${getFileColor(ext)}">${icon}</div>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button class="delete-button" onclick="removeFile(${index})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        filesList.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFiles();
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

// Upload button handler
uploadButton.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    uploadButton.disabled = true;
    uploadButton.innerHTML = `
        <svg class="btn-icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        Uploading...
    `;

    // Get existing files from localStorage
    const existingFiles = JSON.parse(localStorage.getItem('uploadedNotes') || '[]');
    
    // Add new files
    const subject = subjectSelect.value;
    const newFiles = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        subject: subject,
        uploadDate: new Date().toISOString(),
        type: file.name.split('.').pop().toLowerCase()
    }));

    // Save to localStorage
    localStorage.setItem('uploadedNotes', JSON.stringify([...existingFiles, ...newFiles]));

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Show success message
    uploadArea.style.display = 'none';
    uploadedFiles.style.display = 'none';
    uploadSuccess.style.display = 'block';
    document.querySelector('.subject-selector').style.display = 'none';

    // Reset
    selectedFiles = [];
    fileInput.value = '';
});

// Add spinning animation CSS
const style = document.createElement('style');
style.textContent = `
    .spinning {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
