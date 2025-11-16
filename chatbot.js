// Chatbot functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const clearChatBtn = document.getElementById('clearChat');
const attachBtn = document.getElementById('attachBtn');

let conversationHistory = [];

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

function sendMessage() {
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

    // Simulate AI response
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateAIResponse(message);
        addMessage(response, 'ai');
    }, 1500);
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

function generateAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for uploaded notes
    const uploadedNotes = JSON.parse(localStorage.getItem('uploadedNotes') || '[]');
    
    if (uploadedNotes.length === 0 && (lowerMessage.includes('notes') || lowerMessage.includes('upload'))) {
        return "I notice you haven't uploaded any notes yet. Please upload your study materials first so I can help you with specific content from your notes!";
    }
    
    // Subject-specific responses
    if (lowerMessage.includes('math') || lowerMessage.includes('calculus') || lowerMessage.includes('algebra')) {
        return "I'd be happy to help with math! Based on your notes, I can explain concepts, solve problems step-by-step, or create practice questions. What specific topic would you like to explore?";
    }
    
    if (lowerMessage.includes('science') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics')) {
        return "Science questions are my specialty! I can help explain scientific concepts, describe experiments, or clarify complex theories from your notes. What would you like to know?";
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
        return "I can explain concepts from your uploaded notes. Based on what I see, I'll break down complex ideas into simpler terms with examples. Could you specify which topic or concept you'd like me to explain?";
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        return "I can create summaries of your notes! A good summary includes key points, main concepts, and important details. Which subject or specific notes would you like me to summarize?";
    }
    
    if (lowerMessage.includes('question') || lowerMessage.includes('practice') || lowerMessage.includes('quiz')) {
        return "I can generate practice questions based on your study materials! These will help test your understanding. Would you like multiple choice, short answer, or essay-style questions?";
    }
    
    if (lowerMessage.includes('study') || lowerMessage.includes('help') || lowerMessage.includes('learn')) {
        return "I'm here to help you study effectively! I can:\n\n• Explain difficult concepts\n• Create study guides and summaries\n• Generate practice questions\n• Provide mnemonics and memory aids\n• Break down complex topics\n\nWhat would be most helpful for you right now?";
    }
    
    // Default helpful response
    return "I'm your AI study assistant! I can help you understand your notes better, create summaries, generate practice questions, and explain concepts. What would you like to work on today?";
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
