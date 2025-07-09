'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Line } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

interface CanvasProps {
  imageUrl?: string | null
  width?: number
  height?: number
  mode: 'select' | 'brush' | 'eraser' | 'text' | 'shape'
  brushSize: number
  zoom: number
  onImageLoad?: (dimensions: { width: number; height: number }) => void
}

interface DrawingElement {
  id: string
  type: 'line' | 'rect' | 'circle' | 'text'
  points?: number[]
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  stroke?: string
  strokeWidth?: number
  fill?: string
}

export function Canvas({ 
  imageUrl, 
  width = 800, 
  height = 600, 
  mode, 
  brushSize,
  zoom,
  onImageLoad 
}: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [image] = useImage(imageUrl || '')
  const [isDrawing, setIsDrawing] = useState(false)
  const [elements, setElements] = useState<DrawingElement[]>([])
  const [currentPath, setCurrentPath] = useState<number[]>([])

  useEffect(() => {
    if (image && onImageLoad) {
      onImageLoad({ width: image.width, height: image.height })
    }
  }, [image, onImageLoad])

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (mode === 'select') return

    setIsDrawing(true)
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: mode === 'brush' || mode === 'eraser' ? 'line' : mode === 'shape' ? 'rect' : 'text',
      points: mode === 'brush' || mode === 'eraser' ? [pos.x, pos.y] : undefined,
      x: mode !== 'brush' && mode !== 'eraser' ? pos.x : undefined,
      y: mode !== 'brush' && mode !== 'eraser' ? pos.y : undefined,
      width: mode === 'shape' ? 0 : undefined,
      height: mode === 'shape' ? 0 : undefined,
      text: mode === 'text' ? 'New Text' : undefined,
      stroke: mode === 'eraser' ? 'white' : '#ffffff',
      strokeWidth: brushSize,
      fill: mode === 'shape' ? 'rgba(255, 255, 255, 0.1)' : undefined,
    }

    if (mode === 'brush' || mode === 'eraser') {
      setCurrentPath([pos.x, pos.y])
    }

    setElements([...elements, newElement])
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return

    const stage = e.target.getStage()
    const point = stage?.getPointerPosition()
    if (!point) return

    if (mode === 'brush' || mode === 'eraser') {
      const newPath = [...currentPath, point.x, point.y]
      setCurrentPath(newPath)
      
      setElements(prev => {
        const newElements = [...prev]
        const lastElement = newElements[newElements.length - 1]
        if (lastElement && lastElement.type === 'line') {
          lastElement.points = newPath
        }
        return newElements
      })
    } else if (mode === 'shape') {
      setElements(prev => {
        const newElements = [...prev]
        const lastElement = newElements[newElements.length - 1]
        if (lastElement && lastElement.type === 'rect' && lastElement.x !== undefined && lastElement.y !== undefined) {
          lastElement.width = point.x - lastElement.x
          lastElement.height = point.y - lastElement.y
        }
        return newElements
      })
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setCurrentPath([])
  }

  const clearCanvas = () => {
    setElements([])
  }

  const exportCanvas = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
      
      // Create download link
      const link = document.createElement('a')
      link.download = 'flux-create-export.png'
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Canvas exported successfully')
      return dataURL
    }
  }

  const ImageComponent = () => {
    if (!image) return null

    const aspectRatio = image.width / image.height
    let displayWidth = width
    let displayHeight = height

    if (aspectRatio > width / height) {
      displayHeight = width / aspectRatio
    } else {
      displayWidth = height * aspectRatio
    }

    return (
      <KonvaImage
        image={image}
        width={displayWidth}
        height={displayHeight}
        x={(width - displayWidth) / 2}
        y={(height - displayHeight) / 2}
      />
    )
  }

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        scale={{ x: zoom / 100, y: zoom / 100 }}
        className="cursor-crosshair"
      >
        <Layer>
          {/* Background */}
          <Rect width={width} height={height} fill="#1a1a1a" />
          
          {/* Main Image */}
          <ImageComponent />
          
          {/* Drawing Elements */}
          {elements.map((element) => {
            switch (element.type) {
              case 'line':
                return (
                  <Line
                    key={element.id}
                    points={element.points || []}
                    stroke={element.stroke}
                    strokeWidth={element.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      element.stroke === 'white' ? 'destination-out' : 'source-over'
                    }
                  />
                )
              case 'rect':
                return (
                  <Rect
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    stroke={element.stroke}
                    strokeWidth={element.strokeWidth}
                    fill={element.fill}
                  />
                )
              case 'circle':
                return (
                  <Circle
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    radius={Math.abs(element.width || 0) / 2}
                    stroke={element.stroke}
                    strokeWidth={element.strokeWidth}
                    fill={element.fill}
                  />
                )
              case 'text':
                return (
                  <Text
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    text={element.text}
                    fontSize={20}
                    fill={element.stroke}
                    draggable
                  />
                )
              default:
                return null
            }
          })}
        </Layer>
      </Stage>
      
      {/* Canvas Controls Overlay */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={clearCanvas}
          className="px-3 py-1 bg-red-500/50 hover:bg-red-500/70 text-white text-sm rounded-lg border border-red-400/50 transition-all duration-200"
        >
          Clear
        </button>
        <button
          onClick={exportCanvas}
          className="px-3 py-1 bg-green-500/50 hover:bg-green-500/70 text-white text-sm rounded-lg border border-green-400/50 transition-all duration-200"
        >
          Export
        </button>
      </div>
    </div>
  )
}

export default Canvas