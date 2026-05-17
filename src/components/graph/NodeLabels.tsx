// src/components/graph/NodeLabels.tsx
'use client'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'

interface Props {
  nodes: GraphNode[]
  formingT: number
}

function getLabelProps(node: GraphNode): {
  fontSize: number
  labelOffset: number
  maxWidth: number
  labelColor: string
} {
  const base = new THREE.Color(node.color)

  switch (node.depth) {
    case 0:
      return { fontSize: 2.2, labelOffset: 3.5, maxWidth: 12, labelColor: '#ffffff' }
    case 1:
      return { fontSize: 1.4, labelOffset: 2.0, maxWidth: 8, labelColor: '#' + base.getHexString() }
    case 2: {
      const c = base.clone().multiplyScalar(0.8)
      return { fontSize: 0.75, labelOffset: 1.1, maxWidth: 5, labelColor: '#' + c.getHexString() }
    }
    case 3: {
      const c = base.clone().multiplyScalar(0.6)
      return { fontSize: 0.5, labelOffset: 0.8, maxWidth: 5, labelColor: '#' + c.getHexString() }
    }
    default: {
      const c = base.clone().multiplyScalar(0.5)
      return { fontSize: 0.38, labelOffset: 0.6, maxWidth: 5, labelColor: '#' + c.getHexString() }
    }
  }
}

export function NodeLabels({ nodes, formingT }: Props) {
  return (
    <>
      {nodes.map((n) => {
        const { fontSize, labelOffset, maxWidth, labelColor } = getLabelProps(n)
        return (
          <Text
            key={n.id}
            position={[n.x * formingT, n.y * formingT + labelOffset, n.z * formingT]}
            fontSize={fontSize}
            color={labelColor}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.05}
            outlineColor="#000000"
            maxWidth={maxWidth}
            textAlign="center"
            fillOpacity={formingT}
            outlineOpacity={formingT}
          >
            {n.label}
          </Text>
        )
      })}
    </>
  )
}
