import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';

interface CanvasState {
  width: number;
  height: number;
  scale: number;
  image: HTMLImageElement | null;
  layers: any[];
  selectedLayer: string | null;
  history: any[];
  historyIndex: number;
  isLoading: boolean;
  error: string | null;
}

interface CanvasOperations {
  canvasState: CanvasState;
  loadImage: (imageSrc: string) => Promise<void>;
  exportImage: (format: 'png' | 'jpeg' | 'webp') => Promise<void>;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  addLayer: (layerData: any) => void;
  removeLayer: (layerId: string) => void;
  selectLayer: (layerId: string) => void;
  updateLayer: (layerId: string, properties: any) => void;
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (scale: number) => void;
  applyFilter: (filter: string, params: any) => void;
  crop: (x: number, y: number, width: number, height: number) => void;
  rotate: (angle: number) => void;
  flip: (direction: 'horizontal' | 'vertical') => void;
}

export function useCanvas(): CanvasOperations {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    width: 1920,
    height: 1080,
    scale: 1,
    image: null,
    layers: [],
    selectedLayer: null,
    history: [],
    historyIndex: -1,
    isLoading: false,
    error: null,
  });

  const stageRef = useRef<Konva.Stage | null>(null);
  const maxHistorySize = 50;

  const addToHistory = useCallback((state: Partial<CanvasState>) => {
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ ...prev, ...state });
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const loadImage = useCallback(async (imageSrc: string) => {
    setCanvasState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });
      
      // Calculate canvas size based on image
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;
      
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);
        
        width *= scale;
        height *= scale;
      }
      
      const newState = {
        width,
        height,
        image: img,
        layers: [{
          id: 'background',
          type: 'image',
          image: img,
          x: 0,
          y: 0,
          width,
          height,
          visible: true,
        }],
        selectedLayer: 'background',
        isLoading: false,
      };
      
      setCanvasState(prev => ({ ...prev, ...newState }));
      addToHistory(newState);
      
      console.log('Image loaded successfully:', width, 'x', height);
      
    } catch (error) {
      console.error('Failed to load image:', error);
      setCanvasState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: `Failed to load image: ${error}` 
      }));
    }
  }, [addToHistory]);

  const exportImage = useCallback(async (format: 'png' | 'jpeg' | 'webp') => {
    if (!stageRef.current) return;
    
    try {
      const dataURL = stageRef.current.toDataURL({
        mimeType: `image/${format}`,
        quality: format === 'jpeg' ? 0.92 : 1,
      });
      
      // Save via Electron API
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.file.saveDialog({
          defaultPath: `flux-edit.${format}`,
          filters: [
            { name: `${format.toUpperCase()} Files`, extensions: [format] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
        
        if (!result.canceled && result.filePath) {
          // Convert data URL to blob and save
          const response = await fetch(dataURL);
          const blob = await response.blob();
          
          // This would need to be implemented with a proper file saving mechanism
          console.log('Exported image:', result.filePath);
        }
      } else {
        // Fallback: Download in browser
        const link = document.createElement('a');
        link.download = `flux-edit.${format}`;
        link.href = dataURL;
        link.click();
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      setCanvasState(prev => ({ 
        ...prev, 
        error: `Export failed: ${error}` 
      }));
    }
  }, []);

  const undo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        const previousState = prev.history[newIndex];
        
        return {
          ...prev,
          ...previousState,
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        const nextState = prev.history[newIndex];
        
        return {
          ...prev,
          ...nextState,
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const clearCanvas = useCallback(() => {
    const newState = {
      width: 1920,
      height: 1080,
      scale: 1,
      image: null,
      layers: [],
      selectedLayer: null,
      history: [],
      historyIndex: -1,
      error: null,
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    console.log('Canvas cleared');
  }, []);

  const addLayer = useCallback((layerData: any) => {
    const newLayer = {
      id: Date.now().toString(),
      visible: true,
      ...layerData,
    };
    
    const newState = {
      layers: [...canvasState.layers, newLayer],
      selectedLayer: newLayer.id,
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, addToHistory]);

  const removeLayer = useCallback((layerId: string) => {
    const newState = {
      layers: canvasState.layers.filter(layer => layer.id !== layerId),
      selectedLayer: canvasState.selectedLayer === layerId ? null : canvasState.selectedLayer,
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, canvasState.selectedLayer, addToHistory]);

  const selectLayer = useCallback((layerId: string) => {
    setCanvasState(prev => ({ ...prev, selectedLayer: layerId }));
  }, []);

  const updateLayer = useCallback((layerId: string, properties: any) => {
    const newState = {
      layers: canvasState.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...properties } : layer
      ),
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, addToHistory]);

  const setCanvasSize = useCallback((width: number, height: number) => {
    const newState = { width, height };
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [addToHistory]);

  const setZoom = useCallback((scale: number) => {
    const clampedScale = Math.max(0.1, Math.min(5, scale));
    setCanvasState(prev => ({ ...prev, scale: clampedScale }));
  }, []);

  const applyFilter = useCallback((filter: string, params: any) => {
    if (!canvasState.selectedLayer) return;
    
    const newState = {
      layers: canvasState.layers.map(layer =>
        layer.id === canvasState.selectedLayer
          ? { ...layer, filters: [...(layer.filters || []), { type: filter, ...params }] }
          : layer
      ),
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, canvasState.selectedLayer, addToHistory]);

  const crop = useCallback((x: number, y: number, width: number, height: number) => {
    const newState = {
      width,
      height,
      layers: canvasState.layers.map(layer => ({
        ...layer,
        x: layer.x - x,
        y: layer.y - y,
        cropX: x,
        cropY: y,
        cropWidth: width,
        cropHeight: height,
      })),
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, addToHistory]);

  const rotate = useCallback((angle: number) => {
    if (!canvasState.selectedLayer) return;
    
    const newState = {
      layers: canvasState.layers.map(layer =>
        layer.id === canvasState.selectedLayer
          ? { ...layer, rotation: (layer.rotation || 0) + angle }
          : layer
      ),
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, canvasState.selectedLayer, addToHistory]);

  const flip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!canvasState.selectedLayer) return;
    
    const newState = {
      layers: canvasState.layers.map(layer =>
        layer.id === canvasState.selectedLayer
          ? {
              ...layer,
              scaleX: direction === 'horizontal' ? -(layer.scaleX || 1) : (layer.scaleX || 1),
              scaleY: direction === 'vertical' ? -(layer.scaleY || 1) : (layer.scaleY || 1),
            }
          : layer
      ),
    };
    
    setCanvasState(prev => ({ ...prev, ...newState }));
    addToHistory(newState);
  }, [canvasState.layers, canvasState.selectedLayer, addToHistory]);

  // Set stage reference for export functionality
  const setStageRef = useCallback((stage: Konva.Stage | null) => {
    stageRef.current = stage;
  }, []);

  return {
    canvasState,
    loadImage,
    exportImage,
    undo,
    redo,
    clearCanvas,
    addLayer,
    removeLayer,
    selectLayer,
    updateLayer,
    setCanvasSize,
    setZoom,
    applyFilter,
    crop,
    rotate,
    flip,
    setStageRef,
  } as any;
}