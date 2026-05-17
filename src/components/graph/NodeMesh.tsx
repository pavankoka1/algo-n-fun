// src/components/graph/NodeMesh.tsx
'use client'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'
import { useGraphStore } from '@/hooks/useGraphStore'
import { useGraphInteraction } from '@/hooks/useGraphInteraction'

interface Props {
  nodes: GraphNode[]
  formingT: number
}

const SPHERE_GEO = new THREE.SphereGeometry(0.5, 14, 14)

export function NodeMesh({ nodes, formingT }: Props) {
  const meshRef    = useRef<THREE.InstancedMesh>(null!)
  const focusedId  = useGraphStore(s => s.focusedNodeId)
  const { hoveredIdx, onPointerMove, onPointerClick } = useGraphInteraction(nodes)

  const colors = useMemo(() => {
    const arr = new Float32Array(nodes.length * 3)
    nodes.forEach((n, i) => {
      const c = new THREE.Color(n.color)
      arr[i * 3 + 0] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    })
    return arr
  }, [nodes])

  const colorAttr = useMemo(
    () => new THREE.InstancedBufferAttribute(colors, 3),
    [colors]
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const scaleTargets = useRef(new Float32Array(nodes.length).fill(1))

  useFrame(() => {
    if (!meshRef.current) return
    // Assign color attribute once after mount
    if (!meshRef.current.instanceColor) {
      meshRef.current.instanceColor = colorAttr as THREE.InstancedBufferAttribute
    }
    nodes.forEach((n, i) => {
      const isHovered = hoveredIdx.current === i
      const isFocused = focusedId === n.id
      const baseScale = n.depth === 0 ? 2.0 : n.depth === 1 ? 1.3 : n.depth === 2 ? 0.85 : n.depth === 3 ? 0.55 : 0.4
      const targetScale = baseScale * (isHovered || isFocused ? 1.45 : 1) * formingT
      scaleTargets.current[i] += (targetScale - scaleTargets.current[i]) * 0.12

      dummy.position.set(n.x * formingT, n.y * formingT, n.z * formingT)
      dummy.scale.setScalar(scaleTargets.current[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[SPHERE_GEO, undefined, nodes.length]}
      onPointerMove={() => onPointerMove(meshRef.current)}
      onClick={() => onPointerClick(meshRef.current)}
    >
      <meshStandardMaterial
        vertexColors
        emissiveIntensity={0.85}
        emissive={new THREE.Color(1, 1, 1)}
        metalness={0.1}
        roughness={0.35}
      />
    </instancedMesh>
  )
}
