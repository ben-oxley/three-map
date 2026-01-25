const { app, BrowserWindow, ipcMain } = require('electron');
const express = require('express');
const path = require('path');

const serverApp = express();
const PORT = 3000;

let currentMapBuffer = null;

// API to get the latest map image directly
serverApp.get('/map.png', (req, res) => {
    if (currentMapBuffer) {
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': currentMapBuffer.length,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(currentMapBuffer);
    } else {
        res.status(404).send('No map data available yet');
    }
});

// Start internal server
serverApp.listen(PORT, () => {
    console.log(`Internal Map Server running at http://localhost:${PORT}/map.png`);
});

// IPC Listener to receive updates from Renderer
ipcMain.on('update-map', (event, buffer) => {
    // buffer comes in as a Node Buffer from Electron IPC logic usually,
    // but explicit conversion ensures we have a Node Buffer with .length
    currentMapBuffer = Buffer.from(buffer);
});


function createWindow() {
    const win = new BrowserWindow({
        width: 1080,
        height: 1920,
        webPreferences: {
            preload: path.join(__dirname, 'electron-preload.js'),
            // Security: contextIsolation should be true for preload to work right with contextBridge
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Load the local dev server (defaulting to typical Vite port)
    // Adjust this URL if your dev server runs elsewhere
    win.loadURL('http://localhost:8080');

    // Open DevTools for debugging
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
