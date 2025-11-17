import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from "@google/genai";
import { GoogleAuth } from "google-auth-library";

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
console.log("Loaded service account:", credentials.client_email);
console.log("Private key starts with:", credentials.private_key.slice(0, 30));

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
        
        res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
import fetch from "node-fetch";

app.post("/chat", async (req, res) => {
    try {
        const response = await fetch(
        `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            contents: [
                { role: "user", parts: [{ text: req.body.prompt }] }
            ]
            })
        }
        );
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Gemini API error:", err);
        res.status(500).json({ error: err.message });
    }
});
