const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = 5002;

import OpenAI from 'openai';
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
const openai = OPEN_AI_KEY ? new OpenAI({ apiKey: OPEN_AI_KEY }) : null;


// -----------------
// Directories
// -----------------
const uploadDir = path.join(__dirname, 'uploads');
const extractedDir = path.join(__dirname, 'extractedFiles');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(extractedDir)) fs.mkdirSync(extractedDir);

// -----------------
// Multer setup
// -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// -----------------
// Serve index.html
// -----------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// -----------------
// Upload endpoint
// -----------------
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const file = req.file;
  if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Invalid file type' });

  try {
    const { extractedContent, outputFile } = await readCoursebookPdf(file.path, file.originalname);

    // -----------------
    // Feed extracted text to OpenAI
    // -----------------
    const aiSummary = await summarizeWithAI(extractedContent);

    res.status(200).json({
        success: true,
        filename: file.originalname,
        extracted_file: outputFile,
        preview: extractedContent.length > 500
        ? extractedContent.slice(0, 500) + "..."
        : extractedContent,
        ai_summary: aiSummary
    });

  } catch (err) {
    res.status(500).json({ error: `Processing failed: ${err.message}` });
  }
});

// -----------------
// PDF reading function
// -----------------
async function readCoursebookPdf(filePath, filename) {
  if (!fs.existsSync(filePath)) return { extractedContent: "File not found", outputFile: null };

  let text = "";
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text;
  } catch (err) {
    console.error(`Error reading PDF: ${err}`);
    return { extractedContent: `Error: ${err}`, outputFile: null };
  }

  const safeFilename = path.basename(filename);
  const outputFilename = `extracted_${safeFilename.replace('.pdf', '')}.txt`;
  const outputPath = path.join(extractedDir, outputFilename);

  fs.writeFileSync(outputPath, text, 'utf-8');
  console.log(`Content saved at '${outputPath}'`);

  return { extractedContent: text, outputFile: outputFilename };
}

// -----------------
// AI summarization
// -----------------
// -----------------
// AI summarization using fetch
// -----------------
async function summarizeWithAI(text) {
  const prompt = `Summarize the following PDF text concisely:\n\n${text}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPEN_AI_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes PDF content." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}