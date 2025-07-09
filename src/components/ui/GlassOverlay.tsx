'use client';

import React from 'react'
import { motion } from 'framer-motion'

export function GlassOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Floating glass orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 backdrop-blur-lg rounded-full border border-white/10"
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/5 backdrop-blur-lg rounded-full border border-white/10"
        animate={{
          y: [10, -10, 10],
          x: [5, -5, 5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute top-1/2 right-1/3 w-16 h-16 bg-white/5 backdrop-blur-lg rounded-full border border-white/10"
        animate={{
          y: [-8, 8, -8],
          x: [-3, 3, -3],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10" />
      <div className="absolute inset-0 bg-gradient-to-bl from-pink-500/5 via-transparent to-cyan-500/5" />
      
      {/* Glass shimmer effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
}

// Utility component for custom glass panels
export function GlassPanel({ 
  children, 
  className = '', 
  state = 'visible',
  voiceState = 'idle',
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  state?: 'invisible' | 'minimal' | 'visible' | 'prominent';
  voiceState?: 'idle' | 'active' | 'processing' | 'error';
} & React.HTMLAttributes<HTMLDivElement>) {
  
  const stateClasses = {
    invisible: 'glass-invisible',
    minimal: 'glass-minimal', 
    visible: 'glass-visible',
    prominent: 'glass-prominent'
  };

  const voiceClasses = {
    idle: '',
    active: 'voice-active',
    processing: 'voice-processing',
    error: 'voice-error'
  };

  return (
    <div 
      className={`
        glass-overlay 
        ${stateClasses[state]} 
        ${voiceClasses[voiceState]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}