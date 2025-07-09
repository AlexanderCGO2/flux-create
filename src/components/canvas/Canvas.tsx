'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group } from 'react-konva';
import { motion } from 'framer-motion';
import useImage from 'use-image';
import Konva from 'konva';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Crop,
  Loader2 
} from 'lucide-react';

interface CanvasProps {
  canvasState: {
    width: number;
    height: number;
    scale: number;
    image: HTMLImageElement | null;
    layers: any[];
    selectedLayer: string | null;
    isLoading: boolean;
    error: string | null;
  };
  onImageLoad: (imageSrc: string) => void;
  onImageUpload: (file: File) => void;
}

export function Canvas({ canvasState, onImageLoad, onImageUpload }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'move' | 'crop' | 'zoom'>('select');
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageUpload(imageFile);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle selection
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }
    
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    } else {
      setSelectedId(e.target.id());
    }
  }, []);

  // Update transformer
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Handle zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    setStageScale(clampedScale);
    stage.scale({ x: clampedScale, y: clampedScale });
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    setStagePosition(newPos);
    stage.position(newPos);
  }, []);

  // Tool handlers
  const handleZoomIn = () => {
    const newScale = Math.min(stageScale * 1.2, 5);
    setStageScale(newScale);
    if (stageRef.current) {
      stageRef.current.scale({ x: newScale, y: newScale });
    }
  };

  const handleZoomOut = () => {
    const newScale = Math.max(stageScale / 1.2, 0.1);
    setStageScale(newScale);
    if (stageRef.current) {
      stageRef.current.scale({ x: newScale, y: newScale });
    }
  };

  const handleZoomReset = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
    if (stageRef.current) {
      stageRef.current.scale({ x: 1, y: 1 });
      stageRef.current.position({ x: 0, y: 0 });
    }
  };

  // Voice command integration
  useEffect(() => {
    const handleVoiceCommand = (command: string) => {
      const lowerCommand = command.toLowerCase();
      
      if (lowerCommand.includes('zoom in')) {
        handleZoomIn();
      } else if (lowerCommand.includes('zoom out')) {
        handleZoomOut();
      } else if (lowerCommand.includes('reset zoom') || lowerCommand.includes('fit to screen')) {
        handleZoomReset();
      } else if (lowerCommand.includes('select all')) {
        // Select all layers
        console.log('Voice command: select all');
      } else if (lowerCommand.includes('crop')) {
        setTool('crop');
      } else if (lowerCommand.includes('move')) {
        setTool('move');
      }
    };

    // This would be connected to the voice system
    const voiceEventHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.command) {
        handleVoiceCommand(customEvent.detail.command);
      }
    };
    
    window.addEventListener('voiceCommand', voiceEventHandler);

    return () => {
      window.removeEventListener('voiceCommand', voiceEventHandler);
    };
  }, []);

  if (canvasState.isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="glass-overlay p-8 rounded-xl">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <div>
              <div className="text-lg font-medium text-white">Loading Image</div>
              <div className="text-sm text-white/60">Processing your image...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 canvas-container"
      id="main-canvas"
      role="img"
      aria-label="Image editing canvas"
      tabIndex={0}
    >
      {/* Canvas Tools */}
      <div className="absolute top-4 left-4 z-20">
        <div className="glass-overlay p-3 rounded-xl border backdrop-blur-xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTool('select')}
              className={`glass-button p-2 rounded ${tool === 'select' ? 'canvas-tool-active' : ''}`}
              title="Select Tool"
              aria-label="Select tool"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('crop')}
              className={`glass-button p-2 rounded ${tool === 'crop' ? 'canvas-tool-active' : ''}`}
              title="Crop Tool"
              aria-label="Crop tool"
            >
              <Crop className="w-4 h-4" />
            </button>
            <div className="border-l border-white/20 mx-2 h-6" />
            <button
              onClick={handleZoomIn}
              className="glass-button p-2 rounded"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="glass-button p-2 rounded"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              className="glass-button p-2 rounded text-xs"
              title="Reset Zoom"
              aria-label="Reset zoom to 100%"
            >
              {Math.round(stageScale * 100)}%
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div 
        className="w-full h-full relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {canvasState.image ? (
          <Stage
            ref={stageRef}
            width={window.innerWidth}
            height={window.innerHeight}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleWheel}
            onClick={handleStageClick}
            onTap={handleStageClick}
            draggable={tool === 'move'}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              setStagePosition({ x: e.target.x(), y: e.target.y() });
            }}
          >
            <Layer>
              {/* Background */}
              <Rect
                width={canvasState.width}
                height={canvasState.height}
                fill="#f8f9fa"
                stroke="#e9ecef"
                strokeWidth={1}
              />
              
              {/* Main Image */}
              {canvasState.layers.map((layer) => (
                <Group key={layer.id}>
                  {layer.type === 'image' && (
                    <ImageLayer
                      id={layer.id}
                      image={layer.image}
                      x={layer.x || 0}
                      y={layer.y || 0}
                      width={layer.width}
                      height={layer.height}
                      rotation={layer.rotation || 0}
                      scaleX={layer.scaleX || 1}
                      scaleY={layer.scaleY || 1}
                      filters={layer.filters}
                      visible={layer.visible !== false}
                      onSelect={setSelectedId}
                    />
                  )}
                </Group>
              ))}
              
              {/* Transformer for selected elements */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
                anchorFill="#3b82f6"
                anchorStroke="#ffffff"
                borderStroke="#3b82f6"
                borderStrokeWidth={2}
                anchorSize={8}
                rotateAnchorOffset={20}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              />
            </Layer>
          </Stage>
        ) : (
          // Empty state
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-overlay p-8 rounded-xl border backdrop-blur-xl text-center max-w-md"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Start Creating
              </h3>
              <p className="text-white/60 mb-6">
                Drop an image here, or say "open image" to get started with voice control.
              </p>
              
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImageUpload(file);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="glass-button w-full p-3 rounded-lg cursor-pointer inline-block"
                >
                  Choose Image
                </label>
                
                <div className="text-xs text-white/40">
                  Supports: JPG, PNG, WebP, SVG
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Canvas Info */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="glass-overlay p-3 rounded-xl border backdrop-blur-xl">
          <div className="text-xs text-white/60 space-y-1">
            <div>Canvas: {canvasState.width} × {canvasState.height}</div>
            <div>Zoom: {Math.round(stageScale * 100)}%</div>
            {selectedId && <div>Selected: {selectedId}</div>}
          </div>
        </div>
      </div>

      {/* Accessibility info */}
      <div className="sr-only" aria-live="polite">
        {canvasState.image ? 'Image loaded on canvas' : 'Canvas is empty, ready for image upload'}
        {selectedId && `Selected element: ${selectedId}`}
        {tool !== 'select' && `Current tool: ${tool}`}
      </div>
    </div>
  );
}

// Image layer component
function ImageLayer({
  id,
  image,
  x,
  y,
  width,
  height,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  filters = [],
  visible = true,
  onSelect
}: {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  filters?: any[];
  visible?: boolean;
  onSelect: (id: string) => void;
}) {
  const imageRef = useRef<Konva.Image>(null);

  // Apply filters
  useEffect(() => {
    if (imageRef.current && filters.length > 0) {
      const konvaFilters = filters.map(filter => {
        switch (filter.type) {
          case 'blur':
            return Konva.Filters.Blur;
          case 'brighten':
            return Konva.Filters.Brighten;
          case 'contrast':
            return Konva.Filters.Contrast;
          case 'grayscale':
            return Konva.Filters.Grayscale;
          case 'sepia':
            return Konva.Filters.Sepia;
          default:
            return null;
        }
      }).filter((filter): filter is typeof Konva.Filters.Blur => filter !== null);

      imageRef.current.filters(konvaFilters);
      imageRef.current.cache();
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [filters]);

  return (
    <KonvaImage
      ref={imageRef}
      id={id}
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      visible={visible}
      draggable
      onClick={() => onSelect(id)}
      onTap={() => onSelect(id)}
      perfectDrawEnabled={false}
    />
  );
}