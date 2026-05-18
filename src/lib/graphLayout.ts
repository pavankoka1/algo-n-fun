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
  const patternById = new Map<string, PatternNode>()
  PATTERNS.forEach(p => patternById.set(p.id, p))

  const childrenOf = new Map<string, PatternNode[]>()
  PATTERNS.forEach(p => {
    if (p.parentId != null) {
      if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, [])
      childrenOf.get(p.parentId)!.push(p)
    }
  })

  const posMap = new Map<string, { x: number; y: number; z: number }>()

  // Root at origin
  posMap.set('root', { x: 0, y: 0, z: 0 })

  // 16 category cluster centers in a ring at r=22
  const root = patternById.get('root')!
  const depth1Ids = root.childIds // 16 categories
  depth1Ids.forEach((id, i) => {
    const angle = (i / depth1Ids.length) * 2 * Math.PI
    posMap.set(id, {
      x: Math.cos(angle) * 22,
      y: Math.sin(angle) * 22,
      z: (i % 3 === 0 ? 1.5 : i % 3 === 1 ? -1.5 : 0) // gentle z variation
    })
  })

  // Depth-2 nodes: orbit their category at radius 7-8 (local ring)
  depth1Ids.forEach(d1Id => {
    const parent = posMap.get(d1Id)!
    const children = childrenOf.get(d1Id) ?? []
    const n = children.length
    children.forEach((child, i) => {
      const localAngle = (i / Math.max(n, 1)) * 2 * Math.PI
      const r = 7.5 + (i % 2) * 0.8  // slight radius variation
      posMap.set(child.id, {
        x: parent.x + Math.cos(localAngle) * r,
        y: parent.y + Math.sin(localAngle) * r,
        z: parent.z + (i % 2 === 0 ? 1 : -1) * 0.8
      })
    })
  })

  // Depth-3: orbit their depth-2 parent at radius 3.5
  PATTERNS.filter(p => p.depth === 2).forEach(d2Node => {
    const parent = posMap.get(d2Node.id)
    if (!parent) return
    const children = childrenOf.get(d2Node.id) ?? []
    const n = children.length
    children.forEach((child, i) => {
      const localAngle = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 4
      posMap.set(child.id, {
        x: parent.x + Math.cos(localAngle) * 3.5,
        y: parent.y + Math.sin(localAngle) * 3.5,
        z: parent.z + (i % 2 === 0 ? 0.5 : -0.5)
      })
    })
  })

  // Depth-4: orbit their depth-3 parent at radius 1.8
  PATTERNS.filter(p => p.depth === 3).forEach(d3Node => {
    const parent = posMap.get(d3Node.id)
    if (!parent) return
    const children = childrenOf.get(d3Node.id) ?? []
    const n = children.length
    children.forEach((child, i) => {
      const localAngle = (i / Math.max(n, 1)) * 2 * Math.PI + Math.PI / 6
      posMap.set(child.id, {
        x: parent.x + Math.cos(localAngle) * 1.8,
        y: parent.y + Math.sin(localAngle) * 1.8,
        z: parent.z
      })
    })
  })

  const nodes: GraphNode[] = PATTERNS.map((p, idx) => {
    const pos = posMap.get(p.id) ?? { x: 0, y: 0, z: 0 }
    return {
      id: p.id, label: p.label, color: p.color,
      depth: p.depth, isLeaf: p.isLeaf, patternId: p.id,
      x: pos.x, y: pos.y, z: pos.z,
      vx: 0, vy: 0, vz: 0, index: idx,
    }
  })

  const edges: GraphEdge[] = []
  PATTERNS.forEach(p => {
    p.childIds.forEach(cid => edges.push({ source: p.id, target: cid }))
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
