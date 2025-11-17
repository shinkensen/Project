import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from "@google/genai";
import { GoogleAuth } from "google-auth-library";
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fetch from "node-fetch";

import express from "express";
import cors from "cors";
import multer from 'multer';
const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
console.log("Env length:", raw?.length);
console.log("Env starts with:", raw?.slice(0, 100));

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
console.log("Client email:", credentials.client_email);
console.log("Project ID:", credentials.project_id);
console.log("Private key length:", credentials.private_key.length);
console.log("Private key first line:", credentials.private_key.split("\n")[0]);

const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});
(async () => {
  try {
    const client = await auth.getClient();
    console.log("Auth client created:", client.constructor.name);
    const headers = await client.getRequestHeaders();
    console.log("Sample auth headers:", headers);
  } catch (err) {
    console.error("Auth client creation failed:", err);
  }
})();
const gemini =  new GoogleGenAI({auth});
let url = "https://project-iqv0.onrender.com";
const supabase = createClient(
    "https://vcrmkjjzeiwirwszqxew.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcm1ramp6ZWl3aXJ3c3pxeGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjA0NzIsImV4cCI6MjA3ODc5NjQ3Mn0.7n9xIL72BRGEtqCkGZ0C-LGsxrs4MciLh1En2lv-rP4"
);

const DAILY_PROMPT_LIMIT = 20;
const DAILY_TOKEN_LIMIT = 10000;
const MAX_SUMMARY_LENGTH = 150;
console.log("Loaded service account:", credentials.client_email);
console.log("Private key starts with:", credentials.private_key.slice(0, 30));

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Helper: extract text from PDF buffer using pdfjs
async function extractPDFText(buffer) {
    try {
        const data = new Uint8Array(buffer);
        const loadingTask = pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;
        let fullText = '';
        
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        
        return fullText.trim().slice(0, 5000);
    } catch (error) {
        console.error('PDF extraction error:', error);
        return '';
    }
}

const HF_SUMMARY_MODEL = 'sshleifer/distilbart-cnn-12-6';

// Helper: summarize text using HF Inference API
async function summarizeText(text) {
    if (!text || text.length < 100) return 'No content to summarize.';
    
    if (!process.env.HF_TOKEN) {
        console.warn('HF_TOKEN not set, falling back to excerpt');
        return text.slice(0, 150) + '...';
    }
    
    try {
        const response = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_SUMMARY_MODEL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: text.slice(0, 1024),
                parameters: {
                    max_length: MAX_SUMMARY_LENGTH,
                    min_length: 30
                }
            })
        });
        
        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HF API error: ${response.status} ${errBody}`);
        }
        
        const result = await response.json();
        const summaryText = result?.summary_text || result?.generated_text || result?.[0]?.summary_text || result?.[0]?.generated_text;
        return summaryText ? summaryText : text.slice(0, 150) + '...';
    } catch (error) {
        console.error('Summarization error:', error);
        return text.slice(0, 150) + '...';
    }
}

app.post("/upload-notes",upload.single("file"), async(req,res)=>{
    try{
        const userId = req.body.userId || req.userId || "anonymous";
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
        
        const { data: publicUrlData } = supabase.storage
            .from("notes")
            .getPublicUrl(filePath);
        const pdfUrl = publicUrlData.publicUrl;
        
        // Process PDF if it's a PDF file
        if (file.mimetype === 'application/pdf') {
            try {
                const extractedText = await extractPDFText(file.buffer);
                const summary = await summarizeText(extractedText);
                
                const { error: dbError } = await supabase
                    .from('note_summaries')
                    .upsert({
                        pdf_url: pdfUrl,
                        summary: summary,
                        user_id: userId
                    }, { onConflict: 'pdf_url' });
                
                if (dbError) {
                    console.error('Failed to store summary:', dbError);
                }
            } catch (procError) {
                console.error('PDF processing error:', procError);
            }
        }
        
        res.status(200).json({ 
            message: "Uploaded", 
            path: filePath,
            fileName: file.originalname,
            subject: subject,
            url: pdfUrl
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
                redirectTo: `${url}/auth/callback`
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

        for (const subject of subjects) {
            const { data: folders, error: folderError } = await supabase.storage
                .from("notes")
                .list(subject, {
                    limit: 100,
                    offset: 0
                });
            if (!folderError && folders) {
                for (const folder of folders) {
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
        
        // Also delete summary if exists
        const { data: urlData } = supabase.storage.from("notes").getPublicUrl(path);
        if (urlData?.publicUrl) {
            await supabase.from('note_summaries').delete().eq('pdf_url', urlData.publicUrl);
        }
        
        res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const MAX_PROMPT_LENGTH = 250;

// Helper: check and update user AI limits
async function checkAndUpdateLimits(userId) {
    const { data: limitData, error } = await supabase
        .from('user_ai_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        throw new Error('Failed to fetch user limits');
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    if (!limitData) {
        await supabase.from('user_ai_limits').insert({
            user_id: userId,
            daily_prompt_count: 1,
            last_reset_date: today,
            total_tokens_used: 0
        });
        return { allowed: true, remaining: DAILY_PROMPT_LIMIT - 1 };
    }
    
    if (limitData.last_reset_date !== today) {
        await supabase.from('user_ai_limits').update({
            daily_prompt_count: 1,
            last_reset_date: today
        }).eq('user_id', userId);
        return { allowed: true, remaining: DAILY_PROMPT_LIMIT - 1 };
    }
    
    if (limitData.daily_prompt_count >= DAILY_PROMPT_LIMIT) {
        return { 
            allowed: false, 
            remaining: 0,
            resetDate: new Date(limitData.last_reset_date + 'T00:00:00Z').getTime() + 86400000
        };
    }
    
    await supabase.from('user_ai_limits').update({
        daily_prompt_count: limitData.daily_prompt_count + 1
    }).eq('user_id', userId);
    
    return { 
        allowed: true, 
        remaining: DAILY_PROMPT_LIMIT - (limitData.daily_prompt_count + 1) 
    };
}

// Helper: get user note summaries for context
async function getUserContext(userId) {
    const { data, error } = await supabase
        .from('note_summaries')
        .select('summary')
        .eq('user_id', userId)
        .limit(10);
    
    if (error || !data || data.length === 0) {
        return '';
    }
    
    const contextSummaries = data.map(row => row.summary).join(' | ');
    return `\n\nUser's study notes context: ${contextSummaries.slice(0, 500)}`;
}

app.post("/chat", async (req, res) => {
    try {
        const prompt = (req.body.prompt || '').trim();
        const userId = req.body.userId || 'anonymous';

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (prompt.length > MAX_PROMPT_LENGTH) {
            return res.status(400).json({ error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` });
        }
        
        const limitCheck = await checkAndUpdateLimits(userId);
        if (!limitCheck.allowed) {
            return res.status(429).json({ 
                error: "Daily prompt limit exceeded",
                remaining: 0,
                resetDate: limitCheck.resetDate
            });
        }
        
        const userContext = await getUserContext(userId);
        const enrichedPrompt = prompt + " NOTICE TO GEMINI: keep this as short as possible " + userContext;

        const response = await fetch(
            `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: enrichedPrompt }] }
                    ]
                })
            }
        );
        
        const data = await response.json();
        res.json({
            ...data,
            remaining: limitCheck.remaining
        });
    } catch (err) {
        console.error("Chat API error:", err);
        res.status(500).json({ error: err.message });
    }
});
