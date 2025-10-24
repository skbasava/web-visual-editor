/**
 * Electron Main Process
 * Creates the application window and manages the Electron lifecycle.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Development mode - load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log ready state
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ SoC Simulator loaded successfully');
    mainWindow.setTitle('SoC Simulator - Visual Architecture Editor');
  });
}

/**
 * App lifecycle events
 */

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Re-create window on macOS when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
