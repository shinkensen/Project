# IntelliNotes - Smart Notes & AI Q&A Platform

Student Hackpad Hackathon 2025 submission

## Overview
IntelliNotes is a web application that allows students to upload their study notes and ask questions that get answered by an AI model trained on the uploaded content.

## Features
- 📤 **File Upload**: Drag & drop or click to upload notes (PDF, TXT, DOCX, MD)
- 📚 **Multi-file Support**: Upload multiple note files at once
- 💬 **AI Q&A Interface**: Ask questions about your uploaded notes
- 🎨 **Modern UI**: Dark theme with smooth animations
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ⚡ **Real-time Feedback**: Typing indicators and instant responses

## Getting Started

### Option 1: Direct File Access
Simply open `index.html` in your web browser:
```powershell
Start-Process index.html
```

### Option 2: Local Server (Recommended)
Using Python:
```powershell
python -m http.server 8000
```
Then visit: http://localhost:8000

Using Node.js (http-server):
```powershell
npx http-server -p 8000
```

## How to Use
1. **Upload Notes**: Click the upload area or drag & drop your study notes
2. **Ask Questions**: Type your question in the text area
3. **Get Answers**: The AI will respond based on your uploaded content

## Technical Stack
- Pure HTML5, CSS3, JavaScript (no frameworks)
- Responsive grid layout
- CSS animations and transitions
- File API for uploads
- LocalStorage ready for persistence

## Project Structure
```
Project-1/
├── index.html      # Main HTML structure
├── style.css       # Styling and animations
├── script.js       # Application logic
└── README.md       # Documentation
```

## Future Enhancements
- Backend API integration with actual AI model
- PDF/DOCX text extraction
- Conversation export
- Note highlighting & search
- User authentication
- Cloud storage integration

## Notes
Current implementation uses simulated AI responses. In production:
- Upload files to backend server
- Extract text from PDFs/DOCX using proper libraries
- Send to AI model (OpenAI, Claude, or custom trained model)
- Return contextual answers based on note content

---
Built with ❤️ for Student Hackpad Hackathon 2025