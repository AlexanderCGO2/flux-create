'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Zap, Upload, Settings, Palette, Download } from 'lucide-react'
import { GlassOverlay } from '@/components/ui/GlassOverlay'
import { useVoiceContext } from '@/lib/providers/VoiceProvider'
import { useAccessibility } from '@/lib/providers/AccessibilityProvider'
import { toast } from 'sonner'

export default function HomePage() {
  const [isElectron, setIsElectron] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const voice = useVoiceContext()
  const { announce } = useAccessibility()

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI)
    
    // Log initial setup
    console.log('FluxCreate app initialized')
    console.log('Voice support:', voice.isSupported)
    console.log('Electron environment:', typeof window !== 'undefined' && !!window.electronAPI)
  }, [voice.isSupported])

  const handleVoiceToggle = () => {
    if (voice.isListening) {
      voice.stopListening()
      announce('Voice control stopped')
      toast.info('Voice Control', { description: 'Voice control deactivated' })
    } else {
      voice.startListening()
      announce('Voice control started')
      toast.info('Voice Control', { description: 'Voice control activated - speak your command' })
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string)
        announce('Image uploaded successfully')
        toast.success('Image Upload', { description: 'Image loaded successfully' })
      }
      reader.readAsDataURL(file)
    }
  }

  const generateWithFlux = async () => {
    try {
      announce('Starting AI image generation')
      toast.info('Flux AI', { description: 'Generating image with Flux AI...' })
      
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast.success('Flux AI', { description: 'Image generated successfully!' })
      announce('AI image generation completed')
    } catch (error) {
      console.error('Flux generation error:', error)
      toast.error('Flux AI', { description: 'Failed to generate image' })
      announce('AI image generation failed')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700" />
      
      {/* Glass overlay interface */}
      <GlassOverlay />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Flux Create</h1>
                <p className="text-white/70 text-sm">AI-Powered Voice Image Editor</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceToggle}
                className={`p-3 rounded-xl backdrop-blur-md border transition-all duration-300 ${
                  voice.isListening
                    ? 'bg-red-500/20 border-red-400/50 text-red-300'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                }`}
                aria-label={voice.isListening ? 'Stop voice control' : 'Start voice control'}
              >
                {voice.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/20 transition-all duration-300"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main workspace */}
        <main className="flex-1 p-6">
          <div className="h-full flex gap-6">
            {/* Left panel - Tools */}
            <div className="w-80 space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
                
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                    >
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-white">Upload Image</span>
                    </motion.div>
                  </label>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateWithFlux}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                  >
                    <Zap className="w-5 h-5 text-purple-300" />
                    <span className="text-white">Generate with Flux</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Palette className="w-5 h-5 text-white" />
                    <span className="text-white">Edit Tools</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white">Export</span>
                  </motion.button>
                </div>
              </div>

              {/* Voice status */}
              {voice.isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 backdrop-blur-md rounded-2xl border border-red-400/30 p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-white font-medium">Listening...</span>
                  </div>
                  {voice.transcript && (
                    <p className="text-white/80 text-sm mt-2">"{voice.transcript}"</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Center panel - Canvas */}
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <div className="h-full flex items-center justify-center">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="Current image"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-white/60" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Upload an Image</h3>
                    <p className="text-white/60">
                      Upload an image to start editing, or use voice commands to generate with Flux AI
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-white/60 text-sm">
              {isElectron ? 'Electron App' : 'Web Version'} • Voice {voice.isSupported ? 'Supported' : 'Not Supported'}
            </div>
            <div className="text-white/60 text-sm">
              Flux Create v1.0.0
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}