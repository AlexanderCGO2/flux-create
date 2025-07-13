'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  RotateCcw,
  AlertCircle,
  Loader2,
  HelpCircle,
  MessageSquare,
  Terminal,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassOverlay';
import { useVoiceControl } from '@/hooks/useVoiceControl';
import { toast } from 'sonner';

interface VoiceControllerProps {
  onCommandExecuted?: (command: any) => void;
  canvasOperations?: any;
  className?: string;
}

export function VoiceController({
  onCommandExecuted,
  canvasOperations,
  className = ''
}: VoiceControllerProps) {
  const voiceControl = useVoiceControl();
  
  const [showHelp, setShowHelp] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [conversationInput, setConversationInput] = useState('');

  // Voice activity indicator simulation - calmer animation
  useEffect(() => {
    if (voiceControl.state.isListening) {
      let counter = 0;
      const interval = setInterval(() => {
        const sineValue = Math.sin(counter * 0.05) * 0.3 + 0.4; // Slower, gentler animation
        setAudioLevel(sineValue * 0.6 + 0.3);
        counter++;
      }, 400); // Much slower update rate: 400ms instead of 100ms
      
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
      return undefined;
    }
  }, [voiceControl.state.isListening]);

  // Handle command execution
  useEffect(() => {
    if (voiceControl.state.lastCommand && canvasOperations && onCommandExecuted) {
      // Auto-execute voice commands
      console.log('🎨 Voice command ready for execution:', voiceControl.state.lastCommand);
      // You would parse and execute the command here
    }
  }, [voiceControl.state.lastCommand, canvasOperations, onCommandExecuted]);

  const handleVoiceToggle = async () => {
    await voiceControl.toggleListening();
  };

  const handleRetryInitialization = async () => {
    console.log('🔄 Retrying voice service initialization...');
    
    try {
      // First try to cleanup existing service
      const status = voiceControl.getStatus();
      console.log('🔍 Current voice service status:', status);
      
      // Try to reinitialize without page reload
      toast.info('Reinitializing voice service...');
      
      // Force a component remount by clearing error state
      voiceControl.clearError();
      
      // Give it a moment then test
      setTimeout(async () => {
        await handleTestRealtimeConnection();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Retry failed:', error);
      toast.error('Retry failed, reloading page...');
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const handleTestRealtimeConnection = async () => {
    try {
      console.log('🔍 Testing realtime connection...');
      
      // Test 1: Check token endpoint
      console.log('📋 Step 1: Testing token endpoint...');
      const response = await fetch('/api/voice/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Token endpoint failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Token endpoint working:', {
        success: data.success,
        tokenLength: data.token?.length,
        tokenStart: data.token?.substring(0, 20)
      });
      
      // Test 2: Check WebSocket connection manually
      console.log('📋 Step 2: Testing WebSocket connection...');
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01&authorization=Bearer%20${encodeURIComponent(data.token)}`;
      
      const testWs = new WebSocket(wsUrl);
      
      const testPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testWs.close();
          reject(new Error('WebSocket test timeout after 5 seconds'));
        }, 5000);
        
        testWs.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket test connection successful');
          testWs.close();
          resolve('success');
        };
        
        testWs.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket test error:', error);
          reject(new Error('WebSocket connection failed'));
        };
        
        testWs.onclose = (event) => {
          console.log('🔗 WebSocket test closed:', event.code, event.reason);
        };
      });
      
      await testPromise;
      
      toast.success('Realtime connection test successful!');
      console.log('🎉 All tests passed - voice service should work');
      
    } catch (error) {
      console.error('❌ Realtime connection test failed:', error);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleModeSwitch = (mode: 'command' | 'conversation') => {
    voiceControl.switchMode(mode);
    
    if (mode === 'conversation') {
      setShowConversation(true);
    } else {
      setShowConversation(false);
    }
  };

  const startConversation = async () => {
    try {
      const prompt = conversationInput.trim() || 'Hello! I\'d like to have a conversation about image editing.';
      await voiceControl.startConversation(prompt);
      setConversationInput('');
      toast.success('Conversation started!');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const endConversation = () => {
    voiceControl.endConversation();
    setShowConversation(false);
    toast.info('Conversation ended');
  };

  const getVoiceState = () => {
    if (voiceControl.state.error) return 'error';
    if (voiceControl.state.isProcessing) return 'processing';
    if (voiceControl.state.isListening) return 'active';
    return 'idle';
  };

  const voiceCommands = [
    // Mode switching
    { command: '"Switch to create mode"', description: 'Change to image generation mode' },
    { command: '"Switch to edit mode"', description: 'Change to image editing mode' },
    { command: '"Switch to filter mode"', description: 'Change to filter application mode' },
    
    // App controls
    { command: '"Set transparency to 90"', description: 'Adjust app background transparency' },
    { command: '"Change background transparency to 50%"', description: 'Modify app opacity' },
    
    // Image generation and loading
    { command: '"Generate sunset landscape"', description: 'Create AI image from description' },
    { command: '"Upload image"', description: 'Open file dialog' },
    { command: '"Take a photo"', description: 'Open webcam capture' },
    { command: '"Save project"', description: 'Save current work' },
    { command: '"Export as PNG"', description: 'Export image' },
    
    // Filter operations
    { command: '"Set blur to 80"', description: 'Apply blur filter with specific value' },
    { command: '"Increase brightness"', description: 'Make image brighter' },
    { command: '"Set contrast to 70"', description: 'Adjust image contrast' },
    { command: '"Increase saturation slightly"', description: 'Boost color saturation' },
    { command: '"Apply vintage filter"', description: 'Use retro filter preset' },
    { command: '"Apply sepia filter"', description: 'Apply sepia tone effect' },
    
    // Transform operations
    { command: '"Zoom in"', description: 'Enlarge the image view' },
    { command: '"Zoom out by 20"', description: 'Reduce image view by amount' },
    { command: '"Rotate left 45 degrees"', description: 'Rotate image counterclockwise' },
    { command: '"Rotate right"', description: 'Rotate image clockwise (90°)' },
    { command: '"Flip horizontally"', description: 'Mirror image left-right' },
    { command: '"Flip vertically"', description: 'Mirror image up-down' },
    
    // Edit operations
    { command: '"Edit: add more contrast"', description: 'AI-powered image editing' },
    { command: '"Remove background"', description: 'AI background removal' },
    { command: '"Enhance image"', description: 'Auto-improve image quality' },
    
    // Canvas operations
    { command: '"Clear canvas"', description: 'Remove all content' },
    { command: '"Undo"', description: 'Undo last action' },
    { command: '"Redo"', description: 'Redo last undone action' },
  ];

  const conversationExamples = [
    'How can I improve the lighting in this image?',
    'What filters would work best for a portrait?',
    'Explain the difference between brightness and exposure',
    'Help me create a professional headshot',
    'What are the best practices for image composition?'
  ];

  return (
    <>
      {/* Main Voice Control Panel */}
      <div 
        id="voice-controls"
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      >
        <GlassPanel 
          state={voiceControl.state.isListening || voiceControl.state.isProcessing ? 'visible' : 'minimal'}
          voiceState={getVoiceState()}
          className="p-4 rounded-2xl border backdrop-blur-xl"
        >
                    {/* Real-time Spoken Text Display */}
          {(voiceControl.state.lastUserTranscript || voiceControl.state.isRecording || voiceControl.state.isListening) && (
            <div className="mb-3 bg-black/30 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-white/70 flex items-center gap-2">
                  {voiceControl.state.isRecording ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 bg-red-400 rounded-full"
                      />
                      <span>Recording</span>
                    </>
                  ) : voiceControl.state.isListening ? (
                    <>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                      <span>Listening</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Recent</span>
                    </>
                  )}
                </div>
                {voiceControl.state.lastUserTranscript && (
                  <div className="text-xs text-white/50">
                    {voiceControl.state.lastUserTranscript.length} chars
                  </div>
                )}
              </div>
              <div className="text-sm font-mono bg-white/5 rounded p-2 max-w-md overflow-hidden border border-white/5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/90 min-h-5"
                >
                  {voiceControl.state.isRecording ? (
                    <span className="text-blue-200">
                      {voiceControl.state.lastUserTranscript || "🎤 Speak now..."}
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="text-red-400 ml-1"
                      >
                        ●
                      </motion.span>
                    </span>
                  ) : voiceControl.state.isListening ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-green-300"
                    >
                      Ready to listen for voice commands...
                    </motion.span>
                  ) : (
                    <span className="text-blue-300">
                      {voiceControl.state.lastUserTranscript || "Click microphone to start voice control"}
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {/* Main Voice Button */}
            <motion.button
              onClick={handleVoiceToggle}
              disabled={!voiceControl.state.initialized}
              className={`
                relative w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 accessibility-focus
                ${voiceControl.state.isListening 
                  ? 'bg-green-500/20 border-2 border-green-400' 
                  : voiceControl.state.initialized
                    ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                    : 'bg-gray-500/10 border border-gray-500/20 cursor-not-allowed'
                }
              `}
              whileHover={voiceControl.state.initialized ? { scale: 1.05 } : {}}
              whileTap={voiceControl.state.initialized ? { scale: 0.95 } : {}}
              aria-label={voiceControl.state.isListening ? 'Stop voice control' : 'Start voice control'}
              title={voiceControl.state.isListening ? 'Click to stop listening' : 'Click to start voice control'}
            >
              {/* Audio level visualization */}
              {voiceControl.state.isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  animate={{ scale: [1, 1 + audioLevel * 0.3, 1] }}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              {voiceControl.state.isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              ) : voiceControl.state.isRecording ? (
                <div className="relative">
                  <Mic className="w-8 h-8 text-red-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                </div>
              ) : voiceControl.state.isListening ? (
                <Volume2 className="w-8 h-8 text-green-400 animate-pulse" />
              ) : voiceControl.state.initialized ? (
                <MicOff className="w-8 h-8 text-white/60" />
              ) : (
                <AlertCircle className="w-8 h-8 text-gray-400" />
              )}
            </motion.button>

            {/* Voice Status & Controls */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3">
                {/* Status Text */}
                <div className="text-sm font-medium">
                  {!voiceControl.state.initialized ? (
                    <span className="text-gray-400">Initializing...</span>
                  ) : voiceControl.state.isProcessing ? (
                    <span className="text-blue-400">Processing command...</span>
                  ) : voiceControl.state.isRecording ? (
                    <span className="text-red-400">🔴 Recording...</span>
                  ) : voiceControl.state.isListening ? (
                    <span className="text-green-400">🔊 Listening for speech...</span>
                  ) : voiceControl.state.error ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-white/60">Click mic to start listening</span>
                  )}
                </div>

                {/* Mode Switch */}
                <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => handleModeSwitch('command')}
                    className={`p-1.5 rounded text-xs transition-all ${
                      voiceControl.state.mode === 'command'
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                    title="Command Mode"
                  >
                    <Terminal className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleModeSwitch('conversation')}
                    className={`p-1.5 rounded text-xs transition-all ${
                      voiceControl.state.mode === 'conversation'
                        ? 'bg-green-500/30 text-green-200'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                    title="Conversation Mode"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                </div>

                {/* Additional Controls */}
                <div className="flex items-center space-x-2">
                  {voiceControl.state.lastCommand && (
                    <button
                      onClick={() => console.log('Repeat last command')}
                      className="glass-button p-1.5 rounded"
                      title="Repeat last command"
                      aria-label="Repeat last voice command"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="glass-button p-1.5 rounded"
                    title="Voice commands help"
                    aria-label="Show voice commands help"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowConversation(!showConversation)}
                    className="glass-button p-1.5 rounded"
                    title="Conversation panel"
                    aria-label="Show conversation panel"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Display */}
              <div className="flex items-center space-x-2">
                {/* Connection Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    voiceControl.state.initialized ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-white/60">
                    {voiceControl.state.initialized ? 'Ready' : 'Not Ready'}
                  </span>
                </div>

                {/* Realtime Status */}
                {voiceControl.state.realtimeConnected && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-blue-300">Realtime</span>
                  </div>
                )}

                {/* Mode Indicator */}
                <span className="text-xs text-white/50">
                  {voiceControl.state.mode === 'command' ? 'Commands' : 'Chat'}
                </span>
                
                {/* Diagnostic Button */}
                <button
                  onClick={() => {
                    console.log('🔍 Voice Service Status:', voiceControl.getStatus());
                    console.log('🔍 Voice Service State:', voiceControl.state);
                  }}
                  className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors"
                  title="Log diagnostic info to console"
                >
                  Debug
                </button>
              </div>

              {/* Real-time Spoken Text Display */}
              {(voiceControl.state.isRecording || voiceControl.state.isProcessing) && (
                <div className="mb-3">
                  <div className="relative overflow-hidden bg-white/5 rounded-lg p-2 max-w-lg">
                    <div className="text-xs text-blue-200 opacity-75 mb-1">
                      {voiceControl.state.isRecording ? '🎤 Speaking...' : '🧠 Processing...'}
                    </div>
                    <div className="text-xs text-white/90 min-h-4">
                      {voiceControl.state.isRecording ? (
                        <motion.div
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-blue-300"
                        >
                          {voiceControl.state.lastUserTranscript || "Listening for your voice..."}
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-yellow-300"
                        >
                          Processing your command...
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript/Command Display */}
              {(voiceControl.state.lastUserTranscript || voiceControl.state.lastAssistantResponse || voiceControl.state.lastCommand) && (
                <div className="space-y-2">
                  {/* User Transcript */}
                  {voiceControl.state.lastUserTranscript && (
                    <div className="text-xs text-blue-300 max-w-xs">
                      <span className="opacity-60">You said: </span>
                      "{voiceControl.state.lastUserTranscript}"
                    </div>
                  )}
                  
                  {/* Assistant Response */}
                  {voiceControl.state.lastAssistantResponse && (
                    <div className="text-xs text-green-300 max-w-xs">
                      <span className="opacity-60">Assistant: </span>
                      "{voiceControl.state.lastAssistantResponse}"
                    </div>
                  )}
                  
                  {/* Legacy Command Display */}
                  {voiceControl.state.lastCommand && !voiceControl.state.lastUserTranscript && (
                    <div className="text-xs text-white/80 max-w-xs">
                      <span className="opacity-60">
                        {voiceControl.state.mode === 'command' ? 'Command: ' : 'Last: '}
                      </span>
                      "{voiceControl.state.lastCommand}"
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {voiceControl.state.error && (
                <div className="text-xs text-red-300 max-w-xs space-y-2">
                  <div>
                    <span className="opacity-60">Error: </span>
                    {voiceControl.state.error}
                  </div>
                  <div className="text-xs text-yellow-300">
                    💡 Try the Test API button first to diagnose the issue
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleTestRealtimeConnection}
                      className="text-xs bg-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                      title="Test WebSocket connection to OpenAI"
                    >
                      Test API
                    </button>
                    <button
                      onClick={handleRetryInitialization}
                      className="text-xs bg-orange-500/20 px-2 py-1 rounded hover:bg-orange-500/30 transition-colors"
                      title="Try to reinitialize without reload"
                    >
                      Quick Fix
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/30 transition-colors"
                      title="Force reload page"
                    >
                      Reload
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Voice Command Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-24 right-6 z-50 max-w-sm"
          >
            <GlassPanel className="p-6 rounded-xl border backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {voiceControl.state.mode === 'command' ? 'Voice Commands' : 'Conversation Examples'}
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="glass-button p-1.5 rounded"
                  aria-label="Close help"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto glass-scroll">
                {voiceControl.state.mode === 'command' 
                  ? voiceCommands.map((cmd, index) => (
                      <div key={index} className="text-sm">
                        <div className="text-green-300 font-medium">{cmd.command}</div>
                        <div className="text-white/60 text-xs">{cmd.description}</div>
                      </div>
                    ))
                  : conversationExamples.map((example, index) => (
                      <div key={index} className="text-sm">
                        <div className="text-blue-300 font-medium">"{example}"</div>
                      </div>
                    ))
                }
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-white/60">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-3 h-3" />
                    <span>Press Ctrl+Shift+V to toggle voice</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Volume2 className="w-3 h-3" />
                    <span>
                      {voiceControl.state.mode === 'command' 
                        ? 'Say commands clearly'
                        : 'Speak naturally for conversation'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Panel */}
      <AnimatePresence>
        {showConversation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-24 left-6 z-50 max-w-md"
          >
            <GlassPanel className="p-6 rounded-xl border backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Voice Conversation</h3>
                <button
                  onClick={() => setShowConversation(false)}
                  className="glass-button p-1.5 rounded"
                  aria-label="Close conversation panel"
                >
                  ✕
                </button>
              </div>

              {voiceControl.state.conversation ? (
                <div className="space-y-4">
                  {/* Conversation History */}
                  <div className="max-h-40 overflow-y-auto glass-scroll space-y-2">
                    {voiceControl.state.conversation.turns.map((turn, index) => (
                      <div 
                        key={turn.id || index}
                        className={`p-2 rounded text-sm ${
                          turn.type === 'user' 
                            ? 'bg-blue-500/20 text-blue-100 ml-4' 
                            : 'bg-green-500/20 text-green-100 mr-4'
                        }`}
                      >
                        <div className="font-medium text-xs opacity-60 mb-1">
                          {turn.type === 'user' ? 'You' : 'AI'}
                        </div>
                        {turn.content}
                      </div>
                    ))}
                  </div>

                  {/* End Conversation */}
                  <button
                    onClick={endConversation}
                    className="w-full p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded transition-all"
                  >
                    End Conversation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Start Conversation */}
                  <div>
                    <label className="text-sm text-white/80 mb-2 block">
                      Start conversation with:
                    </label>
                    <textarea
                      value={conversationInput}
                      onChange={(e) => setConversationInput(e.target.value)}
                      placeholder="Hello! I'd like help with image editing..."
                      className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 text-sm resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={startConversation}
                    disabled={voiceControl.state.mode !== 'conversation'}
                    className="w-full p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Voice Conversation
                  </button>

                  {voiceControl.state.mode !== 'conversation' && (
                    <p className="text-xs text-yellow-300 text-center">
                      Switch to Conversation Mode first
                    </p>
                  )}
                </div>
              )}
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {voiceControl.state.isListening && `Voice control active in ${voiceControl.state.mode} mode`}
        {voiceControl.state.isProcessing && 'Processing voice input'}
        {voiceControl.state.error && `Voice error: ${voiceControl.state.error}`}
        {voiceControl.state.lastCommand && `Voice input: ${voiceControl.state.lastCommand}`}
      </div>
    </>
  );
}