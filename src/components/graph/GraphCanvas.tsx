'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import { GraphScene } from './GraphScene'
import { HeroLoader } from './HeroLoader'

export function GraphCanvas() {
  return (
    <div className="pointer-events-auto fixed inset-0" style={{ zIndex: 1 }}>
      {/* Loader lives outside Canvas so it renders in normal DOM */}
      <HeroLoader />

      <Canvas
        camera={{ position: [0, 0, 38], fov: 62, near: 0.5, far: 600 }}
        dpr={[1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 2)]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
        onCreated={({ gl, scene }) => {
          // Pure deep-space black — no tint, no glow. The galaxy reads as
          // pinpoint stars against a true void.
          gl.setClearColor(0x000000)
          // NO fog. Black fog × pinpoint stars × dolly-in = stars getting
          // crushed to invisibility when the camera gets close. Without fog
          // the sky stays uniform no matter the zoom level.
          scene.fog = null
        }}
      >
        <Suspense fallback={null}>
          <GraphScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
