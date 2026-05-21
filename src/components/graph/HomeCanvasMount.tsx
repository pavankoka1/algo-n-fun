'use client'
//
// Thin client-only wrapper around <GraphCanvas> and <GraphOverlay>.
//
// We keep this in its own file so the home `page.tsx` can stay a
// server component — that's what lets us bake fully-rendered SEO
// content + JSON-LD into the initial HTML response. Without this
// split, the whole page would have to be `'use client'`, which means
// crawlers and the "view source" pane would see nothing but an empty
// <main> tag and our search ranking would suffer.

import dynamic from 'next/dynamic'
import { GraphOverlay } from '@/components/graph/GraphOverlay'

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then(m => m.GraphCanvas),
  { ssr: false }
)

export function HomeCanvasMount() {
  return (
    <>
      <GraphCanvas />
      <GraphOverlay />
    </>
  )
}
