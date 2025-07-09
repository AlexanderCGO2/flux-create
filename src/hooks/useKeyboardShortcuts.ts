import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onVoiceToggle?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onNewProject?: () => void;
  onOpenFile?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;
    
    // Prevent default behavior for our shortcuts
    let preventDefault = false;
    
    if (isCtrlOrCmd) {
      switch (key.toLowerCase()) {
        case 'z':
          if (shiftKey) {
            shortcuts.onRedo?.();
          } else {
            shortcuts.onUndo?.();
          }
          preventDefault = true;
          break;
          
        case 'y':
          shortcuts.onRedo?.();
          preventDefault = true;
          break;
          
        case 's':
          shortcuts.onSave?.();
          preventDefault = true;
          break;
          
        case 'e':
          shortcuts.onExport?.();
          preventDefault = true;
          break;
          
        case 'n':
          shortcuts.onNewProject?.();
          preventDefault = true;
          break;
          
        case 'o':
          shortcuts.onOpenFile?.();
          preventDefault = true;
          break;
          
        case '=':
        case '+':
          shortcuts.onZoomIn?.();
          preventDefault = true;
          break;
          
        case '-':
          shortcuts.onZoomOut?.();
          preventDefault = true;
          break;
          
        case '0':
          shortcuts.onZoomReset?.();
          preventDefault = true;
          break;
          
        case 'a':
          shortcuts.onSelectAll?.();
          preventDefault = true;
          break;
          
        case 'd':
          shortcuts.onDeselect?.();
          preventDefault = true;
          break;
          
        case 'c':
          shortcuts.onCopy?.();
          preventDefault = true;
          break;
          
        case 'v':
          if (shiftKey) {
            shortcuts.onVoiceToggle?.();
            preventDefault = true;
          } else {
            shortcuts.onPaste?.();
            preventDefault = true;
          }
          break;
      }
    }
    
    // Voice toggle shortcut (Ctrl+Shift+V)
    if (isCtrlOrCmd && shiftKey && key.toLowerCase() === 'v') {
      shortcuts.onVoiceToggle?.();
      preventDefault = true;
    }
    
    // Delete key
    if (key === 'Delete' || key === 'Backspace') {
      shortcuts.onDelete?.();
      preventDefault = true;
    }
    
    // Escape key for deselection
    if (key === 'Escape') {
      shortcuts.onDeselect?.();
      preventDefault = true;
    }
    
    // Space bar for voice toggle (accessibility)
    if (key === ' ' && altKey) {
      shortcuts.onVoiceToggle?.();
      preventDefault = true;
    }
    
    if (preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Accessibility: Announce shortcuts to screen reader
  useEffect(() => {
    const announceShortcuts = () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const shortcuts = [
          'Ctrl+Shift+V: Toggle voice control',
          'Ctrl+Z: Undo',
          'Ctrl+Y: Redo',
          'Ctrl+S: Save',
          'Ctrl+E: Export',
          'Ctrl+N: New project',
          'Ctrl+O: Open file',
          'Alt+Space: Toggle voice control',
          'Escape: Deselect',
          'Delete: Delete selected',
        ];
        
        window.electronAPI.accessibility.announceToScreenReader(
          `Keyboard shortcuts available: ${shortcuts.join(', ')}`
        );
      }
    };

    // Announce shortcuts after a delay
    const timer = setTimeout(announceShortcuts, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    // Return utility functions if needed
    isShortcutPressed: useCallback((event: KeyboardEvent, shortcut: string) => {
      const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
      const isCtrlOrCmd = ctrlKey || metaKey;
      
      const shortcuts: Record<string, () => boolean> = {
        'ctrl+z': () => isCtrlOrCmd && !shiftKey && key.toLowerCase() === 'z',
        'ctrl+y': () => isCtrlOrCmd && key.toLowerCase() === 'y',
        'ctrl+shift+z': () => isCtrlOrCmd && shiftKey && key.toLowerCase() === 'z',
        'ctrl+s': () => isCtrlOrCmd && key.toLowerCase() === 's',
        'ctrl+e': () => isCtrlOrCmd && key.toLowerCase() === 'e',
        'ctrl+n': () => isCtrlOrCmd && key.toLowerCase() === 'n',
        'ctrl+o': () => isCtrlOrCmd && key.toLowerCase() === 'o',
        'ctrl+shift+v': () => isCtrlOrCmd && shiftKey && key.toLowerCase() === 'v',
        'alt+space': () => altKey && key === ' ',
        'escape': () => key === 'Escape',
        'delete': () => key === 'Delete' || key === 'Backspace',
      };
      
      return shortcuts[shortcut.toLowerCase()]?.() || false;
    }, []),
  };
}