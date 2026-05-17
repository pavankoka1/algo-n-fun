'use client'
import dynamic from 'next/dynamic'
import { GraphOverlay } from '@/components/graph/GraphOverlay'

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then(m => m.GraphCanvas),
  { ssr: false }
)

export default function HomePage() {
  return (
    <>
      <GraphCanvas />
      <GraphOverlay />
    </>
  )
}
