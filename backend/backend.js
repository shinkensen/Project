import { createClient } from '@supabase/supabase-js'
import express from "express";
import cors from "cors";
import multer from 'multer'; 
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

        if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = `${userId}/${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage
            .from("notes")
            .upload(filePath, file.buffer, {
                contentType: file.mimetype, 
            });
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json({ message: "Uploaded", path: filePath });
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
    // List all files in the "notes" bucket
    const { data, error } = await supabase.storage
        .from("notes")
         .list(); // optionally pass a folder name here

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Map each file to its public URL
    const files = data.map(file => {
        const { data: publicUrl } = supabase.storage
            .from("notes")
            .getPublicUrl(file.name);

        return {
            name: file.name,
            url: publicUrl.publicUrl,
            updated_at: file.updated_at,
            size: file.metadata?.size
        };
    });

    res.status(200).json({ files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});