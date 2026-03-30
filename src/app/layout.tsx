/**
 * Root layout for Dayread.
 *
 * Sets up fonts (Inter for UI, Newsreader for article content),
 * global styles, and metadata.
 */

import type { Metadata } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dayread — Your daily dose of AI & tech',
  description: 'AI-curated tech news, paced for humans. One article at a time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  )
}
