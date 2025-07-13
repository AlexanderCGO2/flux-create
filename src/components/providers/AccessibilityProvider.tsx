'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  announceToScreenReader: (message: string) => void;
  toggleHighContrast: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  focusElement: (elementId: string) => void;
  isScreenReaderActive: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  // Detect user preferences
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleMotionChange);
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    contrastQuery.addEventListener('change', handleContrastChange);
    
    // Detect screen reader
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasAriaLive = document.querySelector('[aria-live]');
      const hasScreenReaderText = document.querySelector('.sr-only');
      const userAgent = navigator.userAgent.toLowerCase();
      
      const screenReaderIndicators = [
        'nvda',
        'jaws',
        'dragon',
        'voiceover',
        'narrator'
      ];
      
      const hasScreenReaderUA = screenReaderIndicators.some(indicator => 
        userAgent.includes(indicator)
      );
      
      setIsScreenReaderActive(hasScreenReaderUA || !!hasAriaLive || !!hasScreenReaderText);
    };
    
    detectScreenReader();
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Apply accessibility styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // High contrast mode
      if (isHighContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
      
      // Reduced motion
      if (isReducedMotion) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }
      
      // Font size
      root.classList.remove('font-small', 'font-medium', 'font-large');
      root.classList.add(`font-${fontSize}`);
    }
  }, [isHighContrast, isReducedMotion, fontSize]);

  const announceToScreenReader = (message: string) => {
    if (typeof document !== 'undefined') {
      // Create or update the announcement element
      let announcer = document.getElementById('accessibility-announcements');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'accessibility-announcements';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
      }
      
      // Clear previous message and set new one
      announcer.textContent = '';
      setTimeout(() => {
        announcer!.textContent = message;
      }, 100);
      
      // Also use Electron API if available
      if (typeof window !== 'undefined' && window.electronAPI && 'accessibility' in window.electronAPI) {
        (window.electronAPI as any).accessibility?.announceToScreenReader?.(message);
      }
      
      console.log('Screen reader announcement:', message);
    }
  };

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
    announceToScreenReader(`High contrast ${!isHighContrast ? 'enabled' : 'disabled'}`);
  };

  const handleSetFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const focusElement = (elementId: string) => {
    if (typeof document !== 'undefined') {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || elementId}`);
      }
    }
  };

  const contextValue: AccessibilityContextType = {
    isHighContrast,
    isReducedMotion,
    fontSize,
    isScreenReaderActive,
    announceToScreenReader,
    toggleHighContrast,
    setFontSize: handleSetFontSize,
    focusElement,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Accessibility status and controls */}
      <div className="sr-only">
        <div id="accessibility-status">
          CRAISEE Desk - Accessible AI Image Editor
          {isScreenReaderActive && ' - Screen reader detected'}
          {isHighContrast && ' - High contrast mode active'}
          {isReducedMotion && ' - Reduced motion active'}
        </div>
        
        {/* Skip links for keyboard navigation */}
        <a 
          href="#main-canvas" 
          className="skip-link absolute top-0 left-0 z-50 p-2 bg-blue-600 text-white -translate-y-full focus:translate-y-0 transition-transform"
        >
          Skip to main canvas
        </a>
        <a 
          href="#voice-controls" 
          className="skip-link absolute top-0 left-20 z-50 p-2 bg-blue-600 text-white -translate-y-full focus:translate-y-0 transition-transform"
        >
          Skip to voice controls
        </a>
        <a 
          href="#tool-panel" 
          className="skip-link absolute top-0 left-40 z-50 p-2 bg-blue-600 text-white -translate-y-full focus:translate-y-0 transition-transform"
        >
          Skip to tools
        </a>
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}