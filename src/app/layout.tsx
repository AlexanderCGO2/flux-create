import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { VoiceProvider } from '@/lib/providers/VoiceProvider'
import { AccessibilityProvider } from '@/lib/providers/AccessibilityProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRAISEE Desk',
  description: 'Voice-controlled AI image editor. Transform images with simple voice commands.',
  keywords: ['AI', 'image editor', 'voice control', 'CRAISEE', 'artificial intelligence', 'accessibility', 'desk', 'creative tools', 'voice editing'],
  authors: [{ name: 'CRAISEE Team' }],
  creator: 'CRAISEE Team',
  publisher: 'CRAISEE',
  category: 'productivity',
  openGraph: {
    title: 'CRAISEE Desk',
    description: 'Voice-controlled AI image editor with AI integration',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRAISEE Desk',
    description: 'Voice-controlled AI image editor',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://craisee.ai',
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
              <Toaster 
                position="top-right"
                theme="dark"
                richColors
                closeButton
              />
            </AccessibilityProvider>
          </VoiceProvider>
        </QueryProvider>
      </body>
    </html>
  )
}