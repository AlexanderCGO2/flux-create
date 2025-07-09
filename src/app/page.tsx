'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Zap, Upload, Settings, Palette, Download, 
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Move, Square,
  Circle, Type, Brush, Eraser, Save, FileImage,
  Volume2, VolumeX, Eye, EyeOff, Layers, Filter
} from 'lucide-react'
import { GlassOverlay } from '@/components/ui/GlassOverlay'
import { Canvas } from '@/components/canvas/Canvas'
import { useVoiceContext } from '@/lib/providers/VoiceProvider'
import { useAccessibility } from '@/lib/providers/AccessibilityProvider'
import { toast } from 'sonner'

export default function HomePage() {
  const [isElectron, setIsElectron] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [canvasMode, setCanvasMode] = useState<'select' | 'brush' | 'eraser' | 'text' | 'shape'>('select')
  const [brushSize, setBrushSize] = useState(10)
  const [zoom, setZoom] = useState(100)
  const [showLayers, setShowLayers] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const voice = useVoiceContext()
  const { announce } = useAccessibility()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI)
    console.log('FluxCreate app initialized')
    console.log('Voice support:', voice.isSupported)
    console.log('Electron environment:', typeof window !== 'undefined' && !!window.electronAPI)
    
    // Initialize canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [voice.isSupported])

  const handleVoiceToggle = () => {
    try {
      if (voice.isListening) {
        voice.stopListening()
        announce('Voice control stopped', 'polite')
        toast.success('Voice control stopped')
      } else {
        voice.startListening()
        announce('Voice control started', 'polite')
        toast.success('Voice control started - say a command!')
      }
    } catch (error) {
      console.error('Voice toggle error:', error)
      toast.error('Voice control unavailable')
    }
  }

  const handleImageUpload = () => {
    if (isElectron && window.electronAPI) {
      // Electron file dialog
      window.electronAPI.openImage?.((event: any, filePath: string) => {
        setCurrentImage(filePath)
        toast.success('Image loaded successfully')
      })
    } else {
      // Web file input
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string)
        toast.success('Image loaded successfully')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAIGeneration = async () => {
    if (!voice.transcript) {
      toast.error('Please speak a command first')
      return
    }

    setIsProcessing(true)
    try {
      announce('Generating AI image', 'polite')
      toast.loading('AI is generating your image...')
      
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock generated image
      setCurrentImage('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY3ZWVhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BSSBHZW5lcmF0ZWQgSW1hZ2U8L3RleHQ+PC9zdmc+')
      
      toast.success('AI image generated successfully!')
      announce('AI image generated', 'polite')
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('Failed to generate AI image')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <GlassOverlay />
      
      {/* Hidden file input for web */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Container */}
      <div className="relative z-10 h-screen flex flex-col">
        
        {/* Top Control Panel */}
        <motion.div 
          className="glass-panel backdrop-blur-xl bg-white/10 border-b border-white/20 p-4"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between">
            
            {/* Left Controls - File Operations */}
            <div className="flex items-center gap-3">
              <motion.div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  F
                </div>
                <span className="text-white font-semibold text-lg">Flux Create</span>
              </motion.div>
              
              <div className="h-6 w-px bg-white/30 mx-2" />
              
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleImageUpload}
                  className="glass-button p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Upload Image"
                >
                  <Upload className="w-5 h-5 text-white" />
                </motion.button>
                
                <motion.button
                  onClick={() => setCurrentImage(null)}
                  className="glass-button p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="New Project"
                >
                  <FileImage className="w-5 h-5 text-white" />
                </motion.button>

                <motion.button
                  className="glass-button p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Save"
                >
                  <Save className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Center Controls - Canvas Tools */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/20">
                {[
                  { mode: 'select', icon: Move, title: 'Select' },
                  { mode: 'brush', icon: Brush, title: 'Brush' },
                  { mode: 'eraser', icon: Eraser, title: 'Eraser' },
                  { mode: 'text', icon: Type, title: 'Text' },
                  { mode: 'shape', icon: Square, title: 'Shape' },
                ].map(({ mode, icon: Icon, title }) => (
                  <motion.button
                    key={mode}
                    onClick={() => setCanvasMode(mode as any)}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      canvasMode === mode 
                        ? 'bg-blue-500/50 text-white border border-blue-400/50' 
                        : 'hover:bg-white/10 text-white/80'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={title}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.button>
                ))}
              </div>
              
              <div className="h-6 w-px bg-white/30 mx-2" />
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="glass-button p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </motion.button>
                
                <span className="text-white text-sm min-w-12 text-center">{zoom}%</span>
                
                <motion.button
                  onClick={() => setZoom(Math.min(400, zoom + 25))}
                  className="glass-button p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Right Controls - Voice & AI */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setShowLayers(!showLayers)}
                  className={`glass-button p-2 rounded-lg transition-all duration-200 border border-white/20 ${
                    showLayers ? 'bg-blue-500/50' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Layers"
                >
                  <Layers className="w-5 h-5 text-white" />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`glass-button p-2 rounded-lg transition-all duration-200 border border-white/20 ${
                    showFilters ? 'bg-blue-500/50' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Filters"
                >
                  <Filter className="w-5 h-5 text-white" />
                </motion.button>
              </div>
              
              <div className="h-6 w-px bg-white/30 mx-2" />
              
              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleVoiceToggle}
                  className={`glass-button p-3 rounded-xl transition-all duration-200 border ${
                    voice.isListening 
                      ? 'bg-red-500/50 border-red-400/50 animate-pulse' 
                      : 'bg-white/10 hover:bg-white/20 border-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={voice.isListening ? 'Stop Voice Control' : 'Start Voice Control'}
                >
                  {voice.isListening ? (
                    <Mic className="w-6 h-6 text-white" />
                  ) : (
                    <MicOff className="w-6 h-6 text-white" />
                  )}
                </motion.button>

                <motion.button
                  onClick={handleAIGeneration}
                  disabled={isProcessing}
                  className={`glass-button p-3 rounded-xl transition-all duration-200 border border-white/20 ${
                    isProcessing 
                      ? 'bg-yellow-500/50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-500/50 to-blue-500/50 hover:from-purple-500/70 hover:to-blue-500/70'
                  }`}
                  whileHover={!isProcessing ? { scale: 1.05 } : {}}
                  whileTap={!isProcessing ? { scale: 0.95 } : {}}
                  title="Generate AI Image"
                >
                  <Zap className={`w-6 h-6 text-white ${isProcessing ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Voice Transcript Display */}
          <AnimatePresence>
            {voice.transcript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-white/5 rounded-lg border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">
                    <span className="text-blue-400">Voice Command:</span> {voice.transcript}
                  </span>
                  {voice.confidence > 0 && (
                    <span className="text-green-400 text-xs">
                      ({Math.round(voice.confidence * 100)}% confidence)
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          {/* Side Panels */}
          <AnimatePresence>
            {showLayers && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="w-64 glass-panel backdrop-blur-xl bg-white/5 border-r border-white/20 p-4"
              >
                <h3 className="text-white font-semibold mb-4">Layers</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Background</span>
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/50">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Main Image</span>
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div 
              className="glass-panel backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-8 max-w-4xl max-h-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {currentImage ? (
                <Canvas
                  imageUrl={currentImage}
                  width={800}
                  height={600}
                  mode={canvasMode}
                  brushSize={brushSize}
                  zoom={zoom}
                  onImageLoad={(dimensions: { width: number; height: number }) => {
                    console.log('Image loaded:', dimensions)
                    announce(`Image loaded: ${dimensions.width} by ${dimensions.height} pixels`, 'polite')
                  }}
                />
              ) : (
                <div className="w-96 h-64 flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4"
                    animate={{ 
                      boxShadow: [
                        '0 0 20px rgba(59, 130, 246, 0.3)',
                        '0 0 40px rgba(147, 51, 234, 0.4)',
                        '0 0 20px rgba(59, 130, 246, 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Palette className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-white text-xl font-semibold mb-2">Ready to Create</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Upload an image or use voice commands to generate AI art
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleImageUpload}
                      className="px-4 py-2 bg-blue-500/50 hover:bg-blue-500/70 text-white rounded-lg border border-blue-400/50 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Upload Image
                    </motion.button>
                    <motion.button
                      onClick={handleVoiceToggle}
                      className="px-4 py-2 bg-purple-500/50 hover:bg-purple-500/70 text-white rounded-lg border border-purple-400/50 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start Voice Control
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Side Panel - Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-64 glass-panel backdrop-blur-xl bg-white/5 border-l border-white/20 p-4"
              >
                <h3 className="text-white font-semibold mb-4">Filters & Effects</h3>
                <div className="space-y-3">
                  {['Blur', 'Sharpen', 'Vintage', 'Sepia', 'Grayscale', 'Brightness', 'Contrast', 'Saturation'].map((filter) => (
                    <motion.button
                      key={filter}
                      className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white text-sm transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="glass-panel backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
              <motion.div
                className="w-16 h-16 border-4 border-white/30 border-t-blue-500 rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <h3 className="text-white text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-white/70">Creating your image...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}