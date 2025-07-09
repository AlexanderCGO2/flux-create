const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')

// Simple development check instead of electron-is-dev
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

console.log('Flux Create - Main process started')
console.log('Development mode:', isDev)
console.log('Platform:', process.platform)
console.log('Architecture:', process.arch)

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window with transparency
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
    },
    // Full transparency settings for macOS
    transparent: true,
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Fully transparent
    vibrancy: 'ultra-dark', // macOS vibrancy effect
    visualEffectState: 'active',
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../public/icon.png'),
  })

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`
  
  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus the window
    mainWindow.focus()
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== new URL(startUrl).origin) {
      event.preventDefault()
    }
  })
}

// App event handlers
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// IPC handlers for file operations
ipcMain.handle('save-file', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'flux-creation.png',
      filters: [
        { name: 'PNG Images', extensions: ['png'] },
        { name: 'JPG Images', extensions: ['jpg', 'jpeg'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (filePath) {
      const fs = require('fs')
      const base64Data = data.replace(/^data:image\/\w+;base64,/, '')
      fs.writeFileSync(filePath, base64Data, 'base64')
      return { success: true, path: filePath }
    }
    
    return { success: false, message: 'Save cancelled' }
  } catch (error) {
    console.error('Save error:', error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle('open-file', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] }
      ]
    })
    
    if (filePaths.length > 0) {
      const fs = require('fs')
      const filePath = filePaths[0]
      const fileData = fs.readFileSync(filePath)
      const base64 = fileData.toString('base64')
      const mimeType = path.extname(filePath).slice(1)
      
      return {
        success: true,
        data: `data:image/${mimeType};base64,${base64}`,
        path: filePath
      }
    }
    
    return { success: false, message: 'No file selected' }
  } catch (error) {
    console.error('Open file error:', error)
    return { success: false, message: error.message }
  }
})

// Voice control handlers
ipcMain.handle('start-voice-recognition', async () => {
  // Implementation for voice recognition
  return { success: true, message: 'Voice recognition started' }
})

ipcMain.handle('stop-voice-recognition', async () => {
  // Implementation to stop voice recognition
  return { success: true, message: 'Voice recognition stopped' }
})

