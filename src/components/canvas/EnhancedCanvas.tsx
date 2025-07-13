'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

interface EnhancedCanvasProps {
  initialImage?: string
  onImageChange?: (imageData: string) => void
  className?: string
  width?: number
  height?: number
  filters?: FilterValues
}

interface FilterValues {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  hue: number
  sepia: number
  grayscale: number
  invert: number
}

interface CanvasTools {
  select: boolean
  brush: boolean
  eraser: boolean
  text: boolean
}

export function EnhancedCanvas({ 
  initialImage, 
  onImageChange, 
  className = '',
  width = 1024,
  height = 768,
  filters: externalFilters
}: EnhancedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayContextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [filters, setFilters] = useState<FilterValues>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    hue: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0
  })
  const [tools, setTools] = useState<CanvasTools>({
    select: true,
    brush: false,
    eraser: false,
    text: false
  })
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#000000')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  // Predefined color palette
  const colorPalette = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000'
  ]

  // Update filters when external filters change
  useEffect(() => {
    if (externalFilters) {
      setFilters(externalFilters)
    }
  }, [externalFilters])

  // Initialize canvas (only once)
  useEffect(() => {
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    if (!canvas || !overlayCanvas || contextRef.current) return

    canvas.width = width
    canvas.height = height
    overlayCanvas.width = width
    overlayCanvas.height = height

    const context = canvas.getContext('2d')
    const overlayContext = overlayCanvas.getContext('2d')
    if (!context || !overlayContext) return

    contextRef.current = context
    overlayContextRef.current = overlayContext
    
    // Set up drawing properties for overlay canvas
    overlayContext.lineCap = 'round'
    overlayContext.lineJoin = 'round'
    overlayContext.strokeStyle = brushColor
    overlayContext.lineWidth = brushSize
    overlayContext.fillStyle = brushColor

    console.log('✅ Canvas initialized successfully')
  }, [width, height])

  // Update canvas properties when they change
  useEffect(() => {
    const overlayContext = overlayContextRef.current
    if (!overlayContext) return

    overlayContext.lineWidth = brushSize
    overlayContext.strokeStyle = brushColor
    overlayContext.fillStyle = brushColor
  }, [brushSize, brushColor])

  // Load initial image
  useEffect(() => {
    if (initialImage) {
      loadImageToCanvas(initialImage)
    }
  }, [initialImage])

  const loadImageToCanvas = useCallback((imageUrl: string) => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    setIsLoading(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      // Calculate aspect ratio and draw image to fit canvas
      const imgAspect = img.width / img.height
      const canvasAspect = canvas.width / canvas.height
      
      let drawWidth, drawHeight, drawX, drawY
      
      if (imgAspect > canvasAspect) {
        drawWidth = canvas.width
        drawHeight = canvas.width / imgAspect
        drawX = 0
        drawY = (canvas.height - drawHeight) / 2
      } else {
        drawHeight = canvas.height
        drawWidth = canvas.height * imgAspect
        drawX = (canvas.width - drawWidth) / 2
        drawY = 0
      }
      
      context.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      imageRef.current = img
      
      // Store image position for accurate cursor calculations
      setImagePosition({ x: drawX, y: drawY, width: drawWidth, height: drawHeight })
      
      console.log('✅ Image loaded to canvas', { drawX, drawY, drawWidth, drawHeight })
      setIsLoading(false)
      
      // Notify parent component
      if (onImageChange) {
        onImageChange(canvas.toDataURL())
      }
    }

    img.onerror = () => {
      console.error('❌ Failed to load image:', imageUrl)
      setIsLoading(false)
      toast.error('Failed to load image')
    }

    img.src = imageUrl
  }, [onImageChange])

  // Apply CSS filters for real-time preview
  const getCSSFilter = useCallback(() => {
    const filterParts = [
      `brightness(${100 + filters.brightness}%)`,
      `contrast(${100 + filters.contrast}%)`,
      `saturate(${100 + filters.saturation}%)`,
      `blur(${Math.max(0, filters.blur)}px)`,
      `hue-rotate(${filters.hue}deg)`,
      `sepia(${Math.max(0, filters.sepia)}%)`,
      `grayscale(${Math.max(0, filters.grayscale)}%)`,
      `invert(${Math.max(0, filters.invert)}%)`
    ]
    return filterParts.join(' ')
  }, [filters])

  // Calculate accurate cursor position with improved precision
  const getCursorPosition = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    // Get the actual display size of the canvas
    const displayWidth = rect.width
    const displayHeight = rect.height
    
    // Calculate the scale factor between canvas internal size and display size
    const scaleX = canvas.width / displayWidth
    const scaleY = canvas.height / displayHeight
    
    // Get mouse position relative to canvas display area
    const clientX = event.clientX - rect.left
    const clientY = event.clientY - rect.top
    
    // Convert to canvas coordinates
    const canvasX = clientX * scaleX
    const canvasY = clientY * scaleY

    console.log('🎯 Cursor position:', { 
      clientX, 
      clientY, 
      canvasX, 
      canvasY, 
      scaleX, 
      scaleY,
      rectWidth: rect.width,
      rectHeight: rect.height,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    })

    return { x: canvasX, y: canvasY }
  }, [])

  // Handle drawing operations
  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tools.brush && !tools.eraser) return
    
    const overlayContext = overlayContextRef.current
    if (!overlayContext) return

    const { x, y } = getCursorPosition(event)

    setIsDrawing(true)
    overlayContext.beginPath()
    overlayContext.moveTo(x, y)

    if (tools.eraser) {
      // Use a more controlled eraser that only affects the overlay
      overlayContext.globalCompositeOperation = 'destination-out'
      overlayContext.lineWidth = brushSize * 2 // Make eraser larger
    } else {
      overlayContext.globalCompositeOperation = 'source-over'
      overlayContext.lineWidth = brushSize
      overlayContext.strokeStyle = brushColor
      overlayContext.fillStyle = brushColor
    }

    console.log('🎨 Drawing started at:', { x, y }, 'Tool:', tools.brush ? 'brush' : 'eraser', 'Color:', brushColor)
  }, [tools, brushSize, brushColor, getCursorPosition])

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (!tools.brush && !tools.eraser)) return

    const overlayContext = overlayContextRef.current
    if (!overlayContext) return

    const { x, y } = getCursorPosition(event)

    overlayContext.lineTo(x, y)
    overlayContext.stroke()

    // For eraser, also create a circular "hole"
    if (tools.eraser) {
      overlayContext.save()
      overlayContext.globalCompositeOperation = 'destination-out'
      overlayContext.beginPath()
      overlayContext.arc(x, y, brushSize, 0, Math.PI * 2)
      overlayContext.fill()
      overlayContext.restore()
    }
  }, [isDrawing, tools, brushSize, getCursorPosition])

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    // Merge overlay changes to main canvas
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    const context = contextRef.current
    
    if (canvas && overlayCanvas && context) {
      // Draw overlay onto main canvas
      context.drawImage(overlayCanvas, 0, 0)
      
      // Clear overlay for next operation
      const overlayContext = overlayContextRef.current
      if (overlayContext) {
        overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      }
      
      // Notify parent component of changes
      if (onImageChange) {
        onImageChange(canvas.toDataURL())
      }
    }
  }, [isDrawing, onImageChange])

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCursorPosition(event)
    setCursorPosition({ x, y })
    
    if (isDrawing) {
      draw(event)
    }
  }, [isDrawing, draw, getCursorPosition])

  // Tool handlers
  const selectTool = (tool: keyof CanvasTools) => {
    setTools({
      select: false,
      brush: false,
      eraser: false,
      text: false,
      [tool]: true
    })
    
    // Show color picker when brush is selected
    if (tool === 'brush') {
      setShowColorPicker(true)
    } else {
      setShowColorPicker(false)
    }
    
    // Clear any ongoing drawing when switching tools
    if (isDrawing) {
      setIsDrawing(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain absolute top-0 left-0"
        style={{ 
          filter: getCSSFilter(),
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
      
      {/* Overlay Canvas for drawing operations */}
      <canvas
        ref={overlayCanvasRef}
        className="w-full h-full object-contain cursor-crosshair absolute top-0 left-0"
        style={{ 
          maxWidth: '100%',
          maxHeight: '100%',
          pointerEvents: tools.brush || tools.eraser ? 'auto' : 'none'
        }}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p>Processing...</p>
          </div>
        </div>
      )}

      {/* Tool Palette */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 flex flex-col space-y-2 z-10">
        <button
          onClick={() => selectTool('select')}
          className={`p-2 rounded ${tools.select ? 'bg-cyan-500' : 'bg-gray-600'} text-white transition-colors`}
          title="Select Tool"
        >
          🔸
        </button>
        <button
          onClick={() => selectTool('brush')}
          className={`p-2 rounded ${tools.brush ? 'bg-cyan-500' : 'bg-gray-600'} text-white transition-colors`}
          title="Brush Tool"
        >
          🖌️
        </button>
        <button
          onClick={() => selectTool('eraser')}
          className={`p-2 rounded ${tools.eraser ? 'bg-cyan-500' : 'bg-gray-600'} text-white transition-colors`}
          title="Eraser Tool (Safe Mode)"
        >
          🧽
        </button>
        <button
          onClick={() => selectTool('text')}
          className={`p-2 rounded ${tools.text ? 'bg-cyan-500' : 'bg-gray-600'} text-white transition-colors`}
          title="Text Tool"
        >
          📝
        </button>
      </div>

      {/* Color Picker Panel */}
      {showColorPicker && tools.brush && (
        <div className="absolute top-4 right-20 bg-black/60 backdrop-blur-sm rounded-lg p-3 z-20">
          <div className="text-white text-sm mb-2">Brush Color</div>
          
          {/* Color Input */}
          <div className="mb-3">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-full h-8 rounded border-2 border-white/20 cursor-pointer"
            />
          </div>
          
          {/* Color Palette */}
          <div className="grid grid-cols-5 gap-1">
            {colorPalette.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-6 h-6 rounded border-2 ${
                  brushColor === color ? 'border-white' : 'border-gray-400'
                } transition-all`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          
          {/* Current Color Display */}
          <div className="mt-2 text-xs text-gray-300">
            Selected: {brushColor}
          </div>
        </div>
      )}

      {/* Brush Size Control */}
      {(tools.brush || tools.eraser) && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 z-10">
          <div className="text-white text-sm mb-2">
            {tools.eraser ? 'Eraser' : 'Brush'} Size: {brushSize}px
            {tools.brush && (
              <div 
                className="w-4 h-4 rounded-full inline-block ml-2 border border-white/20"
                style={{ backgroundColor: brushColor }}
              />
            )}
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20"
          />
        </div>
      )}

      {/* Filter Controls Quick Access */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 z-10">
        <div className="text-white text-xs mb-2">Quick Filters</div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, brightness: Math.min(prev.brightness + 10, 50) }))}
            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
            title="Brightness +"
          >
            ☀️
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, contrast: Math.min(prev.contrast + 10, 50) }))}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            title="Contrast +"
          >
            🌗
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, saturation: Math.min(prev.saturation + 10, 100) }))}
            className="px-2 py-1 bg-pink-500 text-white rounded text-xs"
            title="Saturation +"
          >
            🎨
          </button>
          <button
            onClick={() => setFilters({ brightness: 0, contrast: 0, saturation: 0, blur: 0, hue: 0, sepia: 0, grayscale: 0, invert: 0 })}
            className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
            title="Reset Filters"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Debug info */}
      {(tools.brush || tools.eraser) && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-xs text-white z-10">
          Tool: {tools.brush ? 'Brush' : tools.eraser ? 'Eraser' : 'Select'}
          <br />
          Size: {brushSize}px
          {tools.brush && <><br />Color: {brushColor}</>}
          <br />
          Cursor: ({Math.round(cursorPosition.x)}, {Math.round(cursorPosition.y)})
        </div>
      )}
    </div>
  )
} 