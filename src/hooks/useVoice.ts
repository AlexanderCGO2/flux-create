import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  voiceError: string | null;
  isSupported: boolean;
}

interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: number;
}

export function useVoice() {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    voiceError: null,
    isSupported: false,
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const commandHistoryRef = useRef<VoiceCommand[]>([]);
  const lastCommandRef = useRef<string>('');

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        synthRef.current = window.speechSynthesis;
        
        setState(prev => ({ ...prev, isSupported: true }));
        
        // Configure recognition
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        // Event listeners
        recognitionRef.current.onstart = () => {
          setState(prev => ({ ...prev, isListening: true, voiceError: null }));
          console.log('Voice recognition started');
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              setState(prev => ({ 
                ...prev, 
                transcript: finalTranscript,
                confidence: confidence || 0.8
              }));
              
              // Process command
              if (finalTranscript.trim()) {
                processVoiceCommand(finalTranscript.trim(), confidence || 0.8);
              }
            } else {
              interimTranscript += transcript;
              setState(prev => ({ 
                ...prev, 
                transcript: interimTranscript,
                confidence: confidence || 0.5
              }));
            }
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setState(prev => ({ 
            ...prev, 
            voiceError: `Speech recognition error: ${event.error}`,
            isListening: false,
            isProcessing: false
          }));
        };
        
        recognitionRef.current.onend = () => {
          setState(prev => ({ ...prev, isListening: false }));
          console.log('Voice recognition ended');
        };
      } else {
        setState(prev => ({ 
          ...prev, 
          isSupported: false,
          voiceError: 'Speech recognition not supported in this browser'
        }));
      }
    }
  }, []);

  const processVoiceCommand = useCallback(async (command: string, confidence: number) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Add to command history
      const voiceCommand: VoiceCommand = {
        command,
        confidence,
        timestamp: Date.now()
      };
      
      commandHistoryRef.current.unshift(voiceCommand);
      
      // Keep only last 10 commands
      if (commandHistoryRef.current.length > 10) {
        commandHistoryRef.current = commandHistoryRef.current.slice(0, 10);
      }
      
      // Log voice command for debugging
      console.log('Processing voice command:', command, 'Confidence:', confidence);
      
      // Process command through OpenAI (placeholder - would integrate with actual API)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      // Provide voice feedback
      speakResponse(`Command processed: ${command}`);
      
      lastCommandRef.current = command;
      
    } catch (error) {
      console.error('Voice command processing error:', error);
      setState(prev => ({ 
        ...prev, 
        voiceError: `Command processing error: ${error}` 
      }));
      
      speakResponse('Sorry, I could not process that command. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (synthRef.current && text) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => {
        console.log('Speech synthesis started');
      };
      
      utterance.onend = () => {
        console.log('Speech synthesis ended');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };
      
      synthRef.current.speak(utterance);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      setState(prev => ({ ...prev, transcript: '', voiceError: null }));
      
      try {
        recognitionRef.current.start();
        
        // Announce to screen reader
        console.log('Voice control activated');
        
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setState(prev => ({ 
          ...prev, 
          voiceError: `Failed to start voice recognition: ${error}` 
        }));
      }
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
      
      // Announce to screen reader
      console.log('Voice control deactivated');
    }
  }, [state.isListening]);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, voiceError: null }));
  }, []);

  const getCommandHistory = useCallback(() => {
    return commandHistoryRef.current;
  }, []);

  const repeatLastCommand = useCallback(() => {
    if (lastCommandRef.current) {
      processVoiceCommand(lastCommandRef.current, 1.0);
    }
  }, [processVoiceCommand]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearError,
    getCommandHistory,
    repeatLastCommand,
    speakResponse,
  };
}

// Extend the Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}