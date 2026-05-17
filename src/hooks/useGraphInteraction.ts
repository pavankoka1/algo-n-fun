// src/hooks/useGraphInteraction.ts
import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'
import { useGraphStore } from './useGraphStore'

export function useGraphInteraction(nodes: GraphNode[]) {
  const setFocused      = useGraphStore(s => s.setFocused)
  const setCameraTarget = useGraphStore(s => s.setCameraTarget)
  const hoveredIdx      = useRef<number>(-1)

  const onPointerMove = useCallback((instanceId: number) => {
    hoveredIdx.current = instanceId
  }, [])

  const onPointerClick = useCallback((instanceId: number) => {
    if (instanceId < 0 || instanceId >= nodes.length) return
    const node = nodes[instanceId]
    setFocused(node.id)
    const target = new THREE.Vector3(node.x, node.y, node.z + 14)
    setCameraTarget(target)
  }, [nodes, setFocused, setCameraTarget])

  return { hoveredIdx, onPointerMove, onPointerClick }
}
