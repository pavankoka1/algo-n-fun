'use client'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { runSimulation, type GraphNode } from '@/lib/graphLayout'
import { useGraphStore } from '@/hooks/useGraphStore'
import { CryptexModel } from './CryptexModel'
import { NodeMesh } from './NodeMesh'
import { CategoryRings } from './CategoryRings'
import { NodeLabels } from './NodeLabels'

export function GraphScene() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [formingT, setFormingT] = useState(0)
  const phase          = useGraphStore(s => s.phase)
  const setPhase       = useGraphStore(s => s.setPhase)
  const cameraTarget   = useGraphStore(s => s.cameraTarget)
  const camTargetRef   = useRef(cameraTarget)
  const controlsRef    = useRef<any>(null)

  camTargetRef.current = cameraTarget

  useEffect(() => {
    if (phase !== 'forming') return
    runSimulation().then(({ nodes: n }) => {
      setNodes(n); setPhase('ready')
    })
  }, [phase, setPhase])

  useEffect(() => {
    if (phase !== 'ready') return
    let t = 0; let raf = 0
    const tick = () => {
      t = Math.min(1, t + 0.008)
      setFormingT(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useFrame(({ camera }) => {
    const tgt = camTargetRef.current
    camera.position.lerp(tgt, 0.045)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(tgt.x, tgt.y, 0), 0.045)
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight color="#e0e8ff" groundColor="#020209" intensity={0.5} />
      <directionalLight position={[15, 20, 10]} intensity={0.9} />
      <directionalLight position={[-12, 8, -8]} intensity={0.45} color="#c4b5fd" />

      <CryptexModel />

      {nodes.length > 0 && (
        <>
          <NodeMesh nodes={nodes} formingT={formingT} />
          <CategoryRings nodes={nodes} formingT={formingT} />
          <NodeLabels nodes={nodes} formingT={formingT} />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        maxDistance={90}
        minDistance={6}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer>
        <Bloom
          intensity={1.6}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.55}
          radius={0.5}
        />
      </EffectComposer>

      <Environment preset="night" environmentIntensity={0.25} />
    </>
  )
}
