'use client'
import { useState, useMemo, useRef, useCallback } from 'react'
import { useFrame }  from '@react-three/fiber'
import { Html }      from '@react-three/drei'
import { useRouter } from 'next/navigation'
import * as THREE    from 'three'
import { PATTERNS, type PatternNode } from '@/data/patterns'

// ─── Layout ───────────────────────────────────────────────────────────────────
const LEVEL_GAP = 18.5  // horizontal gap between levels — slight breathing room
const VERT_GAP  = 3.8   // vertical gap between siblings (level 1: 16 nodes ≈ ±29)

// ─── Spring constants ─────────────────────────────────────────────────────────
const POS_K   = 0.09    // position spring stiffness
const POS_D   = 0.72    // position spring damping
const SCALE_K = 0.11    // scale spring stiffness
const SCALE_D = 0.63    // scale spring damping  (low → bouncy)

// ─── Stagger timing ───────────────────────────────────────────────────────────
const STAGGER_MS = 40   // CSS delay per sibling step
const STAGGER_FR = 2.4  // frame delay per sibling step

// ─── Node radius by depth ─────────────────────────────────────────────────────
//
// Bumped at every depth — the previous values (0.36 / 0.26 at deep levels)
// produced visibly clumsy clusters where the labels and dots were the same
// size. New values give each node a real silhouette even five levels deep.
function bR(level: number) {
  return level === 0 ? 1.35
       : level === 1 ? 0.86
       : level === 2 ? 0.62
       : level === 3 ? 0.48
       :               0.38
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VisibleNode {
  id:           string
  pat:          PatternNode
  x:            number
  y:            number
  level:        number
  parentId:     string | null
  parentX:      number
  parentY:      number
  isSelected:   boolean
  siblingIndex: number
}

// ─── Tree data ────────────────────────────────────────────────────────────────
function getChildren(parentId: string): PatternNode[] {
  return PATTERNS.filter(p => p.parentId === parentId)
}

function computeVisibleNodes(expandedPath: string[]): VisibleNode[] {
  const result: VisibleNode[] = []
  const root = PATTERNS.find(p => p.id === 'root')!

  result.push({
    id: 'root', pat: root, x: 0, y: 0, level: 0,
    parentId: null, parentX: 0, parentY: 0,
    isSelected: expandedPath[0] === 'root', siblingIndex: 0,
  })

  for (let lvl = 0; lvl < expandedPath.length; lvl++) {
    const parentId   = expandedPath[lvl]
    const parentNode = result.find(n => n.id === parentId)
    if (!parentNode) break

    const children = getChildren(parentId)
    const N        = children.length
    const childX   = (lvl + 1) * LEVEL_GAP

    children.forEach((child, idx) => {
      // Centre-outward stagger: centre nodes appear first, edges last
      const dist = Math.abs(idx - (N - 1) / 2)
      result.push({
        id: child.id, pat: child,
        x:  childX,
        y:  parentNode.y + (idx - (N - 1) / 2) * VERT_GAP,
        level: lvl + 1,
        parentId, parentX: parentNode.x, parentY: parentNode.y,
        isSelected:   expandedPath[lvl + 1] === child.id,
        siblingIndex: Math.round(dist * 1.6),
      })
    })
  }
  return result
}

// ─── Ripple ring ──────────────────────────────────────────────────────────────
function NodeRipple({ color, x, y }: { color: string; x: number; y: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const t   = useRef(0)
  useFrame((_, dt) => {
    t.current += dt * 1.2
    if (!ref.current) return
    ref.current.scale.setScalar(0.2 + t.current * 5.2)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 0.58 - t.current * 0.7)
  })
  return (
    <mesh ref={ref} position={[x, y, 0]}>
      <ringGeometry args={[0.9, 1.0, 52]} />
      <meshBasicMaterial color={color} transparent opacity={0.58}
        blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Bezier edge with traveling pulse for the selected branch ─────────────────
function TreeEdge({ from, to }: { from: VisibleNode; to: VisibleNode }) {
  const matRef    = useRef<THREE.LineBasicMaterial>(null!)
  const opRef     = useRef(0)
  const pulseRef  = useRef<THREE.Mesh>(null!)
  const pulseT    = useRef(0)

  const { lineGeo, curve } = useMemo(() => {
    const s    = new THREE.Vector3(from.x, from.y, 0)
    const e    = new THREE.Vector3(to.x,   to.y,   0)
    const ctrl = new THREE.Vector3(from.x + LEVEL_GAP * 0.55, (s.y + e.y) / 2, 0)
    const c    = new THREE.QuadraticBezierCurve3(s, ctrl, e)
    return {
      lineGeo: new THREE.BufferGeometry().setFromPoints(c.getPoints(36)),
      curve:   c,
    }
  }, [from.x, from.y, to.x, to.y])

  const targetOp = to.isSelected ? 0.72 : 0.19

  useFrame((_, dt) => {
    if (matRef.current) {
      opRef.current         += (targetOp - opRef.current) * 0.04
      matRef.current.opacity = opRef.current
    }

    // Traveling light pulse — only on the active branch
    if (pulseRef.current) {
      if (to.isSelected) {
        pulseT.current = (pulseT.current + dt * 0.55) % 1
        const p = curve.getPoint(pulseT.current)
        pulseRef.current.position.copy(p)
        pulseRef.current.visible = true
        const mat = pulseRef.current.material as THREE.MeshBasicMaterial
        // Fade in & out at the ends so it doesn't pop
        const edgeFade = Math.sin(pulseT.current * Math.PI)
        mat.opacity = 0.88 * edgeFade
      } else {
        pulseRef.current.visible = false
      }
    }
  })

  return (
    <>
      {/* @ts-ignore */}
      <line geometry={lineGeo}>
        <lineBasicMaterial ref={matRef} color={to.pat.color}
          transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </line>

      {/* Light pulse — gleam traveling parent → child on the selected path */}
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshBasicMaterial color={to.pat.color} transparent opacity={0}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

// ─── Tree node ────────────────────────────────────────────────────────────────
interface NodeProps {
  vn:          VisibleNode
  onNodeClick: (id: string, level: number, x: number, y: number) => void
}

function TreeNode({ vn, onNodeClick }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const isLeaf  = vn.pat.isLeaf
  const childCt = vn.pat.childIds.length
  const radius  = bR(vn.level)

  // Refs
  const groupRef     = useRef<THREE.Group>(null!)
  const tiltRef      = useRef<THREE.Group>(null!)   // hover tilt wrapper (does NOT affect labels)
  const meshRef      = useRef<THREE.Mesh>(null!)
  const innerRef     = useRef<THREE.Mesh>(null!)    // glow core
  const selRingRef   = useRef<THREE.Mesh>(null!)

  // Spring
  const posRef     = useRef(new THREE.Vector3(vn.parentX, vn.parentY, 0))
  const velRef     = useRef(new THREE.Vector3())
  const scaleRef   = useRef(0)
  const scaleVel   = useRef(0)
  const emissRef   = useRef(isLeaf ? 0.6 : 0.45)
  const tRef       = useRef(0)
  const clickPulse = useRef(0)

  // Smoothed hover tilt — looks like the node is leaning toward you
  const hoverTiltRef = useRef(0)

  // Idle bob phase — each node has its own
  const bobPhase = useMemo(
    () => vn.siblingIndex * 0.73 + (vn.x * 0.31 + vn.y * 0.17),
    [vn.siblingIndex, vn.x, vn.y]
  )

  // Entrance
  const frameCount = useRef(0)
  const launched   = useRef(false)
  const frameDelay = Math.round(vn.siblingIndex * STAGGER_FR)
  const cssDelay   = `${vn.siblingIndex * STAGGER_MS}ms`

  const target = useMemo(() => new THREE.Vector3(vn.x, vn.y, 0), [vn.x, vn.y])
  const diff   = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    frameCount.current++
    const active = frameCount.current >= frameDelay
    if (groupRef.current) groupRef.current.visible = active
    if (!active) return

    // One-time velocity burst — "launched" not "drifted"
    if (!launched.current) {
      launched.current = true
      diff.copy(target).sub(posRef.current)
      const dist = diff.length()
      if (dist > 0.01) velRef.current.copy(diff.normalize().multiplyScalar(dist * 0.22))
      scaleVel.current = 0.1
    }

    // Position spring
    diff.copy(target).sub(posRef.current)
    velRef.current.addScaledVector(diff, POS_K)
    velRef.current.multiplyScalar(POS_D)
    posRef.current.add(velRef.current)

    // Scale spring (bouncy)
    scaleVel.current += (1.0 - scaleRef.current) * SCALE_K
    scaleVel.current *= SCALE_D
    scaleRef.current  = Math.max(0, scaleRef.current + scaleVel.current)

    clickPulse.current *= 0.78

    // Emissive
    tRef.current += dt
    const emissBase   = isLeaf ? 0.60 : 0.45
    const emissHov    = isLeaf ? 1.55 : 1.30
    const emissSel    = vn.isSelected
      ? (isLeaf ? 1.08 : 0.85 + Math.sin(tRef.current * 2.0) * 0.18)
      : emissBase
    const emissTarget = hovered ? emissHov : emissSel
    emissRef.current += (emissTarget - emissRef.current) * 0.09

    const hoverMult  = hovered ? 1.32 : 1.0
    const clickMult  = 1 + clickPulse.current * 0.35
    const totalScale = radius * scaleRef.current * hoverMult * clickMult

    // Idle bob — small breathing motion once settled, scaled with depth so
    // root area is steadier and leaves drift more.
    const settle  = Math.min(1, scaleRef.current)
    const bobAmp  = (isLeaf ? 0.08 : 0.05) * settle
    const bobY    = Math.sin(tRef.current * 0.85 + bobPhase) * bobAmp
    const bobZ    = Math.cos(tRef.current * 0.62 + bobPhase * 1.3) * bobAmp * 0.5

    if (groupRef.current) {
      groupRef.current.position.set(
        posRef.current.x,
        posRef.current.y + bobY,
        posRef.current.z + bobZ
      )
    }

    // Hover tilt — small lean toward viewer
    if (tiltRef.current) {
      const tiltTarget = hovered ? 0.22 : 0.0
      hoverTiltRef.current += (tiltTarget - hoverTiltRef.current) * 0.12
      tiltRef.current.rotation.x = -hoverTiltRef.current * 0.7
      tiltRef.current.rotation.y =  hoverTiltRef.current * 0.4
    }

    if (meshRef.current) {
      meshRef.current.scale.setScalar(totalScale)
      ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissRef.current
      // Leaf diamonds: slow self-rotation for a "gem" effect
      if (isLeaf) {
        meshRef.current.rotation.y += dt * 0.28
        meshRef.current.rotation.x += dt * 0.10
      }
    }

    // Inner glow core — kept *only* for the selected & hover states. On
    // resting nodes we hide it entirely so the body shape reads clean
    // instead of being lost inside a soft fuzzy halo.
    if (innerRef.current) {
      const want = hovered || vn.isSelected
      innerRef.current.visible = want && scaleRef.current > 0.15
      if (want) {
        innerRef.current.scale.setScalar(totalScale * 0.55)
        const coreOp = hovered ? 0.78 : 0.55
        ;(innerRef.current.material as THREE.MeshBasicMaterial).opacity = coreOp * scaleRef.current
      }
    }

    // Selection ring
    if (selRingRef.current) {
      const show = vn.isSelected && scaleRef.current > 0.2
      selRingRef.current.visible = show
      if (show) {
        selRingRef.current.scale.setScalar(radius * 2.0 * Math.min(1, scaleRef.current))
        selRingRef.current.rotation.z += dt * 0.28
      }
    }
  })

  const handleEnter = useCallback((e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handleLeave = useCallback((e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    clickPulse.current = 1.0
    onNodeClick(vn.id, vn.level, vn.x, vn.y)
  }, [vn.id, vn.level, vn.x, vn.y, onNodeClick])

  // Bigger fonts at every depth — the previous 11.5 / 10.5 / 9.5 stack felt
  // clumsy because labels and dots fought for visual weight. Keep the
  // step-down hierarchy but lift the floor so even the deepest leaves
  // are properly readable without zooming in.
  const fontSize = vn.level === 1 ? '13px'
                : vn.level === 2 ? '11.5px'
                : vn.level === 3 ? '10.5px'
                :                 '10px'

  return (
    <group ref={groupRef} visible={false}>

      {/* Tilt wrapper — only the 3D body tilts on hover; labels stay flat. */}
      <group ref={tiltRef}>
        {/* ── Main body: diamond (octahedron) for leaves, sphere for parents ── */}
        <mesh
          ref={meshRef}
          onPointerEnter={handleEnter}
          onPointerLeave={handleLeave}
          onClick={handleClick}
        >
          {isLeaf
            ? <octahedronGeometry args={[1, 0]} />
            : <sphereGeometry args={[1, 28, 28]} />
          }
          <meshStandardMaterial
            color={vn.pat.color}
            emissive={vn.pat.color}
            emissiveIntensity={isLeaf ? 0.60 : 0.45}
            metalness={isLeaf ? 0.08 : 0.28}
            roughness={isLeaf ? 0.18 : 0.12}
            toneMapped={false}
          />
        </mesh>

        {/* ── Inner glow core — only visible on hover / select (gated in
            useFrame). Starts hidden so it can't flash on the first frame. */}
        <mesh ref={innerRef} visible={false}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial
            color={vn.pat.color}
            transparent opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>

        {/* ── Selection ring — tilted halo ──────────────────────────────── */}
        <mesh ref={selRingRef} visible={false} rotation={[Math.PI / 4.5, 0, 0]}>
          <ringGeometry args={[0.87, 1.0, 56]} />
          <meshBasicMaterial color={vn.pat.color} transparent opacity={0.52}
            blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Label — lives inside the group, springs with the node ───────────
          Each label gets a thin dark capsule behind it (alpha-blurred) so
          it stays legible against bright background stars and bloom, no
          matter how tightly siblings pack together. */}
      <Html position={[0, radius + 0.95, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          className="tree-label"
          style={{
            animationDelay: cssDelay,
            color:      vn.isSelected ? '#ffffff' : '#f3f5fb',
            fontSize,
            fontWeight: vn.isSelected ? 700 : 600,
            fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            lineHeight: 1,
            textAlign: 'center',
            // Tight dark backplate first (kills star bleed-through), then a
            // coloured halo that matches the node's family colour.
            background:   vn.isSelected
              ? `linear-gradient(180deg, rgba(8,10,22,0.78), rgba(8,10,22,0.62))`
              : `linear-gradient(180deg, rgba(6,8,18,0.62), rgba(6,8,18,0.42))`,
            border:       `1px solid ${vn.pat.color}${vn.isSelected ? '88' : '44'}`,
            borderRadius: '6px',
            padding:      '3px 8px',
            boxShadow:    vn.isSelected
              ? `0 0 22px ${vn.pat.color}66, 0 1px 3px rgba(0,0,0,0.55)`
              : `0 1px 3px rgba(0,0,0,0.55)`,
            textShadow:   vn.isSelected
              ? `0 0 12px ${vn.pat.color}cc, 0 1px 2px rgba(0,0,0,0.9)`
              : `0 1px 2px rgba(0,0,0,0.95), 0 0 8px ${vn.pat.color}55`,
            userSelect:   'none',
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '6px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span>{vn.pat.label}</span>

          {/* Leaf: destination arrow */}
          {isLeaf && (
            <span style={{
              color: vn.pat.color,
              opacity: 0.85,
              fontSize: '9px',
              fontWeight: 700,
            }}>↗</span>
          )}

          {/* Parent: child count pill */}
          {!isLeaf && childCt > 0 && (
            <span style={{
              background:   `${vn.pat.color}30`,
              border:       `1px solid ${vn.pat.color}66`,
              borderRadius: '10px',
              padding:      '0px 6px',
              fontSize:     '8.5px',
              color:        '#ffffff',
              fontFamily:   'var(--font-mono, ui-monospace, monospace)',
              letterSpacing: 0,
              fontWeight:   600,
              flexShrink:   0,
            }}>
              {childCt}
            </span>
          )}
        </div>
      </Html>

      {/* ── Hover tooltip ─────────────────────────────────────────────────── */}
      {hovered && (
        <Html position={[0, radius + 1.95, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="node-tooltip" style={{
            background:     'rgba(4,4,14,0.94)',
            border:         `1px solid ${vn.pat.color}55`,
            borderRadius:   '8px',
            padding:        '5px 13px',
            fontSize:       '10px',
            fontFamily:     'var(--font-geist-sans, system-ui, sans-serif)',
            color:          `${vn.pat.color}ee`,
            whiteSpace:     'nowrap',
            letterSpacing:  '0.04em',
            fontWeight:     500,
            boxShadow:      `0 6px 28px rgba(0,0,0,0.6), 0 0 16px ${vn.pat.color}22`,
            backdropFilter: 'blur(10px)',
            display:        'flex',
            alignItems:     'center',
            gap:            '6px',
          }}>
            {isLeaf ? (
              <>
                <span style={{ opacity: 0.65 }}>◆</span>
                <span>view problems</span>
              </>
            ) : (
              <>
                <span style={{
                  background:    `${vn.pat.color}28`,
                  borderRadius:  '50%',
                  width: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontFamily: 'monospace', flexShrink: 0,
                }}>
                  {childCt}
                </span>
                <span>{childCt === 1 ? 'sub-topic' : 'sub-topics'}</span>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Root: orbital satellite (small jewel orbiting a ring) ────────────────────
function OrbitSatellite({
  radius,
  speed,
  phase,
  yScale,
  zScale,
  color,
  size,
  rotationEuler,
}: {
  radius:        number
  speed:         number
  phase:         number
  yScale:        number
  zScale:        number
  color:         string
  size:          number
  rotationEuler: [number, number, number]
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const tRef    = useRef(phase)

  useFrame((_, dt) => {
    tRef.current += dt * speed
    if (!meshRef.current) return
    const a = tRef.current
    // Local-space orbit, then the parent group's rotation gives it a tilted plane
    meshRef.current.position.set(
      Math.cos(a) * radius,
      Math.sin(a) * radius * yScale,
      Math.sin(a) * radius * zScale
    )
    const pulse = 0.85 + Math.sin(tRef.current * 2.4) * 0.18
    meshRef.current.scale.setScalar(size * pulse)
  })

  return (
    <group rotation={rotationEuler}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.95}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ─── Root: ambient dust — sparse drifting specks around the core ──────────────
// Lower count + lower opacity than before so the central crystal reads as the
// obvious click target instead of being lost in a cloud.
function RootDust() {
  const ref = useRef<THREE.Points>(null!)
  const N   = 48
  const palette = useMemo(() => [
    new THREE.Color('#9ab7ff'),
    new THREE.Color('#c8d8ff'),
    new THREE.Color('#7c8dff'),
    new THREE.Color('#ffe89a'),  // a hint of gold to echo the cryptex
  ], [])

  const geo = useMemo(() => {
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      // Shell roughly 1.8…3.6 around the root
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 1.8 + Math.random() * 1.8
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3]     = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    return g
  }, [palette])

  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y +=  dt * 0.05
    ref.current.rotation.x += -dt * 0.02
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.48}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

// ─── Root crystal ─────────────────────────────────────────────────────────────
//
// Layered build:
//   1. Soft halo (outer light dome)
//   2. Wireframe cage — dodecahedron of energy lines
//   3. Solid icosahedral crystal core (specular catches scene lights)
//   4. Bright inner pulse (additive)
//   5. Three orbital rings, each with its own satellite jewel
//   6. Ambient dust shell
//   7. Lifted typographic label
//
function RootOrb({
  onRootClick,
  isExpanded,
}: {
  onRootClick: () => void
  isExpanded:  boolean
}) {
  const [hovered, setHovered] = useState(false)

  // Refs
  const outerRef    = useRef<THREE.Group>(null!)   // entry scale wrapper
  const tiltRef     = useRef<THREE.Group>(null!)
  const crystalRef  = useRef<THREE.Mesh>(null!)
  const cageRef     = useRef<THREE.LineSegments>(null!)
  const innerRef    = useRef<THREE.Mesh>(null!)
  const haloRef     = useRef<THREE.Mesh>(null!)
  const ring1Ref    = useRef<THREE.Group>(null!)
  const ring2Ref    = useRef<THREE.Group>(null!)
  const ring3Ref    = useRef<THREE.Group>(null!)
  const t           = useRef(0)
  const hoverTilt   = useRef(0)

  // Entry envelope — scale 0 → 1 + opacity 0 → 1 in sync with the galaxy
  // explosion. Spring is slightly bouncy so the crystal "arrives" with
  // weight instead of just appearing at full size.
  const entryScaleRef   = useRef(0)
  const entryVelRef     = useRef(0)
  const entryOpacityRef = useRef(0)

  // Wireframe cage — slightly larger than the core, gives it "containment"
  const cageGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.65, 0)),
    []
  )

  // Static ring geometry shared by all three rings
  const ringGeo = useMemo(
    () => new THREE.RingGeometry(1.0, 1.04, 96),
    []
  )

  useFrame((_, dt) => {
    t.current += dt

    // Entry spring — scale 0 → 1 with overshoot, opacity follows close behind
    entryVelRef.current += (1 - entryScaleRef.current) * 0.05
    entryVelRef.current *= 0.78
    entryScaleRef.current = Math.max(0, entryScaleRef.current + entryVelRef.current)
    entryOpacityRef.current = Math.min(1, entryOpacityRef.current + dt * 2.0)

    if (outerRef.current) {
      outerRef.current.scale.setScalar(entryScaleRef.current)
    }

    // Smooth hover-driven tilt — feels like the whole assembly responds.
    const tiltTarget = hovered ? 0.16 : 0.0
    hoverTilt.current += (tiltTarget - hoverTilt.current) * 0.1
    if (tiltRef.current) {
      tiltRef.current.rotation.x = -hoverTilt.current * 0.55
      tiltRef.current.rotation.y =  hoverTilt.current * 0.85
    }

    // Crystal core — different X/Y rotation rates so flat faces always glint.
    // Pulse amplitude bumped so the click target visibly "breathes" — calls
    // attention to itself without needing a chrome label.
    if (crystalRef.current) {
      crystalRef.current.rotation.y += dt * 0.28
      crystalRef.current.rotation.x  = Math.sin(t.current * 0.43) * 0.10
      const pulse = 1 + Math.sin(t.current * 1.5) * 0.060
      crystalRef.current.scale.setScalar(pulse)
      const mat = crystalRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = (hovered ? 1.20 : 0.85) + Math.sin(t.current * 1.5) * 0.28
    }

    // Wireframe cage — counter-rotates against the core. Held at low
    // opacity so it suggests "containment" without obscuring the click target.
    if (cageRef.current) {
      cageRef.current.rotation.y -= dt * 0.18
      cageRef.current.rotation.x += dt * 0.07
      const mat = cageRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.30 + Math.sin(t.current * 1.1) * 0.07
    }

    // Inner pulse — additive, breathes with the core
    if (innerRef.current) {
      const p = 0.85 + Math.sin(t.current * 1.6) * 0.18
      innerRef.current.scale.setScalar(p)
      const mat = innerRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.72 + Math.sin(t.current * 1.6) * 0.12
    }

    // Halo — slow breathe
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1 + Math.sin(t.current * 0.6) * 0.10)
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (hovered ? 0.10 : 0.07) + Math.sin(t.current * 0.6) * 0.018
    }

    // Rings — each has its own tilt + counter-rotation, satellites included
    if (ring1Ref.current) ring1Ref.current.rotation.z += dt * 0.32
    if (ring2Ref.current) { ring2Ref.current.rotation.z -= dt * 0.21; ring2Ref.current.rotation.y += dt * 0.08 }
    if (ring3Ref.current) { ring3Ref.current.rotation.y += dt * 0.14; ring3Ref.current.rotation.x -= dt * 0.05 }
  })

  return (
    <group ref={outerRef} scale={0}>
      {/* Outer halo — sits behind everything (does not tilt) */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[3.4, 24, 24]} />
        <meshBasicMaterial color="#8da8ff"
          transparent opacity={0.07}
          depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* Ambient dust — independent of tilt so it feels "weather" around the core */}
      <RootDust />

      {/* Tilt-responsive assembly */}
      <group ref={tiltRef}>

        {/* Crystal core — icosahedron catches scene rim light */}
        <mesh
          ref={crystalRef}
          onClick={(e) => { e.stopPropagation(); onRootClick() }}
          onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default' }}
        >
          <icosahedronGeometry args={[1.35, 1]} />
          <meshStandardMaterial
            color="#d8e4ff"
            emissive="#8aa8ff"
            emissiveIntensity={0.75}
            metalness={0.22}
            roughness={0.16}
            toneMapped={false}
          />
        </mesh>

        {/* Wireframe cage — energy lattice around the core (kept subtle so
            the icosahedron underneath remains the obvious click target). */}
        {/* @ts-ignore */}
        <lineSegments ref={cageRef} geometry={cageGeo}>
          <lineBasicMaterial
            color="#aac4ff"
            transparent
            opacity={0.30}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        {/* @ts-ignore */}
        </lineSegments>

        {/* Inner additive pulse */}
        <mesh ref={innerRef}>
          <sphereGeometry args={[0.78, 16, 16]} />
          <meshBasicMaterial
            color="#cfe0ff"
            transparent opacity={0.72}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* ── Ring 1 — tight orbital ───────────────────────────────────── */}
        <group ref={ring1Ref} rotation={[Math.PI / 2.6, 0.3, 0]}>
          <mesh geometry={ringGeo} scale={[1.85, 1.85, 1.85]}>
            <meshBasicMaterial color="#a8c2ff" transparent opacity={0.45}
              blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <OrbitSatellite
            radius={1.85} speed={1.2} phase={0}
            yScale={0.04} zScale={0.04}
            color="#ffe89a" size={0.16}
            rotationEuler={[0, 0, 0]}
          />
        </group>

        {/* ── Ring 2 — wider counter-orbital ────────────────────────────── */}
        <group ref={ring2Ref} rotation={[Math.PI / 6, Math.PI / 3.5, 0]}>
          <mesh geometry={ringGeo} scale={[2.20, 2.20, 2.20]}>
            <meshBasicMaterial color="#7d96e8" transparent opacity={0.28}
              blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <OrbitSatellite
            radius={2.20} speed={-0.85} phase={2.1}
            yScale={0.05} zScale={0.05}
            color="#bcd5ff" size={0.13}
            rotationEuler={[0, 0, 0]}
          />
          <OrbitSatellite
            radius={2.20} speed={-0.85} phase={2.1 + Math.PI}
            yScale={0.05} zScale={0.05}
            color="#9ec0ff" size={0.10}
            rotationEuler={[0, 0, 0]}
          />
        </group>

        {/* ── Ring 3 — outermost, near-equatorial (kept whisper-quiet so the
            silhouette of the click target stays clean). */}
        <group ref={ring3Ref} rotation={[Math.PI / 18, 0, 0]}>
          <mesh geometry={ringGeo} scale={[2.65, 2.65, 2.65]}>
            <meshBasicMaterial color="#5d76c8" transparent opacity={0.10}
              blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <OrbitSatellite
            radius={2.65} speed={0.6} phase={0.9}
            yScale={0.03} zScale={0.03}
            color="#ffd49a" size={0.12}
            rotationEuler={[0, 0, 0]}
          />
        </group>
      </group>

      {/* ── Label ─────────────────────────────────────────────────────────
          Floating type only — no capsule, no plate. Just airy text lifted
          well clear of the orb assembly (y = 4.6, above the halo at r = 3.4).
          Tight black inner shadow + wide cool halo keeps it legible against
          the bright bloom directly behind it. */}
      <Html
        position={[0, 4.6, 0]}
        center
        style={{ pointerEvents: 'none', zIndex: 10 }}
      >
        <div style={{ textAlign: 'center', userSelect: 'none' }}>
          {/* Eyebrow */}
          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '8.5px',
            letterSpacing: '0.32em',
            color:         'rgba(170,190,240,0.55)',
            textTransform: 'uppercase',
            marginBottom:  6,
            textShadow:    '0 0 6px rgba(0,0,0,0.7)',
          }}>
            ◇ the core ◇
          </div>

          {/* Headline — back to the playful floating size */}
          <div style={{
            color:         '#f0f4ff',
            fontSize:      '14px',
            fontWeight:    700,
            fontFamily:    'var(--font-geist-sans, system-ui, sans-serif)',
            whiteSpace:    'nowrap',
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
            // Two-layer shadow: tight dark base for contrast on the orb's
            // bloom, then a wide cool halo for atmosphere.
            textShadow:
              '0 0 1px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.55), 0 0 16px rgba(120,150,235,0.55)',
            marginBottom:  4,
          }}>
            DSA Patterns
          </div>

          {/* Hairline divider */}
          <div style={{
            width:      88,
            height:     1,
            margin:     '0 auto 5px',
            background: 'linear-gradient(90deg, transparent, rgba(160,190,255,0.50), transparent)',
          }} />

          {/* Subtitle */}
          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '8.5px',
            letterSpacing: '0.22em',
            color:         'rgba(170,190,235,0.66)',
            textTransform: 'uppercase',
            whiteSpace:    'nowrap',
            textShadow:    '0 0 6px rgba(0,0,0,0.7)',
          }}>
            16 families · 182 patterns
          </div>
        </div>
      </Html>

      {/* ── Hint — small floating prompt, no chip ─────────────────────── */}
      <Html
        position={[0, -3.7, 0]}
        center
        style={{ pointerEvents: 'none', zIndex: 10 }}
      >
        <div style={{
          color:          'rgba(180,200,240,0.78)',
          fontSize:       '9px',
          fontFamily:     'var(--font-mono)',
          whiteSpace:     'nowrap',
          letterSpacing:  '0.24em',
          opacity:        isExpanded ? 0 : 1,
          transition:     'opacity 0.7s ease',
          userSelect:     'none',
          textTransform:  'uppercase',
          textShadow:     '0 0 6px rgba(0,0,0,0.7), 0 0 14px rgba(120,150,235,0.35)',
        }}>
          ◦ click to enter ◦
        </div>
      </Html>
    </group>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function TreeExplorer({ formingT }: { formingT: number }) {
  const router          = useRouter()
  const [expandedPath, setExpandedPath] = useState<string[]>([])
  const [ripples, setRipples] = useState<{ id: number; color: string; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  const visibleNodes = useMemo(() => computeVisibleNodes(expandedPath), [expandedPath])

  const spawnRipple = useCallback((color: string, x: number, y: number) => {
    const id = rippleId.current++
    setRipples(r => [...r, { id, color, x, y }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 900)
  }, [])

  // Clicks DON'T move the camera. The user owns the framing once the scene
  // is ready — pan & zoom are entirely manual. Click just expands the node
  // (or, for leaves, routes to the detail page). This is deliberate: every
  // previous attempt to "helpfully" recenter on click felt like the camera
  // was fighting the user mid-exploration.
  const handleNodeClick = useCallback(
    (nodeId: string, nodeLevel: number, _nodeX: number, _nodeY: number) => {
      const pat = PATTERNS.find(p => p.id === nodeId)
      if (!pat) return
      if (pat.childIds.length === 0) {
        router.push(`/pattern/${nodeId}`)
        return
      }
      const newPath = [...expandedPath.slice(0, nodeLevel), nodeId]
      setExpandedPath(newPath)
      spawnRipple(pat.color, _nodeX, _nodeY)
    },
    [expandedPath, router, spawnRipple]
  )

  const handleRootClick = useCallback(() => {
    if (expandedPath.length === 0) {
      setExpandedPath(['root'])
      spawnRipple('#aabfff', 0, 0)
    }
  }, [expandedPath, spawnRipple])

  if (formingT < 0.01) return null

  return (
    <group>
      <RootOrb onRootClick={handleRootClick} isExpanded={expandedPath.length > 0} />

      {visibleNodes.filter(n => n.parentId !== null).map(n => {
        const parent = visibleNodes.find(p => p.id === n.parentId)
        if (!parent) return null
        return <TreeEdge key={`e-${n.id}`} from={parent} to={n} />
      })}

      {visibleNodes.filter(n => n.id !== 'root').map(n => (
        <TreeNode key={n.id} vn={n} onNodeClick={handleNodeClick} />
      ))}

      {ripples.map(rp => (
        <NodeRipple key={rp.id} color={rp.color} x={rp.x} y={rp.y} />
      ))}
    </group>
  )
}
