const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const backend = require('./backend-core');
const { buffer } = require('stream/consumers');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('dist/reader-app/browser/index.html');
    mainWindow.webContents.openDevTools();
}

ipcMain.handle('identify-document', async (event, request) => {
    let filename = request.file.filename;
    let data = request.file.data; // UInt8Array

    let file = {
        originalname: filename,
        buffer: Buffer.from(data)
    };

    const fileIdentification = backend.getFileIdentification(file);

    if (fileIdentification.fileType === 'PDF') {
        const fileInfo = await backend.getPDFInfo(file);
        const documentId = backend.generateDocumentId(fileInfo.filename, fileInfo.filename);

        return {
            success: true,
            info: {
                fileType: fileIdentification.fileType,
                numPages: fileInfo.numPages,
                filename: fileInfo.filename,
                documentId
            }
        };
    }

    return {
        info: fileIdentification
    };
});

ipcMain.handle('search-document', async (event, { searchedText, filename}) => {
    let results = [];
    if (filename === undefined) {
        results = backend.findTextInAllDocuments(searchedText);
    } else if (filename.length > 0) {
        results = backend.findTextInDocument(searchedText, filename);
    } else {
        results = [];
    }

    return { results };
});

ipcMain.handle('upload-document', async (event, request) => {
    let meta = {
        title: request.title,
        author: request.author,
        publishedDate: request.publishedDate
    };
    let filename = request.file.filename;
    let data = request.file.data; // UInt8Array
    let file = {
        originalname: filename,
        buffer: Buffer.from(data)
    };

    const fileInfo = await backend.getPDFInfo(file);
    if (fileInfo.fileType !== 'PDF') {
        return { success: false, error: 'File is not a PDF' };
    }

    let documentId = backend.generateDocumentId(meta.title, filename);
    let filePath = path.join('uploads', `${documentId}.pdf`);
    // Create the folder if it doesn't exist
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }
    // Save the file
    fs.writeFileSync(filePath, Buffer.from(data));

    // Load Documents from documents.json
    let documents = [];
    try {
        documents = JSON.parse(fs.readFileSync('documents.json'));
    } catch (error) {
        console.error('Error reading documents.json: ', error);
    }
    let newDocument = {
        id: documentId,
        title: meta.title,
        author: meta.author,
        publishedDate: meta.publishedDate,
        addedDate: new Date().toISOString(),
        filename: `${documentId}.pdf`,
        originalFilename: filename,
        numPages: fileInfo.numPages
    };
    documents.push(newDocument);
    fs.writeFileSync('documents.json', JSON.stringify(documents, null, 2));

    return {
        success: true,
        document: newDocument
    };
});

ipcMain.handle('get-documents', async (event, request) => {
    // if documents.json doesn't exist, create it with an empty array
    if (!fs.existsSync('documents.json')) {
        fs.writeFileSync('documents.json', JSON.stringify([]));
    }

    // Load Documents from documents.json
    let documents = [];
    try {
        documents = JSON.parse(fs.readFileSync('documents.json'));
    } catch (error) {
        console.error('Error reading documents.json: ', error);
    }

    return {
        success: true,
        documents: documents
    };
});

ipcMain.handle('get-document', async (event, request) => {
    try {
        const buffer = fs.readFileSync(path.join('uploads', `${request.documentId}.pdf`));

        return {
            success: true,
            data: new Uint8Array(buffer)
        };
    } catch (error) {
        console.error('Error reading PDF file: ', error);
        
        return {
            success: false,
            error: 'Error reading PDF file'
        }
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});