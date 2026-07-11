const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1460,
    height: 940,
    minWidth: 1080,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#0b0c10',
    title: 'Slidecraft',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('save-deck', async (e, deck) => {
  const r = await dialog.showSaveDialog(win, {
    title: 'Save deck',
    defaultPath: (deck.title || 'deck').replace(/[^\w-]+/g, '-') + '.slidecraft',
    filters: [{ name: 'Slidecraft deck', extensions: ['slidecraft', 'json'] }]
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, JSON.stringify(deck, null, 2));
  return r.filePath;
});

ipcMain.handle('open-deck', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Open deck',
    filters: [{ name: 'Slidecraft deck', extensions: ['slidecraft', 'json'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
});

ipcMain.handle('pick-image', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Choose image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mime};base64,${fs.readFileSync(p).toString('base64')}`;
});

ipcMain.handle('export-pptx', async (e, deck) => {
  const r = await dialog.showSaveDialog(win, {
    title: 'Export PPTX',
    defaultPath: (deck.title || 'deck').replace(/[^\w-]+/g, '-') + '.pptx',
    filters: [{ name: 'PowerPoint', extensions: ['pptx'] }]
  });
  if (r.canceled || !r.filePath) return null;
  const { deckToPptxBuffer } = require(path.join(__dirname, 'src', 'core', 'export-pptx.js'));
  fs.writeFileSync(r.filePath, await deckToPptxBuffer(deck));
  return r.filePath;
});

ipcMain.handle('export-pdf', async (e, deck) => {
  const r = await dialog.showSaveDialog(win, {
    title: 'Export PDF',
    defaultPath: (deck.title || 'deck').replace(/[^\w-]+/g, '-') + '.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (r.canceled || !r.filePath) return null;
  const { deckToPdfBuffer } = require(path.join(__dirname, 'src', 'core', 'export-pdf.js'));
  fs.writeFileSync(r.filePath, await deckToPdfBuffer(deck));
  return r.filePath;
});
