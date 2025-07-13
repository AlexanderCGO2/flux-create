'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Camera, 
  RotateCcw, 
  X, 
  AlertCircle, 
  Loader2, 
  Zap,
  Eye,
  Square,
  CheckCircle
} from 'lucide-react'

interface WebcamCaptureProps {
  onImageCaptured: (imageData: string) => void
  onClose: () => void
}

export function WebcamCapture({ onImageCaptured, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  // Initialize webcam
  const initializeWebcam = useCallback(async () => {
    setIsInitializing(true)
    setError(null)

    try {
      console.log('🎥 Requesting webcam access...')
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode
        },
        audio: false
      })

      setStream(mediaStream)
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        console.log('✅ Webcam initialized successfully')
      }
    } catch (err) {
      console.error('❌ Failed to access webcam:', err)
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and try again.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.')
        } else if (err.name === 'NotSupportedError') {
          setError('Camera not supported by this browser.')
        } else {
          setError(`Camera error: ${err.message}`)
        }
      } else {
        setError('Failed to access camera. Please check your permissions.')
      }
      
      toast.error('Failed to access webcam')
    } finally {
      setIsInitializing(false)
    }
  }, [facingMode])

  // Capture photo
  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || !hasPermission) {
      toast.error('Camera not ready')
      return
    }

    setIsCapturing(true)

    try {
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      console.log('📸 Photo captured successfully')
      
      // Provide feedback with a flash effect
      if (videoRef.current) {
        videoRef.current.style.filter = 'brightness(2)'
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.style.filter = 'none'
          }
        }, 150)
      }

      onImageCaptured(imageData)
      toast.success('Photo captured!')
      
      // Close webcam after successful capture
      setTimeout(() => {
        onClose()
      }, 500)
      
    } catch (err) {
      console.error('❌ Failed to capture photo:', err)
      toast.error('Failed to capture photo')
    } finally {
      setIsCapturing(false)
    }
  }, [hasPermission, onImageCaptured, onClose])

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    
    // Clean up current stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    // Reinitialize with new facing mode
    setTimeout(() => {
      initializeWebcam()
    }, 100)
  }, [facingMode, stream, initializeWebcam])

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        console.log('🎥 Webcam stream cleaned up')
      }
    }
  }, [stream])

  // Initialize webcam on mount
  useEffect(() => {
    initializeWebcam()
  }, [initializeWebcam])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Webcam Capture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Camera Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={initializeWebcam}
              className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isInitializing && !error && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
            <p className="text-white text-lg">Initializing camera...</p>
            <p className="text-gray-400 text-sm">Please allow camera access when prompted</p>
          </div>
        )}

        {/* Webcam View */}
        {hasPermission && !error && (
          <div className="space-y-4">
            
            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Video overlay for capture feedback */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                  <div className="p-4 bg-black/50 rounded-full">
                    <Zap className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
              )}
              
              {/* Camera info overlay */}
              <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-white" />
                  <p className="text-white text-sm">
                    {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                disabled={isCapturing || isInitializing}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all flex items-center justify-center group"
                title="Switch Camera"
              >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={isCapturing || isInitializing || !hasPermission}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-3"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Capturing...</span>
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5" />
                    <span>Take Photo</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isCapturing}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="text-center text-gray-400 text-sm space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p>Position yourself in the frame and click "Take Photo" to capture an image</p>
              </div>
              <p className="text-xs opacity-75">The photo will be automatically loaded into the editor</p>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  )
} 