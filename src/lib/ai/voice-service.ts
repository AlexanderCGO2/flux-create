export interface VoiceServiceConfig {
  apiKey?: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  language?: string;
  mode?: 'command' | 'conversation';
  realtimeEnabled?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  type?: 'command' | 'conversation';
}

export interface SynthesisResult {
  audioUrl: string;
  duration?: number;
  type?: 'response' | 'confirmation';
}

export interface VoiceCommand {
  action: string;
  target?: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: number;
  // Extended properties for comprehensive voice control
  value?: number;
  direction?: string;
  prompt?: string;
  amount?: string;
}

export interface VoiceConversation {
  id: string;
  turns: VoiceConversationTurn[];
  context: Record<string, any>;
  status: 'active' | 'paused' | 'completed';
}

export interface VoiceConversationTurn {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class VoiceService {
  private config: VoiceServiceConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private realtimeConnection: WebSocket | null = null;
  private currentConversation: VoiceConversation | null = null;
  private commandMode = true;
  private conversationHistory: VoiceConversationTurn[] = [];
  private audioContext: AudioContext | null = null;

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      model: 'whisper-1',
      voice: 'alloy',
      language: 'en',
      mode: 'command',
      realtimeEnabled: false,
      ...config
    };
  }

  /**
   * Initialize audio recording capabilities and realtime connection
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🎤 Initializing comprehensive voice service...');
      
      // Request microphone permission
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          } 
        });
        console.log('✅ Microphone access granted');
      } catch (micError) {
        console.error('❌ Microphone access denied:', micError);
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
      }

      // Initialize realtime connection if enabled
      if (this.config.realtimeEnabled) {
        try {
          await this.initializeRealtimeConnection();
          console.log('✅ Realtime connection initialized');
        } catch (realtimeError) {
          console.error('❌ Realtime connection failed:', realtimeError);
          // Don't fail the entire initialization, just disable realtime
          this.config.realtimeEnabled = false;
          console.log('⚠️ Falling back to basic voice mode');
        }
      }

      console.log('✅ Voice service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
      return false;
    }
  }

  /**
   * Initialize OpenAI Realtime API connection for speech-to-speech
   */
  private async initializeRealtimeConnection(): Promise<void> {
    try {
      console.log('🔗 Initializing OpenAI Realtime connection...');
      
      const response = await fetch('/api/voice/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 503) {
          throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        } else {
          throw new Error(`Realtime token request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
      }

      const { token } = await response.json();
      
      if (!token) {
        throw new Error('No token received from realtime-token endpoint');
      }

      console.log('🔑 API key obtained, connecting to WebSocket...');
      console.log('🔗 Token length:', token.length, 'First 20 chars:', token.substring(0, 20));
      
      // OpenAI Realtime API WebSocket connection
      // Use WebSocket subprotocols for authentication (correct approach)
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      console.log('🌐 Connecting to:', wsUrl);
      
      // Create WebSocket connection with authentication subprotocols
      this.realtimeConnection = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${token}`,
        'openai-beta.realtime-v1'
      ]);

      // Set up connection promise for proper error handling
      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          console.error('❌ Realtime connection timeout after 10 seconds');
          reject(new Error('Realtime connection timeout - WebSocket did not connect within 10 seconds'));
        }, 10000); // 10 second timeout

        this.realtimeConnection!.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ Realtime WebSocket connection established successfully');
          console.log('✅ WebSocket protocol:', this.realtimeConnection?.protocol);
          this.sendRealtimeConfig();
          resolve();
        };

        this.realtimeConnection!.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received message:', message.type, message);
            this.handleRealtimeMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            console.error('❌ Raw message:', event.data);
          }
        };

        this.realtimeConnection!.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ Realtime WebSocket connection error:', error);
          console.error('❌ WebSocket readyState:', this.realtimeConnection?.readyState);
          console.error('❌ WebSocket URL:', wsUrl);
          reject(new Error('WebSocket connection failed - Check console for details'));
        };

        this.realtimeConnection!.onclose = (event) => {
          console.log('🔗 Realtime connection closed:', event.code, event.reason);
          if (event.code !== 1000) {
            // Abnormal closure
            console.error('❌ Realtime connection closed unexpectedly');
            console.error('❌ Close code:', event.code, 'Reason:', event.reason);
            
            // Provide specific error messages for common issues
            let errorMessage = 'Realtime connection failed';
            switch (event.code) {
              case 1002:
                errorMessage = 'Protocol error - Invalid WebSocket request';
                break;
              case 1003:
                errorMessage = 'Unsupported data - Check API compatibility';
                break;
              case 1006:
                errorMessage = 'Connection lost - Network or server issue';
                break;
              case 3000:
                errorMessage = 'Authentication failed - Check API key and token format';
                break;
              case 1011:
                errorMessage = 'Server error - OpenAI API issue';
                break;
              case 1015:
                errorMessage = 'TLS handshake failure - Security issue';
                break;
              default:
                errorMessage = `Connection closed with code ${event.code}: ${event.reason}`;
            }
            
            this.emitEvent('error', errorMessage);
          }
        };
      });

    } catch (error) {
      console.error('❌ Failed to initialize realtime connection:', error);
      throw error;
    }
  }

  /**
   * Send configuration to OpenAI Realtime API
   */
  private sendRealtimeConfig(): void {
    if (!this.realtimeConnection) return;

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: `You are a helpful AI assistant for an image editing application called CRAISEE Desk. 
        You can help users with:
        1. Voice commands for image editing (brightness, contrast, filters, etc.)
        2. Creative suggestions for image improvements
        3. Explaining image editing concepts
        4. Troubleshooting editing issues
        
        When users give you commands, interpret them naturally and use the execute_image_command function.
        
        Example command interpretations:
        - "Set transparency to 90" → use execute_image_command with action='set_transparency', value=90
        - "Make it brighter" → use execute_image_command with action='brightness', amount='moderate'
        - "Apply vintage filter" → use execute_image_command with action='filter_preset', target='vintage'
        - "Rotate left 45 degrees" → use execute_image_command with action='rotate', direction='left', value=45
        - "Switch to edit mode" → use execute_image_command with action='switch_mode', target='edit'
        - "Zoom in" → use execute_image_command with action='zoom', direction='in'
        - "Flip horizontally" → use execute_image_command with action='flip', direction='horizontal'
        
        Always confirm what you're doing and be encouraging. Keep responses brief but friendly.
        After executing commands, provide brief confirmation like "Done!" or "Applied vintage filter!"`,
        voice: this.config.voice || 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [
          {
            type: 'function',
            name: 'execute_image_command',
            description: 'Execute image editing commands in the CRAISEE Desk application',
            parameters: {
              type: 'object',
              properties: {
                action: { 
                  type: 'string', 
                  enum: [
                    // Mode switching
                    'switch_mode',
                    // App controls
                    'set_transparency', 'adjust_background',
                    // Image generation and loading
                    'generate', 'upload', 'webcam', 'save', 'export',
                    // Filter operations
                    'blur', 'brightness', 'contrast', 'saturation', 'filter_preset',
                    // Transform operations
                    'zoom', 'rotate', 'flip', 'resize',
                    // Edit operations
                    'edit', 'adjust', 'enhance', 'remove_background',
                    // Canvas operations
                    'clear', 'undo', 'redo'
                  ],
                  description: 'The type of operation to perform'
                },
                target: { 
                  type: 'string',
                  description: 'The target element, mode, or parameter to modify',
                  enum: [
                    // Modes
                    'create', 'edit', 'filter',
                    // App elements
                    'background', 'app_transparency',
                    // Image properties
                    'blur', 'brightness', 'contrast', 'saturation',
                    // Transform properties
                    'zoom', 'rotation', 'horizontal', 'vertical',
                    // Filter presets
                    'vintage', 'sepia', 'grayscale', 'invert', 'noir', 'warm', 'cool'
                  ]
                },
                value: { 
                  type: 'number',
                  description: 'Numeric value for adjustments (0-100 for percentages, degrees for rotation)'
                },
                direction: {
                  type: 'string',
                  description: 'Direction for operations like rotate, flip',
                  enum: ['left', 'right', 'up', 'down', 'horizontal', 'vertical', 'in', 'out']
                },
                prompt: {
                  type: 'string',
                  description: 'Text prompt for generation or editing actions'
                },
                amount: {
                  type: 'string',
                  description: 'Relative adjustment amount',
                  enum: ['slight', 'moderate', 'strong', 'maximum']
                }
              },
              required: ['action']
            }
          }
        ]
      }
    };

    console.log('🔧 Sending session config:', config);
    this.realtimeConnection.send(JSON.stringify(config));
  }

  /**
   * Handle messages from OpenAI Realtime API
   */
  private handleRealtimeMessage(message: any): void {
    console.log('🎤 Realtime message:', message.type, message);

    switch (message.type) {
      case 'session.created':
        console.log('✅ Realtime session created');
        break;

      case 'session.updated':
        console.log('✅ Realtime session updated');
        break;

      case 'conversation.item.created':
        this.handleConversationItem(message.item);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('🎙️ User transcript:', message.transcript);
        this.handleUserTranscript(message.transcript);
        break;

      case 'response.created':
        console.log('🤖 Response created');
        break;

      case 'response.output_item.added':
        console.log('📝 Output item added');
        break;

      case 'response.content_part.added':
        console.log('🗨️ Content part added');
        break;

      case 'response.audio.delta':
        this.handleAudioDelta(message.delta);
        break;

      case 'response.audio.done':
        console.log('🔊 Audio response completed');
        break;

      case 'response.audio_transcript.delta':
        this.handleTranscriptDelta(message.delta);
        break;

      case 'response.audio_transcript.done':
        this.handleTranscriptDone(message.transcript);
        break;

      case 'response.function_call_arguments.delta':
        console.log('🔧 Function call arguments delta');
        break;

      case 'response.function_call_arguments.done':
        this.handleFunctionCall(message.name, message.arguments);
        break;

      case 'response.done':
        console.log('✅ Response completed');
        break;

      case 'error':
        console.error('❌ Realtime error:', message.error);
        this.emitEvent('error', message.error);
        break;

      default:
        console.log('🔄 Unhandled realtime message:', message.type);
    }
  }

  /**
   * Handle user transcript from realtime API
   */
  private handleUserTranscript(transcript: string): void {
    console.log('👤 User said:', transcript);
    
    // Update conversation with user transcript
    if (this.currentConversation) {
      const userTurn: VoiceConversationTurn = {
        id: `turn_${Date.now()}`,
        type: 'user',
        content: transcript,
        timestamp: Date.now()
      };
      
      this.currentConversation.turns.push(userTurn);
      this.conversationHistory.push(userTurn);
      
      this.emitEvent('conversationUpdated', {
        conversation: this.currentConversation,
        newTurn: userTurn
      });
    }
    
    this.emitEvent('userTranscript', { transcript });
  }

  /**
   * Handle transcript delta (streaming text)
   */
  private handleTranscriptDelta(delta: string): void {
    // Update UI with streaming transcript
    this.emitEvent('transcriptDelta', { delta });
  }

  /**
   * Handle conversation items from realtime API
   */
  private handleConversationItem(item: any): void {
    if (!this.currentConversation) {
      this.currentConversation = {
        id: `conv_${Date.now()}`,
        turns: [],
        context: {},
        status: 'active'
      };
    }

    const turn: VoiceConversationTurn = {
      id: item.id,
      type: item.role === 'user' ? 'user' : 'assistant',
      content: item.content?.[0]?.text || item.content?.[0]?.audio || '',
      timestamp: Date.now(),
      metadata: item
    };

    this.currentConversation.turns.push(turn);
    this.conversationHistory.push(turn);

    // Emit event for UI updates
    this.emitEvent('conversationUpdated', {
      conversation: this.currentConversation,
      newTurn: turn
    });
  }

  /**
   * Handle audio delta from realtime API
   */
  private handleAudioDelta(delta: string): void {
    try {
      // Convert base64 audio to playable format
      const audioData = atob(delta);
      const audioArray = new Uint8Array(audioData.length);
      
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      // Play audio chunk
      this.playAudioChunk(audioArray);
    } catch (error) {
      console.error('❌ Error processing audio delta:', error);
    }
  }

  /**
   * Handle transcript completion
   */
  private handleTranscriptDone(transcript: string): void {
    console.log('📝 Assistant transcript completed:', transcript);
    
    // Update conversation with transcript
    if (this.currentConversation) {
      const assistantTurn: VoiceConversationTurn = {
        id: `turn_${Date.now()}`,
        type: 'assistant',
        content: transcript,
        timestamp: Date.now()
      };
      
      this.currentConversation.turns.push(assistantTurn);
      this.conversationHistory.push(assistantTurn);
      
      this.emitEvent('conversationUpdated', {
        conversation: this.currentConversation,
        newTurn: assistantTurn
      });
    }

    this.emitEvent('transcriptCompleted', { transcript });
  }

  /**
   * Handle function calls from realtime API
   */
  private async handleFunctionCall(name: string, args: string): Promise<void> {
    console.log('🔧 Function call:', name, args);

    if (name === 'execute_image_command') {
      try {
        const command = JSON.parse(args);
        await this.executeImageCommand(command);
        
        // Send function call result back to realtime API
        const response = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: `call_${Date.now()}`,
            output: JSON.stringify({
              success: true,
              action: command.action,
              message: `Successfully executed ${command.action} command`
            })
          }
        };
        
        if (this.realtimeConnection) {
          this.realtimeConnection.send(JSON.stringify(response));
          
          // Trigger response generation
          this.realtimeConnection.send(JSON.stringify({
            type: 'response.create'
          }));
        }
        
      } catch (error) {
        console.error('❌ Error executing function call:', error);
        
        // Send error back to realtime API
        const errorResponse = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: `call_${Date.now()}`,
            output: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        };
        
        if (this.realtimeConnection) {
          this.realtimeConnection.send(JSON.stringify(errorResponse));
        }
      }
    }
  }

  /**
   * Execute image command (implement actual functionality)
   */
  private async executeImageCommand(command: VoiceCommand): Promise<void> {
    console.log('🎨 Executing image command:', command);
    
    // Emit command for the main application to handle
    this.emitEvent('commandExecuted', command);
    
    // Process commands by category
    switch (command.action) {
      // Mode switching
      case 'switch_mode':
        console.log(`🔄 Switching to ${command.target} mode`);
        this.handleModeSwitch(command);
        break;

      // App controls
      case 'set_transparency':
        console.log(`🌫️ Setting app transparency to ${command.value}%`);
        this.handleAppTransparency(command);
        break;

      case 'adjust_background':
        console.log(`🎨 Adjusting background`);
        this.handleBackgroundAdjust(command);
        break;

      // Image generation and loading
      case 'generate':
        console.log(`🖼️ Generating image: ${command.prompt}`);
        break;

      case 'upload':
        console.log('📁 Opening file upload');
        break;

      case 'webcam':
        console.log('📷 Opening webcam capture');
        break;

      case 'save':
        console.log('💾 Saving project');
        break;

      case 'export':
        console.log('📤 Exporting image');
        break;

      // Filter operations
      case 'blur':
        console.log(`🌫️ Applying blur: ${command.value || command.amount}`);
        this.handleFilterAdjust('blur', command);
        break;

      case 'brightness':
        console.log(`☀️ Adjusting brightness: ${command.value || command.amount}`);
        this.handleFilterAdjust('brightness', command);
        break;

      case 'contrast':
        console.log(`⚡ Adjusting contrast: ${command.value || command.amount}`);
        this.handleFilterAdjust('contrast', command);
        break;

      case 'saturation':
        console.log(`🎨 Adjusting saturation: ${command.value || command.amount}`);
        this.handleFilterAdjust('saturation', command);
        break;

      case 'filter_preset':
        console.log(`🎭 Applying filter preset: ${command.target}`);
        this.handleFilterPreset(command);
        break;

      // Transform operations
      case 'zoom':
        console.log(`🔍 Zooming ${command.direction}: ${command.value || command.amount}`);
        this.handleTransform('zoom', command);
        break;

      case 'rotate':
        console.log(`🔄 Rotating ${command.direction}: ${command.value || 90}°`);
        this.handleTransform('rotate', command);
        break;

      case 'flip':
        console.log(`🔄 Flipping ${command.direction || command.target}`);
        this.handleTransform('flip', command);
        break;

      case 'resize':
        console.log(`📏 Resizing image`);
        this.handleTransform('resize', command);
        break;

      // Edit operations
      case 'edit':
        console.log(`✏️ Editing image: ${command.prompt}`);
        break;

      case 'adjust':
        console.log(`🎛️ Making adjustments`);
        break;

      case 'enhance':
        console.log(`✨ Enhancing image`);
        break;

      case 'remove_background':
        console.log(`🗑️ Removing background`);
        break;

      // Canvas operations
      case 'clear':
        console.log('🧹 Clearing canvas');
        break;

      case 'undo':
        console.log('↩️ Undoing last action');
        break;

      case 'redo':
        console.log('↪️ Redoing last action');
        break;

      default:
        console.log('❓ Unknown command:', command.action);
    }
  }

  /**
   * Handle mode switching
   */
  private handleModeSwitch(command: VoiceCommand): void {
    const mode = command.target;
    console.log(`🔄 Mode switch requested: ${mode}`);
    
    this.emitEvent('modeSwitch', { 
      mode, 
      previousMode: 'current', // You'll need to track current mode
      source: 'voice'
    });
  }

  /**
   * Handle app transparency adjustment
   */
  private handleAppTransparency(command: VoiceCommand): void {
    const opacity = command.value ? command.value / 100 : 0.9; // Default to 90%
    
    console.log(`🌫️ Setting app transparency: ${opacity}`);
    
    this.emitEvent('appTransparency', {
      opacity,
      value: command.value,
      source: 'voice'
    });
  }

  /**
   * Handle background adjustments
   */
  private handleBackgroundAdjust(command: VoiceCommand): void {
    console.log(`🎨 Background adjustment:`, command);
    
    this.emitEvent('backgroundAdjust', {
      target: command.target,
      value: command.value,
      amount: command.amount,
      source: 'voice'
    });
  }

  /**
   * Handle filter adjustments (blur, brightness, contrast, saturation)
   */
  private handleFilterAdjust(filterType: string, command: VoiceCommand): void {
    let value = command.value;
    
    // Convert amount to numeric value if needed
    if (!value && command.amount) {
      const amountMap = {
        'slight': 20,
        'moderate': 50,
        'strong': 80,
        'maximum': 100
      };
      value = amountMap[command.amount as keyof typeof amountMap] || 50;
    }
    
    console.log(`🎨 Filter adjust: ${filterType} = ${value}`);
    
    this.emitEvent('filterAdjust', {
      filterType,
      value: value || 50,
      amount: command.amount,
      source: 'voice'
    });
  }

  /**
   * Handle filter presets
   */
  private handleFilterPreset(command: VoiceCommand): void {
    const preset = command.target;
    
    console.log(`🎭 Applying filter preset: ${preset}`);
    
    this.emitEvent('filterPreset', {
      preset,
      source: 'voice'
    });
  }

  /**
   * Handle transform operations (zoom, rotate, flip, resize)
   */
  private handleTransform(transformType: string, command: VoiceCommand): void {
    console.log(`🔄 Transform: ${transformType}`, command);
    
    let value = command.value;
    
    // Handle specific transform logic
    switch (transformType) {
      case 'rotate':
        // Default rotation amount
        if (!value) {
          value = 90; // Default 90 degree rotation
        }
        // Handle direction
        if (command.direction === 'left') {
          value = -Math.abs(value);
        }
        break;
        
      case 'zoom':
        // Handle zoom direction
        if (command.direction === 'out') {
          value = value ? -value : -10; // Zoom out
        } else {
          value = value || 10; // Zoom in
        }
        break;
        
      case 'flip':
        // Direction is handled in the event
        break;
    }
    
    this.emitEvent('transform', {
      type: transformType,
      value,
      direction: command.direction || command.target,
      source: 'voice'
    });
  }

  /**
   * Play audio chunk for realtime audio
   */
  private playAudioChunk(audioData: Uint8Array): void {
    // Create audio context if not exists
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }

    // Convert PCM16 to audio buffer and play
    this.audioContext.decodeAudioData(audioData.buffer).then(audioBuffer => {
      if (!this.audioContext) return;
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    }).catch(error => {
      console.error('❌ Audio playback failed:', error);
    });
  }

  /**
   * Switch between command mode and conversation mode
   */
  switchMode(mode: 'command' | 'conversation'): void {
    console.log(`🔄 Switching to ${mode} mode`);
    this.config.mode = mode;
    this.commandMode = mode === 'command';
    
    this.emitEvent('modeChanged', { mode });
  }

  /**
   * Start recording for voice input
   */
  async startRecording(): Promise<boolean> {
    if (!this.stream) {
      console.error('❌ Voice service not initialized');
      return false;
    }

    if (this.isRecording) {
      console.warn('⚠️ Already recording');
      return true;
    }

    try {
      console.log('🔴 Starting voice recording...');
      
      this.audioChunks = [];
      
      // Use different recording strategies based on mode
      if (this.config.mode === 'conversation' && this.realtimeConnection) {
        return this.startRealtimeRecording();
      } else {
        return this.startCommandRecording();
      }
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Start realtime recording with WebSocket streaming
   */
  private startRealtimeRecording(): boolean {
    if (!this.stream || !this.realtimeConnection) return false;

    try {
      // Create audio context for processing
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create MediaStreamAudioSourceNode
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create ScriptProcessorNode for audio processing
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (this.realtimeConnection?.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          const pcmData = this.convertToPCM16(inputData);
          const base64Data = btoa(String.fromCharCode(...pcmData));
          
          // Send audio data to realtime API
          const audioMessage = {
            type: 'input_audio_buffer.append',
            audio: base64Data
          };
          
          this.realtimeConnection.send(JSON.stringify(audioMessage));
        }
      };
      
      // Connect nodes
      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      // Store processor for cleanup
      (this as any).audioProcessor = processor;
      
      console.log('🎤 Realtime recording started');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start realtime recording:', error);
      return false;
    }
  }

  /**
   * Stop realtime recording
   */
  private stopRealtimeRecording(): void {
    if (this.audioContext) {
      // Stop audio processing
      if ((this as any).audioProcessor) {
        (this as any).audioProcessor.disconnect();
        (this as any).audioProcessor = null;
      }
      
      // Close audio context
      this.audioContext.close();
      this.audioContext = null;
      
      // Send commit message to realtime API
      if (this.realtimeConnection?.readyState === WebSocket.OPEN) {
        const commitMessage = {
          type: 'input_audio_buffer.commit'
        };
        
        this.realtimeConnection.send(JSON.stringify(commitMessage));
        
        // Request response generation
        const responseMessage = {
          type: 'response.create'
        };
        
        this.realtimeConnection.send(JSON.stringify(responseMessage));
      }
      
      console.log('🎤 Realtime recording stopped');
    }
  }

  /**
   * Start command recording using MediaRecorder
   */
  private startCommandRecording(): boolean {
    try {
      this.mediaRecorder = new MediaRecorder(this.stream!, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log('🎤 Voice recording started');
        this.emitEvent('recordingStarted', { timestamp: Date.now() });
      };

      this.mediaRecorder.onstop = () => {
        console.log('🎤 Voice recording stopped');
        this.emitEvent('recordingStopped', { timestamp: Date.now() });
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      console.log('✅ Command recording started');
      return true;
    } catch (error) {
      console.error('❌ Command recording failed:', error);
      return false;
    }
  }

  /**
   * Convert Float32Array to PCM16
   */
  private convertToPCM16(float32Array: Float32Array): Uint8Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
    }
    return new Uint8Array(pcm16.buffer);
  }

  /**
   * Stop recording and get audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.isRecording) {
      console.warn('⚠️ Not currently recording');
      return null;
    }

    this.isRecording = false;

    if (this.config.mode === 'conversation' && this.realtimeConnection) {
      // Stop realtime recording
      this.stopRealtimeRecording();
      return null; // Realtime handles response directly
    }

    // Stop command recording
    if (!this.mediaRecorder) return null;

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert speech to text using OpenAI Whisper
   */
  async speechToText(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('🎤 Starting speech-to-text transcription...', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        mode: this.config.mode
      });
      
      const reader = new FileReader();
      const audioData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transcribe',
          audioData,
          model: this.config.model
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      console.log('✅ Transcription completed:', result.text);
      
      // Emit transcript to UI
      this.emitEvent('userTranscript', { transcript: result.text });
      console.log('📢 Transcript emitted to UI components');
      
      return {
        text: result.text,
        confidence: result.confidence || 0.9,
        language: this.config.language,
        type: this.config.mode === 'command' ? 'command' : 'conversation'
      };
    } catch (error) {
      console.error('❌ Speech-to-text failed:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   */
  async textToSpeech(text: string, type: 'response' | 'confirmation' = 'response'): Promise<SynthesisResult> {
    try {
      console.log('🔊 Starting text-to-speech synthesis...');
      
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'synthesize',
          text,
          voice: this.config.voice
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Speech synthesis failed');
      }

      console.log('✅ Speech synthesis completed');
      
      return {
        audioUrl: result.audioUrl,
        duration: result.duration,
        type
      };
    } catch (error) {
      console.error('❌ Text-to-speech failed:', error);
      throw error;
    }
  }

  /**
   * Play audio from URL or data URI
   */
  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('✅ Audio playback completed');
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback failed:', error);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  }

  /**
   * Process voice command using AI
   */
  async processVoiceCommand(transcript: string): Promise<VoiceCommand | null> {
    try {
      console.log('🧠 Processing voice command:', transcript);
      
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          context: {
            mode: this.config.mode,
            conversationHistory: this.conversationHistory.slice(-5) // Last 5 turns
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Command processing failed');
      }

      console.log('✅ Voice command processed:', result.command);
      return result.command;
    } catch (error) {
      console.error('❌ Voice command processing failed:', error);
      return null;
    }
  }

  /**
   * Start conversation mode
   */
  async startConversation(initialPrompt?: string): Promise<VoiceConversation> {
    console.log('💬 Starting voice conversation...');
    
    this.switchMode('conversation');
    
    this.currentConversation = {
      id: `conv_${Date.now()}`,
      turns: [],
      context: { initialPrompt },
      status: 'active'
    };

    if (initialPrompt && this.realtimeConnection) {
      const message = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: initialPrompt }]
        }
      };
      
      this.realtimeConnection.send(JSON.stringify(message));
      
      // Request response
      this.realtimeConnection.send(JSON.stringify({ type: 'response.create' }));
    }

    return this.currentConversation;
  }

  /**
   * Get current conversation
   */
  getCurrentConversation(): VoiceConversation | null {
    return this.currentConversation;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): VoiceConversationTurn[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.currentConversation = null;
  }

  /**
   * Event emitter for voice service events
   */
  private eventHandlers: Record<string, Function[]> = {};

  on(event: string, handler: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event: string, handler: Function): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  private emitEvent(event: string, data?: any): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up voice service...');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.realtimeConnection) {
      this.realtimeConnection.close();
      this.realtimeConnection = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;
    this.eventHandlers = {};
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: !!this.stream,
      recording: this.isRecording,
      mode: this.config.mode,
      realtimeConnected: this.realtimeConnection?.readyState === WebSocket.OPEN,
      conversationActive: this.currentConversation?.status === 'active'
    };
  }
}

// Export singleton instance
export const voiceService = new VoiceService(); 