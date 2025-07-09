'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
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
  const [isDragging, setIsDragging] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<'select' | 'move' | 'zoom'>('select')
  const [isLoading, setIsLoading] = useState(false)

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Save context state
    ctx.save()
    
    // Apply transformations
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y)
    ctx.scale(zoom, zoom)
    
    // Draw image centered
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight
    const scale = Math.min(canvas.width / imgWidth, canvas.height / imgHeight) * 0.8
    
    const scaledWidth = imgWidth * scale
    const scaledHeight = imgHeight * scale
    
    ctx.drawImage(
      img,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    )
    
    // Restore context state
    ctx.restore()
  }, [zoom, offset])

  const loadImage = useCallback((src: string) => {
    setIsLoading(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      drawImage(img)
      setIsLoading(false)
      
      // Call onImageChange callback if provided
      if (onImageChange && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png')
        onImageChange(dataUrl)
      }
    }
    
    img.onerror = () => {
      console.error('Failed to load image:', src)
      setIsLoading(false)
    }
    
    img.src = src
  }, [drawImage, onImageChange])

  // Load image when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      loadImage(imageUrl)
    }
  }, [imageUrl, loadImage])

  // Handle mouse events for pan and zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'move') {
      setIsDragging(true)
      setLastPosition({ x: e.clientX, y: e.clientY })
    }
  }, [tool])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && tool === 'move') {
      const deltaX = e.clientX - lastPosition.x
      const deltaY = e.clientY - lastPosition.y
      
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPosition({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, lastPosition, tool])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5))
    }
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev * 0.8, 0.1))
  }, [])

  const fitToScreen = useCallback(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 ${className}`}
    >
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setTool(tool === 'move' ? 'select' : 'move')}
          className={`p-2 rounded-lg backdrop-blur-xl border transition-all duration-200 ${
            tool === 'move' 
              ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' 
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
          title="Move Tool (V)"
        >
          <Move size={16} />
        </button>
        
        <button
          onClick={zoomOut}
          className="p-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 transition-all duration-200"
          title="Zoom Out (-)"
        >
          <ZoomOut size={16} />
        </button>
        
        <button
          onClick={zoomIn}
          className="p-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 transition-all duration-200"
          title="Zoom In (+)"
        >
          <ZoomIn size={16} />
        </button>
        
        <button
          onClick={fitToScreen}
          className="p-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 transition-all duration-200"
          title="Fit to Screen (0)"
        >
          <Maximize2 size={16} />
        </button>
        
        <button
          onClick={resetView}
          className="p-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 transition-all duration-200"
          title="Reset View (R)"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1 rounded-lg bg-black/20 backdrop-blur-xl border border-white/10 text-white/70 text-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full h-full ${tool === 'move' ? 'cursor-move' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
            <span className="text-white/70 text-sm">Loading image...</span>
          </div>
        </div>
      )}

      {/* Placeholder when no image */}
      {!imageUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/50">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm">No image loaded</p>
            <p className="text-xs opacity-75 mt-1">Upload or generate an image to start editing</p>
          </div>
        </div>
      )}
    </div>
  )
}