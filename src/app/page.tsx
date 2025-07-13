'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Upload, Settings, Download, Move, Type, 
  Brush, Eraser, Save, FileImage, Filter, Sparkles, X,
  ChevronLeft, ChevronRight, Camera, Palette, Wand2, 
  Image as ImageIcon, Layers, Sliders, Activity,
  Circle, Square, Triangle, Minus, Plus, RotateCw, FlipHorizontal
} from 'lucide-react'
import { EnhancedCanvas } from '@/components/canvas/EnhancedCanvas'
import { WebcamCapture } from '@/components/editor/WebcamCapture'
import { FilterPanel } from '@/components/editor/FilterPanel'
import { VoiceController } from '@/components/voice/VoiceController'
import { toast, Toaster } from 'sonner'

export default function HomePage() {
  // Core state
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [webcamImage, setWebcamImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [showWebcam, setShowWebcam] = useState(false)
  
  // UI state
  const [activePanel, setActivePanel] = useState<'generate' | 'edit' | 'filters'>('generate')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>('')
  const [voiceTranscript, setVoiceTranscript] = useState<string>('')
  const [activeTool, setActiveTool] = useState<'select' | 'brush' | 'eraser' | 'text' | 'shape'>('select')
  
  // Voice state
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [voiceStats, setVoiceStats] = useState({
    sessionsCount: 0,
    totalCommands: 0,
    successRate: 0,
    avgResponseTime: 0
  })
  
  // Filter state
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    hue: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0
  })
  
  // Client-side particles to prevent hydration mismatch
  const [particles, setParticles] = useState<Array<{id: number, left: number, top: number}>>([])
  
  // Initialize particles on client side only
  useEffect(() => {
    const newParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [])
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current input image (prioritize webcam, then uploaded, then generated)
  const currentInputImage = webcamImage || uploadedImage
  const currentDisplayImage = generatedImage || currentInputImage

  // Handle image generation
  const handleGenerate = async () => {
    console.log('🔵 [BUTTON] Generate button clicked!')
    console.log('🔵 [STATE] Current prompt:', prompt)
    
    if (!prompt.trim()) {
      console.log('❌ [ERROR] Empty prompt detected')
      toast.error('Please enter a prompt')
      return
    }

    console.log('🚀 Starting Flux Pro text-to-image generation with prompt:', prompt)
    setIsLoading(true)
    setError(null)

    try {
      const requestBody = {
        prompt: prompt.trim(),
        width: 1024,
        height: 1024,
        seed: Math.floor(Math.random() * 1000000),
        model_type: 'flux-pro'
      }

      console.log('🎨 Using Flux Pro for text-to-image generation')
      toast.info('🎯 Creating with Flux Pro...')

      // Use the proper generate API endpoint
      console.log('🚀 Sending request to /api/generate with:', requestBody)
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json()
        throw new Error(errorData.error || `HTTP error! status: ${generateResponse.status}`)
      }

      const result = await generateResponse.json()
      console.log('✅ Generation request successful:', result)

      // If it's a demo result that's already completed
      if (result.status === 'succeeded' && result.imageUrl) {
        console.log('✅ Demo image ready:', result.imageUrl.slice(0, 50) + '...')
        setGeneratedImage(result.imageUrl)
        setActivePanel('edit')
        toast.success(result.message || 'Image generated successfully!')
        return
      }

      // If we have a prediction ID, poll for completion
      if (result.prediction_id) {
        toast.info('🔄 Processing with Flux Pro... This may take a few moments.')
        let isCompleted = false
        let attempts = 0
        const maxAttempts = 60 // 5 minutes max
        
        while (!isCompleted && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
          attempts++
          
          console.log(`📊 Polling prediction ${result.prediction_id} (attempt ${attempts}/${maxAttempts})`)
          
          const statusResponse = await fetch(`/api/predictions/${result.prediction_id}`)
          if (!statusResponse.ok) {
            throw new Error('Failed to check prediction status')
          }
          
          const status = await statusResponse.json()
          console.log('📊 Prediction status:', status.status)
          
          if (status.status === 'succeeded') {
            const imageUrl = Array.isArray(status.output) ? status.output[0] : status.output
            console.log('✅ Image generated successfully:', imageUrl.slice(0, 50) + '...')
            setGeneratedImage(imageUrl)
            setActivePanel('edit')
            
            toast.success('🎯 Image generated successfully with Flux Pro!')
            isCompleted = true
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Prediction failed')
          } else if (status.status === 'canceled') {
            throw new Error('Prediction was canceled')
          }
          // Continue polling for 'starting' and 'processing' statuses
        }
        
        if (!isCompleted) {
          throw new Error('Prediction timed out after 5 minutes')
        }
      } else {
        throw new Error('No prediction ID returned from server')
      }

    } catch (err) {
      console.error('❌ Generation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('❌ ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image editing with Flux Kontext
  const handleEdit = async () => {
    console.log('🔵 [BUTTON] Edit button clicked!')
    console.log('🔵 [STATE] Current edit prompt:', editPrompt)
    console.log('🔵 [STATE] Current display image:', currentDisplayImage ? 'Available' : 'None')
    
    if (!editPrompt.trim()) {
      console.log('❌ [ERROR] Empty edit prompt detected')
      toast.error('Please enter a transformation prompt')
      return
    }

    if (!currentDisplayImage) {
      console.log('❌ [ERROR] No image to edit')
      toast.error('Please generate or upload an image first')
      return
    }

    console.log('🚀 Starting Flux Kontext image editing with prompt:', editPrompt)
    console.log('🖼️  Using image as input:', currentDisplayImage.slice(0, 50) + '...')
    console.log('🔍 Image sources: webcam=', !!webcamImage, 'uploaded=', !!uploadedImage, 'generated=', !!generatedImage)
    setIsLoading(true)
    setError(null)

    try {
      const requestBody = {
        prompt: editPrompt.trim(),
        image: currentDisplayImage, // ← IMAGE IS BEING USED AS INPUT HERE
        operation: 'edit',
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 20,
        seed: Math.floor(Math.random() * 1000000)
      }

      console.log('🎯 Using Flux Kontext for image-to-image transformation')
      console.log('🖼️  Input image length:', currentDisplayImage.length, 'characters')
      console.log('🖼️  Input image type:', currentDisplayImage.startsWith('data:image/') ? 'Base64 Data URL' : 'URL')
      toast.info('🎯 Transforming with Flux Kontext...')

      // Use the edit API endpoint
      console.log('🚀 Sending request to /api/edit with:', requestBody)
      const editResponse = await fetch('/api/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!editResponse.ok) {
        const errorData = await editResponse.json()
        throw new Error(errorData.error || `HTTP error! status: ${editResponse.status}`)
      }

      const result = await editResponse.json()
      console.log('✅ Edit request successful:', result)

      // If it's a demo result that's already completed
      if (result.status === 'succeeded' && result.imageUrl) {
        console.log('✅ Demo edited image ready:', result.imageUrl.slice(0, 50) + '...')
        setGeneratedImage(result.imageUrl)
        toast.success(result.message || 'Image transformed successfully!')
        return
      }

      // If we have a prediction ID, poll for completion (same pattern as generate)
      if (result.prediction_id) {
        toast.info('🔄 Processing with Flux Kontext... This may take a few moments.')
        let isCompleted = false
        let attempts = 0
        const maxAttempts = 60 // 5 minutes max
        
        while (!isCompleted && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
          attempts++
          
          console.log(`📊 Polling edit prediction ${result.prediction_id} (attempt ${attempts}/${maxAttempts})`)
          
          const statusResponse = await fetch(`/api/predictions/${result.prediction_id}`)
          if (!statusResponse.ok) {
            throw new Error('Failed to check prediction status')
          }
          
          const status = await statusResponse.json()
          console.log('📊 Edit prediction status:', status.status)
          
          if (status.status === 'succeeded') {
            const imageUrl = Array.isArray(status.output) ? status.output[0] : status.output
            console.log('✅ Image edited successfully:', imageUrl.slice(0, 50) + '...')
            setGeneratedImage(imageUrl)
            toast.success('🎯 Image transformed successfully with Flux Kontext!')
            isCompleted = true
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Edit prediction failed')
          } else if (status.status === 'canceled') {
            throw new Error('Edit prediction was canceled')
          }
          // Continue polling for 'starting' and 'processing' statuses
        }
        
        if (!isCompleted) {
          throw new Error('Edit prediction timed out after 5 minutes')
        }
      } else {
        throw new Error('No prediction ID returned from server')
      }

    } catch (err) {
      console.error('❌ Edit error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('❌ ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle webcam capture
  const handleWebcamCapture = (imageData: string) => {
    console.log('📸 [WEBCAM] Photo captured successfully')
    setWebcamImage(imageData)
    setShowWebcam(false)
    toast.success('Photo captured! Ready for AI transformation.')
  }

  const clearWebcamImage = () => {
    console.log('🔵 [BUTTON] Clear webcam image clicked!')
    console.log('🔵 [STATE] Clearing webcam and generated images')
    setWebcamImage(null)
    setGeneratedImage(null)
    toast.success('Webcam image cleared')
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    console.log('🎨 [FILTERS] Filter values changed:', newFilters)
    setFilters(newFilters)
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔵 [INPUT] File input changed!')
    const file = event.target.files?.[0]
    if (!file) {
      console.log('❌ [INPUT] No file selected')
      return
    }

    console.log('📁 [INPUT] File selected:', file.name, 'Type:', file.type, 'Size:', file.size)
    
    if (!file.type.startsWith('image/')) {
      console.log('❌ [INPUT] Invalid file type:', file.type)
      toast.error('Please select a valid image file')
      return
    }

    console.log('📁 [INPUT] Reading file as data URL...')
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log('✅ [INPUT] File loaded successfully, length:', result.length)
      setUploadedImage(result)
      setActivePanel('edit')
      toast.success('Image uploaded successfully!')
    }
    reader.readAsDataURL(file)
  }

  // Voice command operations for the new voice system
  const voiceOperations = {
    generate: (prompt: string) => {
      setPrompt(prompt)
      toast.success(`Generating: ${prompt}`)
      setTimeout(() => handleGenerate(), 1000)
    },
    
    edit: (editPrompt: string) => {
      setEditPrompt(editPrompt)
      setActivePanel('edit')
      toast.success(`Edit prompt set: ${editPrompt}`)
      // Auto-execute edit if we have an image
      if (currentDisplayImage) {
        setTimeout(() => handleEdit(), 1000)
      }
    },
    
    adjust: (property: string, value: number) => {
      setFilters(prev => {
        const filterProperty = property as keyof typeof prev
        if (filterProperty in prev) {
          return {
            ...prev,
            [filterProperty]: Math.max(-100, Math.min(100, prev[filterProperty] + value))
          }
        }
        return prev
      })
      toast.success(`Adjusted ${property} by ${value}`)
    },
    
    applyFilter: (filterName: string) => {
      setActivePanel('filters')
      // Apply predefined filter values
      const filterPresets = {
        vintage: { sepia: 50, contrast: 20, brightness: -10 },
        bw: { grayscale: 100, contrast: 15 },
        dramatic: { contrast: 40, brightness: -5, saturation: 20 },
        soft: { blur: 2, brightness: 5 },
        sharp: { contrast: 25, brightness: 5 }
      }
      
      const preset = filterPresets[filterName as keyof typeof filterPresets]
      if (preset) {
        setFilters(prev => ({ ...prev, ...preset }))
        toast.success(`Applied ${filterName} filter`)
      }
    },
    
    removeBackground: async () => {
      if (!currentDisplayImage) {
        toast.error('No image to process')
        return
      }
      
      try {
        const response = await fetch('/api/remove-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: currentDisplayImage })
        })
        
        const result = await response.json()
        if (result.success) {
          setGeneratedImage(result.imageUrl)
          toast.success('Background removed!')
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('Background removal failed:', error)
        toast.error('Background removal failed')
      }
    },
    
    captureWebcam: () => {
      setShowWebcam(true)
      toast.success('Opening webcam for capture')
    },
    
    startWebcam: () => {
      setShowWebcam(true)
      toast.success('Starting webcam')
    },
    
    upload: () => {
      fileInputRef.current?.click()
      toast.success('Opening file dialog')
    },
    
    save: () => {
      // Implement save functionality
      toast.success('Saving project...')
      console.log('Save project functionality to be implemented')
    },
    
    export: (format = 'png') => {
      // Implement export functionality
      toast.success(`Exporting as ${format.toUpperCase()}...`)
      console.log(`Export as ${format} functionality to be implemented`)
    },
    
    clear: () => {
      setGeneratedImage(null)
      setUploadedImage(null)
      setWebcamImage(null)
      setPrompt('')
      setEditPrompt('')
      toast.success('Canvas cleared')
    },
    
    undo: () => {
      // Implement undo functionality
      toast.success('Undo functionality to be implemented')
    },
    
    redo: () => {
      // Implement redo functionality  
      toast.success('Redo functionality to be implemented')
    }
  }

  // Handle voice command execution
  const handleVoiceCommand = (command: any) => {
    console.log('🎯 Executing voice command from new system:', command)
    // The voice controller will handle command execution automatically
    // through the voiceOperations object
  }

  // Execute voice commands
  const executeVoiceCommand = async (command: any) => {
    console.log('🎯 Executing voice command:', command)
    
    try {
      switch (command.action) {
        case 'generate':
          if (command.parameters?.prompt) {
            setPrompt(command.parameters.prompt)
            toast.success(`Generating: ${command.parameters.prompt}`)
            setTimeout(() => handleGenerate(), 500)
          }
          break

        case 'webcam':
          if (command.target === 'start') {
            setShowWebcam(true)
            toast.success('Opening webcam...')
          } else if (command.target === 'capture') {
            setShowWebcam(true)
            toast.success('Opening webcam for capture...')
          }
          break

        case 'upload':
          fileInputRef.current?.click()
          toast.success('Opening file dialog...')
          break

        case 'save':
          // Implement save functionality
          toast.success('Saving project...')
          break

        case 'export':
          // Implement export functionality
          toast.success('Exporting image...')
          break

        case 'clear':
          setGeneratedImage(null)
          setUploadedImage(null)
          setWebcamImage(null)
          setPrompt('')
          toast.success('Canvas cleared')
          break

        case 'help':
          toast.info('Voice commands: Generate [prompt], Upload file, Take photo, Save, Export, Clear')
          break

        case 'remove_background':
          if (generatedImage || uploadedImage || webcamImage) {
            const currentImage = generatedImage || uploadedImage || webcamImage
            toast.info('Removing background...')
            
            try {
              const response = await fetch('/api/remove-background', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: currentImage })
              })
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
              }
              
              const result = await response.json()
              if (result.success) {
                setGeneratedImage(result.imageUrl)
                toast.success('Background removed successfully!')
              } else {
                throw new Error(result.error)
              }
            } catch (error) {
              console.error('❌ Background removal failed:', error)
              toast.error('Background removal failed')
            }
          } else {
            toast.error('No image to remove background from')
          }
          break

        default:
          toast.warning(`Unknown command: ${command.action}`)
          console.warn('Unknown voice command:', command)
      }

      // Provide audio feedback if available
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(`Command ${command.action} executed`)
        utterance.volume = 0.3
        utterance.rate = 1.2
        window.speechSynthesis.speak(utterance)
      }

    } catch (error: any) {
      console.error('❌ Command execution failed:', error)
      toast.error(`Command failed: ${error.message}`)
    }
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 text-white overflow-hidden">
      <Toaster position="bottom-right" richColors />
      {/* Animated Background Particles - Client-side only to prevent hydration mismatch */}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none">
          {particles.map((particle, i) => (
            <motion.div
              key={particle.id}
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
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Custom Title Bar */}
      <div 
        className="h-8 bg-transparent flex items-center justify-between px-4 text-white/70 border-b border-white/10"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="absolute top-4 left-4 flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => {
              console.log('🔵 [BUTTON] Close window clicked!')
              window.electronAPI?.closeWindow?.()
            }}
            className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:bg-red-600"
          />
          <button
            onClick={() => {
              console.log('🔵 [BUTTON] Minimize window clicked!')
              window.electronAPI?.minimizeWindow?.()
            }}
            className="w-3 h-3 bg-yellow-500 rounded-full cursor-pointer hover:bg-yellow-600"
          />
          <button
            onClick={() => {
              console.log('🔵 [BUTTON] Maximize window clicked!')
              window.electronAPI?.maximizeWindow?.()
            }}
            className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:bg-green-600"
          />
        </div>
        
        {/* App Title */}
        <div className="flex-1 flex items-center justify-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="text-white/80 text-sm font-medium">CRAISEE Desk - AI Image Editor</div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="flex h-full main-interface" style={{ opacity: 1, pointerEvents: 'auto', visibility: 'visible' }}>
        {/* Collapsible Sidebar */}
        <motion.div 
          className="relative bg-white/5 backdrop-blur-xl border-r border-white/10"
          animate={{ width: sidebarCollapsed ? 60 : 320 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Sidebar Toggle */}
          <button
            onClick={() => {
              console.log('🔵 [BUTTON] Sidebar collapse toggle clicked!')
              console.log('🔵 [STATE] Current sidebar state:', sidebarCollapsed ? 'COLLAPSED' : 'EXPANDED')
              console.log('🔵 [STATE] Switching sidebar to:', !sidebarCollapsed ? 'COLLAPSED' : 'EXPANDED')
              setSidebarCollapsed(!sidebarCollapsed)
            }}
            className="absolute -right-3 top-6 w-6 h-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Sidebar Content */}
          <div className="p-4 h-full overflow-hidden">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0 }}
                className="space-y-6 h-full"
                style={{ opacity: 1 }} // Force visibility
              >
                {/* App Title */}
                <div className="text-center pt-8">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    CRAISEE Desk
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
                      onClick={() => {
                        console.log(`🔵 [PANEL] ${label} panel button clicked!`)
                        console.log(`🔵 [STATE] Switching from ${activePanel} to ${id}`)
                        setActivePanel(id as any)
                      }}
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
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <h3 className="font-semibold text-white/90">AI Generation</h3>
                        
                        {/* Model Indicator */}
                        <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-200">
                              Flux Pro (Text→Image)
                            </span>
                          </div>
                          <div className="text-xs text-blue-300 mt-1 opacity-75">
                            High-quality text-to-image generation
                          </div>
                        </div>
                        
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
                                Generating with Flux Pro...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                Generate with Flux Pro (⌘+Enter)
                              </div>
                            )}
                          </button>

                          <div className="space-y-3">
                            <div className="text-xs text-white/50 text-center">Image Input Options</div>
                            
                            {/* Upload and Webcam Controls */}
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <button
                                onClick={() => {
                                  console.log('🔵 [BUTTON] Upload button clicked!')
                                  console.log('🔵 [STATE] Opening file dialog')
                                  fileInputRef.current?.click()
                                }}
                                className="p-3 bg-white/5 border border-white/20 rounded-xl font-medium hover:bg-white/10 transition-all duration-200 flex flex-col items-center gap-1"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-xs">Upload</span>
                              </button>

                              <button
                                onClick={() => {
                                  console.log('🔵 [BUTTON] Webcam button clicked!')
                                  setShowWebcam(true)
                                }}
                                className={`p-3 border border-white/20 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                                  showWebcam 
                                    ? 'bg-red-500/20 border-red-400/30 text-red-200' 
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                <div className="w-4 h-4 relative">
                                  <div className="w-3 h-2 bg-current rounded-sm" />
                                  <div className="w-1 h-1 bg-current rounded-full absolute -top-0.5 left-1.5" />
                                </div>
                                <span className="text-xs">{showWebcam ? 'Stop' : 'Webcam'}</span>
                              </button>
                            </div>


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
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                        style={{ opacity: 1 }} // Force visibility
                      >
                        <h3 className="font-semibold text-white/90">AI Image Editing</h3>
                        
                        {/* Model Indicator */}
                        <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Brush className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-purple-200">
                              FLUX.1 Kontext Pro (Image→Image)
                            </span>
                          </div>
                          <div className="text-xs text-purple-300 mt-1 opacity-75">
                            Official Black Forest Labs image editing model
                          </div>
                        </div>

                        {/* Current Image Status */}
                        {currentDisplayImage && (
                          <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-xl">
                            <div className="flex items-center gap-2">
                              <FileImage className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-200">
                                Using as input: {generatedImage ? 'Generated image' : 
                                 webcamImage ? 'Webcam photo' : 
                                 'Uploaded image'}
                              </span>
                            </div>
                            <div className="text-xs text-green-300 mt-1">
                              ✓ Image will be transformed with your prompt
                            </div>
                          </div>
                        )}

                        {!currentDisplayImage && (
                          <div className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-xl">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-yellow-200">
                                No image loaded. Generate or upload an image first.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Edit Prompt Input */}
                        <div className="space-y-3">
                          <textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Describe how you want to transform the image..."
                            className="w-full h-24 bg-white/5 border border-white/20 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-purple-400/50 backdrop-blur-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleEdit()
                              }
                            }}
                          />
                          
                          <button
                            onClick={handleEdit}
                            disabled={isLoading || !editPrompt.trim() || !currentDisplayImage}
                            className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Transforming with FLUX.1 Kontext Pro...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Wand2 className="w-4 h-4" />
                                Transform with FLUX.1 Kontext Pro (⌘+Enter)
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Upload Options for Edit Tab */}
                        <div className="border-t border-white/10 pt-4">
                          <div className="text-xs text-white/50 text-center mb-3">Add New Image</div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                console.log('🔵 [BUTTON] Upload button clicked from Edit tab!')
                                fileInputRef.current?.click()
                              }}
                              className="p-3 bg-white/5 border border-white/20 rounded-xl font-medium hover:bg-white/10 transition-all duration-200 flex flex-col items-center gap-1"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-xs">Upload</span>
                            </button>

                            <button
                              onClick={() => {
                                console.log('🔵 [BUTTON] Webcam button clicked from Edit tab!')
                                setShowWebcam(true)
                              }}
                              className="p-3 bg-white/5 border border-white/20 rounded-xl font-medium hover:bg-white/10 transition-all duration-200 flex flex-col items-center gap-1"
                            >
                              <Camera className="w-4 h-4" />
                              <span className="text-xs">Webcam</span>
                            </button>
                          </div>
                        </div>

                        {/* Drawing Tools */}
                        <div className="border-t border-white/10 pt-4">
                          <div className="text-xs text-white/50 text-center mb-3">Drawing Tools</div>
                          
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
                        </div>
                      </motion.div>
                    )}

                    {activePanel === 'filters' && (
                      <motion.div
                        key="filters"
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                        style={{ opacity: 1 }} // Force visibility
                      >
                        <FilterPanel
                          onFilterChange={handleFilterChange}
                          initialFilters={filters}
                          className="bg-transparent border-none p-0"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Voice Control */}
                <div className="border-t border-white/10 pt-4">
                  <div className="text-xs text-white/60 mb-2">Voice Control</div>
                  <div className="text-xs text-white/50">
                    Advanced voice control is now handled by the floating voice controller.
                    Use Command Mode for quick actions or Conversation Mode for AI assistance.
                  </div>
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
              {currentDisplayImage && (
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
            <EnhancedCanvas 
              initialImage={currentDisplayImage || undefined}
              width={1024}
              height={768}
              className="w-full h-full"
              onImageChange={(dataUrl: string) => {
                console.log('Canvas image changed:', dataUrl.slice(0, 50) + '...')
                // Handle canvas changes here
              }}
              filters={filters}
            />
          </div>
        </div>
      </div>

      {/* Voice Controller */}
      <VoiceController 
        onCommandExecuted={(command) => {
          console.log('🎯 Voice command executed:', command);
          
          // Demo: Handle transparency commands
          if (command?.action === 'set_transparency') {
            const opacity = command.value ? (100 - command.value) / 100 : 0.1;
            document.body.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
            toast.success(`Set app transparency to ${command.value}%`);
          }
        }}
        canvasOperations={{
          // TODO: Add canvas operations here
          setTransparency: (value: number) => {
            const opacity = (100 - value) / 100;
            document.body.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
          }
        }}
      />

      {/* WebcamCapture Modal */}
      {showWebcam && (
        <WebcamCapture 
          onImageCaptured={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  )
}