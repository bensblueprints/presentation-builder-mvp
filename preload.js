const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('slidecraft', {
  saveDeck: (deck) => ipcRenderer.invoke('save-deck', deck),
  openDeck: () => ipcRenderer.invoke('open-deck'),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  exportPptx: (deck) => ipcRenderer.invoke('export-pptx', deck),
  exportPdf: (deck) => ipcRenderer.invoke('export-pdf', deck)
});
