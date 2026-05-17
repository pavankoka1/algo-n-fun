# algo-n-fun — Phase 2: 3D Graph + Cryptex

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full 3D force graph with cryptex landing sequence. By end of this phase: opening the site shows the Da Vinci cryptex spinning, it unlocks, 182 particles swarm into the force graph, and nodes are interactive (hover + click to fly-to + children explode + Browse badge).

**Architecture:** Three.js canvas via `@react-three/fiber` renders in a fixed full-screen container behind the Next.js UI. `d3-force-3d` drives the physics simulation — computed once and cached. `InstancedMesh` renders all 182 nodes in one draw call. Post-processing `UnrealBloomPass` adds the glow. Camera fly-to on node click uses a `useFrame` lerp tween.

**Prerequisites:** Phase 1 complete. `npm install` run. GLB at `public/models/da_vinci_code_cryptex.glb`.

**Tech Stack:** three 0.175, @react-three/fiber 9, @react-three/drei 10, @react-three/postprocessing, d3-force-3d, zustand

---

### Task 6: Force simulation — physics layout engine

**Files:**
- Create: `src/lib/graphLayout.ts`
- Create: `src/hooks/useGraphStore.ts`

- [ ] **Step 1: Create src/lib/graphLayout.ts**

```typescript
// src/lib/graphLayout.ts
import { PATTERNS, type PatternNode } from '@/data/patterns'
import * as THREE from 'three'

export interface GraphNode {
  id: string
  label: string
  color: string
  depth: number
  isLeaf: boolean
  patternId: string
  // d3-force-3d mutates these:
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  index?: number
}

export interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
}

let _nodes: GraphNode[] | null = null
let _edges: GraphEdge[] | null = null

function buildGraph() {
  const nodes: GraphNode[] = PATTERNS.map((p: PatternNode) => ({
    id:        p.id,
    label:     p.label,
    color:     p.color,
    depth:     p.depth,
    isLeaf:    p.isLeaf,
    patternId: p.id,
    // initial positions — spread by depth ring
    x: (Math.random() - 0.5) * 60,
    y: (Math.random() - 0.5) * 60,
    z: (Math.random() - 0.5) * 30,
    vx: 0, vy: 0, vz: 0,
  }))

  const edges: GraphEdge[] = []
  PATTERNS.forEach(p => {
    p.childIds.forEach(cid => {
      edges.push({ source: p.id, target: cid })
    })
  })

  return { nodes, edges }
}

export async function runSimulation(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  if (_nodes && _edges) return { nodes: _nodes, edges: _edges }

  const { nodes, edges } = buildGraph()

  const { forceSimulation, forceLink, forceManyBody, forceCenter, forceZ } =
    await import('d3-force-3d')

  await new Promise<void>(resolve => {
    const sim = forceSimulation(nodes, 3)
      .force('link',   forceLink(edges).id((d: GraphNode) => d.id).distance(9).strength(0.35))
      .force('charge', forceManyBody().strength(-110))
      .force('center', forceCenter(0, 0, 0))
      .force('z',      forceZ(0).strength(0.08))
      .alphaDecay(0.035)
      .on('end', () => resolve())

    // Run synchronously for up to 300 ticks then resolve anyway
    let ticks = 0
    while (sim.alpha() > sim.alphaMin() && ticks < 300) {
      sim.tick(); ticks++
    }
    resolve()
  })

  _nodes = nodes
  _edges = edges
  return { nodes, edges }
}

export function nodePosition(node: GraphNode): THREE.Vector3 {
  return new THREE.Vector3(node.x ?? 0, node.y ?? 0, node.z ?? 0)
}
```

- [ ] **Step 2: Create src/hooks/useGraphStore.ts**

```typescript
// src/hooks/useGraphStore.ts
import { create } from 'zustand'
import * as THREE from 'three'

interface GraphState {
  focusedNodeId: string | null
  isAnimating: boolean
  cameraTarget: THREE.Vector3
  phase: 'cryptex' | 'dissolve' | 'forming' | 'ready'
  setFocused: (id: string | null) => void
  setAnimating: (v: boolean) => void
  setCameraTarget: (v: THREE.Vector3) => void
  setPhase: (p: GraphState['phase']) => void
}

export const useGraphStore = create<GraphState>(set => ({
  focusedNodeId: null,
  isAnimating: false,
  cameraTarget: new THREE.Vector3(0, 0, 45),
  phase: 'cryptex',
  setFocused:       id  => set({ focusedNodeId: id }),
  setAnimating:     v   => set({ isAnimating: v }),
  setCameraTarget:  v   => set({ cameraTarget: v }),
  setPhase:         p   => set({ phase: p }),
}))
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no errors in `src/lib/graphLayout.ts` or `src/hooks/useGraphStore.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/graphLayout.ts src/hooks/useGraphStore.ts
git commit -m "feat: force simulation layout and graph state store"
```

---

### Task 7: Three.js canvas — GraphCanvas wrapper

**Files:**
- Create: `src/components/graph/GraphCanvas.tsx`

- [ ] **Step 1: Create GraphCanvas.tsx**

```tsx
// src/components/graph/GraphCanvas.tsx
'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import { GraphScene } from './GraphScene'

export function GraphCanvas() {
  return (
    <div className="pointer-events-auto fixed inset-0" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 55], fov: 70, near: 0.5, far: 600 }}
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/components/graph/GraphCanvas.tsx
git commit -m "feat: Three.js canvas wrapper with ACES tone mapping and fog"
```

---

### Task 8: CryptexModel — GLB loader + landing animation

**Files:**
- Create: `src/components/graph/CryptexModel.tsx`

- [ ] **Step 1: Create CryptexModel.tsx**

```tsx
// src/components/graph/CryptexModel.tsx
'use client'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGraphStore } from '@/hooks/useGraphStore'

useGLTF.preload('/models/da_vinci_code_cryptex.glb')

export function CryptexModel() {
  const { scene } = useGLTF('/models/da_vinci_code_cryptex.glb')
  const groupRef  = useRef<THREE.Group>(null)
  const shakeRef  = useRef(0)
  const phase     = useGraphStore(s => s.phase)
  const setPhase  = useGraphStore(s => s.setPhase)
  const opacity   = useRef(1)
  const spinSpeed = useRef(0.002)

  // Override materials for a dramatic look
  useEffect(() => {
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const mat = new THREE.MeshStandardMaterial({
          color:      new THREE.Color(0x1a1000),
          metalness:  0.92,
          roughness:  0.18,
          emissive:   new THREE.Color(0x100800),
          emissiveIntensity: 0.4,
        })
        mesh.material = mat
        mesh.castShadow = false
      }
    })
  }, [scene])

  // Trigger unlock after 2.5s
  useEffect(() => {
    if (phase !== 'cryptex') return
    const t = setTimeout(() => {
      spinSpeed.current = 0.18   // fast spin
      shakeRef.current  = 1
      setTimeout(() => {
        spinSpeed.current = 0
        shakeRef.current  = 0
        setPhase('dissolve')
      }, 500)
    }, 2500)
    return () => clearTimeout(t)
  }, [phase, setPhase])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    if (phase === 'cryptex') {
      groupRef.current.rotation.y += spinSpeed.current
      if (shakeRef.current > 0) {
        groupRef.current.position.x = (Math.random() - 0.5) * 0.18
        groupRef.current.position.y = (Math.random() - 0.5) * 0.18
      } else {
        groupRef.current.position.x *= 0.85
        groupRef.current.position.y *= 0.85
      }
    }

    if (phase === 'dissolve') {
      opacity.current = Math.max(0, opacity.current - dt * 1.8)
      groupRef.current.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
          mat.transparent = true
          mat.opacity = opacity.current
        }
      })
      if (opacity.current <= 0) setPhase('forming')
    }
  })

  if (phase === 'forming' || phase === 'ready') return null

  return (
    <group ref={groupRef} scale={[0.9, 0.9, 0.9]}>
      {/* Warm gold key light */}
      <pointLight position={[4, 6, 3]}  intensity={3.5} color="#FFD700" distance={30} />
      {/* Cool cyan rim */}
      <pointLight position={[-5, -3, -4]} intensity={1.8} color="#00E5FF" distance={25} />
      {/* Subtle fill */}
      <ambientLight intensity={0.3} />
      <primitive object={scene} />
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/graph/CryptexModel.tsx
git commit -m "feat: CryptexModel — GLB loader, dramatic materials, unlock spin + dissolve"
```

---

### Task 9: NodeMesh — InstancedMesh for all 182 nodes

**Files:**
- Create: `src/components/graph/NodeMesh.tsx`
- Create: `src/hooks/useGraphInteraction.ts`

- [ ] **Step 1: Create src/hooks/useGraphInteraction.ts**

```typescript
// src/hooks/useGraphInteraction.ts
import { useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'
import { useGraphStore } from './useGraphStore'

export function useGraphInteraction(nodes: GraphNode[]) {
  const { camera, raycaster, pointer } = useThree()
  const setFocused     = useGraphStore(s => s.setFocused)
  const setCameraTarget = useGraphStore(s => s.setCameraTarget)
  const hoveredIdx     = useRef<number>(-1)

  const getHitNode = useCallback((mesh: THREE.InstancedMesh): number => {
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObject(mesh)
    return hits.length > 0 ? hits[0].instanceId ?? -1 : -1
  }, [camera, raycaster, pointer])

  const onPointerMove = useCallback((mesh: THREE.InstancedMesh) => {
    hoveredIdx.current = getHitNode(mesh)
  }, [getHitNode])

  const onPointerClick = useCallback((mesh: THREE.InstancedMesh) => {
    const idx = getHitNode(mesh)
    if (idx < 0 || idx >= nodes.length) return
    const node = nodes[idx]
    setFocused(node.id)
    const target = new THREE.Vector3(node.x, node.y, node.z + 14)
    setCameraTarget(target)
  }, [getHitNode, nodes, setFocused, setCameraTarget])

  return { hoveredIdx, onPointerMove, onPointerClick }
}
```

- [ ] **Step 2: Create src/components/graph/NodeMesh.tsx**

```tsx
// src/components/graph/NodeMesh.tsx
'use client'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { GraphNode } from '@/lib/graphLayout'
import { useGraphStore } from '@/hooks/useGraphStore'
import { useGraphInteraction } from '@/hooks/useGraphInteraction'

interface Props {
  nodes: GraphNode[]
  formingT: number // 0→1 as graph assembles
}

const SPHERE_GEO = new THREE.SphereGeometry(0.5, 14, 14)

export function NodeMesh({ nodes, formingT }: Props) {
  const meshRef    = useRef<THREE.InstancedMesh>(null!)
  const focusedId  = useGraphStore(s => s.focusedNodeId)
  const { hoveredIdx, onPointerMove, onPointerClick } = useGraphInteraction(nodes)

  const colors = useMemo(() => {
    const arr = new Float32Array(nodes.length * 3)
    nodes.forEach((n, i) => {
      const c = new THREE.Color(n.color)
      arr[i * 3 + 0] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    })
    return arr
  }, [nodes])

  useEffect(() => {
    if (!meshRef.current) return
    const colorAttr = new THREE.InstancedBufferAttribute(colors, 3)
    meshRef.current.instanceColor = colorAttr
  }, [colors])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const scaleTargets = useRef(new Float32Array(nodes.length).fill(1))

  useFrame(() => {
    if (!meshRef.current) return
    nodes.forEach((n, i) => {
      const isHovered = hoveredIdx.current === i
      const isFocused = focusedId === n.id
      const baseScale = n.isLeaf ? 0.56 : (n.depth === 1 ? 1.1 : 0.8)
      const targetScale = baseScale * (isHovered || isFocused ? 1.45 : 1) * formingT
      scaleTargets.current[i] += (targetScale - scaleTargets.current[i]) * 0.12

      dummy.position.set(n.x, n.y, n.z)
      dummy.scale.setScalar(scaleTargets.current[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[SPHERE_GEO, undefined, nodes.length]}
      onPointerMove={() => onPointerMove(meshRef.current)}
      onClick={() => onPointerClick(meshRef.current)}
    >
      <meshStandardMaterial
        vertexColors
        emissiveIntensity={0.85}
        emissive={new THREE.Color(1, 1, 1)}
        metalness={0.1}
        roughness={0.35}
      />
    </instancedMesh>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/graph/NodeMesh.tsx src/hooks/useGraphInteraction.ts
git commit -m "feat: NodeMesh InstancedMesh + raycasting interaction hook"
```

---

### Task 10: EdgeLines — luminescent connections

**Files:**
- Create: `src/components/graph/EdgeLines.tsx`

- [ ] **Step 1: Create EdgeLines.tsx**

```tsx
// src/components/graph/EdgeLines.tsx
'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { GraphNode, GraphEdge } from '@/lib/graphLayout'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  formingT: number
}

export function EdgeLines({ nodes, edges, formingT }: Props) {
  const { geometry, material } = useMemo(() => {
    const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]))
    const positions: number[] = []
    const edgeColors: number[] = []

    edges.forEach(e => {
      const src = nodeById[typeof e.source === 'string' ? e.source : (e.source as GraphNode).id]
      const tgt = nodeById[typeof e.target === 'string' ? e.target : (e.target as GraphNode).id]
      if (!src || !tgt) return
      positions.push(src.x, src.y, src.z, tgt.x, tgt.y, tgt.z)
      const c = new THREE.Color(src.color)
      edgeColors.push(c.r, c.g, c.b, c.r * 0.45, c.g * 0.45, c.b * 0.45)
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(edgeColors, 3))

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28 * formingT,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return { geometry: geo, material: mat }
  }, [nodes, edges, formingT])

  return <lineSegments geometry={geometry} material={material} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/graph/EdgeLines.tsx
git commit -m "feat: EdgeLines with additive blending and vertex colors"
```

---

### Task 11: GraphScene — assemble everything + lighting + bloom + camera

**Files:**
- Create: `src/components/graph/GraphScene.tsx`

- [ ] **Step 1: Create GraphScene.tsx**

```tsx
// src/components/graph/GraphScene.tsx
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
  const idleTimer      = useRef<ReturnType<typeof setTimeout>>()
  const autoRotateRef  = useRef(true)
  const autoRotateY    = useRef(0)
  const controlsRef    = useRef<any>(null)

  camTargetRef.current = cameraTarget

  // Load simulation when phase becomes 'forming'
  useEffect(() => {
    if (phase !== 'forming') return
    runSimulation().then(({ nodes: n, edges: e }) => {
      setNodes(n); setEdges(e); setPhase('ready')
    })
  }, [phase, setPhase])

  // Animate formingT 0→1 when ready
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
    // Camera fly-to
    const tgt = camTargetRef.current
    camera.position.lerp(tgt, 0.045)
    if (controlsRef.current) controlsRef.current.target.lerp(
      new THREE.Vector3(tgt.x, tgt.y, 0), 0.045
    )

    // Auto-rotate when idle
    if (autoRotateRef.current && phase === 'ready') {
      autoRotateY.current += 0.0008
      if (controlsRef.current) {
        controlsRef.current.object.position.x =
          Math.sin(autoRotateY.current) * camera.position.distanceTo(new THREE.Vector3())
        controlsRef.current.object.position.z =
          Math.cos(autoRotateY.current) * camera.position.distanceTo(new THREE.Vector3())
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
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <hemisphereLight color="#e0e8ff" groundColor="#020209" intensity={0.5} />
      <directionalLight position={[15, 20, 10]} intensity={0.9} />
      <directionalLight position={[-12, 8, -8]} intensity={0.45} color="#c4b5fd" />

      {/* Cryptex landing */}
      <CryptexModel />

      {/* Graph (renders after forming) */}
      {nodes.length > 0 && (
        <>
          <NodeMesh nodes={nodes} formingT={formingT} />
          <EdgeLines nodes={nodes} edges={edges} formingT={formingT} />
        </>
      )}

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        maxDistance={90}
        minDistance={6}
        onStart={pauseAutoRotate}
        enableDamping
        dampingFactor={0.08}
      />

      {/* Post-processing */}
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
```

- [ ] **Step 2: Mount GraphCanvas in home page**

```tsx
// src/app/page.tsx
import dynamic from 'next/dynamic'

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then(m => m.GraphCanvas),
  { ssr: false }
)

export default function HomePage() {
  return <GraphCanvas />
}
```

- [ ] **Step 3: Start dev server and verify**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev &
sleep 10
```

Open `http://localhost:3000`. Should see:
1. Cryptex GLB spinning on dark void
2. After 2.5s: spin-unlock animation
3. Cryptex fades → 3D force graph appears
4. Nodes glow with bloom
5. Mouse hover enlarges nodes
6. Node click flies camera in

- [ ] **Step 4: Kill server and commit**

```bash
pkill -f "next dev"
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/components/graph/ src/app/page.tsx
git commit -m "feat: complete 3D graph — cryptex landing, force simulation, node mesh, bloom"
```

---

### Task 12: Node tooltip + Browse badge (HTML overlay)

**Files:**
- Create: `src/components/graph/GraphOverlay.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create GraphOverlay.tsx**

```tsx
// src/components/graph/GraphOverlay.tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGraphStore } from '@/hooks/useGraphStore'
import { PATTERN_MAP } from '@/data/patterns'
import { problemsByPattern } from '@/data/problems'

export function GraphOverlay() {
  const focusedId = useGraphStore(s => s.focusedNodeId)
  const setFocused = useGraphStore(s => s.setFocused)
  const router = useRouter()
  const node = focusedId ? PATTERN_MAP[focusedId] : null
  const problems = node ? problemsByPattern(node.id) : []

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(10,10,20,0.92)',
            border: `1px solid ${node.color}30`,
            borderRadius: 16,
            padding: '14px 20px',
            backdropFilter: 'blur(16px)',
            minWidth: 260,
            maxWidth: 360,
            boxShadow: `0 0 32px ${node.color}18`,
          }}
        >
          {/* Node label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              depth {node.depth}
            </span>
            <span style={{ flex: 1 }} />
            <button
              onClick={() => setFocused(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
              aria-label="Close"
            >×</button>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {node.label}
          </h3>

          {problems.length > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12 }}>
              {problems.length} problem{problems.length > 1 ? 's' : ''} curated
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!node.isLeaf && node.childIds?.length > 0 && (
              <button
                onClick={() => router.push(`/pattern/${node.id}`)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1px solid ${node.color}40`,
                  background: `${node.color}12`,
                  color: node.color,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                Browse {node.childIds.length} sub-patterns →
              </button>
            )}
            {node.isLeaf && problems.length > 0 && (
              <button
                onClick={() => router.push(`/pattern/${node.parentId}/${node.id}`)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: node.color,
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                View problems →
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Add GraphOverlay to home page**

```tsx
// src/app/page.tsx
import dynamic from 'next/dynamic'
import { GraphOverlay } from '@/components/graph/GraphOverlay'

const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then(m => m.GraphCanvas),
  { ssr: false }
)

export default function HomePage() {
  return (
    <>
      <GraphCanvas />
      <GraphOverlay />
    </>
  )
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev &
sleep 8
```

Open `http://localhost:3000`. After graph forms, click a node → badge should appear at bottom with node name and "Browse →" button.

- [ ] **Step 4: Kill and commit**

```bash
pkill -f "next dev"
git add src/components/graph/GraphOverlay.tsx src/app/page.tsx
git commit -m "feat: GraphOverlay — node tooltip + Browse/View badge on click"
```

---

**Phase 2 complete.** Cryptex landing → force graph → node interaction → browse badge all working.

Proceed to Phase 3: `docs/superpowers/plans/2026-05-17-algo-n-fun-p3-routes.md`
