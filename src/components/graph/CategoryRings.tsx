'use client'
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'

interface Props {
  nodes: GraphNode[]
  formingT: number
}

// Shared ring geometry - thin halo
const RING_GEO = new THREE.RingGeometry(1.55, 1.85, 48)
// Slightly different tilt per ring to look 3D and varied
const TILTS = [0.3, 0.6, 0.25, 0.7, 0.4, 0.55, 0.35, 0.65, 0.45, 0.3, 0.7, 0.5, 0.4, 0.6, 0.35, 0.55]

export function CategoryRings({ nodes, formingT }: Props) {
  const categoryNodes = useMemo(() => nodes.filter(n => n.depth === 1), [nodes])
  const rotations = useRef<number[]>(categoryNodes.map((_, i) => i * 0.4))
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((_, delta) => {
    categoryNodes.forEach((_, i) => {
      const mesh = meshRefs.current[i]
      if (!mesh) return
      rotations.current[i] += delta * 0.35 * (i % 2 === 0 ? 1 : -1)
      const tilt = TILTS[i % TILTS.length]
      mesh.rotation.set(tilt, 0, rotations.current[i])
    })
  })

  return (
    <>
      {categoryNodes.map((n, i) => {
        const color = new THREE.Color(n.color)
        return (
          <mesh
            key={n.id}
            ref={(el: THREE.Mesh | null) => { meshRefs.current[i] = el }}
            geometry={RING_GEO}
            position={[n.x, n.y, n.z]}
          >
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.55 * formingT}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </>
  )
}
