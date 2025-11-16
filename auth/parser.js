const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 5002;

// Ensure directories exist
const uploadDir = path.join(__dirname, 'uploads');
const extractedDir = path.join(__dirname, 'extractedFiles');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(extractedDir)) fs.mkdirSync(extractedDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  if (!file.originalname.endsWith('.pdf')) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  try {
    const { extractedContent, outputFile } = await readCoursebookPdf(file.path, file.originalname);

    res.status(200).json({
      success: true,
      message: 'File uploaded and analyzed successfully',
      filename: file.originalname,
      extracted_file: outputFile,
      preview: extractedContent.length > 500
        ? extractedContent.slice(0, 500) + "..."
        : extractedContent
    });
  } catch (err) {
    res.status(500).json({ error: `PDF analysis failed: ${err.message}` });
  }
});

// Function to read and extract PDF content
async function readCoursebookPdf(filePath, filename) {
  if (!fs.existsSync(filePath)) {
    return { extractedContent: "File not found", outputFile: null };
  }

  let text = "";
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    text = pdfData.text; // Extracted text from PDF
  } catch (err) {
    console.error(`Error reading PDF: ${err}`);
    return { extractedContent: `Error: ${err}`, outputFile: null };
  }

  const outputFilename = `extracted_${filename.replace('.pdf', '')}.txt`;
  const outputPath = path.join(extractedDir, outputFilename);

  fs.writeFileSync(outputPath, text, 'utf-8');
  console.log(`Content saved at '${outputPath}'`);

  return { extractedContent: text, outputFile: outputFilename };
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
