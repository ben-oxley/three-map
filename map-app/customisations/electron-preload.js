const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendMapUpdate: (buffer) => ipcRenderer.send('update-map', buffer)
});
