const { app, BrowserWindow, ipcMain, Menu } = require('electron');
if (require('electron-squirrel-startup')) app.quit();

const path = require('path');
const fs = require('fs');

const backend = require('./backend-core');
const { buffer } = require('stream/consumers');

const APP_DIR = app.getPath("userData");
const STORAGE_DIR = path.join(APP_DIR, 'appstorage');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, {
        recursive: true
    });
}
console.log('STORAGE_DIR:', STORAGE_DIR);

const selectTextMenu = Menu.buildFromTemplate([{ role: 'copy'}]);
function createWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Biblio Investiga',
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('dist/reader-app/browser/index.html');
    mainWindow.webContents.on('context-menu', () => {
        selectTextMenu.popup(mainWindow.webContents);
    });
    // mainWindow.webContents.openDevTools();
}


const TEXTS_FOLDER = path.join(STORAGE_DIR, 'texts');
if (!fs.existsSync(TEXTS_FOLDER)) {
    fs.mkdirSync(TEXTS_FOLDER);
}
const UPLOADS_FOLDER = path.join(STORAGE_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER);
}
const DOCUMENTS_BD_FILE = path.join(STORAGE_DIR, 'documents.json')
if (!fs.existsSync(DOCUMENTS_BD_FILE)) {
    fs.writeFileSync(DOCUMENTS_BD_FILE, JSON.stringify([]));
}

// import worker module and spawn 'search.worker.js' worker. It will post a string message to be printed
const worker = require('worker_threads');
let searchWorkerCb = undefined;
const searchWorker = new worker.Worker(path.join(__dirname, 'search.worker.js'));
searchWorker.on('message', (response) => {
    if (searchWorkerCb) {
        searchWorkerCb(response);
    }
});

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

ipcMain.handle('search-document', (event, request) => {
    return new Promise((resolve, reject) => {
        searchWorkerCb = resolve;
        request.TEXTS_FOLDER = TEXTS_FOLDER;
        request.DOCUMENTS_BD_FILE = DOCUMENTS_BD_FILE;
        searchWorker.postMessage(request);
    });
// ipcMain.handle('search-document', async (event, request) => {
//     let searchedText = request.searchedText;
//     let filename = request.filename;
//     let results = [];

//     if (!fs.existsSync(TEXTS_FOLDER)) {
//         fs.mkdirSync(TEXTS_FOLDER);
//     }
    
//     if (filename === undefined) {
//         results = backend.findTextInAllDocuments(searchedText, TEXTS_FOLDER);
//     } else if (filename.length > 0) {
//         results = backend.findTextInDocument(searchedText, TEXTS_FOLDER, `${filename}.json`);
//     } else {
//         results = [];
//     }

//     const documents = JSON.parse(fs.readFileSync(DOCUMENTS_BD_FILE, 'utf8'));
//     results = results.map(result => {
//         const document = documents.find(doc => doc.id === result.document);
//         return {
//             ...result,
//             documentTitle: document ? document.title : 'Unknown'
//         };
//     });

//     return {
//         success: true,
//         results
//     };
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
    let filePath = path.join(UPLOADS_FOLDER, `${documentId}.pdf`);
    // Create the folder if it doesn't exist
    if (!fs.existsSync(UPLOADS_FOLDER)) {
        fs.mkdirSync(UPLOADS_FOLDER);
    }
    // Save the file
    fs.writeFileSync(filePath, Buffer.from(data));

    // Load Documents from documents.json
    let documents = [];
    try {
        documents = JSON.parse(fs.readFileSync(DOCUMENTS_BD_FILE));
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
    fs.writeFileSync(DOCUMENTS_BD_FILE, JSON.stringify(documents, null, 2));

    if (!fs.existsSync(TEXTS_FOLDER)) {
        fs.mkdirSync(TEXTS_FOLDER);
    }
    const textContentFileName = `${TEXTS_FOLDER}/${documentId}.json`;
    const textContent = fileInfo.pagesContent.map((pageContent, index) => ({
        page: index + 1,
        content: pageContent
    }));
    fs.writeFileSync(textContentFileName, JSON.stringify(textContent, null, 2));

    return {
        success: true,
        document: newDocument
    };
});

ipcMain.handle('get-documents', async (event, request) => {
    // if documents.json doesn't exist, create it with an empty array
    if (!fs.existsSync(DOCUMENTS_BD_FILE)) {
        fs.writeFileSync(DOCUMENTS_BD_FILE, JSON.stringify([]));
    }

    // Load Documents from documents.json
    let documents = [];
    try {
        documents = JSON.parse(fs.readFileSync(DOCUMENTS_BD_FILE));
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
        const buffer = fs.readFileSync(path.join(UPLOADS_FOLDER, `${request.documentId}.pdf`));

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