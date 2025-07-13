'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'

interface BackgroundRemovalPanelProps {
  onImageProcessed: (imageUrl: string) => void
  currentImage?: string | null
  className?: string
}

export function BackgroundRemovalPanel({ 
  onImageProcessed, 
  currentImage,
  className = '' 
}: BackgroundRemovalPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'general' | 'person' | 'object'>('general')

  const removeBackground = async (modelType: string = 'general') => {
    if (!currentImage) {
      toast.error('No image available for background removal')
      return
    }

    setIsLoading(true)
    try {
      console.log('🎭 Starting background removal...', { modelType, hasImage: !!currentImage })
      
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: currentImage,
          model_type: modelType
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Background removal response:', result)
      
      if (result.success && result.imageUrl) {
        onImageProcessed(result.imageUrl)
        toast.success('🎭 Background removed successfully!')
      } else {
        throw new Error(result.error || 'No image URL returned')
      }
    } catch (error: any) {
      console.error('❌ Background removal error:', error)
      toast.error(`Background removal failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const enhanceImage = async (prompt: string) => {
    if (!currentImage) {
      toast.error('No image available for enhancement')
      return
    }

    if (!prompt.trim()) {
      toast.error('Please provide enhancement instructions')
      return
    }

    setIsLoading(true)
    try {
      console.log('✨ Starting image enhancement...', { prompt, hasImage: !!currentImage })
      
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: currentImage,
          prompt: prompt,
          operation: 'enhance'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Image enhancement response:', result)
      
      if (result.success && result.imageUrl) {
        onImageProcessed(result.imageUrl)
        toast.success('✨ Image enhanced successfully!')
      } else {
        throw new Error(result.error || 'No enhanced image returned')
      }
    } catch (error: any) {
      console.error('❌ Image enhancement error:', error)
      toast.error(`Image enhancement failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white">🎭 AI Processing</h3>
        {isLoading && (
          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
        )}
      </div>

      {/* Background Removal Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-white/70">Background Removal</h4>
        
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs text-white/60">Model Type:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'general' | 'person' | 'object')}
            className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-xs"
            disabled={isLoading}
          >
            <option value="general">General (Best for most images)</option>
            <option value="person">Person (Optimized for people)</option>
            <option value="object">Object (For products/items)</option>
          </select>
        </div>

        {/* Remove Background Button */}
        <button
          onClick={() => removeBackground(selectedModel)}
          disabled={isLoading || !currentImage}
          className={`w-full p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isLoading || !currentImage
              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full"></div>
              Removing Background...
            </>
          ) : (
            <>
              🎭 Remove Background
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10"></div>

      {/* AI Enhancement Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-white/70">AI Enhancement</h4>
        
        <div className="space-y-2">
          <label className="text-xs text-white/60">Enhancement Instructions:</label>
          <div className="space-y-2">
            <textarea
              placeholder="e.g., 'make the colors more vibrant', 'improve lighting', 'make it look professional'"
              className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-xs placeholder-white/40 resize-none"
              rows={3}
              disabled={isLoading}
              id="enhancement-prompt"
            />
            
            {/* Quick Enhancement Presets */}
            <div className="grid grid-cols-2 gap-1">
              {[
                'Improve lighting',
                'Enhance colors',
                'Make professional',
                'Artistic style',
                'High contrast',
                'Soft focus'
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    const textarea = document.getElementById('enhancement-prompt') as HTMLTextAreaElement
                    if (textarea) {
                      textarea.value = preset
                    }
                  }}
                  className="text-xs p-1 bg-white/5 hover:bg-white/10 text-white/70 rounded transition-colors"
                  disabled={isLoading}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhance Button */}
        <button
          onClick={() => {
            const textarea = document.getElementById('enhancement-prompt') as HTMLTextAreaElement
            if (textarea) {
              enhanceImage(textarea.value)
            }
          }}
          disabled={isLoading || !currentImage}
          className={`w-full p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isLoading || !currentImage
              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full"></div>
              Enhancing Image...
            </>
          ) : (
            <>
              ✨ Enhance with AI
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {!currentImage && (
        <div className="text-xs text-white/50 text-center p-2 bg-white/5 rounded">
          Load an image to enable AI processing
        </div>
      )}
    </div>
  )
} 