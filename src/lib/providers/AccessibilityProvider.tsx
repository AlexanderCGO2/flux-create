'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AccessibilitySettings {
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  fontSize: 'small' | 'medium' | 'large'
  voiceAnnouncements: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  isScreenReaderActive: boolean
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: true,
  fontSize: 'medium',
  voiceAnnouncements: true,
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)

  useEffect(() => {
    // Check for screen reader
    const checkScreenReader = () => {
      if (typeof window !== 'undefined') {
        const hasScreenReader = window.navigator.userAgent.includes('NVDA') ||
                               window.navigator.userAgent.includes('JAWS') ||
                               window.speechSynthesis?.speaking ||
                               window.speechSynthesis?.pending
        setIsScreenReaderActive(hasScreenReader)
      }
    }

    checkScreenReader()
  }, [])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof window !== 'undefined') {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', priority)
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }
  }

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    announce,
    isScreenReaderActive,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
} 