'use client'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { runSimulation, type GraphNode, type GraphEdge } from '@/lib/graphLayout'
import { useGraphStore } from '@/hooks/useGraphStore'
import { CryptexModel } from './CryptexModel'
import { NodeMesh } from './NodeMesh'
import { EdgeLines } from './EdgeLines'

export function GraphScene() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [formingT, setFormingT] = useState(0)
  const phase          = useGraphStore(s => s.phase)
  const setPhase       = useGraphStore(s => s.setPhase)
  const cameraTarget   = useGraphStore(s => s.cameraTarget)
  const camTargetRef   = useRef(cameraTarget)
  const idleTimer      = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const autoRotateRef  = useRef(true)
  const autoRotateY    = useRef(0)
  const controlsRef    = useRef<any>(null)

  camTargetRef.current = cameraTarget

  useEffect(() => {
    if (phase !== 'forming') return
    runSimulation().then(({ nodes: n, edges: e }) => {
      setNodes(n); setEdges(e); setPhase('ready')
    })
  }, [phase, setPhase])

  useEffect(() => {
    if (phase !== 'ready') return
    let t = 0; let raf = 0
    const tick = () => {
      t = Math.min(1, t + 0.012)
      setFormingT(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useFrame(({ camera }) => {
    if (autoRotateRef.current && phase === 'ready') {
      autoRotateY.current += 0.0008
      const dist = camera.position.length()
      camera.position.x = Math.sin(autoRotateY.current) * dist
      camera.position.z = Math.cos(autoRotateY.current) * dist
    } else {
      const tgt = camTargetRef.current
      camera.position.lerp(tgt, 0.045)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(tgt.x, tgt.y, 0), 0.045)
      }
    }
  })

  const pauseAutoRotate = () => {
    autoRotateRef.current = false
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => { autoRotateRef.current = true }, 4000)
  }

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
          <EdgeLines nodes={nodes} edges={edges} formingT={formingT} />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        maxDistance={90}
        minDistance={6}
        onStart={pauseAutoRotate}
        enableDamping
        dampingFactor={0.08}
      />

      <EffectComposer>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.55}
          radius={0.5}
        />
      </EffectComposer>

      <Environment preset="night" environmentIntensity={0.25} />
    </>
  )
}
