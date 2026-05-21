'use client'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGraphStore } from '@/hooks/useGraphStore'

useGLTF.preload('/models/da_vinci_code_cryptex.glb')

const TARGET_MODEL_SIZE = 16

// ─── Shared soft sprite (round particles, no square boxes) ──────────────────
let _spriteCache: THREE.Texture | null = null
function getSoftSprite(): THREE.Texture | null {
  if (_spriteCache) return _spriteCache
  if (typeof document === 'undefined') return null
  const c   = document.createElement('canvas')
  c.width = 64; c.height = 64
  const ctx = c.getContext('2d')!
  const g   = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0.0,  'rgba(255,255,255,1.0)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.7,  'rgba(255,255,255,0.14)')
  g.addColorStop(1.0,  'rgba(255,255,255,0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  _spriteCache = new THREE.CanvasTexture(c)
  _spriteCache.needsUpdate = true
  return _spriteCache
}

// ─── Subtle charge ring — slim, low-opacity ring that wraps the cryptex
//     during the wind-up. Anticipation, not fireworks. ────────────────────────
function ChargeRing({
  chargeRef,
  dissolveRef,
}: {
  chargeRef:   React.MutableRefObject<number>
  dissolveRef: React.MutableRefObject<boolean>
}) {
  const ringRef    = useRef<THREE.Mesh>(null!)
  const collapseRef = useRef(0)

  useFrame((_, dt) => {
    if (!ringRef.current) return
    const c            = chargeRef.current
    const collapseTgt  = dissolveRef.current ? 1 : 0
    collapseRef.current += (collapseTgt - collapseRef.current) * Math.min(1, dt * 2.4)
    const k = collapseRef.current

    // Spin accelerates dramatically as the ring tightens into the singularity.
    ringRef.current.rotation.z += dt * (0.5 + c * 4.0 + k * 14.0)

    // Scale: grows slightly with charge, then contracts hard with collapse so
    // it stays welded to the shrinking cryptex body instead of floating off.
    const s = (0.92 + c * 0.18) * (1 - k * 0.92)
    ringRef.current.scale.setScalar(s)

    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    // Brief brighten just as it collapses, then fade out so it vanishes
    // synchronously with the cryptex's last frame.
    mat.opacity = c * 0.38 * (1 - k * 0.85) + k * (1 - k) * 0.75
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[8.6, 8.95, 96]} />
      <meshBasicMaterial
        color="#ffd890"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

// ─── Orbital swarm ────────────────────────────────────────────────────────────
//
// 320 particles orbiting the cryptex on a fat torus band, with a multi-hue
// jewel-toned palette so the swarm reads as *magical* rather than just gold.
// Each particle has its own radius, height, angular speed and phase — so they
// read as a chaotic swirl rather than a synchronized ring. As the dissolve
// phase begins they accelerate hard and spiral inward, visually consuming
// the cryptex.
//
function OrbitalSwarm({
  chargeRef,
  dissolveRef,
  opacityRef,
}: {
  chargeRef:   React.MutableRefObject<number>
  dissolveRef: React.MutableRefObject<boolean>
  opacityRef:  React.MutableRefObject<number>      // cryptex's own opacity
}) {
  const COUNT     = 320
  const pointsRef = useRef<THREE.Points>(null!)

  // Per-particle data — static across frames.
  const data = useMemo(() => {
    const baseR  = new Float32Array(COUNT)
    const height = new Float32Array(COUNT)
    const speed  = new Float32Array(COUNT)
    const phase  = new Float32Array(COUNT)
    const wob    = new Float32Array(COUNT)   // vertical wobble phase
    for (let i = 0; i < COUNT; i++) {
      // Wider band than before — 4.5 .. 11.2 — gives the cloud body, not just a ring.
      baseR[i]  = 4.5 + Math.random() * 6.7
      // Vertical spread along the cryptex's length, with leakage above & below.
      height[i] = (Math.random() - 0.5) * 11.0
      // Faster base angular speeds — 1.8 .. 5.8 rad/s.
      speed[i]  = (Math.random() < 0.5 ? -1 : 1) * (1.8 + Math.random() * 4.0)
      phase[i]  = Math.random() * Math.PI * 2
      wob[i]    = Math.random() * Math.PI * 2
    }
    return { baseR, height, speed, phase, wob }
  }, [])

  // Geometry + material — created once.
  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      // Magical multi-hue palette — weighted toward warm so the cryptex still
      // reads as the obvious "gold artefact":
      //   55% gold     (anchors the look)
      //   18% white    (bright sparks)
      //   12% violet   (magic accent)
      //   10% cyan     (cool counterpoint)
      //    5% rose     (rare hot pop)
      const r = Math.random()
      let c: THREE.Color
      if (r < 0.55) {
        c = new THREE.Color().setHSL(0.09 + Math.random() * 0.05, 0.85, 0.55 + Math.random() * 0.30)
      } else if (r < 0.73) {
        c = new THREE.Color().setHSL(0.13, 0.18, 0.86 + Math.random() * 0.10)
      } else if (r < 0.85) {
        c = new THREE.Color().setHSL(0.75 + Math.random() * 0.04, 0.78, 0.68)
      } else if (r < 0.95) {
        c = new THREE.Color().setHSL(0.52 + Math.random() * 0.05, 0.82, 0.68)
      } else {
        c = new THREE.Color().setHSL(0.96 + Math.random() * 0.03, 0.78, 0.68)
      }
      col[i * 3]     = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    const m = new THREE.PointsMaterial({
      size:           0.32,
      vertexColors:   true,
      transparent:    true,
      opacity:        0,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped:     false,
      map:             getSoftSprite() ?? undefined,
      alphaTest:       0.01,
    })
    return { geo: g, mat: m }
  }, [])

  const tRef       = useRef(0)
  const fadeRef    = useRef(0)              // 0..1, particle alpha envelope
  const collapseRef = useRef(0)             // 0 (full radius) → 1 (collapsed to centre)

  useFrame((_, dt) => {
    tRef.current += dt
    const charge     = chargeRef.current
    const dissolving = dissolveRef.current

    // ── Fade envelope ────────────────────────────────────────────────────
    let fadeTarget: number
    if (!dissolving) {
      fadeTarget = charge
    } else if (opacityRef.current > 0.15) {
      fadeTarget = 1
    } else {
      fadeTarget = 0
    }
    // Faster fade-out so the swarm clears the stage immediately when the
    // explosion fires — no lingering particles after the big bang.
    const fadeSpeed = fadeTarget < fadeRef.current ? 8.0 : 2.8
    fadeRef.current += (fadeTarget - fadeRef.current) * Math.min(1, dt * fadeSpeed)

    // ── Collapse envelope ────────────────────────────────────────────────
    const collapseTarget = dissolving ? 1 : 0
    collapseRef.current += (collapseTarget - collapseRef.current) * Math.min(1, dt * 2.6)

    // ── Speed multiplier ────────────────────────────────────────────────
    // 1× idle → ~12× during the final spiral. The acceleration sells the
    // "everything is being sucked into the singularity" beat.
    const speedMult = 1.0 + charge * 3.0 + collapseRef.current * 9.0

    // ── Write positions ─────────────────────────────────────────────────
    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array
    const collapse = collapseRef.current
    for (let i = 0; i < COUNT; i++) {
      const angle = data.phase[i] + tRef.current * data.speed[i] * speedMult
      const r     = data.baseR[i] * (1 - collapse * 0.95) + 0.3 * collapse
      const h     = data.height[i] * (1 - collapse * 0.90)
      const wobY  = Math.sin(tRef.current * 2.2 + data.wob[i]) * 0.35 * (1 - collapse * 0.7)

      pos[i * 3]     = Math.cos(angle) * r
      pos[i * 3 + 1] = h + wobY
      pos[i * 3 + 2] = Math.sin(angle) * r
    }
    ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true

    mat.opacity = fadeRef.current * 0.95
    mat.size    = 0.32 + collapseRef.current * 0.22
  })

  return <points ref={pointsRef} geometry={geo} material={mat} />
}

// ─── Sparkle layer — bright tiny points that wink in/out ─────────────────────
//
// Adds the "fairy magic" feel without overwhelming the cryptex. Each sparkle
// has an independent orbit + a fast sine envelope on its alpha so they appear
// to twinkle individually rather than pulsing in unison.
//
function SparkleLayer({
  chargeRef,
  dissolveRef,
}: {
  chargeRef:   React.MutableRefObject<number>
  dissolveRef: React.MutableRefObject<boolean>
}) {
  const COUNT  = 90
  const ref    = useRef<THREE.Points>(null!)

  const data = useMemo(() => {
    const r       = new Float32Array(COUNT)
    const h       = new Float32Array(COUNT)
    const speed   = new Float32Array(COUNT)
    const phase   = new Float32Array(COUNT)
    const twPhase = new Float32Array(COUNT)
    const twFreq  = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      r[i]       = 5.0 + Math.random() * 7.5
      h[i]       = (Math.random() - 0.5) * 13.0
      speed[i]   = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 1.4)
      phase[i]   = Math.random() * Math.PI * 2
      twPhase[i] = Math.random() * Math.PI * 2
      twFreq[i]  = 2.5 + Math.random() * 3.5
    }
    return { r, h, speed, phase, twPhase, twFreq }
  }, [])

  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      // Sparkles are pure white-hot — high luminance so Bloom catches them.
      col[i * 3]     = 1
      col[i * 3 + 1] = 0.96 + Math.random() * 0.04
      col[i * 3 + 2] = 0.85 + Math.random() * 0.15
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    const m = new THREE.PointsMaterial({
      size:           0.22,
      vertexColors:   true,
      transparent:    true,
      opacity:        0,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped:     false,
      map:             getSoftSprite() ?? undefined,
      alphaTest:       0.01,
    })
    return { geo: g, mat: m }
  }, [])

  const tRef    = useRef(0)
  const fadeRef = useRef(0)
  const collapseRef = useRef(0)

  useFrame((_, dt) => {
    tRef.current += dt
    const charge = chargeRef.current
    const dissolving = dissolveRef.current

    const fadeTarget = dissolving ? 0 : charge
    fadeRef.current += (fadeTarget - fadeRef.current) * Math.min(1, dt * (fadeTarget < fadeRef.current ? 8.0 : 3.0))

    collapseRef.current += ((dissolving ? 1 : 0) - collapseRef.current) * Math.min(1, dt * 2.6)
    const speedMult = 1.0 + charge * 2.0 + collapseRef.current * 8.0

    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array
    const collapse = collapseRef.current
    for (let i = 0; i < COUNT; i++) {
      const a = data.phase[i] + tRef.current * data.speed[i] * speedMult
      const r = data.r[i] * (1 - collapse * 0.95) + 0.25 * collapse
      const h = data.h[i] * (1 - collapse * 0.85)
      pos[i * 3]     = Math.cos(a) * r
      pos[i * 3 + 1] = h
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true

    // Global alpha gated by charge envelope; the per-sparkle twinkle is
    // baked into the size pulse (we don't have per-vertex alpha) so they
    // *appear* to wink because their visual brightness oscillates.
    const winkAvg = 0.5 + Math.sin(tRef.current * 4.0) * 0.18
    mat.opacity = fadeRef.current * winkAvg * 1.1
    mat.size    = 0.22 + collapse * 0.30
  })

  return <points ref={ref} geometry={geo} material={mat} />
}

export function CryptexModel() {
  const { scene }  = useGLTF('/models/da_vinci_code_cryptex.glb')
  const groupRef   = useRef<THREE.Group | null>(null)
  const phase      = useGraphStore(s => s.phase)
  const setPhase   = useGraphStore(s => s.setPhase)

  // Animation state — refs so useFrame reads them without re-renders.
  const opacityRef     = useRef(0)          // starts INVISIBLE — entry fades it in
  const dissolveRef    = useRef(false)
  const flareRef       = useRef(0)          // brief mid-sequence emissive lift
  const chargeRef      = useRef(0)          // 0..1, drives ring + particle ramp
  const tiltRef        = useRef(0)
  const tRef           = useRef(0)
  const currentXRot    = useRef(0)
  const spinSpeedRef   = useRef(0)          // entry boost decays to idle
  const scaleRef       = useRef(0)          // entry spring grows it from 0 → 1
  const scaleVelRef    = useRef(0)
  const collapseRef    = useRef(0)
  // Entry envelope — drives the "arrival" beat. The cryptex flies up & forward
  // from below the camera, scaling & spinning into focus, then settles.
  const entryRef       = useRef(0)          // 0..1 over the entrance window

  // ── Material + bounding-box normalization ──────────────────────────────────
  //
  // useLayoutEffect (not useEffect) so the model is normalized BEFORE the
  // browser paints the first frame. Otherwise on a cold load the raw GLB
  // bounds (which can be 100+ units) flash on screen as a giant blob/circle
  // for a single frame before useEffect shrinks it. On refresh, useGLTF's
  // cache hands us the already-normalized scene and the bug hides itself —
  // exactly the asymmetry the user reported ("first time too zoomed in, fine
  // after refresh").
  //
  useLayoutEffect(() => {
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    const box    = new THREE.Box3().setFromObject(scene)
    const size   = new THREE.Vector3()
    const centre = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(centre)
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0) {
      const s = TARGET_MODEL_SIZE / maxDim
      scene.scale.setScalar(s)
      scene.position.set(-centre.x * s, -centre.y * s, -centre.z * s)
    }

    scene.traverse(obj => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh
      mesh.material = new THREE.MeshStandardMaterial({
        color:             new THREE.Color(0xE8A832),
        metalness:         0.92,
        roughness:         0.28,
        emissive:          new THREE.Color(0x2a1500),
        emissiveIntensity: 0.22,
        envMapIntensity:   1.35,
        transparent:       true,
        opacity:           0,        // start invisible, fade-in owns it
      })
      mesh.castShadow    = false
      mesh.receiveShadow = false
    })
  }, [scene])

  // ── Timing sequence ─────────────────────────────────────────────────────────
  //
  //  t = 0.0s  ── ENTRY begins: cryptex rises from below + spins in (momentum)
  //  t = 0.5s  ── tilt overshoot starts (arrival "settle" beat)
  //  t = 0.9s  ── entry envelope complete, idle spin
  //  t = 1.8s  ── charge begins (ring + particles fade in)
  //  t = 2.6s  ── emissive lift
  //  t = 3.2s  ── dissolve: cryptex spins violently & shrinks
  //  t ≈ 3.6s  ── cryptex hits ~0 opacity, triggers 'exploding' phase
  //
  useEffect(() => {
    if (phase !== 'cryptex') return

    // Kick the entry envelope on the first frame after mount — we use a flag
    // ref instead of a timer so the very next useFrame tick reads entryRef > 0
    // and the per-frame spring engages. Otherwise React's scheduling can cost
    // us a perceptible "stationary" frame at t=0.
    entryRef.current = 0.001
    // Seed the spin with entrance momentum — the cryptex arrives spinning.
    spinSpeedRef.current = 0.22

    const tiltTimer = setTimeout(() => {
      tiltRef.current = 0.30
    }, 500)

    const chargeTimer = setTimeout(() => {
      chargeRef.current = 0.001
    }, 1800)

    const flareTimer = setTimeout(() => {
      flareRef.current = 1.0
    }, 2600)

    const dissolveTimer = setTimeout(() => {
      dissolveRef.current = true
    }, 3200)

    return () => {
      clearTimeout(tiltTimer)
      clearTimeout(chargeTimer)
      clearTimeout(flareTimer)
      clearTimeout(dissolveTimer)
    }
  }, [phase, setPhase])

  useFrame((_, dt) => {
    if (!groupRef.current) return
    tRef.current += dt

    if (phase === 'cryptex') {
      // ── Entry envelope ──────────────────────────────────────────────
      // Drives a single 0..1 progress that controls scale, opacity, and
      // rise-from-below. Once it hits 1 the cryptex is "landed" and we
      // hand off to the idle / charge / dissolve sequence.
      if (entryRef.current > 0 && entryRef.current < 1) {
        entryRef.current = Math.min(1, entryRef.current + dt * 1.4)   // ~0.7s
      }

      // ── Charge ramp ──────────────────────────────────────────────────
      if (chargeRef.current > 0 && chargeRef.current < 1) {
        chargeRef.current = Math.min(1, chargeRef.current + dt * 0.85)
      }

      // ── Collapse envelope ────────────────────────────────────────────
      const collapseTarget = dissolveRef.current ? 1 : 0
      collapseRef.current += (collapseTarget - collapseRef.current) * Math.min(1, dt * 3.2)

      // ── Spin ─────────────────────────────────────────────────────────
      // Entry seeds the spin with strong momentum (0.22 rad/frame) and we
      // decay it toward an idle baseline, then re-accelerate with charge
      // and collapse. The whole spin profile reads as: arrives spinning,
      // settles, breathes, then stress-spins as it implodes.
      const e          = entryRef.current
      const idleSpin   = 0.006
      const entryDecay = (1 - Math.min(1, e * 1.4)) * 0.20      // 0.20 → 0 over the first 0.7s
      const targetSpin = idleSpin + entryDecay + chargeRef.current * 0.10 + collapseRef.current * 0.85
      spinSpeedRef.current += (targetSpin - spinSpeedRef.current) * 0.18
      groupRef.current.rotation.y += spinSpeedRef.current

      // ── X tilt — smoothed, springs to target with overshoot during entry ──
      currentXRot.current += (tiltRef.current - currentXRot.current) * Math.min(1, dt * 2.6)
      groupRef.current.rotation.x = currentXRot.current

      // ── Scale envelope ───────────────────────────────────────────────
      //
      //   entry        (0 → 1):     spring from 0 → 1 with overshoot
      //   charge       (× 0.84):    visible "vessel compressing"
      //   collapse     (× 0.04):    fully consumed by the vortex
      //   breath       (+ small):   subtle alive-ness
      //
      const compress      = 1.0 - chargeRef.current * 0.16
      const implode       = 1.0 - collapseRef.current * 0.96
      const breath        = Math.sin(tRef.current * 0.9) * 0.012 * (1 - collapseRef.current) * e
      const targetScale   = e * compress * implode + breath

      // Spring solver — gives the entry a snappy overshoot without making
      // the steady-state response jittery. Stiff during entry (k=0.42, d=0.62),
      // looser for charge/collapse modulation handled by the same equation.
      scaleVelRef.current += (targetScale - scaleRef.current) * 0.42
      scaleVelRef.current *= 0.62
      scaleRef.current = Math.max(0, scaleRef.current + scaleVelRef.current)
      groupRef.current.scale.setScalar(scaleRef.current)

      // ── Position — rise from below + idle float + stress shake ──────
      // Entry: y = -3.5 → 0 with the same envelope as scale, so it feels
      // like a single coordinated "lift into place" motion.
      const riseFrom  = -3.5
      const eased     = 1 - Math.pow(1 - e, 3)
      const entryY    = riseFrom * (1 - eased)

      // Gentle float — fully damped once charge is up
      const floatAmp = 0.28 * (1 - chargeRef.current * 0.85) * e
      const floatY   = Math.sin(tRef.current * 0.55) * floatAmp

      // Stress jitter — only activates above 30% collapse
      const stress   = Math.max(0, (collapseRef.current - 0.30) / 0.70)
      const shakeAmp = stress * 0.55
      const sx = (Math.sin(tRef.current * 41.0) + Math.sin(tRef.current * 67.0)) * 0.5 * shakeAmp
      const sy = (Math.sin(tRef.current * 53.0) + Math.cos(tRef.current * 71.0)) * 0.5 * shakeAmp
      const sz = (Math.cos(tRef.current * 47.0) + Math.sin(tRef.current * 59.0)) * 0.5 * shakeAmp

      groupRef.current.position.x = sx
      groupRef.current.position.y = entryY + floatY + sy
      groupRef.current.position.z = sz

      // ── Opacity — fade in alongside the entry envelope (skip once we're
      // dissolving, the dissolve block below owns the fade-out) ──────────
      if (!dissolveRef.current && opacityRef.current < 1) {
        opacityRef.current = Math.min(1, opacityRef.current + dt * 2.4)
        groupRef.current.traverse(obj => {
          if (!(obj as THREE.Mesh).isMesh) return
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
          mat.transparent = true
          mat.opacity     = opacityRef.current
        })
      }

      // ── Emissive lift — gentle pulse, no spike ──────────────────────
      if (flareRef.current > 0) {
        flareRef.current = Math.max(0, flareRef.current - dt * 0.7)
        const base      = 0.22 + chargeRef.current * 0.30
        const flareGain = flareRef.current * 0.85
        scene.traverse(obj => {
          if (!(obj as THREE.Mesh).isMesh) return
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = base + flareGain
        })
      }
    }

    // ── Dissolve: opacity fades in place ─────────────────────────────────
    if (phase === 'cryptex' && dissolveRef.current) {
      // Aggressive opacity decay — gone in ~0.4s.
      opacityRef.current = Math.max(0, opacityRef.current - dt * 2.5)
      groupRef.current.traverse(obj => {
        if (!(obj as THREE.Mesh).isMesh) return
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.transparent = true
        mat.opacity     = opacityRef.current
      })

      if (opacityRef.current <= 0.02) {
        setPhase('exploding')
      }
    }
  })

  // Unmount immediately when we leave the cryptex phase — the ImpactFlash
  // & StarField take over from here. Keeping the cryptex mounted during
  // 'exploding' left visible artefacts (the swarm in particular) that
  // muddied the big-bang read.
  if (phase !== 'cryptex') return null

  return (
    // scale={0} on the JSX so the very first paint is invisible. useFrame
    // then springs the scale up from 0 → 1 as the entry envelope progresses.
    // Without this, the brief window between the primitive being mounted and
    // useFrame's first tick lets the raw cryptex render at scale 1 — which
    // (combined with bloom on the metallic gold) reads as a flashing circle.
    <group ref={groupRef} scale={0}>
      {/* Compact local rig — supplements the scene-level lights so the gold
          really catches highlights without needing absurd Bloom. */}
      <pointLight position={[7, 9, 11]}  intensity={11}  color="#FFD478" distance={48} decay={1.6} />
      <pointLight position={[-8, 4, 9]}  intensity={6.5} color="#FFAA44" distance={42} decay={1.7} />
      <pointLight position={[0, 1, -12]} intensity={5.5} color="#C8E8FF" distance={40} decay={1.7} />
      <pointLight position={[0, -8, 4]}  intensity={2.8} color="#CC7700" distance={26} decay={1.9} />

      <primitive object={scene} />

      <ChargeRing chargeRef={chargeRef} dissolveRef={dissolveRef} />
      <OrbitalSwarm
        chargeRef={chargeRef}
        dissolveRef={dissolveRef}
        opacityRef={opacityRef}
      />
      <SparkleLayer chargeRef={chargeRef} dissolveRef={dissolveRef} />
    </group>
  )
}
