'use client'
import { Html } from '@react-three/drei'
import type { GraphNode } from '@/lib/graphLayout'

interface Props {
  nodes: GraphNode[]
  formingT: number
}

export function NodeLabels({ nodes, formingT }: Props) {
  // Only show labels for depth 0 (root) and depth 1 (categories)
  const labelNodes = nodes.filter(n => n.depth <= 1)

  return (
    <>
      {labelNodes.map((n) => {
        const isRoot = n.depth === 0
        const fontSize = isRoot ? 13 : 11
        const offsetY = isRoot ? 3.5 : 2.0
        const color = n.color

        return (
          <Html
            key={n.id}
            position={[n.x * formingT, n.y * formingT + offsetY, n.z * formingT]}
            center
            style={{ pointerEvents: 'none', opacity: formingT }}
          >
            <div style={{
              color,
              fontSize: `${fontSize}px`,
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textShadow: `0 0 12px ${color}, 0 0 6px ${color}88, 0 1px 3px #000`,
              letterSpacing: '0.04em',
              userSelect: 'none',
            }}>
              {n.label}
            </div>
          </Html>
        )
      })}
    </>
  )
}
