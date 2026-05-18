'use client'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGraphStore } from '@/hooks/useGraphStore'
import { CryptexModel } from './CryptexModel'
import { FloatingCards } from './FloatingCards'

export function GraphScene() {
  const [formingT, setFormingT] = useState(0)
  const phase          = useGraphStore(s => s.phase)
  const setPhase       = useGraphStore(s => s.setPhase)
  const cameraTarget   = useGraphStore(s => s.cameraTarget)
  const camTargetRef   = useRef(cameraTarget)
  const controlsRef    = useRef<any>(null)

  camTargetRef.current = cameraTarget

  useEffect(() => {
    if (phase !== 'forming') return
    // No simulation needed — FloatingCards reads directly from PATTERNS
    setPhase('ready')
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

      {phase === 'ready' && (
        <FloatingCards formingT={formingT} />
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
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.8}
          radius={0.6}
        />
      </EffectComposer>

      <Environment preset="night" environmentIntensity={0.25} />
    </>
  )
}
