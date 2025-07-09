'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Zap, Upload, Settings, Palette, Download, 
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Move, Square,
  Circle, Type, Brush, Eraser, Save, FileImage,
  Volume2, VolumeX, Eye, EyeOff, Layers, Filter,
  Sparkles, Plus, Minus, Grid3X3, Maximize2, MoreHorizontal, X,
  ChevronLeft, ChevronRight, Play, Pause
} from 'lucide-react'
import { Canvas } from '@/components/canvas/Canvas'
import { fluxAI } from '@/lib/ai/flux'
import { toast } from 'sonner'

export default function HomePage() {
  // Core state
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [activePanel, setActivePanel] = useState<'generate' | 'edit' | 'filters'>('generate')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [activeTool, setActiveTool] = useState<'select' | 'brush' | 'eraser' | 'text' | 'shape'>('select')
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    console.log('🚀 Starting image generation with prompt:', prompt)
    setIsLoading(true)
    setError(null)

    try {
      const imageUrl = await fluxAI.generateImage({
        prompt: prompt.trim(),
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5
      })

      if (imageUrl) {
        console.log('✅ Image generated successfully:', imageUrl.slice(0, 50) + '...')
        setGeneratedImage(imageUrl)
        setActivePanel('edit')
        toast.success('Image generated successfully!')
      } else {
        console.error('❌ Generation failed: No image URL returned')
        setError('Failed to generate image. Please try again.')
        toast.error('Failed to generate image')
      }
    } catch (err) {
      console.error('❌ Generation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImage(result)
      setActivePanel('edit')
      toast.success('Image uploaded successfully!')
    }
    reader.readAsDataURL(file)
  }

  // Handle voice toggle
  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive)
    toast.info(isVoiceActive ? 'Voice control disabled' : 'Voice control enabled')
  }

  // Get current image
  const currentImage = generatedImage || uploadedImage

  return (
    <div className="h-screen w-screen bg-transparent text-white overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* macOS Window Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        <div className="w-3 h-3 bg-green-500 rounded-full" />
      </div>

      {/* Main Interface */}
      <div className="flex h-full">
        {/* Collapsible Sidebar */}
        <motion.div 
          className="relative bg-white/5 backdrop-blur-xl border-r border-white/10"
          animate={{ width: sidebarCollapsed ? 60 : 320 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Sidebar Content */}
          <div className="p-4 h-full overflow-hidden">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 h-full"
              >
                {/* App Title */}
                <div className="text-center pt-8">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Flux Create
                  </h1>
                  <p className="text-xs text-white/60 mt-1">AI-Powered Image Editor</p>
                </div>

                {/* Panel Navigation */}
                <div className="space-y-2">
                  {[
                    { id: 'generate', label: 'Generate', icon: Sparkles },
                    { id: 'edit', label: 'Edit', icon: Brush },
                    { id: 'filters', label: 'Filters', icon: Filter },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActivePanel(id as any)}
                      className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        activePanel === id
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
          </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {activePanel === 'generate' && (
                      <motion.div
                        key="generate"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="font-semibold text-white/90">AI Generation</h3>
                        
                        <div className="space-y-3">
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create..."
                            className="w-full h-24 bg-white/5 border border-white/20 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400/50 backdrop-blur-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleGenerate()
                              }
                            }}
                          />
                          
                          <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                Generate (⌘+Enter)
                              </div>
                            )}
                          </button>

                          <div className="text-center">
                            <div className="text-xs text-white/50 mb-2">or</div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full p-3 bg-white/5 border border-white/20 rounded-xl font-medium hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Upload Image
                            </button>
                          </div>
                        </div>

                        {error && (
                          <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                            <p className="text-sm text-red-200">{error}</p>
                          </div>
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
                        <h3 className="font-semibold text-white/90">Edit Tools</h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'select', icon: Move, label: 'Select' },
                            { id: 'brush', icon: Brush, label: 'Brush' },
                            { id: 'eraser', icon: Eraser, label: 'Eraser' },
                            { id: 'text', icon: Type, label: 'Text' },
                          ].map(({ id, icon: Icon, label }) => (
                            <button
                              key={id}
                              onClick={() => setActiveTool(id as any)}
                              className={`p-3 rounded-lg transition-all duration-200 ${
                                activeTool === id
                                  ? 'bg-blue-500/20 border border-blue-400/30'
                                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              <Icon className="w-4 h-4 mx-auto mb-1" />
                              <div className="text-xs">{label}</div>
                            </button>
                          ))}
                        </div>
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
                        <h3 className="font-semibold text-white/90">Filters & Effects</h3>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            'Blur', 'Sharpen', 'Vintage', 'B&W', 'Sepia', 'Contrast'
                          ].map((filter) => (
                            <button
                              key={filter}
                              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200 text-sm"
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Voice Control */}
                <div className="border-t border-white/10 pt-4">
                  <button
                    onClick={toggleVoice}
                    className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                      isVoiceActive
                        ? 'bg-red-500/20 border border-red-400/30 text-red-200'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {isVoiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {isVoiceActive ? 'Voice Active' : 'Enable Voice'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {sidebarCollapsed && (
              <div className="flex flex-col items-center gap-4 pt-12">
                <Sparkles className="w-6 h-6 text-white/60" />
                <Brush className="w-6 h-6 text-white/60" />
                <Filter className="w-6 h-6 text-white/60" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Controls Bar */}
          <div className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Canvas</h2>
              {currentImage && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Image loaded
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
                <Save className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">
                <Settings className="w-4 h-4" />
              </button>
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
    </div>
  )
}