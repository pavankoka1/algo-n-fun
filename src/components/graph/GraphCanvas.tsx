'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import { GraphScene } from './GraphScene'

export function GraphCanvas() {
  return (
    <div className="pointer-events-auto fixed inset-0" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 46], fov: 70, near: 0.5, far: 600 }}
        dpr={[1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 2)]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x03030a)
          scene.fog = new THREE.FogExp2(0x03030a, 0.006)
        }}
      >
        <Suspense fallback={null}>
          <GraphScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
