'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGraphStore } from '@/hooks/useGraphStore'

// ─── Real-physics explosion model ────────────────────────────────────────────
//
// Inspired by the velocity-driven approach in /personal/webgl-particle-bomb:
// every star is a particle with explicit velocity and acceleration. Per
// frame we integrate (Verlet/Euler) under three forces:
//
//   1. SPRING        — F = k · (final − pos)   pulls toward resting spot
//   2. AIR DRAG      — F = −c · v              dampens momentum
//   3. TURBULENCE    — small smooth noise      organic shimmer / wobble
//
// At t=0 each particle gets an explicit IMPULSE: an outward velocity along
// the radial line to its final position, scaled to feel like a bomb went
// off. The combination of high initial velocity + spring + drag produces
// a *real* overshoot-and-settle without any baked easing curve — the math
// is the same that governs a physical mass on a damped spring.
//
// Per-particle variation (kick speed, turbulence seed) makes the bang
// non-uniform — some particles whip past their target, others land more
// directly, just like real debris.
//
const SPRING_K     = 78         // ω² (stiffness): ω ≈ 8.83 rad/s, period ≈ 0.71s
const DAMP_C       = 9.5        // 2·ζ·ω, ζ ≈ 0.54 → underdamped, clean settle
const KICK_SCALE   = 14.0       // base radial impulse multiplier (units/sec per unit-of-radius)
const TURB_AMP     = 2.4        // turbulence acceleration amplitude (units/sec²)
const TURB_FREQ    = 11.5       // turbulence base frequency (rad/sec)
const SETTLE_TIME  = 1.0        // after this many seconds, snap to final and freeze
const FADE_IN_TIME = 0.12       // opacity ramps from 0→1 over this window

// Cap per-frame dt so a tab-switch resume doesn't fling particles into orbit.
const MAX_DT       = 0.033

// ─── Soft circular sprite ────────────────────────────────────────────────────
//
// Without a texture, three.js Points render as raw gl_PointSize quads (the
// "square stars" look). We bake one soft radial gradient on the client at
// module-load and share it across every star material so every point looks
// like a tiny gaussian dot.
//
let _starSprite: THREE.Texture | null = null
function buildSprite(stops: Array<[number, string]>, size = 64): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const c   = document.createElement('canvas')
  c.width = size; c.height = size
  const ctx = c.getContext('2d')!
  const g   = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [stop, color] of stops) g.addColorStop(stop, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

function getStarSprite() {
  if (_starSprite) return _starSprite
  // Tight gaussian falloff — stars read as pinpoints even with bloom.
  _starSprite = buildSprite([
    [0.00, 'rgba(255,255,255,1.00)'],
    [0.18, 'rgba(255,255,255,0.85)'],
    [0.40, 'rgba(255,255,255,0.18)'],
    [0.70, 'rgba(255,255,255,0.04)'],
    [1.00, 'rgba(255,255,255,0.00)'],
  ])
  return _starSprite
}

// ─── Module-scope data generation ────────────────────────────────────────────
//
// All randomized starfield data is computed once at module-load time, outside
// any component render. Keeps React 19 purity rules happy and means the
// layout is stable across re-renders & HMR.
//
function spherePos(rMin: number, rMax: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2
  const phi   = Math.acos(2 * Math.random() - 1)
  const r     = rMin + Math.random() * (rMax - rMin)
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ]
}

// Real-stellar palette — overwhelmingly white & blue-white (matches what the
// human eye perceives looking at the night sky), with rare warm accents.
function starColor(): [number, number, number] {
  const r = Math.random()
  if (r < 0.68) return [1, 1, 1]                                // pure white  (most stars)
  if (r < 0.86) return [0xdc / 255, 0xe8 / 255, 1]              // blue-white  (hot stars)
  if (r < 0.95) return [1, 0xf6 / 255, 0xde / 255]              // warm white  (sun-like)
  if (r < 0.99) return [1, 0xde / 255, 0xb2 / 255]              // pale yellow (cooler G/K)
  return             [1, 0xb2 / 255, 0x92 / 255]                // faint orange (rare red giants)
}

interface LayerData {
  N:        number
  final:    Float32Array   // resting position xyz
  colors:   Float32Array
  kicks:    Float32Array   // per-particle initial speed multiplier (organic spread)
  turb:     Float32Array   // per-particle turbulence phase seed
}

function buildLayer(
  N: number,
  fillPos: (i: number, out: Float32Array) => void,
  colorize: () => [number, number, number] = starColor,
): LayerData {
  const final  = new Float32Array(N * 3)
  const colors = new Float32Array(N * 3)
  const kicks  = new Float32Array(N)
  const turb   = new Float32Array(N)

  for (let i = 0; i < N; i++) {
    fillPos(i, final)
    const c = colorize()
    colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2]
    // Per-particle kick multiplier in [0.78, 1.42] — mirrors the
    // (1 + random*1) speed variance from the reference bomb, but scaled
    // around 1.0 instead of 1.0..2.0 because our spring expects the kick
    // to be tuned around critical velocity.
    kicks[i] = 0.78 + Math.random() * 0.64
    // Independent turbulence phase per particle so the shimmer isn't
    // synchronised across the field.
    turb[i]  = Math.random() * 1000
  }

  return { N, final, colors, kicks, turb }
}

// ── Star counts ────────────────────────────────────────────────────────────
// ~7k total stars across all layers — sparse enough to read as a real night
// sky once settled, dense enough that the explosion has visible mass.
//
const NEAR_DATA = buildLayer(700, (i, out) => {
  const [x, y, z] = spherePos(6, 28)
  out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z
})

const INNER_DATA = buildLayer(700, (i, out) => {
  const [x, y, z] = spherePos(28, 60)
  out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z
})

const MID_DATA = buildLayer(800, (i, out) => {
  const [x, y, z] = spherePos(60, 120)
  out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z
})

const DISTANT_DATA = buildLayer(3200, (i, out) => {
  const [x, y, z] = spherePos(120, 320)
  out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z
})

const GALAXY_DATA = buildLayer(
  1600,
  (i, out) => {
    const angle     = Math.random() * Math.PI * 2
    const u         = Math.pow(Math.random(), 0.6)
    const r         = 70 + u * 220
    const band      = (Math.random() - 0.5) * 14 * (1 - u * 0.5)
    const armOffset = Math.sin(angle * 2) * 10
    out[i * 3]     = r * Math.cos(angle)
    out[i * 3 + 1] = band + armOffset * 0.25
    out[i * 3 + 2] = r * Math.sin(angle)
  },
  () => {
    const c = starColor()
    return [Math.min(1, c[0] * 1.0), c[1] * 0.97, c[2] * 0.94]
  },
)

// Shared galaxy-band tilt — slight pitch + yaw so the disc reads as the
// "Milky Way ribbon" from a flat 2D camera angle.
const GALAXY_TILT = new THREE.Euler(0.42, 0.18, 0)

// ─── Shockwave bubble ────────────────────────────────────────────────────────
//
// Every real explosion has a visible compression front — the bubble of
// over-pressured gas racing outward at the moment of detonation. We render
// it as a single hollow sphere that scales from 0 → ~220 over 0.45s while
// fading from bright to nothing. Combined with the bloom pass, this gives
// the bang a clear "BOOM!" moment: a luminous expanding bubble that races
// past the camera before vanishing.
//
// Rendered with BackSide so once the bubble crosses the camera distance
// (~38 units), we see the *inside* surface, giving a brief "we're inside
// the shockwave" sensation without obstructing the starfield behind.
//
function Shockwave() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef  = useRef<THREE.MeshBasicMaterial>(null!)
  const tRef    = useRef(0)
  const aliveRef = useRef(true)

  const DURATION  = 0.55     // total visible lifetime (seconds)
  const MAX_RADIUS = 240     // peak bubble radius (engulfs the camera at ~38)
  const PEAK_OP    = 0.55    // max bubble brightness — kept moderate so the
                              // stars behind aren't washed out

  useFrame((_, dt) => {
    if (!aliveRef.current) return
    tRef.current += Math.min(dt, MAX_DT)
    const t = tRef.current
    const p = Math.min(1, t / DURATION)

    // easeOutCubic — fast initial expansion, slowing as the bubble dissipates
    const ease = 1 - Math.pow(1 - p, 3)

    if (meshRef.current) {
      meshRef.current.scale.setScalar(ease * MAX_RADIUS + 0.001)
    }
    if (matRef.current) {
      // Quick ramp-up over the first 8% of life, then linear fade to nothing.
      const ramp = Math.min(1, p / 0.08)
      const fade = 1 - p
      matRef.current.opacity = PEAK_OP * ramp * fade * fade
    }

    if (t >= DURATION) {
      aliveRef.current = false
      if (meshRef.current) meshRef.current.visible = false
    }
  })

  return (
    <mesh ref={meshRef} scale={0.001}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color="#cfe2ff"          // cool blue-white compression front
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}    // see the bubble's interior as it engulfs us
        toneMapped={false}
      />
    </mesh>
  )
}

// ─── Verlet-integrated exploding-points layer ────────────────────────────────
//
// Each layer maintains its own per-particle velocity buffer and steps physics
// every frame. When phase===cryptex the parent un-mounts us entirely, so
// re-mounting on phase===exploding gives every particle a fresh start at
// origin with zero velocity — perfect synchronised detonation.
//
interface ExplodingPointsProps {
  data:           LayerData
  baseOpacity:    number
  size:           number
  spinY:          number
  spinX?:         number
  spinZ?:         number
  rotation?:      THREE.Euler
  /** Multiplier applied to size & opacity during the initial flash. 1 = no boost. */
  flashBoost?:    number
  /** Time (s) over which the flash boost decays back to baseline. */
  flashDecay?:    number
}

function ExplodingPoints({
  data,
  baseOpacity, size, spinY, spinX = 0, spinZ = 0,
  rotation,
  flashBoost = 2.6,
  flashDecay = 0.35,
}: ExplodingPointsProps) {
  const ref = useRef<THREE.Points>(null!)
  const { N, final, colors, kicks, turb } = data
  const sprite = getStarSprite()

  // Live physics state — recreated each mount.
  const velocityRef = useRef<Float32Array | null>(null)
  const tRef        = useRef(0)
  const launchedRef = useRef(false)
  const settledRef  = useRef(false)

  if (velocityRef.current === null || velocityRef.current.length !== N * 3) {
    velocityRef.current = new Float32Array(N * 3)
  }

  const geo = useMemo(() => {
    const live = new Float32Array(N * 3)   // starts at origin (zeros)
    const g    = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(live, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
    return g
  }, [N, colors])

  useFrame((_, dt) => {
    const clampedDt = Math.min(dt, MAX_DT)
    const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array
    const vel = velocityRef.current!

    // Once we've settled, the layer is inert — only the slow idle spin runs.
    if (settledRef.current) {
      if (ref.current) {
        ref.current.rotation.y += dt * spinY
        ref.current.rotation.x += dt * spinX
        ref.current.rotation.z += dt * spinZ
      }
      return
    }

    tRef.current += clampedDt
    const t = tRef.current

    // ─── Impulse: detonation moment ─────────────────────────────────────────
    // On the very first frame after the parent mounts us (phase enters
    // 'exploding'), assign each particle an outward velocity along its
    // radial line. Magnitude scales with both the particle's resting
    // distance (farther stars get launched harder) and a per-particle
    // jitter so the wavefront is organic, not a perfect sphere.
    if (!launchedRef.current) {
      for (let i = 0; i < N; i++) {
        const ix = i * 3
        const speed = KICK_SCALE * kicks[i]
        vel[ix]     = final[ix]     * speed
        vel[ix + 1] = final[ix + 1] * speed
        vel[ix + 2] = final[ix + 2] * speed
      }
      launchedRef.current = true
    }

    // ─── Per-particle physics step (Euler integration) ──────────────────────
    // For each star:
    //   a  = SPRING_K · (final − pos)   ← restoring pull toward resting spot
    //      − DAMP_C   · v               ← air drag (kills momentum over time)
    //      + turbulence(t)              ← small smooth noise wobble
    //   v += a · dt
    //   pos += v · dt
    //
    // ~7k particles × ~25 ops/particle/frame ≈ 180k ops — trivial on any GPU.
    for (let i = 0; i < N; i++) {
      const ix = i * 3

      // Distance to resting position (spring stretch)
      const dx = final[ix]     - pos[ix]
      const dy = final[ix + 1] - pos[ix + 1]
      const dz = final[ix + 2] - pos[ix + 2]

      // Turbulence — three independent sine waves with per-particle phase.
      // Decays out as the explosion settles so the final star sky is dead-still.
      const seed = turb[i]
      const turbDecay = Math.max(0, 1 - t / SETTLE_TIME)
      const tx = Math.sin(t * TURB_FREQ + seed)                 * TURB_AMP * turbDecay
      const ty = Math.cos(t * TURB_FREQ * 0.87 + seed * 1.31)   * TURB_AMP * turbDecay
      const tz = Math.sin(t * TURB_FREQ * 0.69 + seed * 0.73)   * TURB_AMP * turbDecay

      // Acceleration components
      const ax = SPRING_K * dx - DAMP_C * vel[ix]     + tx
      const ay = SPRING_K * dy - DAMP_C * vel[ix + 1] + ty
      const az = SPRING_K * dz - DAMP_C * vel[ix + 2] + tz

      // Integrate velocity, then position
      vel[ix]     += ax * clampedDt
      vel[ix + 1] += ay * clampedDt
      vel[ix + 2] += az * clampedDt

      pos[ix]     += vel[ix]     * clampedDt
      pos[ix + 1] += vel[ix + 1] * clampedDt
      pos[ix + 2] += vel[ix + 2] * clampedDt
    }
    ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true

    // ─── Opacity fade-in + incandescent hot-flash boost ─────────────────────
    //
    // For the first ~`flashDecay` seconds, push both opacity *and* size above
    // their baseline. Combined with the bloom pass, this reads as the
    // particles glowing white-hot at the moment of detonation — the
    // "incandescent debris" half of a real explosion — before cooling to
    // their final star-sky brightness.
    const mat = ref.current?.material as THREE.PointsMaterial
    if (mat) {
      const fadeIn   = Math.min(1, Math.max(0, t / FADE_IN_TIME))
      // Flash factor decays from 1.0 at t=0 → 0 at t=flashDecay (cubic ease-out)
      const fProg    = Math.min(1, t / flashDecay)
      const flashF   = Math.pow(1 - fProg, 3)
      const boost    = 1 + (flashBoost - 1) * flashF

      mat.opacity = Math.min(1, baseOpacity * fadeIn * boost)
      mat.size    = size * boost
    }

    // ─── Settle watchdog ────────────────────────────────────────────────────
    // After SETTLE_TIME, slam positions to exact resting values and freeze
    // physics. This guarantees the sky is pixel-perfect once the bang is
    // done — no residual oscillation, no drift.
    if (t > SETTLE_TIME) {
      pos.set(final)
      vel.fill(0)
      ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true
      // Lock material at its true baseline — no residual flash boost.
      if (mat) {
        mat.opacity = baseOpacity
        mat.size    = size
      }
      settledRef.current = true
    }
  })

  return (
    <points ref={ref} geometry={geo} rotation={rotation as unknown as [number, number, number] | undefined}>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0}
        sizeAttenuation={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={sprite ?? undefined}
        alphaTest={0.01}
      />
    </points>
  )
}

// ─── Composite export ────────────────────────────────────────────────────────
//
// During the cryptex hero phase, nothing here is mounted — the void must
// be empty so the cryptex reads as the *only* thing in the universe.
// The moment we cross into 'exploding', every layer mounts and detonates
// outward from origin under real physics until it settles into the resting
// star sky.
//
export function StarField() {
  const phase = useGraphStore(s => s.phase)
  if (phase === 'cryptex') return null

  return (
    <>
      {/* Shockwave — only mount during the active explosion phase. Self-
          destructs after ~0.55s so it doesn't keep ticking forever. The
          'exploding'-phase key remount guarantees a fresh bubble every
          time the user replays the hero (HMR / nav). */}
      {phase === 'exploding' && <Shockwave key="shockwave" />}

      {/* Galactic band — tilted slightly so the disc reads as the Milky Way
          ribbon when viewed from the camera's flat angle. Hot flash kept
          modest here so the disc doesn't drown the foreground. */}
      <ExplodingPoints
        data={GALAXY_DATA}
        baseOpacity={0.82}
        size={1.7}
        spinY={0.004}
        rotation={GALAXY_TILT}
        flashBoost={2.0}
        flashDecay={0.45}
      />

      {/* Vast distant sphere — pinpoints across the void. */}
      <ExplodingPoints
        data={DISTANT_DATA}
        baseOpacity={0.85}
        size={1.6}
        spinY={0.002}
        spinX={0.0008}
        flashBoost={2.1}
        flashDecay={0.40}
      />

      {/* Mid-field — fills depth between distant haze and inner shell. */}
      <ExplodingPoints
        data={MID_DATA}
        baseOpacity={0.90}
        size={1.7}
        spinY={0.005}
        spinZ={-0.002}
        flashBoost={2.5}
        flashDecay={0.35}
      />

      {/* Inner shell — fills the middle distance. */}
      <ExplodingPoints
        data={INNER_DATA}
        baseOpacity={0.92}
        size={1.7}
        spinY={0.007}
        spinZ={-0.003}
        flashBoost={2.8}
        flashDecay={0.30}
      />

      {/* NEAR shell — sits right around the camera so the sky stays dense
          even when the user dollies in hard. Hottest flash of the bunch
          because these are the particles the camera sees biggest. */}
      <ExplodingPoints
        data={NEAR_DATA}
        baseOpacity={0.95}
        size={1.6}
        spinY={0.010}
        spinZ={-0.004}
        flashBoost={3.2}
        flashDecay={0.28}
      />
    </>
  )
}
