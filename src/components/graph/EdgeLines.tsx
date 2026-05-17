'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { GraphNode, GraphEdge } from '@/lib/graphLayout'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  formingT: number
}

export function EdgeLines({ nodes, edges, formingT }: Props) {
  const { geometry, material } = useMemo(() => {
    const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]))
    const positions: number[] = []
    const edgeColors: number[] = []

    edges.forEach(e => {
      const src = nodeById[typeof e.source === 'string' ? e.source : (e.source as GraphNode).id]
      const tgt = nodeById[typeof e.target === 'string' ? e.target : (e.target as GraphNode).id]
      if (!src || !tgt) return
      positions.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z)
      const c = new THREE.Color(src.color)
      edgeColors.push(c.r, c.g, c.b, c.r * 0.45, c.g * 0.45, c.b * 0.45)
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(edgeColors, 3))

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28 * formingT,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return { geometry: geo, material: mat }
  }, [nodes, edges, formingT])

  return <lineSegments geometry={geometry} material={material} />
}
