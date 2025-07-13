'use client'

import React, { useState, useCallback } from 'react'
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

interface FilterPanelProps {
  onFilterChange: (filters: FilterValues) => void
  initialFilters?: Partial<FilterValues>
  className?: string
}

export function FilterPanel({ 
  onFilterChange, 
  initialFilters = {},
  className = '' 
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    hue: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
    ...initialFilters
  })

  const updateFilter = useCallback((filterType: keyof FilterValues, value: number) => {
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
    
    console.log(`${filterType} adjusted to: ${value}`)
  }, [filters, onFilterChange])

  const resetFilters = useCallback(() => {
    const resetValues: FilterValues = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
      hue: 0,
      sepia: 0,
      grayscale: 0,
      invert: 0
    }
    
    setFilters(resetValues)
    onFilterChange(resetValues)
    toast.success('Filters reset')
  }, [onFilterChange])

  const applyPreset = useCallback((presetName: string) => {
    let presetFilters: FilterValues

    switch (presetName) {
      case 'vintage':
        presetFilters = {
          ...filters,
          sepia: 50,
          contrast: -10,
          saturation: -20,
          brightness: 5
        }
        break
      case 'enhance':
        presetFilters = {
          ...filters,
          brightness: 10,
          contrast: 15,
          saturation: 10
        }
        break
      case 'cool':
        presetFilters = {
          ...filters,
          hue: 180,
          saturation: 20,
          brightness: 5
        }
        break
      case 'warm':
        presetFilters = {
          ...filters,
          hue: -30,
          saturation: 15,
          brightness: 8
        }
        break
      case 'dramatic':
        presetFilters = {
          ...filters,
          contrast: 30,
          saturation: 25,
          brightness: -5
        }
        break
      case 'soft':
        presetFilters = {
          ...filters,
          contrast: -15,
          brightness: 10,
          blur: 1
        }
        break
      default:
        return
    }

    setFilters(presetFilters)
    onFilterChange(presetFilters)
    toast.success(`${presetName} preset applied`)
  }, [filters, onFilterChange])

  const filterSettings = [
    { 
      key: 'brightness', 
      label: 'Brightness', 
      min: -50, 
      max: 50, 
      icon: '☀️',
      description: 'Adjust image brightness'
    },
    { 
      key: 'contrast', 
      label: 'Contrast', 
      min: -50, 
      max: 50, 
      icon: '◐',
      description: 'Adjust image contrast'
    },
    { 
      key: 'saturation', 
      label: 'Saturation', 
      min: -100, 
      max: 100, 
      icon: '🎨',
      description: 'Adjust color intensity'
    },
    { 
      key: 'hue', 
      label: 'Hue', 
      min: -180, 
      max: 180, 
      icon: '🌈',
      description: 'Shift color hue'
    },
    { 
      key: 'blur', 
      label: 'Blur', 
      min: 0, 
      max: 10, 
      icon: '🌫️',
      description: 'Apply blur effect'
    },
    { 
      key: 'sepia', 
      label: 'Sepia', 
      min: 0, 
      max: 100, 
      icon: '📸',
      description: 'Apply sepia tone'
    },
    { 
      key: 'grayscale', 
      label: 'Grayscale', 
      min: 0, 
      max: 100, 
      icon: '⚫',
      description: 'Convert to grayscale'
    },
    { 
      key: 'invert', 
      label: 'Invert', 
      min: 0, 
      max: 100, 
      icon: '🔄',
      description: 'Invert colors'
    }
  ]

  const presets = [
    { name: 'vintage', label: 'Vintage', icon: '📷' },
    { name: 'enhance', label: 'Enhance', icon: '✨' },
    { name: 'cool', label: 'Cool', icon: '❄️' },
    { name: 'warm', label: 'Warm', icon: '🔥' },
    { name: 'dramatic', label: 'Dramatic', icon: '🎭' },
    { name: 'soft', label: 'Soft', icon: '🌸' }
  ]

  return (
    <div className={`bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🎨 Filters & Adjustments
        </h3>
        <button
          onClick={resetFilters}
          className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
          title="Reset all filters"
        >
          Reset
        </button>
      </div>

      {/* Filter Presets */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-white/70 mb-2">Quick Presets</h4>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              className="text-xs p-2 bg-white/5 hover:bg-white/10 text-white/80 rounded transition-colors flex items-center justify-center gap-1"
              title={`Apply ${preset.label} preset`}
            >
              <span className="text-[10px]">{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Filter Controls */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-white/70">Manual Adjustments</h4>
        
        {filterSettings.map(({ key, label, min, max, icon, description }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label 
                className="text-xs text-white/80 flex items-center gap-1" 
                title={description}
              >
                <span className="text-[10px]">{icon}</span>
                {label}
              </label>
              <span className="text-xs text-white/60 font-mono">
                {filters[key as keyof FilterValues]}
              </span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min={min}
                max={max}
                step={key === 'blur' ? 0.5 : 1}
                value={filters[key as keyof FilterValues]}
                onChange={(e) => updateFilter(key as keyof FilterValues, Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                title={`${label}: ${filters[key as keyof FilterValues]}`}
              />
              
              {/* Zero indicator line for filters that can go negative */}
              {min < 0 && (
                <div 
                  className="absolute top-0 w-0.5 h-2 bg-white/40 pointer-events-none"
                  style={{ 
                    left: `${((0 - min) / (max - min)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter summary */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-xs text-white/60">
          Active filters: {Object.values(filters).filter(v => v !== 0).length}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
} 