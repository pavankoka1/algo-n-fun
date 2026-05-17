// src/hooks/useGraphInteraction.ts
import { useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'
import { useGraphStore } from './useGraphStore'

export function useGraphInteraction(nodes: GraphNode[]) {
  const { camera, raycaster, pointer } = useThree()
  const setFocused      = useGraphStore(s => s.setFocused)
  const setCameraTarget = useGraphStore(s => s.setCameraTarget)
  const hoveredIdx      = useRef<number>(-1)

  const getHitNode = useCallback((mesh: THREE.InstancedMesh): number => {
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObject(mesh)
    return hits.length > 0 ? hits[0].instanceId ?? -1 : -1
  }, [camera, raycaster, pointer])

  const onPointerMove = useCallback((mesh: THREE.InstancedMesh) => {
    hoveredIdx.current = getHitNode(mesh)
  }, [getHitNode])

  const onPointerClick = useCallback((mesh: THREE.InstancedMesh) => {
    const idx = getHitNode(mesh)
    if (idx < 0 || idx >= nodes.length) return
    const node = nodes[idx]
    setFocused(node.id)
    const target = new THREE.Vector3(node.x, node.y, node.z + 14)
    setCameraTarget(target)
  }, [getHitNode, nodes, setFocused, setCameraTarget])

  return { hoveredIdx, onPointerMove, onPointerClick }
}
