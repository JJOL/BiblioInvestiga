const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const backend = require('./backend-core');

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

ipcMain.handle('identify-document', async (event, file) => {
    const fileIdentification = backend.getFileIdentification(file);

    if (fileIdentification.fileType === 'PDF') {
        const fileInfo = await backend.getPDFInfo(file);
        const documentId = backend.generateDocumentId(fileInfo.filename, fileInfo.filename);

        return {
            fileType: fileIdentification.fileType,
            numPages: fileInfo.numPages,
            filename: fileInfo.filename,
            documentId
        }
    }

    return fileIdentification;
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

ipcMain.handle('get-document', async (event, documentId) => {
    try {
        const buffer = fs.readFileSync(path.join('uploads', `${documentId}.pdf`));

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