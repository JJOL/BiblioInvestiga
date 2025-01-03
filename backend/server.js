const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const {
    findTextInDocument,
    findTextInAllDocuments,
    generateDocumentId,
    getPDFInfo,
    getFileIdentification
} = require('./backend-core');

const app = express();
const port = 3000;

const TEXTS_FOLDER = 'texts';
const UPLOADS_FOLDER = 'uploads';


// Enable CORS
app.use(cors());

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      fs.mkdirSync(UPLOADS_FOLDER);
    }
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const newFilename = Buffer.from(file.originalname).toString('utf8');
    cb(null, newFilename);
  }
});

const upload = multer({ storage });

// in memory storage multer for identify-document
const identifyDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

app.use(bodyParser.urlencoded({ extended: true }));

// Route for document identification
app.get('/identify-document', identifyDocumentUpload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const fileIdentification = getFileIdentification(req.file);
    
    try {
        if (fileIdentification.fileType === 'PDF') {
            const fileInfo = await getPDFInfo(req.file);

            res.json({
                success: true,
                info: {
                    fileType: fileIdentification.fileType,
                    filename: fileInfo.filename,
                    numPages: fileInfo.numPages,
                }
            });
        } else {
            res.json({
                success: true,
                info: {
                    fileType: fileIdentification.fileType,
                    filename: req.file.originalname,
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// Update the search endpoint
app.post('/search-document', async (req, res) => {
    const searchedText = req.body.searchedText;
    const filename = req.body.filename;

    if (!searchedText) {
        return res.status(400).json({ 
            error: 'Missing required parameter: searchedText' 
        });
    }

    try {
        let results;
        if (filename) {
            results = findTextInDocument(searchedText, TEXTS_FOLDER, `${filename}.json`);
        } else {
            results = findTextInAllDocuments(searchedText, TEXTS_FOLDER);
        }
        // add to each result its document title from documents.json matching id with entry.title
        const documents = JSON.parse(fs.readFileSync('documents.json', 'utf8'));

        results = results.map(result => {
            const document = documents.find(doc => doc.id === result.document);
            return {
                ...result,
                documentTitle: document ? document.title : 'Unknown'
            };
        });
        
        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Failed to search document',
            details: error.message 
        });
    }
});

// New endpoint for document upload
app.post('/documents', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        let title = req.body.title;
        let author = req.body.author;
        let publishedDate = req.body.publishedDate;

        // validate title, author, publishedDate
        if (!title || title.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required parameter: title' });
        }
        if (!author || author.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required parameter: author' });
        }
        if (!publishedDate || publishedDate.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required parameter: publishedDate' });
        }

        const originalFilename = req.file.filename;
        let documentId = generateDocumentId(title, originalFilename);

        const file = fs.readFileSync(path.join('uploads', originalFilename));
        file.originalname = originalFilename;

        const fileInfo = await getPDFInfo(file);
        if (fileInfo.fileType !== 'PDF') {
            return res.status(400).json({ success: false, error: 'File is not a PDF' });
        }
        
        const newFilename = `${documentId}.pdf`;
        fs.renameSync(
            path.join(UPLOADS_FOLDER, originalFilename), // Use the decoded filename
            path.join(UPLOADS_FOLDER, newFilename)
        );

        const document = {
            id: documentId,
            title,
            author,
            publishedDate,
            addedDate: new Date().toISOString(),
            filename: newFilename,
            originalFilename,
            numPages: fileInfo.numPages
        };

        // Update documents.json
        const documentsFile = 'documents.json';
        let documents = [];
        if (fs.existsSync(documentsFile)) {
            documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
        }
        documents.push(document);
        fs.writeFileSync(documentsFile, JSON.stringify(documents, null, 2), 'utf8');

        // Save text content with document ID
        const textContentFolder = 'texts';
        if (!fs.existsSync(textContentFolder)) {
            fs.mkdirSync(textContentFolder);
        }
        const textContentFileName = `${textContentFolder}/${documentId}.json`;
        const textContent = fileInfo.pagesContent.map((pageContent, index) => ({
            page: index + 1,
            content: pageContent
        }));
        fs.writeFileSync(textContentFileName, JSON.stringify(textContent, null, 2));

        res.json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, error: 'Failed to upload document' });
    }
});

// Update document serving endpoint to use ID
app.get('/documents/:id/file', (req, res) => {
    try {
        const documentId = req.params.id;
    const filePath = path.join('uploads', `${documentId}.pdf`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${documentId}.pdf"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ error: 'Failed to serve document' });
    }
});

app.get('/documents', (req, res) => {
    const documents = fs.readFileSync('documents.json', 'utf8');
    res.json({
        success: true,
        documents: JSON.parse(documents)
    });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
