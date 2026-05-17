// src/app/layout.tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { GrainOverlay } from '@/components/GrainOverlay'
import { TopNav } from '@/components/TopNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'algo-n-fun — Crack the Pattern. Own the Problem.',
  description: '182 DSA patterns mapped as an interactive 3D force graph. Find your pattern, crack the problem.',
}

export default function RootLayout({ children, overlay }: {
  children: React.ReactNode
  overlay?: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <GrainOverlay />
        <TopNav />
        <main className="pt-14">{children}</main>
        {overlay}
      </body>
    </html>
  )
}
