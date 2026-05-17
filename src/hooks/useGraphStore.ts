// src/hooks/useGraphStore.ts
import { create } from 'zustand'
import * as THREE from 'three'

interface GraphState {
  focusedNodeId: string | null
  isAnimating: boolean
  cameraTarget: THREE.Vector3
  phase: 'cryptex' | 'dissolve' | 'forming' | 'ready'
  setFocused: (id: string | null) => void
  setAnimating: (v: boolean) => void
  setCameraTarget: (v: THREE.Vector3) => void
  setPhase: (p: GraphState['phase']) => void
}

export const useGraphStore = create<GraphState>(set => ({
  focusedNodeId: null,
  isAnimating: false,
  cameraTarget: new THREE.Vector3(0, 0, 45),
  phase: 'cryptex',
  setFocused:       id  => set({ focusedNodeId: id }),
  setAnimating:     v   => set({ isAnimating: v }),
  setCameraTarget:  v   => set({ cameraTarget: v }),
  setPhase:         p   => set({ phase: p }),
}))
