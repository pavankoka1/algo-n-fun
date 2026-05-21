// src/hooks/useGraphStore.ts
import { create } from 'zustand'
import * as THREE from 'three'

interface GraphState {
  focusedNodeId: string | null
  isAnimating: boolean
  cameraTarget: THREE.Vector3
  // ─── Phase machine ──────────────────────────────────────────────────────
  //
  //   cryptex   — hero animation: cryptex spins, charges, dissolves & shrinks
  //   exploding — the singularity blows up: impact flash + stars erupt outward
  //   forming   — transient handoff (kept for backward compat with FloatingCards)
  //   ready     — galaxy is settled, tree explorer is interactive
  //
  phase: 'cryptex' | 'exploding' | 'forming' | 'ready'
  setFocused: (id: string | null) => void
  setAnimating: (v: boolean) => void
  setCameraTarget: (v: THREE.Vector3) => void
  setPhase: (p: GraphState['phase']) => void
}

export const useGraphStore = create<GraphState>(set => ({
  focusedNodeId: null,
  isAnimating: false,
  cameraTarget: new THREE.Vector3(0, 0, 60),
  phase: 'cryptex',
  setFocused:       id  => set({ focusedNodeId: id }),
  setAnimating:     v   => set({ isAnimating: v }),
  setCameraTarget:  v   => set({ cameraTarget: v }),
  setPhase:         p   => set({ phase: p }),
}))
