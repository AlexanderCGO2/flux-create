'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Download, 
  Share2, 
  History, 
  Folder, 
  FileText,
  Image as ImageIcon,
  Settings,
  Cloud,
  Clock,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
  CheckCircle
} from 'lucide-react';

interface ProjectPanelProps {
  currentProject: string | null;
  onExport: (format: 'png' | 'jpeg' | 'webp') => void;
}

export function ProjectPanel({ currentProject, onExport }: ProjectPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'export' | 'history' | 'share'>('save');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [exportQuality, setExportQuality] = useState(92);
  const [exportSize, setExportSize] = useState<'original' | 'web' | 'print' | 'custom'>('original');

  const projectHistory = [
    { id: '1', name: 'Auto-save', time: '2 minutes ago', thumbnail: '🖼️' },
    { id: '2', name: 'Before AI enhancement', time: '5 minutes ago', thumbnail: '📸' },
    { id: '3', name: 'Initial upload', time: '12 minutes ago', thumbnail: '🎨' },
  ];

  const exportFormats = [
    { id: 'png', name: 'PNG', description: 'Lossless, supports transparency', size: '~2.4MB' },
    { id: 'jpeg', name: 'JPEG', description: 'Compressed, best for photos', size: '~450KB' },
    { id: 'webp', name: 'WebP', description: 'Modern format, great compression', size: '~320KB' },
  ];

  const exportSizes = [
    { id: 'original', name: 'Original', dimensions: '1920×1080' },
    { id: 'web', name: 'Web Optimized', dimensions: '1200×675' },
    { id: 'print', name: 'Print Ready', dimensions: '3840×2160' },
    { id: 'custom', name: 'Custom Size', dimensions: 'Set custom' },
  ];

  const handleExport = () => {
    onExport(exportFormat);
    
    // Voice feedback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(`Exporting as ${exportFormat}`);
      utterance.volume = 0.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = () => {
    // Save project logic
    console.log('Saving project...');
    
    // Voice feedback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance('Project saved successfully');
      utterance.volume = 0.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-overlay px-6 py-3 rounded-full border backdrop-blur-xl flex items-center space-x-3 transition-all ${
          isOpen ? 'scale-105' : 'hover:scale-105'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open project panel"
      >
        <Save className="w-5 h-5" />
        <span className="font-medium">
          {currentProject ? `Project: ${currentProject}` : 'Untitled Project'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-96"
          >
            <div className="glass-overlay p-6 rounded-2xl border backdrop-blur-xl">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
                {[
                  { id: 'save', label: 'Save', icon: Save },
                  { id: 'export', label: 'Export', icon: Download },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'share', label: 'Share', icon: Share2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'save' && (
                  <motion.div
                    key="save"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Save Project</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-white/80 mb-2">Project Name</label>
                        <input
                          type="text"
                          value={currentProject || 'Untitled Project'}
                          className="glass-input w-full"
                          placeholder="Enter project name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/80 mb-2">Description</label>
                        <textarea
                          className="glass-input w-full h-20 resize-none"
                          placeholder="Optional description"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Cloud className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">Auto-save to Cloud</div>
                          <div className="text-xs text-white/60">Last saved 2 minutes ago</div>
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      </div>
                      
                      <button
                        onClick={handleSave}
                        className="glass-button w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Project</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'export' && (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Export Image</h3>
                    
                    <div className="space-y-4">
                      {/* Format Selection */}
                      <div>
                        <label className="block text-sm text-white/80 mb-2">Format</label>
                        <div className="space-y-2">
                          {exportFormats.map((format) => (
                            <button
                              key={format.id}
                              onClick={() => setExportFormat(format.id as any)}
                              className={`w-full p-3 rounded-lg border text-left transition-all ${
                                exportFormat === format.id
                                  ? 'bg-white/10 border-white/30'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-white">{format.name}</div>
                                  <div className="text-xs text-white/60">{format.description}</div>
                                </div>
                                <div className="text-xs text-white/40">{format.size}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size Selection */}
                      <div>
                        <label className="block text-sm text-white/80 mb-2">Size</label>
                        <select
                          value={exportSize}
                          onChange={(e) => setExportSize(e.target.value as any)}
                          className="glass-input w-full"
                        >
                          {exportSizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.name} ({size.dimensions})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quality Slider (for JPEG) */}
                      {exportFormat === 'jpeg' && (
                        <div>
                          <label className="block text-sm text-white/80 mb-2">
                            Quality: {exportQuality}%
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={exportQuality}
                            onChange={(e) => setExportQuality(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      <button
                        onClick={handleExport}
                        className="glass-button w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export {exportFormat.toUpperCase()}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Version History</h3>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto glass-scroll">
                      {projectHistory.map((version, index) => (
                        <div
                          key={version.id}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            index === 0
                              ? 'bg-white/10 border-white/30'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{version.thumbnail}</div>
                            <div className="flex-1">
                              <div className="font-medium text-white">{version.name}</div>
                              <div className="text-xs text-white/60 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{version.time}</span>
                              </div>
                            </div>
                            {index === 0 && (
                              <div className="flex items-center space-x-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Current</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="glass-button w-full py-3 rounded-lg font-medium mt-4">
                      View Full History
                    </button>
                  </motion.div>
                )}

                {activeTab === 'share' && (
                  <motion.div
                    key="share"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Share Project</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-white/80 mb-2">Share Link</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value="https://flux.ai/projects/abc123"
                            readOnly
                            className="glass-input flex-1"
                          />
                          <button className="glass-button p-3 rounded-lg">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button className="glass-button p-3 rounded-lg flex items-center justify-center space-x-2">
                          <ExternalLink className="w-4 h-4" />
                          <span>Open in Browser</span>
                        </button>
                        <button className="glass-button p-3 rounded-lg flex items-center justify-center space-x-2">
                          <Star className="w-4 h-4" />
                          <span>Add to Gallery</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm text-white/80 mb-2">Permissions</label>
                        <select className="glass-input w-full">
                          <option>View Only</option>
                          <option>Can Comment</option>
                          <option>Can Edit</option>
                        </select>
                      </div>

                      <button className="glass-button w-full py-3 rounded-lg font-medium">
                        Generate Share Link
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcut Hints */}
      <div className="sr-only" aria-live="polite">
        <div>Project panel: {isOpen ? 'open' : 'closed'}</div>
        <div>Press Ctrl+S to save, Ctrl+E to export</div>
        {activeTab && <div>Active tab: {activeTab}</div>}
      </div>
    </div>
  );
}