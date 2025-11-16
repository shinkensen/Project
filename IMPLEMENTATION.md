# IntelliNotes - Full Stack Implementation

## Overview
IntelliNotes is now fully integrated with a backend API deployed at **https://project-iqv0.onrender.com/** with Supabase storage for file management and authentication.

## Features Implemented

### 🔐 Authentication System
- **Sign Up**: Users can create accounts with email/password
- **Login**: Email/password authentication via Supabase
- **Session Management**: User sessions stored in localStorage
- **Protected Routes**: All pages except index.html require authentication
- **Auto Logout**: Logout button available on all authenticated pages

### 📤 File Upload System
- **Real PDF Upload**: Files are uploaded to Supabase storage via backend API
- **Subject Organization**: Files organized by subject and user ID
- **Multi-file Support**: Upload multiple files at once
- **Progress Tracking**: Visual feedback during upload process
- **Supported Formats**: PDF, TXT, DOCX, MD

### 📚 Gallery System
- **Real-time Data**: Fetches actual notes from backend API
- **Search**: Search notes by filename
- **Filter by Subject**: Filter notes by academic subject
- **Sort Options**: Sort by newest, oldest, name, or subject
- **View Files**: Click to view files in new tab
- **Download**: Direct download functionality
- **Delete**: Remove files from storage (admin access)

### 🤖 Chatbot (Enhanced)
- Protected by authentication
- Persists across sessions
- Ready for AI integration

## API Endpoints

### Authentication
- `POST /sign-up` - Create new user account
- `POST /loginEmail` - Login with email/password
- `POST /auth/callback` - OAuth callback handler
- `POST /loginGoogle` - Google OAuth login

### File Management
- `POST /upload-notes` - Upload files to Supabase storage
- `GET /notes` - List all uploaded notes
- `DELETE /delete-note` - Delete a note from storage

## File Structure

```
Project/
├── auth/
│   ├── auth.html          # Login/Signup page
│   ├── auth.js            # Authentication logic
│   └── auth.css           # Auth page styling
├── backend/
│   ├── backend.js         # Express server with Supabase integration
│   └── package.json       # Backend dependencies
├── index.html             # Landing page (public)
├── chatbot.html           # AI chatbot (protected)
├── upload.html            # File upload page (protected)
├── gallery.html           # Notes gallery (protected)
├── auth-check.js          # Authentication middleware
├── chatbot.js             # Chatbot functionality
├── upload.js              # Upload functionality
├── gallery.js             # Gallery functionality
└── style.css              # Global styles
```

## How to Use

### 1. First Time Setup
1. Visit the landing page at `index.html`
2. Click "Get Started" to go to the auth page
3. Sign up with your email and password
4. Check your email for verification (Supabase)
5. Log in with your credentials

### 2. Uploading Notes
1. Navigate to the Upload page
2. Select a subject from the dropdown
3. Drag & drop files or click to browse
4. Click "Upload All Files"
5. Files are uploaded to Supabase storage

### 3. Viewing Notes
1. Navigate to the Gallery page
2. Use search bar to find specific notes
3. Filter by subject using the buttons
4. Sort notes using the dropdown
5. Click "View" to open in new tab
6. Click "Download" to save locally

### 4. Using Chatbot
1. Navigate to the Chatbot page
2. Type your questions in the input box
3. Use suggestion chips for quick prompts
4. AI responses based on your notes

## Backend Configuration

The backend uses:
- **Supabase URL**: `https://vcrmkjjzeiwirwszqxew.supabase.co`
- **Storage Bucket**: `notes`
- **File Organization**: `{subject}/{userId}/{timestamp}-{filename}`

## Security Features

1. **Authentication Required**: All pages except landing page require login
2. **Session Validation**: User sessions checked on page load
3. **Auto Redirect**: Unauthenticated users redirected to login
4. **Secure Storage**: Files stored with user-specific paths
5. **CORS Enabled**: Backend configured for cross-origin requests

## Notes

- Backend is deployed on Render and may have cold start delays
- File uploads are permanent (delete functionality available)
- Maximum file size depends on Supabase storage limits
- Email verification required for new accounts

## Future Enhancements

- AI-powered note analysis
- Collaborative note sharing
- Advanced search with OCR
- Note tagging and categorization
- Study session tracking
