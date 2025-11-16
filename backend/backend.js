import { createClient } from '@supabase/supabase-js'
import express from "express";
import cors from "cors";
import multer from 'multer'; 

// ============================================
// 🔑 OPENAI API KEY (from Render environment variable)
// ============================================
const OPENAI_API_KEY = process.env["OPENAI-KEY"] || "";
// Set OPENAI-KEY in your Render dashboard environment variables
// ============================================

let url = "https://project-iqv0.onrender.com";
const supabase = createClient(
    "https://vcrmkjjzeiwirwszqxew.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcm1ramp6ZWl3aXJ3c3pxeGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjA0NzIsImV4cCI6MjA3ODc5NjQ3Mn0.7n9xIL72BRGEtqCkGZ0C-LGsxrs4MciLh1En2lv-rP4"
)
const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.post("/upload-notes",upload.single("file"), async(req,res)=>{
    try{
        const userId = req.userId || "anonymous";
        const file = req.file;
        const subject = req.body.subject || "other";

        if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = `${subject}/${userId}/${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage
            .from("notes")
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json({ 
            message: "Uploaded", 
            path: filePath,
            fileName: file.originalname,
            subject: subject 
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})
app.post("/sign-up",async(req,res) =>{
    let email = req.body.email;
    let pass = req.body.password;
    try{
        const{data, error} = await supabase.auth.signUp({email: email, password: pass});
        if(error){
            return res.status(500).json({error: error.message});
        }
        res.status(200).json({message: "valid"});
    }
    catch(err){
        res.status(500).json({error: error.message});
    }
})

app.post("/auth/callback", async(req, res)=>{
    try{
        const accessToken = req.body.access_token; 
        const {data: {user}, error } = await supabase.auth.getUser(accessToken);
        if(error){
            return res.status(500).json({message: error.message});
        }
        const isNewUser = user.created_at === user.last_sign_in_at;
        if(isNewUser){
            res.json({message: "New user,", user});
        }
        else{
            res.json({message: "Welcome back,", user});
        }
    }
    catch(err){
        res.status(500).json({error: error.message});
    }
});

app.post("/loginEmail", async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email, 
            password: password
        });
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.status(200).json({ userId: data.user.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/loginGoogle", async (req, res) => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${url}/auth/callback` // You need to set this URL
            }
        });
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.status(200).json({ url: data.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get("/notes", async (req, res) => {
    try {
        const allFiles = [];
        const subjects = ['mathematics', 'science', 'history', 'literature', 'computer-science', 'languages', 'arts', 'other'];
        
        // List files from each subject folder
        for (const subject of subjects) {
            // First, list user folders within each subject
            const { data: folders, error: folderError } = await supabase.storage
                .from("notes")
                .list(subject, {
                    limit: 100,
                    offset: 0
                });

            if (!folderError && folders) {
                for (const folder of folders) {
                    // List files within each user folder
                    const { data: files, error: fileError } = await supabase.storage
                        .from("notes")
                        .list(`${subject}/${folder.name}`, {
                            limit: 100,
                            offset: 0,
                            sortBy: { column: 'created_at', order: 'desc' }
                        });

                    if (!fileError && files) {
                        for (const file of files) {
                            // Skip folders, only process actual files
                            if (file.id && !file.name.includes('/')) {
                                const filePath = `${subject}/${folder.name}/${file.name}`;
                                const { data: publicUrl } = supabase.storage
                                    .from("notes")
                                    .getPublicUrl(filePath);

                                // Extract original filename from the timestamp prefix
                                const originalName = file.name.split('-').slice(1).join('-') || file.name;
                                
                                allFiles.push({
                                    name: originalName,
                                    path: filePath,
                                    url: publicUrl.publicUrl,
                                    subject: subject,
                                    uploadDate: file.created_at || file.updated_at,
                                    size: file.metadata?.size || 0,
                                    type: originalName.split('.').pop().toLowerCase()
                                });
                            }
                        }
                    }
                }
            }
        }

        res.status(200).json({ files: allFiles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/delete-note", async (req, res) => {
    try {
        const { path } = req.body;
        
        if (!path) {
            return res.status(400).json({ error: "File path is required" });
        }
        
        const { data, error } = await supabase.storage
            .from("notes")
            .remove([path]);
        
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        
        res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/chat", async (req, res) => {
    try {
        console.log('Chat request received:', req.body);
        const { message, userId, conversationHistory } = req.body;
        
        if (!message) {
            console.log('Error: No message provided');
            return res.status(400).json({ error: "Message is required" });
        }

        console.log(`Processing chat for user: ${userId}, message: ${message}`);

        // Fetch user's notes for context
        const allFiles = [];
        const subjects = ['mathematics', 'science', 'history', 'literature', 'computer-science', 'languages', 'arts', 'other'];
        
        for (const subject of subjects) {
            const { data: folders, error: folderError } = await supabase.storage
                .from("notes")
                .list(subject, { limit: 50 });

            if (folderError) {
                console.error(`Error listing folders for ${subject}:`, folderError);
                continue;
            }

            if (folders) {
                for (const folder of folders) {
                    if (folder.name === userId || userId === 'anonymous') {
                        const { data: files, error: fileError } = await supabase.storage
                            .from("notes")
                            .list(`${subject}/${folder.name}`, { limit: 50 });

                        if (fileError) {
                            console.error(`Error listing files in ${subject}/${folder.name}:`, fileError);
                            continue;
                        }

                        if (files) {
                            files.forEach(file => {
                                if (file.id) {
                                    allFiles.push({
                                        name: file.name.split('-').slice(1).join('-') || file.name,
                                        subject: subject,
                                        path: `${subject}/${folder.name}/${file.name}`
                                    });
                                }
                            });
                        }
                    }
                }
            }
        }

        console.log(`Found ${allFiles.length} notes for user ${userId}`);

        // Generate contextual response
        const response = generateResponse(message, allFiles, conversationHistory);
        
        console.log('Sending response:', response.substring(0, 100) + '...');
        
        res.status(200).json({ 
            response: response,
            notesAvailable: allFiles.length,
            subjects: [...new Set(allFiles.map(f => f.subject))]
        });
    } catch (err) {
        console.error('Chat endpoint error:', err);
        res.status(500).json({ error: err.message });
    }
});

function generateResponse(message, notes, history) {
    const lowerMessage = message.toLowerCase();
    const noteCount = notes.length;
    const subjects = [...new Set(notes.map(n => n.subject))];
    
    // Build context about available notes
    const notesContext = noteCount > 0 
        ? `You have ${noteCount} notes uploaded covering ${subjects.length} subject(s): ${subjects.map(formatSubject).join(', ')}.`
        : "You haven't uploaded any notes yet.";

    // Check for specific intents
    if (noteCount === 0) {
        if (lowerMessage.includes('upload') || lowerMessage.includes('notes')) {
            return `${notesContext} To get started, please upload your study materials using the Upload page. Once uploaded, I'll be able to help you study, create summaries, generate questions, and more!`;
        }
        return `${notesContext} Please upload your study materials first so I can provide personalized assistance with your coursework.`;
    }

    // List notes
    if (lowerMessage.includes('what notes') || lowerMessage.includes('list') || lowerMessage.includes('show')) {
        const notesList = notes.map(n => `• ${n.name} (${formatSubject(n.subject)})`).join('\n');
        return `${notesContext}\n\nHere are your uploaded notes:\n\n${notesList}\n\nWhat would you like to know about these materials?`;
    }

    // Subject-specific queries
    for (const subject of subjects) {
        if (lowerMessage.includes(subject) || lowerMessage.includes(formatSubject(subject).toLowerCase())) {
            const subjectNotes = notes.filter(n => n.subject === subject);
            const fileList = subjectNotes.map(n => n.name).join(', ');
            return `Great! I can help you with ${formatSubject(subject)}. You have ${subjectNotes.length} note(s) in this subject: ${fileList}.\n\nI can:\n• Explain key concepts\n• Create study summaries\n• Generate practice questions\n• Help you understand difficult topics\n\nWhat specific aspect would you like to focus on?`;
        }
    }

    // Explain/Teach
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
        return `I'd be happy to explain concepts from your notes! ${notesContext}\n\nTo provide the most accurate explanation, please specify:\n1. Which subject (${subjects.map(formatSubject).join(', ')})\n2. The specific concept or topic\n\nExample: "Explain calculus derivatives" or "What is photosynthesis in my biology notes?"`;
    }

    // Summarize
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        return `I can create comprehensive summaries of your notes! ${notesContext}\n\nWhich subject would you like me to summarize?\n${subjects.map(s => `• ${formatSubject(s)}`).join('\n')}\n\nOr specify a particular file name for a focused summary.`;
    }

    // Practice Questions
    if (lowerMessage.includes('question') || lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('practice')) {
        return `Perfect! I can generate practice questions from your notes. ${notesContext}\n\nI can create:\n• Multiple choice questions\n• Short answer questions\n• Essay prompts\n• Problem-solving exercises\n\nWhich subject would you like to practice? (${subjects.map(formatSubject).join(', ')})`;
    }

    // Study help
    if (lowerMessage.includes('study') || lowerMessage.includes('prepare') || lowerMessage.includes('exam')) {
        return `I'm here to help you study effectively! ${notesContext}\n\nHere's what I can do:\n\n📚 **Content Review**\n• Summarize key points\n• Explain difficult concepts\n• Create study guides\n\n✍️ **Practice & Testing**\n• Generate practice questions\n• Create flashcard topics\n• Suggest study exercises\n\n🎯 **Study Strategies**\n• Recommend study schedules\n• Provide memory techniques\n• Offer exam preparation tips\n\nWhat would you like to start with?`;
    }

    // Compare/Analyze
    if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('similar')) {
        return `I can help you compare concepts across your notes! ${notesContext}\n\nTo compare effectively, please tell me:\n1. What topics or concepts you'd like to compare\n2. Which subjects they're from\n\nExample: "Compare cellular respiration and photosynthesis" or "What's the difference between derivatives and integrals?"`;
    }

    // Tips/Help
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('how to')) {
        return `Here are some study tips based on your uploaded materials:\n\n💡 **Effective Study Techniques:**\n• Review notes within 24 hours of uploading\n• Create concept maps connecting ideas\n• Practice active recall with self-quizzing\n• Use spaced repetition for long-term retention\n• Teach concepts to others (or explain them out loud)\n\n📝 **Using Your Notes:**\n${subjects.map(s => `• ${formatSubject(s)}: Focus on key concepts and examples`).join('\n')}\n\nWould you like specific study strategies for any subject?`;
    }

    // Default helpful response
    return `I'm your AI study assistant! ${notesContext}\n\nI can help you:\n• 📖 **Understand** - Explain concepts and topics\n• 📝 **Summarize** - Create concise study summaries\n• ❓ **Practice** - Generate questions and quizzes\n• 🎯 **Study** - Provide study tips and strategies\n• 🔍 **Analyze** - Compare and contrast concepts\n\nWhat would you like to work on? Just ask about any topic from your ${subjects.map(formatSubject).join(' or ')} notes!`;
}

function formatSubject(subject) {
    const subjectNames = {
        'mathematics': 'Mathematics',
        'science': 'Science',
        'history': 'History',
        'literature': 'Literature',
        'computer-science': 'Computer Science',
        'languages': 'Languages',
        'arts': 'Arts',
        'other': 'Other'
    };
    return subjectNames[subject] || subject;
}