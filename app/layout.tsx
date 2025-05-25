import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DrowsinessProvider } from './contexts/DrowsinessContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Driver Monitoring System',
  description: 'AI-powered driver monitoring system for enhanced road safety',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DrowsinessProvider>
          {children}
        </DrowsinessProvider>
      </body>
    </html>
  )
}
