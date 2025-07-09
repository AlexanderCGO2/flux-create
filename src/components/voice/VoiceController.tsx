'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassOverlay';

interface VoiceControllerProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
}

export function VoiceController({
  isListening,
  isProcessing,
  transcript,
  error,
  onStartListening,
  onStopListening
}: VoiceControllerProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  // Voice activity indicator
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        // Simulate audio level for visual feedback
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening]);

  // Track command history
  useEffect(() => {
    if (transcript && !isProcessing && transcript !== lastCommand) {
      setLastCommand(transcript);
      setCommandHistory(prev => [transcript, ...prev.slice(0, 9)]); // Keep last 10 commands
    }
  }, [transcript, isProcessing, lastCommand]);

  const handleVoiceToggle = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleRepeatCommand = () => {
    if (lastCommand) {
      // Trigger repeat of last command
      console.log('Repeating last command:', lastCommand);
      // This would be connected to the actual command processing
    }
  };

  const getVoiceState = () => {
    if (error) return 'error';
    if (isProcessing) return 'processing';
    if (isListening) return 'active';
    return 'idle';
  };

  const voiceCommands = [
    { command: '"Make it brighter"', description: 'Increase image brightness' },
    { command: '"Add contrast"', description: 'Adjust image contrast' },
    { command: '"Apply vintage filter"', description: 'Add retro effects' },
    { command: '"Crop the image"', description: 'Enter crop mode' },
    { command: '"Rotate 90 degrees"', description: 'Rotate image' },
    { command: '"Generate sunset"', description: 'AI background generation' },
    { command: '"Remove person"', description: 'AI object removal' },
    { command: '"Undo"', description: 'Undo last action' },
    { command: '"Save"', description: 'Save current work' },
    { command: '"Help"', description: 'Show available commands' },
  ];

  return (
    <>
      {/* Main Voice Control Panel */}
      <div 
        id="voice-controls"
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <GlassPanel 
          state={isListening || isProcessing ? 'visible' : 'minimal'}
          voiceState={getVoiceState()}
          className="p-4 rounded-2xl border backdrop-blur-xl"
        >
          <div className="flex items-center space-x-4">
            {/* Main Voice Button */}
            <motion.button
              onClick={handleVoiceToggle}
              className={`
                relative w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 accessibility-focus
                ${isListening 
                  ? 'bg-green-500/20 border-2 border-green-400' 
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isListening ? 'Stop voice control' : 'Start voice control'}
              title={isListening ? 'Click to stop listening' : 'Click to start voice control'}
            >
              {/* Audio level visualization */}
              {isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  animate={{ scale: [1, 1 + audioLevel * 0.3, 1] }}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              ) : isListening ? (
                <Mic className="w-8 h-8 text-green-400" />
              ) : (
                <MicOff className="w-8 h-8 text-white/60" />
              )}
            </motion.button>

            {/* Voice Status & Controls */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3">
                {/* Status Text */}
                <div className="text-sm font-medium">
                  {isProcessing ? (
                    <span className="text-blue-400">Processing...</span>
                  ) : isListening ? (
                    <span className="text-green-400">Listening</span>
                  ) : error ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-white/60">Voice Control</span>
                  )}
                </div>

                {/* Additional Controls */}
                <div className="flex items-center space-x-2">
                  {lastCommand && (
                    <button
                      onClick={handleRepeatCommand}
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
                </div>
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="text-xs text-white/80 max-w-xs">
                  <span className="opacity-60">You said: </span>
                  "{transcript}"
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
                <h3 className="text-lg font-semibold text-white">Voice Commands</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="glass-button p-1.5 rounded"
                  aria-label="Close help"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto glass-scroll">
                {voiceCommands.map((cmd, index) => (
                  <div key={index} className="text-sm">
                    <div className="text-green-300 font-medium">{cmd.command}</div>
                    <div className="text-white/60 text-xs">{cmd.description}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-white/60">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-3 h-3" />
                    <span>Press Ctrl+Shift+V to toggle voice</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Volume2 className="w-3 h-3" />
                    <span>Say "help" for voice guidance</span>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command History Panel */}
      {commandHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-32 left-6 z-40 max-w-xs"
        >
          <GlassPanel className="p-4 rounded-xl border backdrop-blur-xl">
            <h4 className="text-sm font-medium text-white mb-3">Recent Commands</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto glass-scroll">
              {commandHistory.slice(0, 5).map((cmd, index) => (
                <div 
                  key={index} 
                  className={`text-xs p-2 rounded ${
                    index === 0 ? 'bg-white/10' : 'bg-white/5'
                  }`}
                >
                  <span className="text-white/80">"{cmd}"</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <GlassPanel 
              voiceState="error"
              className="p-4 rounded-xl border backdrop-blur-xl max-w-md"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-400">Voice Error</div>
                  <div className="text-xs text-white/80 mt-1">{error}</div>
                </div>
                <button
                  onClick={onStartListening}
                  className="glass-button p-2 rounded text-xs"
                >
                  Retry
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Activity Visualization */}
      {isListening && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-green-400 rounded-full"
                animate={{
                  height: [4, 8 + Math.random() * 16, 4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isListening && 'Voice control is active. Speak your command.'}
        {isProcessing && 'Processing your voice command.'}
        {error && `Voice error: ${error}`}
        {transcript && `Voice input received: ${transcript}`}
      </div>
    </>
  );
}