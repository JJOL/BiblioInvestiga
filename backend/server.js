const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFParser = require('pdf-parse');
// const crypto = require('crypto-js');
const {
    createHash,
  } = require('node:crypto');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with UTF-8 encoding
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
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

function getFileIdentification(file) {
    const fileName = file.originalname;
    const fileExtension = path.extname(fileName).toLowerCase();

    let fileType;
    switch (fileExtension) {
        case '.pdf':
            fileType = 'PDF';
            break;
        case '.doc':
        case '.docx':
            fileType = 'WORD DOCUMENT';
            break;
        default:
            fileType = 'UNKNOWN';
    }
    return { fileType };
}

async function getPDFInfo(file) {
    const pagesContent = [];

    function renderPage(pageData) {

        let render_options = {
            //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
            normalizeWhitespace: false,
            //do not attempt to combine same line TextItem's. The default value is `false`.
            disableCombineTextItems: false
        }

        return pageData.getTextContent(render_options)
            .then(function(textContent) {
                let lastY, text = '';
                //https://github.com/mozilla/pdf.js/issues/8963
                //https://github.com/mozilla/pdf.js/issues/2140
                //https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
                //https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY){
                        text += item.str;
                    }  
                    else{
                        text += '\n' + item.str;
                    }    
                    lastY = item.transform[5];
                }            
                //let strings = textContent.items.map(item => item.str);
                //let text = strings.join("\n");
                //text = text.replace(/[ ]+/ig," ");
                //ret.text = `${ret.text} ${text} \n\n`;

                pagesContent.push(text);
                return text;
            });
    }

    try {
        let options = {
            pagerender: renderPage
        };
        const data = await PDFParser(file.buffer, options);

        return {
            filename: file.originalname,
            fileType: getFileIdentification(file).fileType,
            numPages: data.numpages,
            pagesContent: pagesContent
        };
    } catch (error) {
        console.error('Error processing PDF:', error);
        throw new Error('Failed to process PDF file');
    }
}


// Creates a word index for each page. That is, a set of unique words for each page.
function makePdfDictionary(pagesContent) {
    const pdfDictionary = []
    for (let pageContent of pagesContent) {
        const words = pageContent.split(/\s+/);
        const uniqueWords = new Set(words);
        pdfDictionary.push(Array.from(uniqueWords));
    }
    return pdfDictionary;
}

// Route for document identification
app.post('/identify-document', identifyDocumentUpload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure filename is properly encoded in UTF-8
    req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const fileIdentification = getFileIdentification(req.file);
    
    try {
        if (fileIdentification.fileType === 'PDF') {
            const fileInfo = await getPDFInfo(req.file);

            const pdfDictionary = makePdfDictionary(fileInfo.pagesContent);

            // save pdfDictionary to file in the path 'dictionaries/<filename>.json'
            // create the dictionaries folder if it doesn't exist
            const dictionariesFolder = 'dictionaries';
            if (!fs.existsSync(dictionariesFolder)) {
                fs.mkdirSync(dictionariesFolder);
            }

            const dictionaryFileName = `${dictionariesFolder}/${fileInfo.filename}.json`;
            fs.writeFileSync(dictionaryFileName, JSON.stringify(pdfDictionary, null, 2));

            const textContentFolder = 'texts';
            if (!fs.existsSync(textContentFolder)) {
                fs.mkdirSync(textContentFolder);
            }

            // save each page content in an entry of an array similar to the pdfDictionary
            const textContentFileName = `${textContentFolder}/${fileInfo.filename}.json`;
            const textContent = fileInfo.pagesContent.map((pageContent, index) => ({
                page: index + 1,
                content: pageContent
            }));
            fs.writeFileSync(textContentFileName, JSON.stringify(textContent, null, 2));


            res.json({
                fileType: fileIdentification.fileType,
                numPages: fileInfo.numPages,
                filename: fileInfo.filename,
                pagesDictionary: pdfDictionary
            });
        } else {
            res.json({
                fileType: fileIdentification.fileType,
                filename: req.file.originalname,
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});



function findTextInDocument(searchedText, documentFileName) {
    try {
        // Read the document content from the texts folder
        const textContentPath = `texts/${documentFileName}`;
        if (!fs.existsSync(textContentPath)) {
            throw new Error('Document content not found');
        }

        const textContent = JSON.parse(fs.readFileSync(textContentPath, 'utf8'));
        const results = [];

        // Normalize the searched text (trim, collapse whitespace, and convert to lowercase)
        const normalizedSearchText = searchedText
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .normalize('NFD')  // Decompose UTF-8 characters
            .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

        // Search through each page
        textContent.forEach(page => {
            // Normalize the page content (replace newlines, collapse whitespace, and convert to lowercase)
            const normalizedContent = page.content
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase()
                .normalize('NFD')  // Decompose UTF-8 characters
                .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
            
            let lastIndex = 0;
            let occurrenceIndex = 0;

            // Find all occurrences in this page
            while (true) {
                const index = normalizedContent.indexOf(normalizedSearchText, lastIndex);
                if (index === -1) break;

                // Get the original text from the content using the same length as the match
                const originalText = page.content
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(index, index + searchedText.length);

                results.push({
                    document: documentFileName.replace('.json', ''),  // Remove .json extension
                    page: page.page,
                    occurrenceIndex: occurrenceIndex,
                    text: originalText,  // Use the original case from the document
                    context: extractContext(page.content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(), 
                                         index, searchedText.length)
                });

                lastIndex = index + 1;
                occurrenceIndex++;
            }
        });

        return results;

    } catch (error) {
        console.error('Error searching text:', error);
        throw error;
    }
}

function findTextInAllDocuments(searchedText) {
    try {
        const textsFolder = 'texts';
        const files = fs.readdirSync(textsFolder);
        let allResults = [];

        // Filter for .json files and search in each document
        files.filter(file => file.endsWith('.json'))
             .forEach(file => {
                try {
                    const results = findTextInDocument(searchedText, file);
                    allResults = allResults.concat(results);
                } catch (error) {
                    console.error(`Error searching in ${file}:`, error);
                    // Continue with other files even if one fails
                }
             });

        return allResults;
    } catch (error) {
        console.error('Error searching across documents:', error);
        throw error;
    }
}

function extractContext(content, index, searchLength, contextLength = 50) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + searchLength + contextLength);
    
    let context = content.substring(start, end);
    
    // Add ellipsis if we're not at the start/end of the content
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';
    
    return context;
}

// Update the search endpoint
app.post('/search-document', express.json(), async (req, res) => {
    const { searchedText, filename } = req.body;

    if (!searchedText) {
        return res.status(400).json({ 
            error: 'Missing required parameter: searchedText' 
        });
    }

    try {
        let results;
        if (filename) {
            // Search in specific document
            results = findTextInDocument(searchedText, `${filename}.json`);
        } else {
            // Search across all documents
            results = findTextInAllDocuments(searchedText);
        }
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Failed to search document',
            details: error.message 
        });
    }
});

// New endpoint for document upload
app.post('/upload-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Ensure filename is properly encoded in UTF-8
    req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const metadata = JSON.parse(req.body.metadata);

    // metadata has pageCount. Trust that fileType is PDF and numPages is the same as pageCount
    const document = {
      ...metadata,
      id: createHash('md5').update(metadata.title).digest('hex'),
      addedDate: new Date(),
      pageCount: metadata.pageCount
    };

    // Store document metadata with UTF-8 encoding
    const documentsFile = 'documents.json';
    let documents = [];
    if (fs.existsSync(documentsFile)) {
      documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
    }
    documents.push(document);
    fs.writeFileSync(documentsFile, JSON.stringify(documents, null, 2), 'utf8');

    res.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload document' 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
