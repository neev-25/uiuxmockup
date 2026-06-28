import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import Provider from './provider'
import { Toaster } from '@/components/ui/sonner'

const appFont = DM_Sans({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'UIUXMock — AI Mockup Generator',
  description:
    'Generate high-quality website and mobile app UI mockups with AI. Describe your idea and get polished designs instantly.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={appFont.className}>
          <Provider>{children}</Provider>
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
