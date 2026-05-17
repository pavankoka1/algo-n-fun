'use client'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { GraphNode, GraphEdge } from '@/lib/graphLayout'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  formingT: number
}

const CURVE_POINTS = 16

export function EdgeLines({ nodes, edges, formingT }: Props) {
  const matRef = useRef<THREE.LineBasicMaterial>(null!)

  const geometry = useMemo(() => {
    const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]))
    const positions: number[] = []
    const edgeColors: number[] = []

    edges.forEach(e => {
      const src = nodeById[typeof e.source === 'string' ? e.source : (e.source as GraphNode).id]
      const tgt = nodeById[typeof e.target === 'string' ? e.target : (e.target as GraphNode).id]
      if (!src || !tgt) return

      const srcV = new THREE.Vector3(src.x, src.y, src.z)
      const tgtV = new THREE.Vector3(tgt.x, tgt.y, tgt.z)

      // Control point: midpoint between src and tgt, pulled toward origin
      const mid = srcV.clone().add(tgtV).multiplyScalar(0.5)
      mid.multiplyScalar(0.55) // bow inward toward origin

      const curve = new THREE.QuadraticBezierCurve3(srcV, mid, tgtV)
      const pts = curve.getPoints(CURVE_POINTS)

      const srcColor = new THREE.Color(src.color)
      const tgtColor = new THREE.Color(src.color).multiplyScalar(0.45)

      // Each segment = 2 points; CURVE_POINTS points → CURVE_POINTS-1 segments? No:
      // getPoints(N) returns N+1 points → N segments as line pairs
      for (let i = 0; i < pts.length - 1; i++) {
        positions.push(pts[i].x, pts[i].y, pts[i].z)
        positions.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)

        // Fade color from src to tgt-dimmed along the curve
        const t = i / (pts.length - 2)
        const r = srcColor.r + (tgtColor.r - srcColor.r) * t
        const g = srcColor.g + (tgtColor.g - srcColor.g) * t
        const b = srcColor.b + (tgtColor.b - srcColor.b) * t
        // Two vertices per segment, same color for each
        edgeColors.push(r, g, b, r, g, b)
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(edgeColors, 3))
    return geo
  }, [nodes, edges])

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = 0.28 * formingT
    }
  })

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        ref={matRef}
        vertexColors
        transparent
        opacity={0.28 * formingT}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}
