// post a message to the root worker "Hello from search.worker.js"
const { parentPort } = require('worker_threads');
const fs = require('fs');
const backend = require('./backend-core');


parentPort.on('message', (request) => {
    const TEXTS_FOLDER = request.TEXTS_FOLDER;
    const DOCUMENTS_BD_FILE = request.DOCUMENTS_BD_FILE;
    
    let searchedText = request.searchedText;
    let filename = request.filename;
    let results = [];
    
    if (!fs.existsSync(TEXTS_FOLDER)) {
        fs.mkdirSync(TEXTS_FOLDER);
    }
        
    if (filename === undefined) {
        results = backend.findTextInAllDocuments(searchedText, TEXTS_FOLDER);
    } else if (filename.length > 0) {
        results = backend.findTextInDocument(searchedText, TEXTS_FOLDER, `${filename}.json`);
    } else {
        results = [];
    }

    const documents = JSON.parse(fs.readFileSync(DOCUMENTS_BD_FILE, 'utf8'));
    results = results.map(result => {
        const document = documents.find(doc => doc.id === result.document);
        return {
            ...result,
            documentTitle: document ? document.title : 'Unknown'
        };
    });

    parentPort.postMessage({
        success: true,
        results
    });
});