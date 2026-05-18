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
        const offsetY = isRoot ? 3.5 : 2.0
        const color = n.color

        return (
          <Html
            key={n.id}
            position={[n.x, n.y + offsetY, n.z]}
            center
            style={{ pointerEvents: 'none', opacity: formingT, transition: 'opacity 0.3s' }}
          >
            <div style={{
              color,
              fontSize: isRoot ? '14px' : '12px',
              fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textShadow: `0 0 16px ${color}, 0 0 8px ${color}99, 0 2px 4px rgba(0,0,0,0.9)`,
              letterSpacing: '0.05em',
              userSelect: 'none',
              textTransform: isRoot ? 'none' : 'uppercase',
              textAlign: 'center',
              transform: 'translateY(-50%)',
            }}>
              {n.label}
            </div>
          </Html>
        )
      })}
    </>
  )
}
