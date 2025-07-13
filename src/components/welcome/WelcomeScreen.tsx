'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Mic, 
  Sparkles, 
  BookOpen, 
  Image as ImageIcon,
  Play,
  Volume2,
  ChevronRight,
  Users,
  Accessibility
} from 'lucide-react';

interface WelcomeScreenProps {
  onStartProject: (type: 'new' | 'open' | 'template') => void;
  onImageUpload: (file: File) => void;
}

export function WelcomeScreen({ onStartProject, onImageUpload }: WelcomeScreenProps) {

  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  // Check if user has seen the tutorial before
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('craisee-tutorial-completed');
    setHasCompletedTutorial(!!tutorialCompleted);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      onImageUpload(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const markTutorialComplete = () => {
    localStorage.setItem('craisee-tutorial-completed', 'true');
    setHasCompletedTutorial(true);
    setShowVoiceTutorial(false);
  };

  const features = [
    {
      icon: Mic,
      title: 'Voice Control',
      description: 'Edit images naturally with voice commands',
      color: 'text-green-400'
    },
    {
      icon: Sparkles,
      title: 'AI Generation',
      description: 'Create and enhance with AI models',
      color: 'text-blue-400'
    },
    {
      icon: Accessibility,
      title: 'Accessible Design',
      description: 'Professional editing for everyone',
      color: 'text-purple-400'
    },
    {
      icon: BookOpen,
      title: 'Learn & Create',
      description: 'Educational tutorials and guidance',
      color: 'text-orange-400'
    }
  ];

  const templates = [
    {
      id: 'social-post',
      name: 'Social Media Post',
      size: '1080x1080',
      preview: '📱',
      description: 'Perfect for Instagram and Facebook'
    },
    {
      id: 'youtube-thumb',
      name: 'YouTube Thumbnail',
      size: '1280x720',
      preview: '🎬',
      description: 'Eye-catching video thumbnails'
    },
    {
      id: 'presentation',
      name: 'Presentation Slide',
      size: '1920x1080',
      preview: '📊',
      description: 'Professional presentation graphics'
    },
    {
      id: 'poster',
      name: 'Poster Design',
      size: '3000x4000',
      preview: '🎨',
      description: 'High-resolution posters and prints'
    }
  ];

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-32 h-32 flex items-center justify-center mb-4">
                <img 
                  src="/assets/logos/craisee-logo.svg" 
                  alt="CRAISEE Logo" 
                  className="h-32 w-32 object-contain drop-shadow-2xl"
                  onError={(e) => {
                    // Fallback to PNG if SVG fails
                    e.currentTarget.src = "/assets/logos/craisee-logo.png"
                  }}
                />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4 font-display">
              CRAISEE Desk
            </h1>
            <p className="text-xl text-white/60 mb-8">
              Voice-controlled AI image editor
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-overlay p-4 rounded-xl text-center"
                >
                  <feature.icon className={`w-8 h-8 mx-auto mb-2 ${feature.color}`} />
                  <h3 className="text-sm font-medium text-white mb-1">{feature.title}</h3>
                  <p className="text-xs text-white/60">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Action Area */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className="glass-overlay p-8 rounded-2xl border-2 border-dashed border-white/20 text-center cursor-pointer hover:border-white/40 transition-all"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Upload Your Image
                </h3>
                <p className="text-white/60 mb-6">
                  Drag and drop an image or click to browse
                </p>
                
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button className="glass-button px-6 py-3 rounded-lg font-medium">
                  Choose File
                </button>
                
                <p className="text-xs text-white/40 mt-4">
                  Supports: JPG, PNG, WebP, SVG up to 50MB
                </p>
              </div>

              {/* Voice Tutorial Button */}
              {!hasCompletedTutorial && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6"
                >
                  <button
                    onClick={() => setShowVoiceTutorial(true)}
                    className="glass-overlay w-full p-4 rounded-xl border flex items-center space-x-3 hover:bg-white/10 transition-all"
                  >
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-white">Voice Tutorial</h4>
                      <p className="text-xs text-white/60">Learn voice commands in 2 minutes</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Templates Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Start with a Template
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onStartProject('template')}
                    className="glass-overlay p-4 rounded-xl text-left hover:bg-white/10 transition-all"
                  >
                    <div className="text-2xl mb-2">{template.preview}</div>
                    <h4 className="text-sm font-medium text-white mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-white/60 mb-1">{template.size}</p>
                    <p className="text-xs text-white/40">{template.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onStartProject('new')}
                className="glass-button w-full p-4 rounded-xl font-medium"
              >
                Create Blank Canvas
              </button>
            </motion.div>
          </div>

          {/* Quick Start Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center space-x-4 mt-12"
          >
            <button
              onClick={() => onStartProject('open')}
              className="glass-button px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Open Recent</span>
            </button>
            
            <button className="glass-button px-6 py-3 rounded-lg flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Browse Gallery</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Voice Tutorial Modal */}
      <AnimatePresence>
        {showVoiceTutorial && (
          <VoiceTutorialModal
            onClose={() => setShowVoiceTutorial(false)}
            onComplete={markTutorialComplete}
          />
        )}
      </AnimatePresence>

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite">
        Welcome to CRAISEE Experiments Vol 1 VoiceEditor. Upload an image to start editing, or try voice commands.
      </div>
    </div>
  );
}

// Voice Tutorial Modal Component
function VoiceTutorialModal({ 
  onClose, 
  onComplete 
}: { 
  onClose: () => void; 
  onComplete: () => void; 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const tutorialSteps = [
    {
      title: 'Welcome to Voice Control',
      content: 'CRAISEE VoiceEditor responds to natural voice commands. Let\'s learn the basics!',
      action: 'Press "Start" to begin',
      voiceCommand: null
    },
    {
      title: 'Activating Voice Control',
      content: 'Say "Hello CRAISEE" or press Ctrl+Shift+V to start voice control.',
      action: 'Try saying "Hello CRAISEE"',
      voiceCommand: 'hello craisee'
    },
    {
      title: 'Basic Commands',
      content: 'You can use natural language like "make it brighter" or "add contrast".',
      action: 'Try saying "help"',
      voiceCommand: 'help'
    },
    {
      title: 'AI Generation',
      content: 'Create content with commands like "generate a sunset background".',
      action: 'Try saying "show me examples"',
      voiceCommand: 'show me examples'
    },
    {
      title: 'You\'re Ready!',
      content: 'You\'ve learned the basics. Start creating with voice commands!',
      action: 'Complete tutorial',
      voiceCommand: null
    }
  ];

  const currentTutorialStep = tutorialSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleVoiceActivation = () => {
    setIsListening(true);
    
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      handleNext();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-overlay p-8 rounded-2xl max-w-md w-full border"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-green-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            {currentTutorialStep.title}
          </h3>
          
          <p className="text-white/60 mb-6">
            {currentTutorialStep.content}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex space-x-2 mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full flex-1 transition-all ${
                index <= currentStep ? 'bg-green-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          {currentTutorialStep.voiceCommand ? (
            <button
              onClick={handleVoiceActivation}
              className={`glass-button w-full p-4 rounded-lg flex items-center justify-center space-x-3 ${
                isListening ? 'voice-active' : ''
              }`}
              disabled={isListening}
            >
              {isListening ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="w-5 h-5 text-green-400" />
                  </motion.div>
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>{currentTutorialStep.action}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="glass-button w-full p-4 rounded-lg"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Start Creating!' : 'Next'}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full text-white/60 text-sm hover:text-white/80 transition-colors"
          >
            Skip Tutorial
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}