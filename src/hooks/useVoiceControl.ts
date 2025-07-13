import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { VoiceService, VoiceCommand, VoiceConversation, VoiceConversationTurn } from '@/lib/ai/voice-service'

interface VoiceControlState {
  isListening: boolean
  isRecording: boolean  // Added: separate state for actual recording
  isProcessing: boolean
  vadActive: boolean    // Added: VAD (Voice Activity Detection) state
  lastCommand: string | null
  lastUserTranscript: string | null
  lastAssistantResponse: string | null
  error: string | null
  mode: 'command' | 'conversation'
  conversation: VoiceConversation | null
  realtimeConnected: boolean
  initialized: boolean
}

interface VoiceControlOperations {
  // Core state and operations
  state: VoiceControlState
  
  // Mode switching
  switchMode: (mode: 'command' | 'conversation') => void
  
  // Recording operations with VAD
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  toggleListening: () => Promise<void>  // Added: convenient toggle method
  
  // Command processing
  processCommand: (transcript: string) => Promise<VoiceCommand | null>
  executeCommand: (command: VoiceCommand, operations: any) => Promise<void>
  
  // Conversation operations
  startConversation: (initialPrompt?: string) => Promise<VoiceConversation>
  sendMessage: (message: string) => Promise<void>
  endConversation: () => void
  
  // Utility operations
  playAudio: (audioUrl: string) => Promise<void>
  clearError: () => void
  getStatus: () => any
}

// Voice Activity Detection class
class VoiceActivityDetector {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private isActive = false
  private threshold = 30  // Adjustable threshold for voice detection
  private minSpeechDuration = 300  // Minimum speech duration in ms
  private silenceDuration = 1500   // Silence duration to stop recording
  private speechStartTime = 0
  private silenceStartTime = 0
  private onSpeechStart: (() => void) | null = null
  private onSpeechEnd: (() => void) | null = null
  private checkInterval: number | null = null

  async initialize(stream: MediaStream) {
    try {
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.source = this.audioContext.createMediaStreamSource(stream)
      
      this.analyser.fftSize = 256
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
      
      this.source.connect(this.analyser)
      
      console.log('🎤 VAD initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize VAD:', error)
      return false
    }
  }

  start(onSpeechStart: () => void, onSpeechEnd: () => void) {
    if (!this.analyser || !this.dataArray) {
      console.error('❌ VAD not initialized')
      return false
    }

    this.onSpeechStart = onSpeechStart
    this.onSpeechEnd = onSpeechEnd
    this.isActive = true
    this.speechStartTime = 0
    this.silenceStartTime = Date.now()

    // Start monitoring audio levels
    this.checkInterval = window.setInterval(() => {
      this.checkAudioLevel()
    }, 50) // Check every 50ms

    console.log('🔊 VAD started - listening for speech...')
    return true
  }

  stop() {
    this.isActive = false
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    console.log('🔇 VAD stopped')
  }

  private checkAudioLevel() {
    if (!this.analyser || !this.dataArray || !this.isActive) return

    this.analyser.getByteFrequencyData(this.dataArray)
    
    // Calculate average volume
    const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length
    
    const now = Date.now()
    const isSpeaking = average > this.threshold

    if (isSpeaking) {
      // Speech detected
      if (this.speechStartTime === 0) {
        this.speechStartTime = now
        console.log('🗣️ Speech detected, starting recording...')
        this.onSpeechStart?.()
      }
      this.silenceStartTime = 0
    } else {
      // Silence detected
      if (this.speechStartTime > 0 && this.silenceStartTime === 0) {
        this.silenceStartTime = now
      }
      
      // Check if we've had enough silence to stop recording
      if (this.speechStartTime > 0 && 
          this.silenceStartTime > 0 && 
          now - this.silenceStartTime > this.silenceDuration &&
          now - this.speechStartTime > this.minSpeechDuration) {
        
        console.log('🤫 Silence detected, stopping recording...')
        this.speechStartTime = 0
        this.silenceStartTime = now
        this.onSpeechEnd?.()
      }
    }
  }

  cleanup() {
    this.stop()
    if (this.source) {
      this.source.disconnect()
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
  }

  setThreshold(threshold: number) {
    this.threshold = threshold
    console.log(`🎛️ VAD threshold set to: ${threshold}`)
  }
}

export function useVoiceControl(): VoiceControlOperations {
  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    isRecording: false,
    isProcessing: false,
    vadActive: false,
    lastCommand: null,
    lastUserTranscript: null,
    lastAssistantResponse: null,
    error: null,
    mode: 'command',
    conversation: null,
    realtimeConnected: false,
    initialized: false
  })

  const voiceServiceRef = useRef<VoiceService | null>(null)
  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const recordingTimeoutRef = useRef<NodeJS.Timeout>()
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize voice service
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('🎤 Initializing comprehensive voice service...');
        
        // Check if we have required environment variables
        const healthCheck = await fetch('/api/voice/realtime-token', {
          method: 'GET',
        }).catch(() => null);

        let realtimeEnabled = false;
        if (healthCheck?.ok) {
          const status = await healthCheck.json();
          realtimeEnabled = status.success;
          console.log('✅ Realtime API service available');
        } else {
          console.log('⚠️ Realtime API service not available, using basic mode');
        }

        // Create voice service with fallback configuration
        const service = new VoiceService({
          mode: 'command',
          realtimeEnabled,
          voice: 'alloy',
          language: 'en'
        });

        // Set up event listeners
        service.on('modeChanged', ({ mode }: { mode: 'command' | 'conversation' }) => {
          setState(prev => ({ ...prev, mode }));
          console.log(`🔄 Voice mode changed to: ${mode}`);
        });

        service.on('conversationUpdated', ({ conversation, newTurn }: { conversation: VoiceConversation; newTurn: VoiceConversationTurn }) => {
          setState(prev => ({ ...prev, conversation }));
          console.log('💬 Conversation updated:', newTurn);
        });

        service.on('commandExecuted', (command: VoiceCommand) => {
          setState(prev => ({ ...prev, lastCommand: `Command: ${command.action}` }));
          console.log('🎯 Command executed:', command);
        });

        service.on('userTranscript', ({ transcript }: { transcript: string }) => {
          setState(prev => ({ ...prev, lastUserTranscript: transcript }));
          console.log('👤 User said:', transcript);
          console.log('🎯 Transcript updated in state for UI display');
        });

        service.on('recordingStarted', ({ timestamp }: { timestamp: number }) => {
          console.log('🎤 Recording started event received');
          setState(prev => ({ ...prev, isRecording: true }));
        });

        service.on('recordingStopped', ({ timestamp }: { timestamp: number }) => {
          console.log('🎤 Recording stopped event received');
          setState(prev => ({ ...prev, isRecording: false }));
        });

        service.on('transcriptCompleted', ({ transcript }: { transcript: string }) => {
          setState(prev => ({ ...prev, lastAssistantResponse: transcript }));
          console.log('🤖 Assistant response:', transcript);
        });

        // Add comprehensive command handlers
        service.on('modeSwitch', ({ mode, source }: { mode: string; source: string }) => {
          console.log(`🔄 Mode switch: ${mode} (from ${source})`);
          // TODO: Implement mode switching logic
          setState(prev => ({ ...prev, lastCommand: `Switched to ${mode} mode` }));
        });

        service.on('appTransparency', ({ opacity, value, source }: { opacity: number; value: number; source: string }) => {
          console.log(`🌫️ App transparency: ${opacity} (from ${source})`);
          // Apply transparency to app background
          document.body.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
          setState(prev => ({ ...prev, lastCommand: `Set transparency to ${value}%` }));
        });

        service.on('filterAdjust', ({ filterType, value, source }: { filterType: string; value: number; source: string }) => {
          console.log(`🎨 Filter adjust: ${filterType} = ${value} (from ${source})`);
          // TODO: Apply filter to canvas/image
          setState(prev => ({ ...prev, lastCommand: `Set ${filterType} to ${value}` }));
        });

        service.on('filterPreset', ({ preset, source }: { preset: string; source: string }) => {
          console.log(`🎭 Filter preset: ${preset} (from ${source})`);
          // TODO: Apply filter preset
          setState(prev => ({ ...prev, lastCommand: `Applied ${preset} filter` }));
        });

        service.on('transform', ({ type, value, direction, source }: { type: string; value: number; direction: string; source: string }) => {
          console.log(`🔄 Transform: ${type} ${direction} ${value} (from ${source})`);
          // TODO: Apply transformation
          let commandText = `${type}`;
          if (direction) commandText += ` ${direction}`;
          if (value) commandText += ` ${value}`;
          setState(prev => ({ ...prev, lastCommand: commandText }));
        });

        // Initialize the service
        const initialized = await service.initialize();
        
        if (initialized) {
          voiceServiceRef.current = service;
          
          // Initialize VAD
          vadRef.current = new VoiceActivityDetector();
          
          setState(prev => ({ 
            ...prev, 
            initialized: true,
            realtimeConnected: service.getStatus().realtimeConnected
          }));
          
          console.log('✅ Voice service initialized successfully');
          toast.success('Voice control system ready! Click microphone once to start listening.');
        } else {
          throw new Error('Failed to initialize voice service');
        }

      } catch (error) {
        console.error('❌ Voice service initialization failed:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Voice control initialization failed';
        
        if (error instanceof Error) {
          if (error.message.includes('getUserMedia')) {
            errorMessage = 'Microphone permission denied. Please allow microphone access and refresh.';
          } else if (error.message.includes('realtime-token')) {
            errorMessage = 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network connection failed. Please check your internet connection.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage
        }));
        toast.error(errorMessage);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.cleanup();
      }
      if (vadRef.current) {
        vadRef.current.cleanup();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Switch between command and conversation modes
  const switchMode = useCallback((mode: 'command' | 'conversation') => {
    if (!voiceServiceRef.current) return;

    console.log(`🔄 Switching to ${mode} mode`);
    voiceServiceRef.current.switchMode(mode);
    
    setState(prev => ({ ...prev, mode }));
    
    if (mode === 'command') {
      toast.info('Switched to Command Mode - Click mic once, then speak naturally');
    } else {
      toast.info('Switched to Conversation Mode - Have a natural conversation with AI');
    }
  }, []);

  // Handle VAD speech start
  const handleSpeechStart = useCallback(async () => {
    if (!voiceServiceRef.current) return;

    try {
      setState(prev => {
        if (prev.isRecording) {
          console.log('⚠️ Already recording');
          return prev;
        }
        
        console.log('🔴 Starting recording from VAD...');
        return { ...prev, isRecording: true };
      });
      
      const success = await voiceServiceRef.current.startRecording();
      
      if (success) {
        console.log('✅ Recording started automatically (VAD detected speech)');
      } else {
        setState(prev => ({ ...prev, isRecording: false }));
      }
    } catch (error) {
      console.error('❌ Failed to start recording from VAD:', error);
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, []); // Remove state dependency to prevent stale closures

  // Handle VAD speech end
  const handleSpeechEnd = useCallback(async () => {
    if (!voiceServiceRef.current) return;

    try {
      let currentMode = 'command';
      
      setState(prev => {
        if (!prev.isRecording) {
          console.log('⚠️ Not currently recording');
          return prev;
        }
        
        console.log('⏹️ Recording stopped automatically (VAD detected silence)');
        currentMode = prev.mode;
        return { ...prev, isRecording: false, isProcessing: true };
      });
      
      // Stop recording
      const audioBlob = await voiceServiceRef.current.stopRecording();
      
      if (currentMode === 'conversation') {
        // Realtime mode handles processing automatically
        console.log('💬 Realtime conversation mode - processing automatically');
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Command mode - process the audio
      if (audioBlob) {
        console.log('🧠 Processing voice command...', {
          blobSize: audioBlob.size,
          blobType: audioBlob.type,
          mode: currentMode
        });
        
        // Transcribe audio
        const transcription = await voiceServiceRef.current.speechToText(audioBlob);
        console.log('📝 Transcribed:', transcription.text);
        
        // Process command
        const command = await voiceServiceRef.current.processVoiceCommand(transcription.text);
        
        if (command) {
          setState(prev => ({ 
            ...prev, 
            lastCommand: `"${transcription.text}" → ${command.action}` 
          }));
          
          // Execute command would be handled by the main app
          console.log('🎯 Command ready for execution:', command);
          toast.success(`Command: ${command.action}`);
        } else {
          setState(prev => ({ 
            ...prev, 
            lastCommand: `"${transcription.text}" → not understood` 
          }));
          toast.warning(`Not recognized: "${transcription.text}"`);
        }
      }
      
    } catch (error) {
      console.error('❌ Voice processing failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Voice processing failed' 
      }));
      toast.error('Voice processing failed');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []); // Remove state dependencies to prevent stale closures

  // Start listening with VAD
  const startListening = useCallback(async () => {
    if (!voiceServiceRef.current || !vadRef.current || !state.initialized) {
      toast.error('Voice service not ready');
      return;
    }

    if (state.isListening) {
      console.log('⚠️ Already listening');
      return;
    }

    try {
      setState(prev => ({ ...prev, isListening: true, vadActive: true, error: null }));
      
      // Request microphone access
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      }

      // Initialize VAD with the stream
      const vadInitialized = await vadRef.current.initialize(streamRef.current);
      
      if (vadInitialized) {
        // Start VAD monitoring
        vadRef.current.start(handleSpeechStart, handleSpeechEnd);
        
        console.log('🔊 Listening mode activated - speak naturally');
        toast.success(`Listening for ${state.mode === 'command' ? 'commands' : 'conversation'}... Speak naturally!`);
        
        // Auto-stop after 5 minutes for safety
        recordingTimeoutRef.current = setTimeout(() => {
          stopListening();
          toast.info('Listening stopped (timeout)');
        }, 300000); // 5 minutes
      } else {
        throw new Error('Failed to initialize voice activity detection');
      }
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        vadActive: false,
        error: error instanceof Error ? error.message : 'Failed to start listening' 
      }));
      toast.error('Failed to start voice listening');
    }
  }, [state.initialized, state.isListening, state.mode, handleSpeechStart, handleSpeechEnd]);

  // Stop listening
  const stopListening = useCallback(async () => {
    if (!state.isListening) return;

    try {
      setState(prev => ({ ...prev, isListening: false, vadActive: false, isRecording: false }));
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }

      // Stop VAD monitoring
      if (vadRef.current) {
        vadRef.current.stop();
      }

      // Stop any ongoing recording
      if (voiceServiceRef.current && state.isRecording) {
        await voiceServiceRef.current.stopRecording();
      }

      console.log('🔇 Listening mode deactivated');
      toast.info('Stopped listening');
      
    } catch (error) {
      console.error('❌ Failed to stop listening:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to stop listening' 
      }));
    }
  }, [state.isListening, state.isRecording]);

  // Toggle listening state
  const toggleListening = useCallback(async () => {
    if (state.isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Process voice command
  const processCommand = useCallback(async (transcript: string): Promise<VoiceCommand | null> => {
    if (!voiceServiceRef.current) return null;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const command = await voiceServiceRef.current.processVoiceCommand(transcript);
      
      if (command) {
        setState(prev => ({ 
          ...prev, 
          lastCommand: `${transcript} → ${command.action}` 
        }));
      }
      
      return command;
    } catch (error) {
      console.error('❌ Command processing failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Command processing failed' 
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  // Execute voice command
  const executeCommand = useCallback(async (command: VoiceCommand, operations: any) => {
    if (!operations) {
      toast.error('No operations available');
      return;
    }

    try {
      console.log('🎯 Executing voice command:', command);
      
      switch (command.action) {
        case 'generate':
          if (command.parameters?.prompt) {
            operations.generate?.(command.parameters.prompt);
            toast.success(`Generating: ${command.parameters.prompt}`);
          }
          break;

        case 'adjust':
          if (command.target && command.parameters?.value !== undefined) {
            operations.adjust?.(command.target, command.parameters.value);
            toast.success(`Adjusted ${command.target} to ${command.parameters.value}`);
          }
          break;

        case 'filter':
          if (command.target) {
            operations.applyFilter?.(command.target);
            toast.success(`Applied ${command.target} filter`);
          }
          break;

        case 'edit':
          if (command.parameters?.prompt) {
            operations.edit?.(command.parameters.prompt);
            toast.success(`Editing: ${command.parameters.prompt}`);
          }
          break;

        case 'remove_background':
          operations.removeBackground?.();
          toast.success('Background removal started');
          break;

        case 'webcam':
          if (command.target === 'capture') {
            operations.captureWebcam?.();
            toast.success('Opening webcam for capture');
          } else {
            operations.startWebcam?.();
            toast.success('Starting webcam');
          }
          break;

        case 'upload':
          operations.upload?.();
          toast.success('Opening file dialog');
          break;

        case 'save':
          operations.save?.();
          toast.success('Saving project');
          break;

        case 'export':
          operations.export?.(command.parameters?.format || 'png');
          toast.success(`Exporting as ${command.parameters?.format || 'PNG'}`);
          break;

        case 'clear':
          operations.clear?.();
          toast.success('Canvas cleared');
          break;

        case 'undo':
          operations.undo?.();
          toast.success('Undone last action');
          break;

        case 'redo':
          operations.redo?.();
          toast.success('Redone last action');
          break;

        default:
          toast.warning(`Unknown command: ${command.action}`);
          console.warn('Unknown voice command:', command);
      }

      // Provide voice feedback
      if (voiceServiceRef.current) {
        const confirmationText = `${command.action} command executed`;
        const synthesis = await voiceServiceRef.current.textToSpeech(confirmationText, 'confirmation');
        await voiceServiceRef.current.playAudio(synthesis.audioUrl);
      }

    } catch (error) {
      console.error('❌ Command execution failed:', error);
      toast.error(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Start conversation mode
  const startConversation = useCallback(async (initialPrompt?: string): Promise<VoiceConversation> => {
    if (!voiceServiceRef.current) {
      throw new Error('Voice service not available');
    }

    try {
      console.log('💬 Starting voice conversation...');
      
      switchMode('conversation');
      
      const conversation = await voiceServiceRef.current.startConversation(initialPrompt);
      
      setState(prev => ({ 
        ...prev, 
        conversation,
        mode: 'conversation' 
      }));
      
      toast.success('Conversation started! You can now speak naturally with the AI.');
      
      return conversation;
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      toast.error('Failed to start conversation');
      throw error;
    }
  }, [switchMode]);

  // Send message in conversation mode
  const sendMessage = useCallback(async (message: string) => {
    if (!voiceServiceRef.current || state.mode !== 'conversation') {
      toast.error('Not in conversation mode');
      return;
    }

    try {
      console.log('💬 Sending message:', message);
      
      // Convert message to speech and play it
      const synthesis = await voiceServiceRef.current.textToSpeech(message, 'response');
      await voiceServiceRef.current.playAudio(synthesis.audioUrl);
      
      toast.success('Message sent');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message');
    }
  }, [state.mode]);

  // End conversation
  const endConversation = useCallback(() => {
    if (!voiceServiceRef.current) return;

    console.log('💬 Ending conversation...');
    
    voiceServiceRef.current.clearConversationHistory();
    setState(prev => ({ 
      ...prev, 
      conversation: null,
      mode: 'command' 
    }));
    
    toast.info('Conversation ended. Switched back to command mode.');
  }, []);

  // Play audio
  const playAudio = useCallback(async (audioUrl: string) => {
    if (!voiceServiceRef.current) return;

    try {
      await voiceServiceRef.current.playAudio(audioUrl);
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      toast.error('Audio playback failed');
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get service status
  const getStatus = useCallback(() => {
    if (!voiceServiceRef.current) {
      return { initialized: false, error: 'Service not available' };
    }
    return voiceServiceRef.current.getStatus();
  }, []);

  return {
    state,
    switchMode,
    startListening,
    stopListening,
    toggleListening,
    processCommand,
    executeCommand,
    startConversation,
    sendMessage,
    endConversation,
    playAudio,
    clearError,
    getStatus
  };
}

// Hook for easy voice canvas integration
export function useVoiceCanvasIntegration(canvasOperations: any) {
  const voiceControl = useVoiceControl();

  // Auto-execute commands when they're processed
  useEffect(() => {
    if (voiceControl.state.lastCommand && canvasOperations) {
      // This would be triggered by the voice processing pipeline
      console.log('🎨 Voice command ready for canvas integration');
    }
  }, [voiceControl.state.lastCommand, canvasOperations]);

  return {
    ...voiceControl,
    canvasOperations
  };
} 