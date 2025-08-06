const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  
  // Download handling
  downloadFile: (url, filename) => {
    return ipcRenderer.invoke('download-file', url, filename);
  },
  
  // Check if we're in Electron
  isElectron: true
});