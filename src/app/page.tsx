'use client'
import dynamic from 'next/dynamic'

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then(m => m.GraphCanvas),
  { ssr: false }
)

export default function HomePage() {
  return <GraphCanvas />
}
