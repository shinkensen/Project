// Chatbot functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const clearChatBtn = document.getElementById('clearChat');
const attachBtn = document.getElementById('attachBtn');

let conversationHistory = [];
let userNotes = [];

// Load user's notes on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('https://project-iqv0.onrender.com/notes');
        if (response.ok) {
            const data = await response.json();
            const userId = localStorage.getItem('userId');
            // Filter notes for current user
            userNotes = data.files.filter(file => file.path.includes(userId));
            
            // Update notes count in header
            updateNotesCount();
            
            // Update welcome message if user has notes
            if (userNotes.length > 0) {
                updateWelcomeMessage();
            }
            
            // Populate notes panel
            populateNotesPanel();
        }
    } catch (error) {
        console.log('Could not load notes:', error);
        document.getElementById('notesCount').textContent = 'No notes loaded';
    }
});

// Toggle notes panel
const toggleNotesBtn = document.getElementById('toggleNotes');
if (toggleNotesBtn) {
    toggleNotesBtn.addEventListener('click', toggleNotesPanel);
}

function toggleNotesPanel() {
    const panel = document.getElementById('notesPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function updateNotesCount() {
    const notesCountEl = document.getElementById('notesCount');
    if (notesCountEl) {
        if (userNotes.length === 0) {
            notesCountEl.textContent = 'No notes uploaded';
        } else {
            const subjects = [...new Set(userNotes.map(n => n.subject))];
            notesCountEl.textContent = `${userNotes.length} notes in ${subjects.length} subject(s)`;
        }
    }
}

function populateNotesPanel() {
    const panelContent = document.getElementById('notesPanelContent');
    
    if (!panelContent) return;
    
    if (userNotes.length === 0) {
        panelContent.innerHTML = `
            <div class="empty-notes">
                <p>📝 No notes uploaded yet</p>
                <a href="upload.html" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">Upload Notes</a>
            </div>
        `;
        return;
    }
    
    // Group notes by subject
    const notesBySubject = {};
    userNotes.forEach(note => {
        if (!notesBySubject[note.subject]) {
            notesBySubject[note.subject] = [];
        }
        notesBySubject[note.subject].push(note);
    });
    
    let html = '';
    for (const subject in notesBySubject) {
        const notes = notesBySubject[subject];
        html += `
            <div class="subject-group">
                <h4 class="subject-title">${formatSubjectName(subject)}</h4>
                <ul class="notes-list">
                    ${notes.map(note => `
                        <li class="note-item">
                            <span class="note-name" title="${note.name}">${truncate(note.name, 30)}</span>
                            <button class="mini-btn" onclick="sendSuggestion('Tell me about ${note.name}')" title="Ask about this note">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    panelContent.innerHTML = html;
}

function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

function updateWelcomeMessage() {
    const welcomeText = document.getElementById('welcomeText');
    const suggestionChips = document.getElementById('suggestionChips');
    
    if (welcomeText && userNotes.length > 0) {
        const subjects = [...new Set(userNotes.map(n => n.subject))];
        const subjectNames = subjects.map(formatSubjectName).join(', ');
        welcomeText.textContent = `You have ${userNotes.length} notes uploaded covering ${subjectNames}. Ask me anything!`;
        
        // Add subject-specific suggestions
        if (suggestionChips) {
            suggestionChips.innerHTML = `
                <button class="chip" onclick="sendSuggestion('What notes do I have?')">📚 Show my notes</button>
                <button class="chip" onclick="sendSuggestion('Summarize my ${subjects[0]} notes')">📝 Summarize ${formatSubjectName(subjects[0])}</button>
                <button class="chip" onclick="sendSuggestion('Create ${subjects[0]} practice questions')">❓ Quiz me</button>
                <button class="chip" onclick="sendSuggestion('Explain a ${subjects[0]} concept')">💡 Explain concepts</button>
            `;
        }
    }
}

function formatSubjectName(subject) {
    const names = {
        'mathematics': 'Mathematics',
        'science': 'Science',
        'history': 'History',
        'literature': 'Literature',
        'computer-science': 'Computer Science',
        'languages': 'Languages',
        'arts': 'Arts',
        'other': 'General'
    };
    return names[subject] || subject;
}

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Enable/disable send button
    sendButton.disabled = this.value.trim() === '';
});

// Send message on Enter (without Shift)
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send button click
sendButton.addEventListener('click', sendMessage);

// Clear chat
clearChatBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
        conversationHistory = [];
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                <h3>Welcome to IntelliNotes AI</h3>
                <p>I can help you with questions about your study materials. Upload your notes and ask me anything!</p>
                <div class="suggestion-chips">
                    <button class="chip" onclick="sendSuggestion('Explain this concept')">📚 Explain concepts</button>
                    <button class="chip" onclick="sendSuggestion('Summarize my notes')">📝 Summarize notes</button>
                    <button class="chip" onclick="sendSuggestion('Create practice questions')">❓ Practice questions</button>
                    <button class="chip" onclick="sendSuggestion('Help me study')">🎯 Study tips</button>
                </div>
            </div>
        `;
    }
});

function sendSuggestion(text) {
    chatInput.value = text;
    chatInput.focus();
    sendButton.disabled = false;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Remove welcome message if it exists
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendButton.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
        // Get user ID from localStorage
        const userId = localStorage.getItem('userId') || 'anonymous';
        
        // Send message to backend API
        const response = await fetch('https://project-iqv0.onrender.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                userId: userId,
                conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from AI');
        }

        const data = await response.json();
        
        hideTypingIndicator();
        addMessage(data.response, 'ai');
        
        // Optional: Show notes count if available
        if (data.notesAvailable !== undefined && data.notesAvailable === 0) {
            setTimeout(() => {
                addMessage('💡 Tip: Upload your study materials using the Upload page to get personalized help!', 'ai');
            }, 500);
        }
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again. If the problem persists, the backend server may be starting up (this can take a minute on the first request).', 'ai');
        sendButton.disabled = false;
    }
}

function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    const icon = type === 'user' 
        ? '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
        : '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
    
    messageDiv.innerHTML = `
        <div class="message-avatar ${type}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${icon}
            </svg>
        </div>
        <div class="message-content">
            <div class="message-bubble">${escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    conversationHistory.push({ text, type, time });
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-message ai typing-indicator-msg';
    indicator.innerHTML = `
        <div class="message-avatar ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = chatMessages.querySelector('.typing-indicator-msg');
    if (indicator) {
        indicator.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// Add typing indicator styles
const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        display: flex;
        gap: 0.4rem;
        padding: 1rem 1.25rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        border-bottom-left-radius: 0.25rem;
        width: fit-content;
    }
    
    .typing-indicator span {
        width: 8px;
        height: 8px;
        background: var(--primary);
        border-radius: 50%;
        animation: typing 1.4s infinite;
    }
    
    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
        }
        30% {
            transform: translateY(-8px);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
