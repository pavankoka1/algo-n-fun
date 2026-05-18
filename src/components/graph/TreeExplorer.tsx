'use client'
import { useState, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { PATTERNS, type PatternNode } from '@/data/patterns'
import { useGraphStore } from '@/hooks/useGraphStore'

const LEVEL_GAP = 12
const VERT_GAP = 2.0

interface VisibleNode {
  id: string
  pat: PatternNode
  x: number
  y: number
  level: number
  parentId: string | null
  parentX: number
  parentY: number
  isSelected: boolean
}

// ── helpers ──────────────────────────────────────────────
function getChildren(parentId: string): PatternNode[] {
  return PATTERNS.filter(p => p.parentId === parentId)
}

function computeVisibleNodes(expandedPath: string[]): VisibleNode[] {
  const result: VisibleNode[] = []
  const root = PATTERNS.find(p => p.id === 'root')!

  result.push({
    id: 'root', pat: root,
    x: 0, y: 0, level: 0,
    parentId: null, parentX: 0, parentY: 0,
    isSelected: expandedPath.length > 0 && expandedPath[0] === 'root',
  })

  // For each opened level, show children of expandedPath[lvl]
  for (let lvl = 0; lvl < expandedPath.length; lvl++) {
    const parentId = expandedPath[lvl]
    const parentNode = result.find(n => n.id === parentId)
    if (!parentNode) break

    const children = getChildren(parentId)
    const N = children.length
    const childX = (lvl + 1) * LEVEL_GAP

    children.forEach((child, idx) => {
      const childY = parentNode.y + (idx - (N - 1) / 2) * VERT_GAP
      result.push({
        id: child.id, pat: child,
        x: childX, y: childY, level: lvl + 1,
        parentId: parentId,
        parentX: parentNode.x, parentY: parentNode.y,
        isSelected: expandedPath[lvl + 1] === child.id,
      })
    })
  }

  return result
}

// ── Ripple ring on click ──────────────────────────────────
function NodeRipple({ color, x, y }: { color: string; x: number; y: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const t = useRef(0)
  useFrame((_, delta) => {
    t.current += delta * 1.8
    if (!meshRef.current) return
    meshRef.current.scale.setScalar(0.5 + t.current * 2.5)
    ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - t.current)
  })
  return (
    <mesh ref={meshRef} position={[x, y, 0]}>
      <ringGeometry args={[0.88, 1.0, 40]} />
      <meshBasicMaterial
        color={color} transparent opacity={0.7}
        blending={THREE.AdditiveBlending} depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ── Connection edge (bezier arc) ─────────────────────────
function TreeEdge({ from, to, color }: { from: VisibleNode; to: VisibleNode; color: string }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null!)
  const geo = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, 0)
    const end   = new THREE.Vector3(to.x, to.y, 0)
    const ctrl  = new THREE.Vector3(
      (start.x + end.x) / 2 + 1,
      (start.y + end.y) / 2,
      0
    )
    const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end)
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(24))
  }, [from.x, from.y, to.x, to.y])

  useFrame(() => {
    if (matRef.current && matRef.current.opacity < 0.35) {
      matRef.current.opacity += 0.008
    }
  })

  return (
    // @ts-ignore — R3F lowercase 'line' maps to THREE.Line
    <line geometry={geo}>
      <lineBasicMaterial
        ref={matRef}
        color={color}
        transparent opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  )
}

// ── Single node sphere ────────────────────────────────────
interface NodeProps {
  vn: VisibleNode
  onNodeClick: (id: string, level: number, x: number, y: number) => void
}

function TreeNode({ vn, onNodeClick }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const meshRef   = useRef<THREE.Mesh>(null!)
  const posRef    = useRef(new THREE.Vector3(vn.parentX, vn.parentY, 0))
  const velRef    = useRef(new THREE.Vector3())
  const scaleRef  = useRef(0)
  const emissRef  = useRef(vn.isSelected ? 0.7 : 0.35)
  const target    = useMemo(() => new THREE.Vector3(vn.x, vn.y, 0), [vn.x, vn.y])

  const baseRadius =
    vn.level === 0 ? 1.2 :
    vn.level === 1 ? 0.65 :
    vn.level === 2 ? 0.48 :
    vn.level === 3 ? 0.35 : 0.28

  useFrame((_, delta) => {
    // Spring position from parent → final
    const diff = target.clone().sub(posRef.current)
    velRef.current.addScaledVector(diff, 0.14)
    velRef.current.multiplyScalar(0.72)
    posRef.current.add(velRef.current)

    // Scale in from 0 → 1
    scaleRef.current += (1 - scaleRef.current) * Math.min(1, delta * 7)

    // Emissive target
    const emissTarget = hovered ? 1.1 : vn.isSelected ? 0.75 : 0.38
    emissRef.current += (emissTarget - emissRef.current) * 0.08

    if (meshRef.current) {
      meshRef.current.position.copy(posRef.current)
      const hoverMult = hovered ? 1.25 : 1
      meshRef.current.scale.setScalar(baseRadius * scaleRef.current * hoverMult)
      ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissRef.current
    }
  })

  const labelOffset = baseRadius + 0.35
  const fontSize = vn.level === 1 ? '11px' : '10px'

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false) }}
        onClick={(e) => {
          e.stopPropagation()
          onNodeClick(vn.id, vn.level, vn.x, vn.y)
        }}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={vn.pat.color}
          emissive={vn.pat.color}
          emissiveIntensity={0.38}
          metalness={0.15}
          roughness={0.25}
          toneMapped={false}
        />
      </mesh>

      {/* Label — positioned at final node location */}
      <Html
        position={[vn.x + labelOffset + 0.2, vn.y, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="tree-label" style={{
          color: vn.isSelected ? '#ffffff' : vn.pat.color,
          fontSize,
          fontWeight: vn.isSelected ? 700 : 600,
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
          whiteSpace: 'nowrap',
          textShadow: `0 0 10px ${vn.pat.color}cc, 0 0 4px ${vn.pat.color}66`,
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>
          {vn.pat.label}
        </div>
      </Html>
    </group>
  )
}

// ── Root node with pulse ring ─────────────────────────────
function RootOrb({ onRootClick, isExpanded }: { onRootClick: () => void; isExpanded: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const t = useRef(0)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    t.current += delta
    if (ringRef.current) {
      ringRef.current.rotation.z = t.current * 0.4
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(t.current * 1.5) * 0.15
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t.current * 1.2) * 0.04
      glowRef.current.scale.setScalar(s)
      ;(glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(t.current * 1.2) * 0.2
    }
  })

  // suppress unused warning
  void hovered

  return (
    <group>
      {/* Glow sphere */}
      <mesh
        ref={glowRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onRootClick() }}
      >
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6}
          metalness={0.05} roughness={0.1} toneMapped={false}
        />
      </mesh>

      {/* Rotating halo ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[1.55, 1.72, 60]} />
        <meshBasicMaterial
          color="#aaccff" transparent opacity={0.3}
          blending={THREE.AdditiveBlending} depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      <Html position={[0, -1.9, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#c8d8ff',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
          whiteSpace: 'nowrap',
          textShadow: '0 0 12px #88aaff, 0 0 6px #6688ff',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          {isExpanded ? 'DSA Patterns' : '⬡ Click to explore'}
        </div>
      </Html>
    </group>
  )
}

// ── Main component ────────────────────────────────────────
export function TreeExplorer({ formingT }: { formingT: number }) {
  const router = useRouter()
  const setCameraTarget = useGraphStore(s => s.setCameraTarget)
  const [expandedPath, setExpandedPath] = useState<string[]>([])
  const [ripples, setRipples] = useState<{ id: number; color: string; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  const visibleNodes = useMemo(
    () => computeVisibleNodes(expandedPath),
    [expandedPath]
  )

  function spawnRipple(color: string, x: number, y: number) {
    const id = rippleId.current++
    setRipples(r => [...r, { id, color, x, y }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700)
  }

  function handleNodeClick(nodeId: string, nodeLevel: number, nodeX: number, nodeY: number) {
    const pat = PATTERNS.find(p => p.id === nodeId)
    if (!pat) return

    // Leaf node: navigate to pattern page
    if (pat.childIds.length === 0) {
      router.push(`/pattern/${nodeId}`)
      return
    }

    const newPath = [...expandedPath.slice(0, nodeLevel), nodeId]
    setExpandedPath(newPath)
    spawnRipple(pat.color, nodeX, nodeY)

    // Pan camera: center between current node and next level
    const nextLevelX = (nodeLevel + 1) * LEVEL_GAP
    const camX = (nodeX + nextLevelX) / 2
    const camY = nodeY * 0.4
    setCameraTarget(new THREE.Vector3(camX, camY, 60))
  }

  function handleRootClick() {
    if (expandedPath.length === 0) {
      setExpandedPath(['root'])
      spawnRipple('#ffffff', 0, 0)
      setCameraTarget(new THREE.Vector3(LEVEL_GAP * 0.5, 0, 60))
    }
  }

  // Don't render until cryptex phase is done
  if (formingT < 0.01) return null

  return (
    <group>
      {/* Root orb */}
      <RootOrb onRootClick={handleRootClick} isExpanded={expandedPath.length > 0} />

      {/* Edges */}
      {visibleNodes
        .filter(n => n.parentId !== null)
        .map(n => {
          const parent = visibleNodes.find(p => p.id === n.parentId)
          if (!parent) return null
          return (
            <TreeEdge
              key={`edge-${n.id}`}
              from={parent}
              to={n}
              color={n.pat.color}
            />
          )
        })}

      {/* Nodes (skip root — rendered separately as RootOrb) */}
      {visibleNodes
        .filter(n => n.id !== 'root')
        .map(n => (
          <TreeNode
            key={n.id}
            vn={n}
            onNodeClick={handleNodeClick}
          />
        ))}

      {/* Click ripples */}
      {ripples.map(rp => (
        <NodeRipple key={rp.id} color={rp.color} x={rp.x} y={rp.y} />
      ))}
    </group>
  )
}
