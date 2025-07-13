interface ElectronAPI {
  voice: {
    processCommand: (audioData: ArrayBuffer) => Promise<{ success: boolean; command: string }>;
    onToggle: (callback: () => void) => void;
    onMute: (callback: () => void) => void;
    onSettings: (callback: () => void) => void;
    onTutorial: (callback: () => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  };
  
  file: {
    saveDialog: (options: {
      filters?: Array<{ name: string; extensions: string[] }>;
      defaultPath?: string;
    }) => Promise<{ canceled: boolean; filePath?: string }>;
    
    openDialog: (options: {
      properties?: string[];
      filters?: Array<{ name: string; extensions: string[] }>;
      defaultPath?: string;
    }) => Promise<{ canceled: boolean; filePaths: string[] }>;
    
    onOpen: (callback: (filePath: string) => void) => void;
    onSave: (callback: () => void) => void;
    onExport: (callback: () => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  };

  // Additional methods for the main interface
  openImage?: (callback: (event: any, filePath: string) => void) => void;
  onVoiceToggle?: (callback: () => void) => void;
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
  
  project: {
    onNew: (callback: () => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  };
  
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
    platform: string;
    arch: string;
  };
  
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  
  accessibility: {
    announceToScreenReader: (message: string) => void;
    setAriaLabel: (elementId: string, label: string) => void;
  };
  
  dev: {
    log: (message: string) => void;
    error: (message: string) => void;
  };
}

interface Window {
  electronAPI: ElectronAPI;
}

declare global {
  interface Window {
    electronAPI: {
      // Window controls
      closeWindow: () => Promise<void>
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      
      // File operations
      openFile: () => Promise<string>
      saveFile: (data: any) => Promise<boolean>
      
      // System info
      platform: string
      version: string
      
      // App events
      onAppReady: (callback: () => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

// Extend CSS properties to include Webkit App Region
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
    webkitAppRegion?: 'drag' | 'no-drag'
  }
}

export {};