'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'

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

interface ExportPanelProps {
  currentImage?: string | null
  filters?: FilterValues
  className?: string
}

export function ExportPanel({ 
  currentImage,
  filters,
  className = '' 
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'tiff' | 'pdf'>('png')
  const [quality, setQuality] = useState(90)
  const [width, setWidth] = useState<number | undefined>()
  const [height, setHeight] = useState<number | undefined>()
  const [dpi, setDpi] = useState(300)

  const exportImage = async () => {
    if (!currentImage) {
      toast.error('No image available for export')
      return
    }

    setIsExporting(true)
    try {
      console.log('🔄 Exporting image...', { format, quality, width, height, dpi, hasFilters: !!filters })

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentImage,
          format,
          quality,
          width,
          height,
          dpi,
          filters
        })
      })

      const result = await response.json()

      if (result.success) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.imageUrl
        link.download = `export-${Date.now()}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success(`Image exported successfully as ${format.toUpperCase()}!`, {
          description: `File size: ${(result.fileSize / 1024).toFixed(1)}KB`
        })
      } else {
        toast.error('Failed to export image: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Export error:', error)
      toast.error('Failed to export image')
    } finally {
      setIsExporting(false)
    }
  }

  const saveToCanvas = () => {
    if (!currentImage) {
      toast.error('No image available to save')
      return
    }

    try {
      // Create download link for current canvas state
      const link = document.createElement('a')
      link.href = currentImage
      link.download = `canvas-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Canvas saved successfully!')
    } catch (error) {
      console.error('❌ Save error:', error)
      toast.error('Failed to save canvas')
    }
  }

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Export & Save</h3>
      
      {/* Quick Save */}
      <div className="space-y-2">
        <button
          onClick={saveToCanvas}
          disabled={!currentImage}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
        >
          💾 Quick Save PNG
        </button>
      </div>

      <div className="border-t border-white/20 pt-4">
        <h4 className="text-md font-medium text-white mb-3">Advanced Export</h4>
        
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-300">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="png">PNG (Lossless)</option>
            <option value="jpeg">JPEG (Compressed)</option>
            <option value="webp">WebP (Modern)</option>
            <option value="tiff">TIFF (Professional)</option>
            <option value="pdf">PDF (Document)</option>
          </select>
        </div>

        {/* Quality Slider (not for PNG) */}
        {format !== 'png' && (
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">
              Quality: {quality}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Width (px)</label>
            <input
              type="number"
              placeholder="Auto"
              value={width || ''}
              onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Height (px)</label>
            <input
              type="number"
              placeholder="Auto"
              value={height || ''}
              onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* DPI Setting */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-300">DPI (Print Quality)</label>
          <select
            value={dpi}
            onChange={(e) => setDpi(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value={72}>72 DPI (Web)</option>
            <option value={150}>150 DPI (Draft Print)</option>
            <option value={300}>300 DPI (High Quality Print)</option>
            <option value={600}>600 DPI (Professional Print)</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={exportImage}
          disabled={!currentImage || isExporting}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors mt-4"
        >
          {isExporting ? '⏳ Exporting...' : `📤 Export as ${format.toUpperCase()}`}
        </button>

        {filters && (
          <p className="text-xs text-gray-400 mt-2">
            ✨ Filters will be permanently applied during export
          </p>
        )}
      </div>
    </div>
  )
} 