const { contextBridge, ipcRenderer } = require('electron');

// Log preload script loading
console.log('🔌 Preload script loaded');
console.log('🔧 Node integration:', process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : 'PRODUCTION');

// Polyfill for global in renderer process (needed for Next.js)
if (typeof global === 'undefined') {
  global = globalThis;
}

// Polyfill for process.env (needed for Next.js/React)
if (typeof process === 'undefined') {
  process = {
    env: {
      NODE_ENV: 'development'
    }
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    closeWindow: () => {
      console.log('🔵 [ELECTRON] Close window requested')
      return ipcRenderer.invoke('window-close')
    },
    minimizeWindow: () => {
      console.log('🔵 [ELECTRON] Minimize window requested')
      return ipcRenderer.invoke('window-minimize')
    },
    maximizeWindow: () => {
      console.log('🔵 [ELECTRON] Maximize window requested')
      return ipcRenderer.invoke('window-maximize')
    },
    
    // File operations
    openFile: () => {
      console.log('🔵 [ELECTRON] Open file dialog requested')
      return ipcRenderer.invoke('open-file')
    },
    saveFile: (data) => {
      console.log('🔵 [ELECTRON] Save file requested')
      return ipcRenderer.invoke('save-file', data)
    },
    
    // System info
    platform: process.platform,
    version: process.versions.electron,
    isDev: process.env.NODE_ENV === 'development',
    
    // App events
    onAppReady: (callback) => ipcRenderer.on('app-ready', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  });

  console.log('✅ ElectronAPI exposed successfully');
} catch (error) {
  console.error('❌ Failed to expose ElectronAPI:', error);
}

// Voice API for direct voice control
try {
  contextBridge.exposeInMainWorld('voiceAPI', {
    // Voice recognition
    startListening: () => {
      console.log('🔵 [VOICE] Start listening requested')
      return ipcRenderer.send('voice-start-listening')
    },
    stopListening: () => {
      console.log('🔵 [VOICE] Stop listening requested')
      return ipcRenderer.send('voice-stop-listening')
    },
    
    // Voice synthesis
    speak: (text, options = {}) => {
      console.log('🔵 [VOICE] Speak requested:', text)
      return ipcRenderer.send('voice-speak', text, options)
    },
    stopSpeaking: () => {
      console.log('🔵 [VOICE] Stop speaking requested')
      return ipcRenderer.send('voice-stop-speaking')
    },
    
    // Voice callbacks
    onVoiceResult: (callback) => ipcRenderer.on('voice-result', (event, result) => callback(result)),
    onVoiceError: (callback) => ipcRenderer.on('voice-error', (event, error) => callback(error)),
    onVoiceEnd: (callback) => ipcRenderer.on('voice-end', (event) => callback()),
    
    // Voice settings
    setVoiceLanguage: (language) => ipcRenderer.send('voice-set-language', language),
    getVoiceLanguages: () => ipcRenderer.invoke('voice-get-languages'),
    
    // Accessibility voice features
    enableVoiceNavigation: () => ipcRenderer.send('voice-enable-navigation'),
    disableVoiceNavigation: () => ipcRenderer.send('voice-disable-navigation'),
  });

  console.log('✅ VoiceAPI exposed successfully');
} catch (error) {
  console.error('❌ Failed to expose VoiceAPI:', error);
}

// Canvas API for image manipulation
try {
  contextBridge.exposeInMainWorld('canvasAPI', {
    // Canvas operations
    createCanvas: (width, height) => {
      console.log('🔵 [CANVAS] Create canvas requested:', width, 'x', height)
      return ipcRenderer.invoke('canvas-create', width, height)
    },
    resizeCanvas: (width, height) => {
      console.log('🔵 [CANVAS] Resize canvas requested:', width, 'x', height)
      return ipcRenderer.send('canvas-resize', width, height)
    },
    clearCanvas: () => {
      console.log('🔵 [CANVAS] Clear canvas requested')
      return ipcRenderer.send('canvas-clear')
    },
    
    // Image operations
    loadImage: (imagePath) => {
      console.log('🔵 [CANVAS] Load image requested:', imagePath)
      return ipcRenderer.invoke('canvas-load-image', imagePath)
    },
    saveImage: (format, quality) => {
      console.log('🔵 [CANVAS] Save image requested:', format, quality)
      return ipcRenderer.invoke('canvas-save-image', format, quality)
    },
    exportImage: (format, options) => {
      console.log('🔵 [CANVAS] Export image requested:', format, options)
      return ipcRenderer.invoke('canvas-export-image', format, options)
    },
    
    // Filter operations
    applyFilter: (filterName, options) => {
      console.log('🔵 [CANVAS] Apply filter requested:', filterName, options)
      return ipcRenderer.invoke('canvas-apply-filter', filterName, options)
    },
    removeFilter: (filterId) => {
      console.log('🔵 [CANVAS] Remove filter requested:', filterId)
      return ipcRenderer.send('canvas-remove-filter', filterId)
    },
    
    // Layer operations
    addLayer: (layerData) => {
      console.log('🔵 [CANVAS] Add layer requested')
      return ipcRenderer.invoke('canvas-add-layer', layerData)
    },
    removeLayer: (layerId) => {
      console.log('🔵 [CANVAS] Remove layer requested:', layerId)
      return ipcRenderer.send('canvas-remove-layer', layerId)
    },
    moveLayer: (layerId, direction) => {
      console.log('🔵 [CANVAS] Move layer requested:', layerId, direction)
      return ipcRenderer.send('canvas-move-layer', layerId, direction)
    },
    
    // History operations
    undo: () => {
      console.log('🔵 [CANVAS] Undo requested')
      return ipcRenderer.send('canvas-undo')
    },
    redo: () => {
      console.log('🔵 [CANVAS] Redo requested')
      return ipcRenderer.send('canvas-redo')
    },
    getHistory: () => {
      console.log('🔵 [CANVAS] Get history requested')
      return ipcRenderer.invoke('canvas-get-history')
    },
  });

  console.log('✅ CanvasAPI exposed successfully');
} catch (error) {
  console.error('❌ Failed to expose CanvasAPI:', error);
}

// AI API for AI-powered features  
try {
  contextBridge.exposeInMainWorld('aiAPI', {
    // Image generation
    generateImage: (prompt, options) => {
      console.log('🔵 [AI] Generate image requested:', prompt, options)
      return ipcRenderer.invoke('ai-generate-image', prompt, options)
    },
    enhanceImage: (imageData, prompt) => {
      console.log('🔵 [AI] Enhance image requested:', prompt)
      return ipcRenderer.invoke('ai-enhance-image', imageData, prompt)
    },
    
    // Style transfer
    applyStyle: (imageData, stylePrompt) => {
      console.log('🔵 [AI] Apply style requested:', stylePrompt)
      return ipcRenderer.invoke('ai-apply-style', imageData, stylePrompt)
    },
    
    // Object detection and manipulation
    detectObjects: (imageData) => {
      console.log('🔵 [AI] Detect objects requested')
      return ipcRenderer.invoke('ai-detect-objects', imageData)
    },
    removeObject: (imageData, objectMask) => {
      console.log('🔵 [AI] Remove object requested')
      return ipcRenderer.invoke('ai-remove-object', imageData, objectMask)
    },
    replaceObject: (imageData, objectMask, prompt) => {
      console.log('🔵 [AI] Replace object requested:', prompt)
      return ipcRenderer.invoke('ai-replace-object', imageData, objectMask, prompt)
    },
    
    // Background operations
    removeBackground: (imageData) => {
      console.log('🔵 [AI] Remove background requested')
      return ipcRenderer.invoke('ai-remove-background', imageData)
    },
    replaceBackground: (imageData, backgroundPrompt) => {
      console.log('🔵 [AI] Replace background requested:', backgroundPrompt)
      return ipcRenderer.invoke('ai-replace-background', imageData, backgroundPrompt)
    },
    
    // Text to speech for accessibility
    textToSpeech: (text, options) => {
      console.log('🔵 [AI] Text to speech requested:', text)
      return ipcRenderer.invoke('ai-text-to-speech', text, options)
    },
    
    // Voice command interpretation
    interpretVoiceCommand: (command) => {
      console.log('🔵 [AI] Interpret voice command requested:', command)
      return ipcRenderer.invoke('ai-interpret-voice-command', command)
    },
  });

  console.log('✅ AIAPI exposed successfully');
} catch (error) {
  console.error('❌ Failed to expose AIAPI:', error);
}

// Development mode helpers
if (process.env.NODE_ENV === 'development') {
  try {
    // Development console shortcuts
    contextBridge.exposeInMainWorld('devAPI', {
      openDevTools: () => {
        console.log('🔵 [DEV] Open dev tools requested')
        return ipcRenderer.send('dev-open-tools')
      },
      reloadApp: () => {
        console.log('🔵 [DEV] Reload app requested')
        return ipcRenderer.send('dev-reload')
      },
      clearStorage: () => {
        console.log('🔵 [DEV] Clear storage requested')
        return ipcRenderer.send('dev-clear-storage')
      },
      getPerformanceMetrics: () => {
        console.log('🔵 [DEV] Get performance metrics requested')
        return ipcRenderer.invoke('dev-get-metrics')
      },
    });

    console.log('✅ DevAPI exposed successfully (development mode)');
  } catch (error) {
    console.error('❌ Failed to expose DevAPI:', error);
  }
}

// Security: Clean up Node.js globals after polyfills are set
try {
  // Remove Node.js globals from renderer process for security
  if (typeof window !== 'undefined') {
    delete window.require;
    delete window.exports; 
    delete window.module;
  }
  console.log('✅ Node.js globals cleaned up for security');
} catch (error) {
  console.error('❌ Failed to clean up globals:', error);
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('🎯 Initializing accessibility features...');
    
    // Add ARIA live region for screen reader announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    liveRegion.id = 'accessibility-live-region';
    document.body.appendChild(liveRegion);
    
    console.log('✅ Accessibility features initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize accessibility features:', error);
  }
});

console.log('✅ Preload script setup complete');
