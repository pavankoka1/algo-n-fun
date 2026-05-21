'use client'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGraphStore } from '@/hooks/useGraphStore'
import { CryptexModel } from './CryptexModel'
import { TreeExplorer } from './TreeExplorer'
import { StarField } from './StarField'

// ─── Main scene ──────────────────────────────────────────────────────────────
export function GraphScene() {
  const [formingT, setFormingT] = useState(0)
  const phase          = useGraphStore(s => s.phase)
  const setPhase       = useGraphStore(s => s.setPhase)
  const cameraTarget   = useGraphStore(s => s.cameraTarget)
  const camTargetRef   = useRef(cameraTarget)
  const controlsRef    = useRef<any>(null)

  // When cameraTarget changes (e.g. user clicks a node), set this flag so
  // the lerp re-engages. Once we reach the target, the flag falls off and
  // OrbitControls regains exclusive ownership of the camera — otherwise
  // every frame would yank the user's pan back to the last programmatic
  // target, which feels like the camera is fighting them.
  const animatingRef   = useRef(true)
  camTargetRef.current = cameraTarget

  useEffect(() => {
    animatingRef.current = true
  }, [cameraTarget])

  // ─── exploding → forming ───────────────────────────────────────────────────
  // 1000ms — matches StarField's SETTLE_TIME. The cryptex collapses, the
  // universe detonates outward under real physics (spring + drag + turbulence),
  // particles overshoot and oscillate back to their resting positions, and
  // we hand off to the tree explorer as the sky finishes settling. The
  // *physical* settle is what makes the bang feel real, not staged.
  useEffect(() => {
    if (phase !== 'exploding') return
    const t = setTimeout(() => setPhase('forming'), 1000)
    return () => clearTimeout(t)
  }, [phase, setPhase])

  // ─── forming → ready ──────────────────────────────────────────────────────
  // Transient handoff (no FloatingCards to wait on).
  useEffect(() => {
    if (phase !== 'forming') return
    setPhase('ready')
  }, [phase, setPhase])

  // ─── exploding → animate formingT for the tree ───────────────────────────
  // The tree mounts *during* the explosion so it can emerge alongside the
  // starfield. We let formingT animate over ~1.1s so the nodes crystallise
  // into place just after the starfield finishes its physical settle —
  // the explosion lays down the dust, the nodes condense out of it.
  useEffect(() => {
    if (phase !== 'exploding' && phase !== 'forming' && phase !== 'ready') return
    let t = 0; let raf = 0
    const tick = () => {
      t = Math.min(1, t + 0.016)
      setFormingT(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // ─── Camera lerp (gated, Z-preserving) ────────────────────────────────────
  //
  // Only X & Y of the cameraTarget are honoured — the user's current zoom
  // level (Z) is preserved. Otherwise every node click would snap the camera
  // back to the default Z=60, undoing whatever zoom they had set.
  //
  useFrame(({ camera }) => {
    if (!animatingRef.current) return
    const tgt = camTargetRef.current
    const desired = new THREE.Vector3(tgt.x, tgt.y, camera.position.z)
    camera.position.lerp(desired, 0.06)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(tgt.x, tgt.y, 0), 0.06)
    }
    if (camera.position.distanceTo(desired) < 0.20) {
      animatingRef.current = false
    }
  })

  const controlsEnabled  = phase === 'exploding' || phase === 'forming' || phase === 'ready'
  const treeMounted      = phase === 'exploding' || phase === 'forming' || phase === 'ready'

  return (
    <>
      {/* Ambient base — slightly lifted so shadow zones still have material detail */}
      <ambientLight intensity={0.42} />
      <hemisphereLight color="#e6ecff" groundColor="#070414" intensity={0.55} />

      {/* Key — warm front-right, gives the cryptex its primary highlight */}
      <directionalLight position={[14, 18, 12]} intensity={1.1} color="#ffe6b0" />

      {/* Fill — cool front-left, lifts shadows without flattening */}
      <directionalLight position={[-14, 6, 8]} intensity={0.55} color="#b9c4ff" />

      {/* Rim — pure cold backlight that separates the silhouette from the void.
          Critical for high-metalness surfaces (otherwise the back edge dies into the BG). */}
      <directionalLight position={[0, 6, -16]} intensity={0.95} color="#cfe2ff" />

      <CryptexModel />

      {/* No separate flash mesh — the StarField erupting outward from origin
          IS the explosion. A bright additive flash on top was reading as a
          floodlight against the void. */}
      <StarField />

      {/* TreeExplorer mounts the instant the cryptex detonates so the root orb
          can scale-in & opacity-up alongside the emerging galaxy. */}
      {treeMounted && (
        <TreeExplorer formingT={formingT} />
      )}

      <OrbitControls
        ref={controlsRef}
        // ─── Map-style navigation ──────────────────────────────────────────
        //   • Left-drag pans (crawl around the frame)
        //   • Scroll zooms (in/out along the view direction)
        //   • Rotation is locked — no Z-perspective shifts, the framing
        //     stays flat & readable like a 2D atlas of the patterns.
        //   • Disabled entirely until phase==='ready' so the user can't
        //     hijack the hero animation.
        enabled={controlsEnabled}
        enablePan
        enableZoom
        enableRotate={false}
        screenSpacePanning
        // minDistance dropped to 8 — the new NEAR_DATA shell sits at radius
        // 6–28 so even at full zoom-in the camera is surrounded by stars,
        // not a black void. maxDistance generous for "see the whole galaxy".
        maxDistance={220}
        minDistance={8}
        zoomSpeed={0.85}
        panSpeed={0.95}
        enableDamping
        dampingFactor={0.10}
        mouseButtons={{
          LEFT:   THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      <EffectComposer>
        {/* Bloom tightened: higher threshold + lower intensity means stars
            no longer blow into giant white halos. UI hot-points (root orb,
            ripples) still glow softly because they sit in the >0.55 lum
            range; raw white star pixels are tiny enough that even after
            bloom they read as pinpoints, not blobs. */}
        <Bloom
          intensity={0.70}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.82}
          radius={0.45}
          mipmapBlur
        />
      </EffectComposer>

      {/* Studio IBL gives broader, softer reflections on metallic surfaces than warehouse —
          and at higher intensity the gold actually reads as gold, not olive-bronze. */}
      <Environment preset="studio" environmentIntensity={1.05} />
    </>
  )
}
