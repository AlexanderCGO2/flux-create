'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Zap, Upload, Settings, Palette, Download, 
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Move, Square,
  Circle, Type, Brush, Eraser, Save, FileImage,
  Volume2, VolumeX, Eye, EyeOff, Layers, Filter,
  Sparkles, Plus, Minus,
  Grid3X3, Maximize2, MoreHorizontal, X
} from 'lucide-react'
import { GlassOverlay } from '@/components/ui/GlassOverlay'
import { Canvas } from '@/components/canvas/Canvas'
import { useVoiceContext } from '@/lib/providers/VoiceProvider'
import { useAccessibility } from '@/lib/providers/AccessibilityProvider'
import { fluxAI } from '@/lib/ai/flux'
import { toast } from 'sonner'

export default function HomePage() {
  const [isElectron, setIsElectron] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [canvasMode, setCanvasMode] = useState<'select' | 'brush' | 'eraser' | 'text' | 'shape'>('select')
  const [brushSize, setBrushSize] = useState(10)
  const [zoom, setZoom] = useState(100)
  const [showLayers, setShowLayers] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [activePanel, setActivePanel] = useState<'generate' | 'edit' | 'filters' | null>('generate')

  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    isListening, 
    startListening, 
    stopListening, 
    transcript: lastTranscript 
  } = useVoiceContext()
  
  const { 
    announce
  } = useAccessibility()

  // Check if running in Electron
  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!(window as any).electronAPI)
  }, [])

  // Handle voice commands
  useEffect(() => {
    if (lastTranscript) {
      const command = lastTranscript.toLowerCase()
      console.log('🎤 Voice command received:', command)
      
      if (command.includes('generate') || command.includes('create')) {
        const promptMatch = command.match(/(?:generate|create)\s+(.+)/i)
        if (promptMatch) {
          const extractedPrompt = promptMatch[1]
          setPrompt(extractedPrompt)
          handleGenerateImage(extractedPrompt)
          announce(`Generating image: ${extractedPrompt}`, 'polite')
        }
      } else if (command.includes('zoom in')) {
        setZoom(prev => Math.min(prev + 25, 400))
        announce('Zoomed in', 'polite')
      } else if (command.includes('zoom out')) {
        setZoom(prev => Math.max(prev - 25, 25))
        announce('Zoomed out', 'polite')
      }
    }
  }, [lastTranscript])

  const handleGenerateImage = async (inputPrompt?: string) => {
    const promptToUse = inputPrompt || prompt
    if (!promptToUse.trim()) {
      toast.error('Please enter a prompt for image generation')
      announce('Please enter a prompt for image generation', 'assertive')
      return
    }

    setIsProcessing(true)
    setIsGenerating(true)
    console.log('🎨 Starting AI image generation with prompt:', promptToUse)
    announce(`Starting AI generation: ${promptToUse}`, 'polite')

    try {
      const result = await fluxAI.generateImage({
        prompt: promptToUse,
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        guidance_scale: 7.5
      })

      setCurrentImage(result)
      setPrompt('')
      
      toast.success('Image generated successfully!')
      announce('Image generation completed successfully', 'polite')
      console.log('✅ Image generation completed successfully')
    } catch (error) {
      console.error('❌ Image generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Generation failed')
      announce('Image generation failed', 'assertive')
    } finally {
      setIsProcessing(false)
      setIsGenerating(false)
    }
  }

  const macOSControls = [
    { id: 'close', color: 'bg-red-500 hover:bg-red-600' },
    { id: 'minimize', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { id: 'maximize', color: 'bg-green-500 hover:bg-green-600' }
  ]

  const tools = [
    { id: 'select', icon: Move, label: 'Select', shortcut: 'V' },
    { id: 'brush', icon: Brush, label: 'Brush', shortcut: 'B' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'shape', icon: Square, label: 'Shape', shortcut: 'U' }
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black relative overflow-hidden">
      {/* macOS Window Controls */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-50 flex items-center">
        <div className="flex items-center gap-2 pl-4">
          {macOSControls.map((control) => (
            <motion.button
              key={control.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-3 h-3 rounded-full ${control.color} transition-colors duration-200`}
            />
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            FluxCreate - AI Image Editor
          </span>
        </div>
        <div className="w-16" />
      </div>

      {/* Main Layout */}
      <div className="flex h-full pt-8">
        {/* Sidebar */}
        <motion.div 
          initial={{ width: sidebarExpanded ? 280 : 64 }}
          animate={{ width: sidebarExpanded ? 280 : 64 }}
          className="bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              {sidebarExpanded && (
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold text-gray-800 dark:text-gray-200"
                >
                  Tools
                </motion.h2>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="p-1.5 rounded-lg bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>
          </div>

          {/* Panel Navigation */}
          <div className="p-2">
            {[
              { id: 'generate', icon: Zap, label: 'Generate' },
              { id: 'edit', icon: Brush, label: 'Edit' },
              { id: 'filters', icon: Filter, label: 'Filters' }
            ].map((panel) => (
              <motion.button
                key={panel.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActivePanel(panel.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  activePanel === panel.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <panel.icon className="w-5 h-5" />
                {sidebarExpanded && (
                  <span className="font-medium">{panel.label}</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activePanel === 'generate' && (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {sidebarExpanded && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Prompt
                        </label>
                        <textarea
                          ref={promptInputRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the image you want to create..."
                          className="w-full h-24 p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleGenerateImage()
                            }
                          }}
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGenerateImage()}
                        disabled={isProcessing || !prompt.trim()}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isGenerating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate
                          </>
                        )}
                      </motion.button>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ⌘ + Enter to generate
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={isListening ? stopListening : startListening}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isListening 
                              ? 'bg-red-500 text-white shadow-lg' 
                              : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activePanel === 'edit' && (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Tools */}
                  <div className="space-y-2">
                    {tools.map((tool) => (
                      <motion.button
                        key={tool.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCanvasMode(tool.id as any)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                          canvasMode === tool.id
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <tool.icon className="w-4 h-4" />
                        {sidebarExpanded && (
                          <>
                            <span className="font-medium flex-1 text-left">{tool.label}</span>
                            <span className="text-xs opacity-60">{tool.shortcut}</span>
                          </>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {sidebarExpanded && (
                    <>
                      {/* Brush Size */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Brush Size: {brushSize}px
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Zoom: {zoom}%
                        </label>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setZoom(prev => Math.max(prev - 25, 25))}
                            className="p-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </motion.button>
                          <div className="flex-1 text-center text-sm font-medium">
                            {zoom}%
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setZoom(prev => Math.min(prev + 25, 400))}
                            className="p-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activePanel === 'filters' && (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {sidebarExpanded && (
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                      Filters coming soon...
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                fluxAI.getStatus().ready ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {sidebarExpanded && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {fluxAI.getStatus().ready ? 'AI Ready' : 'Setup Required'}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
          {/* Top Toolbar */}
          <div className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Import</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!currentImage}
                className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setZoom(100)}
                className="px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm font-medium hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                {zoom}%
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                <Grid3X3 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-6">
            <Canvas 
              imageUrl={currentImage || undefined}
              width={1024}
              height={768}
              className="w-full h-full"
              onImageChange={(dataUrl) => {
                console.log('Canvas image changed:', dataUrl.slice(0, 50) + '...')
                // Handle canvas changes here
              }}
            />
          </div>
        </div>
      </div>

      {/* Voice Transcript Display */}
      <AnimatePresence>
        {lastTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-black/80 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  "{lastTranscript}"
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
      `}</style>
    </div>
  )
}