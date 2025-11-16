const appState = {
    uploadedFiles: [],
    conversationHistory: [],
    notesContent: ''
};
// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const subjectSelect = document.getElementById('subjectSelect');
const galleryGrid = document.getElementById('galleryGrid');
const subjectFilters = document.getElementById('subjectFilters');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const conversation = document.getElementById('conversation');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeUploadHandlers();
    initializeQuestionHandlers();
    initializeGalleryHandlers();
    updateFileCount();
    renderGallery();
});

let url = "https://project-iqv0.onrender.com";

// ============================================
// FILE UPLOAD HANDLERS
// ============================================

function initializeUploadHandlers() {
    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
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
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Validate file type
        const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/markdown'];
        const validExtensions = ['.pdf', '.txt', '.docx', '.doc', '.md'];
        
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
            addFile(file);
        } else {
            alert(`File "${file.name}" is not a supported format. Please upload PDF, TXT, DOCX, or MD files.`);
        }
    });
}

function addFile(file) {
    // Check if file already exists
    if (appState.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        alert(`"${file.name}" is already uploaded.`);
        return;
    }
    
    const fileObj = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        subject: subjectSelect.value,
        uploadDate: new Date().toISOString()
    };
    
    appState.uploadedFiles.push(fileObj);
    
    // Simulate reading file content (in production, you'd actually extract text)
    readFileContent(file, fileObj.id);
    
    renderFiles();
    renderGallery();
    updateFileCount();
}

function readFileContent(file, fileId) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        // In a real app, you'd parse PDFs, DOCX, etc. properly
        // For this demo, we'll just simulate it
        const content = e.target.result;
        
        // Add to notes content (simulated extraction)
        appState.notesContent += `\n\n--- Content from ${file.name} ---\n`;
        if (file.type === 'text/plain' || file.name.endsWith('.md')) {
            appState.notesContent += content;
        } else {
            appState.notesContent += `[Simulated content from ${file.name}]\nThis is a demonstration. In production, the actual content would be extracted from the file.`;
        }
        
        console.log(`File "${file.name}" processed successfully`);
    };
    
    // Read as text for text files
    if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
    } else {
        // For binary files (PDF, DOCX), in production you'd use proper libraries
        // For now, just simulate
        appState.notesContent += `\n\n--- Content from ${file.name} ---\n`;
        appState.notesContent += `[Simulated content from ${file.name}]\nThis is a demonstration. In production, the actual content would be extracted from the file using appropriate libraries.`;
    }
}

function renderFiles() {
    if (appState.uploadedFiles.length === 0) {
        filesList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No files uploaded yet</p>';
        return;
    }
    
    filesList.innerHTML = appState.uploadedFiles.map(file => `
        <div class="file-item" data-file-id="${file.id}">
            <div class="file-info">
                <div class="file-icon">${getFileExtension(file.name).toUpperCase()}</div>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button class="delete-button" onclick="deleteFile(${file.id})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `).join('');
}

function deleteFile(fileId) {
    appState.uploadedFiles = appState.uploadedFiles.filter(f => f.id !== fileId);
    renderFiles();
    renderGallery();
    updateFileCount();
    
    // In production, you'd also remove the content from notesContent
    // For this demo, we'll keep it simple
}

function updateFileCount() {
    fileCount.textContent = appState.uploadedFiles.length;
}

function getFileExtension(filename) {
    return filename.split('.').pop() || 'file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// GALLERY HANDLERS
// ============================================

function initializeGalleryHandlers() {
    // Filter button handlers
    subjectFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Filter gallery
            const selectedSubject = e.target.dataset.subject;
            filterGallery(selectedSubject);
        }
    });
}

function renderGallery() {
    if (appState.uploadedFiles.length === 0) {
        galleryGrid.innerHTML = `
            <div class="gallery-empty">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No notes uploaded yet</p>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = appState.uploadedFiles.map(file => {
        const ext = getFileExtension(file.name).toUpperCase();
        const subjectEmoji = getSubjectEmoji(file.subject);
        const subjectName = getSubjectName(file.subject);
        const uploadDate = new Date(file.uploadDate).toLocaleDateString();
        
        return `
            <div class="gallery-card ${file.subject}" data-subject="${file.subject}" data-file-id="${file.id}">
                <div class="gallery-card-header">
                    <div class="gallery-file-icon ${file.subject}">${ext}</div>
                    <div class="subject-badge ${file.subject}">
                        ${subjectEmoji} ${subjectName}
                    </div>
                </div>
                <div class="gallery-card-body">
                    <div class="gallery-card-title" title="${file.name}">${file.name}</div>
                    <div class="gallery-card-meta">
                        <span>📅 ${uploadDate}</span>
                        <span>📦 ${formatFileSize(file.size)}</span>
                    </div>
                </div>
                <div class="gallery-card-footer">
                    <button class="gallery-action-btn" onclick="viewFileDetails(${file.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                    </button>
                    <button class="gallery-action-btn danger" onclick="deleteFile(${file.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterGallery(subject) {
    const cards = document.querySelectorAll('.gallery-card');
    
    cards.forEach(card => {
        if (subject === 'all') {
            card.classList.remove('hidden');
        } else {
            if (card.dataset.subject === subject) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
}

function viewFileDetails(fileId) {
    const file = appState.uploadedFiles.find(f => f.id === fileId);
    if (file) {
        const subjectName = getSubjectName(file.subject);
        const uploadDate = new Date(file.uploadDate).toLocaleString();
        alert(`File Details:\n\nName: ${file.name}\nSubject: ${subjectName}\nSize: ${formatFileSize(file.size)}\nUploaded: ${uploadDate}`);
    }
}

function getSubjectEmoji(subject) {
    const emojis = {
        'mathematics': '📐',
        'science': '🔬',
        'history': '📜',
        'literature': '📖',
        'computer-science': '💻',
        'languages': '🌍',
        'arts': '🎨',
        'other': '📌'
    };
    return emojis[subject] || '📌';
}

function getSubjectName(subject) {
    const names = {
        'mathematics': 'Math',
        'science': 'Science',
        'history': 'History',
        'literature': 'Literature',
        'computer-science': 'CS',
        'languages': 'Languages',
        'arts': 'Arts',
        'other': 'Other'
    };
    return names[subject] || 'Other';
}

// ============================================
// QUESTION & ANSWER HANDLERS
// ============================================

function initializeQuestionHandlers() {
    askButton.addEventListener('click', handleAskQuestion);
    
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskQuestion();
        }
    });
    
    // Enable/disable ask button based on input
    questionInput.addEventListener('input', () => {
        const hasText = questionInput.value.trim().length > 0;
        const hasFiles = appState.uploadedFiles.length > 0;
        askButton.disabled = !hasText || !hasFiles;
    });
}

async function handleAskQuestion() {
    const question = questionInput.value.trim();
    
    if (!question) {
        alert('Please enter a question.');
        return;
    }
    
    if (appState.uploadedFiles.length === 0) {
        alert('Please upload at least one note file first.');
        return;
    }
    
    // Clear input
    questionInput.value = '';
    askButton.disabled = true;
    
    // Remove empty state if it exists
    const emptyState = conversation.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Add user message
    addMessage(question, 'user');
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    // Simulate AI response (in production, this would call your backend API)
    setTimeout(() => {
        typingIndicator.remove();
        const aiResponse = generateAIResponse(question);
        addMessage(aiResponse, 'ai');
    }, 1500 + Math.random() * 1000);
}
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageHeader = document.createElement('div');
    messageHeader.className = `message-header ${sender}`;
    messageHeader.textContent = sender === 'user' ? '👤 You' : '🤖 AI Assistant';
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    conversation.appendChild(messageDiv);
    conversation.scrollTop = conversation.scrollHeight;
    appState.conversationHistory.push({ content, sender, timestamp: Date.now() });
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    conversation.appendChild(typingDiv);
    conversation.scrollTop = conversation.scrollHeight;
    return typingDiv;
}

function generateAIResponse(question) {
    const responses = [
        `Based on your uploaded notes, here's what I found: ${question.toLowerCase().includes('what') ? 'The key concept relates to the material you provided.' : 'Let me explain this based on your notes.'}

The answer involves understanding the foundational principles outlined in your documents. ${getRandomInsight()}

Would you like me to elaborate on any specific aspect?`,
        
        `Great question! Looking through your notes, I can see that ${getRandomInsight()}

This connects to the main themes in your uploaded materials. ${question.toLowerCase().includes('how') ? 'The process involves several key steps that are detailed in your notes.' : 'The concept is well-explained in the documents you provided.'}

Is there a particular section you'd like me to focus on?`,
        
        `From analyzing your uploaded notes, ${getRandomInsight()}

${question.toLowerCase().includes('why') ? 'The reasoning behind this is explained in your materials.' : 'Your notes contain relevant information that addresses this topic.'} 

Feel free to ask follow-up questions for more detailed explanations!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function getRandomInsight() {
    const insights = [
        'the main topic emphasizes the importance of understanding core principles.',
        'there are several interconnected concepts that build upon each other.',
        'the material covers both theoretical and practical applications.',
        'your notes highlight critical points that are essential for mastery.',
        'the content provides a comprehensive overview of the subject matter.',
        'key definitions and examples are provided throughout your materials.'
    ];
    return insights[Math.floor(Math.random() * insights.length)];
}
function exportConversation() {
    const text = appState.conversationHistory
        .map(msg => `[${msg.sender.toUpperCase()}]: ${msg.content}`)
        .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
console.log('StudyAI initialized! Upload notes and start asking questions.');