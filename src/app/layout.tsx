import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { VoiceProvider } from '@/lib/providers/VoiceProvider'
import { AccessibilityProvider } from '@/lib/providers/AccessibilityProvider'
import { Toaster } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flux Create - AI-Powered Voice Image Editor',
  description: 'World\'s first voice-controlled image editor with AI-powered Flux integration. Transform images with simple voice commands.',
  keywords: ['AI', 'image editor', 'voice control', 'Flux', 'artificial intelligence', 'accessibility'],
  authors: [{ name: 'Flux Create Team' }],
  creator: 'Flux Create Team',
  publisher: 'Flux Create',
  category: 'productivity',
  openGraph: {
    title: 'Flux Create - AI-Powered Voice Image Editor',
    description: 'Transform images with voice commands and AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flux Create',
    description: 'AI-Powered Voice Image Editor',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://fluxcreate.ai',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-transparent antialiased">
        <QueryProvider>
          <VoiceProvider>
            <AccessibilityProvider>
              {children}
              <Toaster />
            </AccessibilityProvider>
          </VoiceProvider>
        </QueryProvider>
      </body>
    </html>
  )
}