'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      expand={true}
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-white group-[.toaster]:border-white/20 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-white/80',
          actionButton: 'group-[.toast]:bg-white/20 group-[.toast]:text-white group-[.toast]:border-white/30',
          cancelButton: 'group-[.toast]:bg-white/10 group-[.toast]:text-white/80 group-[.toast]:border-white/20',
        },
      }}
    />
  )
}