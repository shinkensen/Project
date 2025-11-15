import { createClient } from '@supabase/supabase-js'
import express from "express";
import cors from "cors";
let url = "";
const supabase = createClient(
    "https://vcrmkjjzeiwirwszqxew.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcm1ramp6ZWl3aXJ3c3pxeGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjA0NzIsImV4cCI6MjA3ODc5NjQ3Mn0.7n9xIL72BRGEtqCkGZ0C-LGsxrs4MciLh1En2lv-rP4"
)
const app = express();
app.use(cors());


app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.post("/upload-notes",async(req,res)=>{
    uuid = req.userId;
    file
    const { data, error } = await supabase.storage
        .from("notes")
        .upload(`user123/${Date.now()}-${file.name}`, file)
    if (error) {
        res.status(500).json({error: error.message});
    } else {
        res.status(200).json({message: "uploaded"});
    }
})
app.post("/sign-up",async(req,res) =>{
    uuid = req.userId;
    try{
        const{data, error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${url}`
            }
        });
        if(error){
            return res.status(500).json({error: error.message});
        }
        res.status(200).json({url: data.url});
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

app.post("/loginEmail",async(req,res) => {
    const {data, error} = await supabase.auth.signInWithPassword({email: req.email, password: req.password});
    if (error){
        res.status(500).json({error: error});
    }else{
        res.status(200).json({userId: data.user.id});
    }
});

app.post("/loginGoogle",async(req,res) => { const {data, error} = await supabase.auth.signInWithOAuth({email: req.email, password: req.password});
    if (error){
        res.status(500).json({error: error});
    }else{
        res.status(200).json({userId: data.user.id});
    }
});

app.get("/notes",async(req,res) => {
    const {data, error} = await supabase.storage
    .from("notes")
    .download()
    if (error){
        res.status(500).json({error: error});
    }else{
        res.status(200).json({message: "here is the data"});
    }
});

app.post("")