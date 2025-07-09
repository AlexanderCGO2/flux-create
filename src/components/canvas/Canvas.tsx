'use client'

import React, { useRef, useEffect, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Move, Maximize2 } from 'lucide-react'

interface CanvasProps {
  imageUrl?: string
  width?: number
  height?: number
  className?: string
  onImageChange?: (dataUrl: string) => void
}

export function Canvas({ 
  imageUrl, 
  width = 800, 
  height = 600, 
  className = '',
  onImageChange 
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState<'select' | 'brush' | 'eraser'>('select')
  const [imageLoaded, setImageLoaded] = useState(false)

  // Load image onto canvas
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Calculate scaling to fit image
      const scale = Math.min(width / img.width, height / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      
      // Center the image
      const x = (width - scaledWidth) / 2
      const y = (height - scaledHeight) / 2
      
      // Draw image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      setImageLoaded(true)
      
      // Callback with canvas data
      if (onImageChange) {
        onImageChange(canvas.toDataURL())
      }
    }
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error)
      setImageLoaded(false)
    }
    
    img.src = imageUrl
  }, [imageUrl, width, height, onImageChange])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleReset = () => {
    setZoom(1)
  }

  const handleFitToScreen = () => {
    if (containerRef.current && canvasRef.current) {
      const container = containerRef.current
      const canvas = canvasRef.current
      const scale = Math.min(
        container.offsetWidth / canvas.width,
        container.offsetHeight / canvas.height
      )
      setZoom(scale)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden ${className}`}
    >
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Tool Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
          <span className="text-white text-sm font-medium capitalize">{tool}</span>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        className="w-full h-full flex items-center justify-center p-6"
        style={{ transform: `scale(${zoom})` }}
      >
        {imageUrl ? (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10"
            style={{
              background: imageLoaded ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                <Move className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium">No Image Loaded</p>
              <p className="text-sm opacity-75">Upload an image or generate one with AI</p>
            </div>
          </div>
        )}
      </div>

      {/* Zoom Indicator */}
      {zoom !== 1 && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
            <span className="text-white text-sm font-medium">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}