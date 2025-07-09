const { contextBridge, ipcRenderer } = require('electron');

// Log preload script loading
console.log('Preload script loaded');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // File operations
  openImage: (callback) => ipcRenderer.on('menu-open-image', callback),
  saveFile: (callback) => ipcRenderer.on('menu-save', callback),
  exportFile: (callback) => ipcRenderer.on('menu-export', callback),
  newProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  
  // Voice controls
  onVoiceToggle: (callback) => ipcRenderer.on('voice-toggle', callback),
  onVoiceMute: (callback) => ipcRenderer.on('voice-mute', callback),
  onVoiceSettings: (callback) => ipcRenderer.on('voice-settings', callback),
  onVoiceTutorial: (callback) => ipcRenderer.on('voice-tutorial', callback),
  
  // Voice command sending
  sendVoiceCommand: (command) => ipcRenderer.send('voice-command', command),
  sendVoiceResponse: (response) => ipcRenderer.send('voice-response', response),
  
  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Accessibility features
  announceToScreenReader: (text) => ipcRenderer.send('announce-screen-reader', text),
  setAccessibilityFocus: (elementId) => ipcRenderer.send('accessibility-focus', elementId),
  
  // Canvas operations
  saveCanvasState: (state) => ipcRenderer.send('save-canvas-state', state),
  loadCanvasState: () => ipcRenderer.invoke('load-canvas-state'),
  
  // AI integrations
  generateImage: (prompt, options) => ipcRenderer.invoke('generate-image', prompt, options),
  enhanceImage: (imageData, options) => ipcRenderer.invoke('enhance-image', imageData, options),
  
  // Performance monitoring
  reportPerformance: (metrics) => ipcRenderer.send('performance-metrics', metrics),
  
  // Theme and settings
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
  
  // Development helpers
  isDev: () => process.env.NODE_ENV === 'development',
  
  // Version info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Remove all listeners for cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Voice API for direct voice control
contextBridge.exposeInMainWorld('voiceAPI', {
  // Voice recognition
  startListening: () => ipcRenderer.send('voice-start-listening'),
  stopListening: () => ipcRenderer.send('voice-stop-listening'),
  
  // Voice synthesis
  speak: (text, options = {}) => ipcRenderer.send('voice-speak', text, options),
  stopSpeaking: () => ipcRenderer.send('voice-stop-speaking'),
  
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

// Canvas API for image manipulation
contextBridge.exposeInMainWorld('canvasAPI', {
  // Canvas operations
  createCanvas: (width, height) => ipcRenderer.invoke('canvas-create', width, height),
  resizeCanvas: (width, height) => ipcRenderer.send('canvas-resize', width, height),
  clearCanvas: () => ipcRenderer.send('canvas-clear'),
  
  // Image operations
  loadImage: (imagePath) => ipcRenderer.invoke('canvas-load-image', imagePath),
  saveImage: (format, quality) => ipcRenderer.invoke('canvas-save-image', format, quality),
  exportImage: (format, options) => ipcRenderer.invoke('canvas-export-image', format, options),
  
  // Filter operations
  applyFilter: (filterName, options) => ipcRenderer.invoke('canvas-apply-filter', filterName, options),
  removeFilter: (filterId) => ipcRenderer.send('canvas-remove-filter', filterId),
  
  // Layer operations
  addLayer: (layerData) => ipcRenderer.invoke('canvas-add-layer', layerData),
  removeLayer: (layerId) => ipcRenderer.send('canvas-remove-layer', layerId),
  moveLayer: (layerId, direction) => ipcRenderer.send('canvas-move-layer', layerId, direction),
  
  // History operations
  undo: () => ipcRenderer.send('canvas-undo'),
  redo: () => ipcRenderer.send('canvas-redo'),
  getHistory: () => ipcRenderer.invoke('canvas-get-history'),
});

// AI API for AI-powered features
contextBridge.exposeInMainWorld('aiAPI', {
  // Image generation
  generateImage: (prompt, options) => ipcRenderer.invoke('ai-generate-image', prompt, options),
  enhanceImage: (imageData, prompt) => ipcRenderer.invoke('ai-enhance-image', imageData, prompt),
  
  // Style transfer
  applyStyle: (imageData, stylePrompt) => ipcRenderer.invoke('ai-apply-style', imageData, stylePrompt),
  
  // Object detection and manipulation
  detectObjects: (imageData) => ipcRenderer.invoke('ai-detect-objects', imageData),
  removeObject: (imageData, objectMask) => ipcRenderer.invoke('ai-remove-object', imageData, objectMask),
  replaceObject: (imageData, objectMask, prompt) => ipcRenderer.invoke('ai-replace-object', imageData, objectMask, prompt),
  
  // Background operations
  removeBackground: (imageData) => ipcRenderer.invoke('ai-remove-background', imageData),
  replaceBackground: (imageData, backgroundPrompt) => ipcRenderer.invoke('ai-replace-background', imageData, backgroundPrompt),
  
  // Text to speech for accessibility
  textToSpeech: (text, options) => ipcRenderer.invoke('ai-text-to-speech', text, options),
  
  // Voice command interpretation
  interpretVoiceCommand: (command) => ipcRenderer.invoke('ai-interpret-voice-command', command),
});

// Security: Remove Node.js globals from renderer process
delete window.require;
delete window.exports;
delete window.module;

// Development mode helpers
if (process.env.NODE_ENV === 'development') {
  window.electronAPI.isDev = true;
  
  // Development console shortcuts
  contextBridge.exposeInMainWorld('devAPI', {
    openDevTools: () => ipcRenderer.send('dev-open-tools'),
    reloadApp: () => ipcRenderer.send('dev-reload'),
    clearStorage: () => ipcRenderer.send('dev-clear-storage'),
    getPerformanceMetrics: () => ipcRenderer.invoke('dev-get-metrics'),
  });
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', () => {
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
  
  console.log('Accessibility features initialized');
});

console.log('Preload script setup complete');
