const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    ipcCall: (channel, request) => ipcRenderer.invoke(channel, request),
    searchDocument: (params) => ipcRenderer.invoke('search-document', params),
    getDocument: (documentId) => ipcRenderer.invoke('get-document', documentId)
});