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
  // Build a map from id → PatternNode for quick lookup
  const patternById = new Map<string, PatternNode>()
  PATTERNS.forEach(p => patternById.set(p.id, p))

  // Build a map from parentId → children
  const childrenOf = new Map<string, PatternNode[]>()
  PATTERNS.forEach(p => {
    if (p.parentId != null) {
      if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, [])
      childrenOf.get(p.parentId)!.push(p)
    }
  })

  // Depth 1 category nodes (children of root), sorted by their order in childIds of root
  const root = patternById.get('root')!
  const depth1Ids = root.childIds
  const depth1Count = depth1Ids.length // 16

  // Map to store computed positions
  const posMap = new Map<string, { x: number; y: number; z: number; angle: number }>()

  // Root at origin
  posMap.set('root', { x: 0, y: 0, z: 0, angle: 0 })

  // Depth 1: evenly spaced ring at radius 18, alternating z ±2
  depth1Ids.forEach((id, i) => {
    const angle = (i / depth1Count) * 2 * Math.PI
    const r = 18
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    const z = (i % 2 === 0 ? 1 : -1) * 2
    posMap.set(id, { x, y, z, angle })
  })

  // BFS to compute depth 2, 3, 4 positions
  // For each depth, spread children within ±(sectorWidth * 0.4) of parent's angle
  // Radii: depth2=36, depth3=54, depth4=68
  const radii: Record<number, number> = { 2: 36, 3: 54, 4: 68 }
  const sectorWidth = (2 * Math.PI) / depth1Count

  // Process depth 2 (children of depth-1 nodes)
  depth1Ids.forEach((d1Id) => {
    const parentPos = posMap.get(d1Id)!
    const children = childrenOf.get(d1Id) ?? []
    const n = children.length
    if (n === 0) return
    const halfArc = sectorWidth * 0.4

    children.forEach((child, i) => {
      const angle =
        n === 1
          ? parentPos.angle
          : parentPos.angle + halfArc * (2 * (i / (n - 1)) - 1)
      const r = radii[2]
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      const z = parentPos.z * 0.5 + (i % 2 === 0 ? 0.5 : -0.5)
      posMap.set(child.id, { x, y, z, angle })
    })
  })

  // Process depth 3
  PATTERNS.filter(p => p.depth === 2).forEach(d2Node => {
    const parentPos = posMap.get(d2Node.id)
    if (!parentPos) return
    const children = childrenOf.get(d2Node.id) ?? []
    const n = children.length
    if (n === 0) return
    const halfArc = sectorWidth * 0.28

    children.forEach((child, i) => {
      const angle =
        n === 1
          ? parentPos.angle
          : parentPos.angle + halfArc * (2 * (i / (n - 1)) - 1)
      const r = radii[3]
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      const z = parentPos.z * 0.3
      posMap.set(child.id, { x, y, z, angle })
    })
  })

  // Process depth 4
  PATTERNS.filter(p => p.depth === 3).forEach(d3Node => {
    const parentPos = posMap.get(d3Node.id)
    if (!parentPos) return
    const children = childrenOf.get(d3Node.id) ?? []
    const n = children.length
    if (n === 0) return
    const halfArc = sectorWidth * 0.18

    children.forEach((child, i) => {
      const angle =
        n === 1
          ? parentPos.angle
          : parentPos.angle + halfArc * (2 * (i / (n - 1)) - 1)
      const r = radii[4]
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      const z = 0
      posMap.set(child.id, { x, y, z, angle })
    })
  })

  // Build final nodes array
  const nodes: GraphNode[] = PATTERNS.map((p: PatternNode, idx: number) => {
    const pos = posMap.get(p.id) ?? { x: 0, y: 0, z: 0 }
    return {
      id:        p.id,
      label:     p.label,
      color:     p.color,
      depth:     p.depth,
      isLeaf:    p.isLeaf,
      patternId: p.id,
      x:  pos.x,
      y:  pos.y,
      z:  pos.z,
      vx: 0,
      vy: 0,
      vz: 0,
      index: idx,
    }
  })

  // Build edges
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

  _nodes = nodes
  _edges = edges
  return Promise.resolve({ nodes, edges })
}

export function nodePosition(node: GraphNode): THREE.Vector3 {
  return new THREE.Vector3(node.x ?? 0, node.y ?? 0, node.z ?? 0)
}
