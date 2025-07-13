'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useVoice } from '@/hooks/useVoice';

interface VoiceContextType {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  voiceError: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearError: () => void;
  getCommandHistory: () => any[];
  repeatLastCommand: () => void;
  speakResponse: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: React.ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const voiceHook = useVoice();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize voice system
    const initVoice = async () => {
      try {
        console.log('Initializing voice system...');
        
        // Check for voice support
        if (voiceHook.isSupported) {
          console.log('Voice recognition supported');
          
          // Announce to screen reader
          if (typeof window !== 'undefined' && window.electronAPI && 'accessibility' in window.electronAPI) {
            (window.electronAPI as any).accessibility?.announceToScreenReader?.(
              'CRAISEE VoiceEditor voice control system initialized'
            );
          }
          
          // Provide welcome voice feedback (avoid state updates during render)
          const timer = setTimeout(() => {
            if (voiceHook.isSupported) {
            voiceHook.speakResponse(
                'Welcome to CRAISEE Experiments Vol 1 VoiceEditor. Voice control is ready. Say "help" for available commands.'
            );
            }
          }, 2000);
          
          return () => clearTimeout(timer);
        } else {
          console.warn('Voice recognition not supported');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Voice initialization error:', error);
        setIsInitialized(true);
      }
    };

    initVoice();
  }, [voiceHook.isSupported, voiceHook.speakResponse]);

  // Voice command processing
  useEffect(() => {
    const processVoiceCommands = (transcript: string) => {
      if (!transcript.trim()) return;

      const command = transcript.toLowerCase().trim();
      console.log('Processing voice command:', command);

      // Basic voice commands
      if (command.includes('help')) {
        voiceHook.speakResponse(
          'Available commands: Make it brighter, add contrast, apply filter, crop image, rotate, undo, redo, save, export.'
        );
      } else if (command.includes('stop') || command.includes('quiet')) {
        voiceHook.stopListening();
        voiceHook.speakResponse('Voice control stopped.');
      } else if (command.includes('clear error')) {
        voiceHook.clearError();
        voiceHook.speakResponse('Errors cleared.');
      }

      // Log command for debugging
      console.log('Voice command processed:', command);
    };

    if (voiceHook.transcript && !voiceHook.isProcessing) {
      processVoiceCommands(voiceHook.transcript);
    }
  }, [voiceHook.transcript, voiceHook.isProcessing, voiceHook.speakResponse, voiceHook.stopListening, voiceHook.clearError]);

  const contextValue: VoiceContextType = {
    ...voiceHook,
    isInitialized,
  } as any;

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
      
      {/* Voice status indicator for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {voiceHook.isListening && 'Voice control active'}
        {voiceHook.isProcessing && 'Processing voice command'}
        {voiceHook.voiceError && `Voice error: ${voiceHook.voiceError}`}
      </div>
    </VoiceContext.Provider>
  );
}

export function useVoiceContext() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoiceContext must be used within a VoiceProvider');
  }
  return context;
}