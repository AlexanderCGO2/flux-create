import type { Metadata } from 'next'
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
  creator: 'Flux Create',
  publisher: 'Flux Create',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#667eea',
  openGraph: {
    title: 'Flux Create - AI-Powered Voice Image Editor',
    description: 'Transform images with voice commands using AI-powered Flux technology',
    type: 'website',
    locale: 'en_US',
    siteName: 'Flux Create',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flux Create - AI-Powered Voice Image Editor',
    description: 'Transform images with voice commands using AI-powered Flux technology',
    creator: '@fluxcreate',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          <AccessibilityProvider>
            <VoiceProvider>
              <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
                {children}
                <Toaster />
              </div>
            </VoiceProvider>
          </AccessibilityProvider>
        </QueryProvider>
      </body>
    </html>
  )
}