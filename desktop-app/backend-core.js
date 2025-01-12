const path = require('path');
const fs = require('fs');
const PDFParser = require('pdf-parse');
const {
    createHash,
  } = require('node:crypto');

  
function generateDocumentId(title, filename) {
    const uniqueString = `${title}-${filename}-${Date.now()}`;
    return createHash('md5').update(uniqueString).digest('hex');
}

function findTextInDocument(searchedText, textsFolder, documentFileName) {
    try {
        // Read the document content from the texts folder
        const textContentPath = path.join(textsFolder, documentFileName);
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

function findTextInAllDocuments(searchedText, textsFolder) {
    const MAX_RESULTS_SIZE = 1000;
    try {
        const files = fs.readdirSync(textsFolder);
        let allResults = [];

        // Filter for .json files and search in each document
        for (let file of files.filter(file => file.endsWith('.json'))) {
            try {
                const results = findTextInDocument(searchedText, textsFolder, file);
                allResults = allResults.concat(results);
                if (allResults.length > MAX_RESULTS_SIZE) {
                    return [];
                }
            } catch (error) {
                console.error(`Error searching in ${file}:`, error);
                // Continue with other files even if one fails
            }
        }
        // files.filter(file => file.endsWith('.json'))
        //      .forEach(file => {
        //         try {
        //             const results = findTextInDocument(searchedText, textsFolder, file);
        //             allResults = allResults.concat(results);
        //         } catch (error) {
        //             console.error(`Error searching in ${file}:`, error);
        //             // Continue with other files even if one fails
        //         }
        //      });

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

module.exports = {
    findTextInDocument,
    findTextInAllDocuments,
    generateDocumentId,
    getPDFInfo,
    getFileIdentification
};
