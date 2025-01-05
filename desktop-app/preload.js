const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    searchDocument: (params) => ipcRenderer.invoke('search-document', params),
    getDocument: (documentId) => ipcRenderer.invoke('get-document', documentId)
});