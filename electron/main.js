const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

console.log('CRAISEE Desk - Main process started')
console.log('Development mode:', isDev)
console.log('Platform:', process.platform)
console.log('Architecture:', process.arch)

// Keep a global reference of the window object
let mainWindow

// Function to find available Next.js dev server port
async function findDevServerPort() {
  const http = require('http')
  
  // Try common ports in order
  const portsToTry = [3000, 3001, 3002, 3003]
  
  for (const port of portsToTry) {
    try {
      console.log(`🔍 Checking port ${port} for Next.js server...`)
      
      // Make HTTP request to check if Next.js is running
      const isNextJSRunning = await new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          console.log(`✅ Port ${port} responded with status ${res.statusCode}`)
          resolve(res.statusCode === 200 || res.statusCode === 404) // 404 is OK for Next.js
        })
        
        req.on('error', (error) => {
          console.log(`❌ Port ${port} error:`, error.code)
          resolve(false)
        })
        
        req.setTimeout(1000, () => {
          console.log(`⏰ Port ${port} timeout`)
          req.abort()
          resolve(false)
        })
      })
      
      if (isNextJSRunning) {
        console.log(`🎯 Found Next.js server on port ${port}`)
        return port
      }
    } catch (error) {
      console.log(`❌ Error checking port ${port}:`, error.message)
      continue
    }
  }
  
  console.log('⚠️ No Next.js dev server found, defaulting to port 3000')
  return 3000
}

async function createWindow() {
  console.log('🚀 Creating main window...')
  
  // Get the correct preload path
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('📁 Preload script path:', preloadPath)
  
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
      preload: preloadPath,
      webSecurity: !isDev, // Disable in dev for local development
      allowRunningInsecureContent: isDev, // Allow in dev mode
      experimentalFeatures: true,
      // Add polyfills for Node.js globals
      additionalArguments: ['--enable-features=VaapiVideoDecoder']
    },
    // Full transparency settings for macOS with draggable title bar
    transparent: true,
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Fully transparent
    vibrancy: 'ultra-dark', // macOS vibrancy effect
    visualEffectState: 'active',
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../public/icon.png'),
    // Enable dragging for the entire window
    movable: true,
    resizable: true,
  })

  // Load the app with dynamic port detection
  let startUrl
  if (isDev) {
    const port = await findDevServerPort()
    startUrl = `http://localhost:${port}`
  } else {
    startUrl = `file://${path.join(__dirname, '../dist/index.html')}`
  }
  
  console.log('🌐 Loading URL:', startUrl)
  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Window ready to show')
    mainWindow.show()
    
    // Focus the window
    mainWindow.focus()
    
    // Open DevTools in development
    if (isDev) {
      console.log('🔧 Opening DevTools...')
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    console.log('🚪 Window closed')
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('🔗 Opening external URL:', url)
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== new URL(startUrl).origin) {
      console.log('🚫 Preventing navigation to external site:', navigationUrl)
      event.preventDefault()
    }
  })

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('📄 Page finished loading')
  })

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message) => {
    const levelStr = typeof level === 'string' ? level.toUpperCase() : String(level).toUpperCase()
    console.log(`[RENDERER ${levelStr}]:`, message)
  })
}

// IPC handlers for window controls
ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

// This method will be called when Electron has finished initialization
app.whenReady().then(() => createWindow())

// Quit when all windows are closed
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
      defaultPath: 'craisee-creation.png',
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

