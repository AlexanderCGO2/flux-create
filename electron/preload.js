const { app, BrowserWindow, ipcMain, globalShortcut, Menu, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const Store = require('electron-store');

// Initialize electron-store for persistence
const store = new Store();

// Enable live reload for development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;
let splashWindow;

// Create the main application window with glass effects
function createMainWindow() {
  const windowBounds = store.get('window-bounds', {
    width: 1920,
    height: 1080,
    x: undefined,
    y: undefined
  });

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    minWidth: 1024,
    minHeight: 768,
    
    // Glass overlay configuration
    transparent: true,
    frame: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark', // macOS glass effect
    backgroundMaterial: 'acrylic', // Windows glass effect
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: true,
    },
    
    // Performance optimizations
    show: false, // Hide until ready
    paintWhenInitiallyHidden: false,
    
    // Accessibility
    accessibleTitle: 'Flux Create - AI Image Editor',
    
    // Icon configuration
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Load the Next.js application
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Enable hardware acceleration for voice and canvas performance
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('disable-software-rasterizer');

  // Window event handlers
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    
    // Focus for accessibility
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    store.set('window-bounds', mainWindow.getBounds());
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Voice command global shortcuts
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    mainWindow.webContents.send('voice-toggle');
  });

  globalShortcut.register('CommandOrControl+Shift+M', () => {
    mainWindow.webContents.send('voice-mute');
  });

  return mainWindow;
}

// Create splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load splash HTML
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-project'),
        },
        {
          label: 'Open Image',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-image', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save'),
        },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu-export'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Voice',
      submenu: [
        {
          label: 'Toggle Voice Control',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => mainWindow.webContents.send('voice-toggle'),
        },
        {
          label: 'Voice Settings',
          click: () => mainWindow.webContents.send('voice-settings'),
        },
        {
          label: 'Voice Tutorial',
          click: () => mainWindow.webContents.send('voice-tutorial'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for voice and file operations
ipcMain.handle('voice-process-command', async (event, audioData) => {
  // Voice processing will be handled in the renderer process
  // This is a placeholder for future native voice processing
  console.log('Voice command received:', audioData.length, 'bytes');
  return { success: true, command: 'processed' };
});

ipcMain.handle('file-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('file-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('app-get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app-get-path', (event, name) => {
  return app.getPath(name);
});

// Application ready
app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();
  createMenu();

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Window closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});

// Clean up on quit
app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});

console.log('Flux Create - Main process started');
console.log('Development mode:', isDev);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
