'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useVoice } from '@/hooks/useVoice'

interface VoiceContextType {
  isListening: boolean
  transcript: string
  confidence: number
  isProcessing: boolean
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  clearError: () => void
  getCommandHistory: () => any[]
  repeatLastCommand: () => void
  speakResponse: (text: string) => void
  voiceError: string | null
  isSupported: boolean
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

interface VoiceProviderProps {
  children: React.ReactNode
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const voice = useVoice()
  
  return (
    <VoiceContext.Provider value={voice}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoiceContext() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoiceContext must be used within a VoiceProvider')
  }
  return context
} 