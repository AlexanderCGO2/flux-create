'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Layers, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical,
  Brush,
  Eraser,
  Type,
  Circle,
  Square,
  Wand2,
  Filter,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassOverlay';

interface ToolPanelProps {
  onToolSelect?: (tool: string) => void;
  onAdjustmentChange?: (adjustment: string, value: number) => void;
  onFilterApply?: (filter: string, params: any) => void;
}

export function ToolPanel({ 
  onToolSelect, 
  onAdjustmentChange, 
  onFilterApply 
}: ToolPanelProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools = [
    { id: 'select', name: 'Select', icon: Wand2 },
    { id: 'brush', name: 'Brush', icon: Brush },
    { id: 'eraser', name: 'Eraser', icon: Eraser },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'shape-circle', name: 'Circle', icon: Circle },
    { id: 'shape-square', name: 'Rectangle', icon: Square },
    { id: 'crop', name: 'Crop', icon: Crop },
  ];

  const adjustments = [
    { id: 'brightness', name: 'Brightness', min: -100, max: 100, default: 0 },
    { id: 'contrast', name: 'Contrast', min: -100, max: 100, default: 0 },
    { id: 'saturation', name: 'Saturation', min: -100, max: 100, default: 0 },
    { id: 'hue', name: 'Hue', min: -180, max: 180, default: 0 },
    { id: 'temperature', name: 'Temperature', min: -100, max: 100, default: 0 },
    { id: 'tint', name: 'Tint', min: -100, max: 100, default: 0 },
  ];

  const filters = [
    { id: 'none', name: 'Original', preview: '🖼️' },
    { id: 'vintage', name: 'Vintage', preview: '📸' },
    { id: 'bw', name: 'Black & White', preview: '⚫' },
    { id: 'sepia', name: 'Sepia', preview: '🟤' },
    { id: 'vibrant', name: 'Vibrant', preview: '🌈' },
    { id: 'dramatic', name: 'Dramatic', preview: '🎭' },
    { id: 'soft', name: 'Soft', preview: '💫' },
    { id: 'cool', name: 'Cool', preview: '❄️' },
    { id: 'warm', name: 'Warm', preview: '🔥' },
  ];

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    onToolSelect?.(toolId);
    
    // Voice feedback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(`${toolId} tool selected`);
      utterance.volume = 0.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePanelToggle = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId);
  };

  return (
    <div 
      id="tool-panel"
      className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-300 ${
        isCollapsed ? 'translate-x-16' : 'translate-x-0'
      }`}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-8 top-0 glass-overlay p-2 rounded-l-lg border backdrop-blur-xl"
        aria-label={isCollapsed ? 'Expand tool panel' : 'Collapse tool panel'}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* Main Tools */}
          <GlassPanel className="p-4 rounded-xl border backdrop-blur-xl">
            <h3 className="text-sm font-medium text-white mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`glass-button p-3 rounded-lg flex flex-col items-center space-y-1 transition-all accessibility-focus ${
                      selectedTool === tool.id ? 'canvas-tool-active' : ''
                    }`}
                    title={tool.name}
                    aria-label={`Select ${tool.name} tool`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {/* Quick Actions */}
          <GlassPanel className="p-4 rounded-xl border backdrop-blur-xl">
            <h3 className="text-sm font-medium text-white mb-3">Transform</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="glass-button p-2 rounded-lg"
                title="Rotate 90°"
                aria-label="Rotate image 90 degrees clockwise"
                onClick={() => onToolSelect?.('rotate-90')}
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                className="glass-button p-2 rounded-lg"
                title="Flip Horizontal"
                aria-label="Flip image horizontally"
                onClick={() => onToolSelect?.('flip-horizontal')}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                className="glass-button p-2 rounded-lg"
                title="Flip Vertical"
                aria-label="Flip image vertically"
                onClick={() => onToolSelect?.('flip-vertical')}
              >
                <FlipVertical className="w-4 h-4" />
              </button>
            </div>
          </GlassPanel>

          {/* Panel Toggles */}
          <div className="space-y-2">
            <button
              onClick={() => handlePanelToggle('adjustments')}
              className={`glass-button w-full p-3 rounded-lg flex items-center space-x-3 ${
                activePanel === 'adjustments' ? 'canvas-tool-active' : ''
              }`}
              aria-label="Toggle adjustments panel"
            >
              <Sliders className="w-5 h-5" />
              <span className="text-sm">Adjustments</span>
            </button>

            <button
              onClick={() => handlePanelToggle('filters')}
              className={`glass-button w-full p-3 rounded-lg flex items-center space-x-3 ${
                activePanel === 'filters' ? 'canvas-tool-active' : ''
              }`}
              aria-label="Toggle filters panel"
            >
              <Filter className="w-5 h-5" />
              <span className="text-sm">Filters</span>
            </button>

            <button
              onClick={() => handlePanelToggle('layers')}
              className={`glass-button w-full p-3 rounded-lg flex items-center space-x-3 ${
                activePanel === 'layers' ? 'canvas-tool-active' : ''
              }`}
              aria-label="Toggle layers panel"
            >
              <Layers className="w-5 h-5" />
              <span className="text-sm">Layers</span>
            </button>
          </div>
        </div>
      )}

      {/* Expandable Panels */}
      <AnimatePresence>
        {activePanel && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-72 top-0 w-64"
          >
            {activePanel === 'adjustments' && (
              <AdjustmentsPanel 
                adjustments={adjustments}
                onAdjustmentChange={onAdjustmentChange}
              />
            )}
            
            {activePanel === 'filters' && (
              <FiltersPanel 
                filters={filters}
                onFilterApply={onFilterApply}
              />
            )}
            
            {activePanel === 'layers' && (
              <LayersPanel />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Command Instructions */}
      <div className="sr-only" aria-live="polite">
        <div>Current tool: {selectedTool}</div>
        <div>Say "select brush tool" or "apply vintage filter" for voice control</div>
        {activePanel && <div>Active panel: {activePanel}</div>}
      </div>
    </div>
  );
}

// Adjustments Panel Component
function AdjustmentsPanel({ 
  adjustments, 
  onAdjustmentChange 
}: {
  adjustments: any[];
  onAdjustmentChange?: (adjustment: string, value: number) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>({});

  const handleSliderChange = (adjustmentId: string, value: number) => {
    setValues(prev => ({ ...prev, [adjustmentId]: value }));
    onAdjustmentChange?.(adjustmentId, value);
  };

  return (
    <GlassPanel className="p-4 rounded-xl border backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Adjustments</h3>
        <button 
          className="glass-button text-xs p-1 rounded"
          onClick={() => {
            setValues({});
            adjustments.forEach(adj => onAdjustmentChange?.(adj.id, adj.default));
          }}
        >
          Reset
        </button>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto glass-scroll">
        {adjustments.map((adjustment) => (
          <div key={adjustment.id}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/80" htmlFor={`slider-${adjustment.id}`}>
                {adjustment.name}
              </label>
              <span className="text-xs text-white/60">
                {values[adjustment.id] || adjustment.default}
              </span>
            </div>
            <input
              id={`slider-${adjustment.id}`}
              type="range"
              min={adjustment.min}
              max={adjustment.max}
              value={values[adjustment.id] ?? adjustment.default}
              onChange={(e) => handleSliderChange(adjustment.id, parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              aria-label={`Adjust ${adjustment.name}`}
            />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Filters Panel Component
function FiltersPanel({ 
  filters, 
  onFilterApply 
}: {
  filters: any[];
  onFilterApply?: (filter: string, params: any) => void;
}) {
  const [selectedFilter, setSelectedFilter] = useState('none');

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    onFilterApply?.(filterId, {});
    
    // Voice feedback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(`${filterId} filter applied`);
      utterance.volume = 0.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <GlassPanel className="p-4 rounded-xl border backdrop-blur-xl">
      <h3 className="text-sm font-medium text-white mb-4">Filters</h3>
      
      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto glass-scroll">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterSelect(filter.id)}
            className={`glass-button p-3 rounded-lg flex flex-col items-center space-y-2 transition-all ${
              selectedFilter === filter.id ? 'canvas-tool-active' : ''
            }`}
            title={filter.name}
            aria-label={`Apply ${filter.name} filter`}
          >
            <div className="text-lg">{filter.preview}</div>
            <span className="text-xs text-center">{filter.name}</span>
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}

// Layers Panel Component
function LayersPanel() {
  const [layers] = useState([
    { id: 'bg', name: 'Background', visible: true, locked: false },
    { id: 'main', name: 'Main Image', visible: true, locked: false },
  ]);

  return (
    <GlassPanel className="p-4 rounded-xl border backdrop-blur-xl">
      <h3 className="text-sm font-medium text-white mb-4">Layers</h3>
      
      <div className="space-y-2 max-h-80 overflow-y-auto glass-scroll">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="glass-button p-3 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded border flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-sm">{layer.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                className={`text-xs ${layer.visible ? 'text-white' : 'text-white/40'}`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
                aria-label={`${layer.visible ? 'Hide' : 'Show'} ${layer.name} layer`}
              >
                👁
              </button>
              <button
                className={`text-xs ${layer.locked ? 'text-yellow-400' : 'text-white/40'}`}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                aria-label={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.name} layer`}
              >
                🔒
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button className="glass-button w-full p-3 rounded-lg mt-4 text-sm">
        + Add Layer
      </button>
    </GlassPanel>
  );
}