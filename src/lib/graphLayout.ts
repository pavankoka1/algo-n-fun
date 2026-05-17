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

  // @ts-expect-error no types
  const d3 = await import('d3-force-3d') as any
  const sim = d3.forceSimulation(nodes, 3)
    .force('link',   d3.forceLink(edges).id((d: GraphNode) => d.id).distance(9).strength(0.35))
    .force('charge', d3.forceManyBody().strength(-110))
    .force('center', d3.forceCenter(0, 0, 0))
    .force('z',      d3.forceZ(0).strength(0.08))
    .alphaDecay(0.035)

  let ticks = 0
  while (sim.alpha() > sim.alphaMin() && ticks < 300) {
    sim.tick(); ticks++
  }

  _nodes = nodes
  _edges = edges
  return { nodes, edges }
}

export function nodePosition(node: GraphNode): THREE.Vector3 {
  return new THREE.Vector3(node.x ?? 0, node.y ?? 0, node.z ?? 0)
}
