'use client'
import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { PATTERNS, type PatternNode } from '@/data/patterns'
import { useGraphStore } from '@/hooks/useGraphStore'

const CATEGORIES = PATTERNS.filter(p => p.depth === 1)
const CARD_W = 6.4   // Three.js units wide
const CARD_H = 4.2   // Three.js units tall
const COL_GAP = 8.0  // center-to-center spacing x
const ROW_GAP = 5.6  // center-to-center spacing y
const TEX_W = 768
const TEX_H = 504

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  cat: PatternNode,
  children: PatternNode[],
  total: number,
  hovered: boolean,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h)
  const [r, g, b] = hexToRgb(cat.color)
  const pad = 24

  // — Background —
  const bgGrad = ctx.createLinearGradient(0, 0, w * 0.7, h)
  bgGrad.addColorStop(0, `rgba(${r},${g},${b},${hovered ? 0.18 : 0.1})`)
  bgGrad.addColorStop(1, 'rgba(4,4,12,0.97)')
  ctx.fillStyle = bgGrad
  ctx.beginPath()
  // @ts-ignore
  ctx.roundRect(0, 0, w, h, 18)
  ctx.fill()

  // — Border —
  ctx.strokeStyle = hovered ? cat.color : `rgba(${r},${g},${b},0.45)`
  ctx.lineWidth = hovered ? 2.5 : 1.5
  ctx.beginPath()
  // @ts-ignore
  ctx.roundRect(0, 0, w, h, 18)
  ctx.stroke()

  // — Top accent bar —
  const barGrad = ctx.createLinearGradient(0, 0, w * 0.6, 0)
  barGrad.addColorStop(0, cat.color)
  barGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = barGrad
  ctx.beginPath()
  // @ts-ignore
  ctx.roundRect(pad, 18, w * 0.55, 3, 2)
  ctx.fill()

  // — Watermark letter —
  ctx.save()
  ctx.font = `900 200px system-ui,-apple-system,sans-serif`
  ctx.fillStyle = `rgba(${r},${g},${b},${hovered ? 0.08 : 0.05})`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(cat.label[0].toUpperCase(), w - 10, h + 20)
  ctx.restore()

  // — Badge + Category name —
  // Badge box
  ctx.fillStyle = `rgba(${r},${g},${b},0.2)`
  ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`
  ctx.lineWidth = 1
  ctx.beginPath()
  // @ts-ignore
  ctx.roundRect(pad, 36, 36, 36, 9)
  ctx.fill()
  ctx.stroke()
  // Badge letter
  ctx.fillStyle = cat.color
  ctx.font = `800 18px system-ui,-apple-system,sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cat.label[0].toUpperCase(), pad + 18, 36 + 18)

  // Category name
  ctx.fillStyle = hovered ? '#ffffff' : '#e8e8f8'
  ctx.font = `700 26px system-ui,-apple-system,sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const name = cat.label.length > 18 ? cat.label.slice(0, 17) + '…' : cat.label
  ctx.fillText(name, pad + 46, 36 + 18)

  // — Sub-pattern tags —
  let tx = pad
  let ty = 100
  const tagFont = '500 15px monospace'
  ctx.font = tagFont
  children.slice(0, 4).forEach(child => {
    const label = child.label.length > 14 ? child.label.slice(0, 13) + '…' : child.label
    const tw = ctx.measureText(label).width + 18
    if (tx + tw > w - pad) { tx = pad; ty += 30 }
    // Tag bg
    ctx.fillStyle = `rgba(${r},${g},${b},0.12)`
    ctx.strokeStyle = `rgba(${r},${g},${b},0.28)`
    ctx.lineWidth = 1
    ctx.beginPath()
    // @ts-ignore
    ctx.roundRect(tx, ty, tw, 22, 5)
    ctx.fill()
    ctx.stroke()
    // Tag text
    ctx.fillStyle = `rgba(${r},${g},${b},0.9)`
    ctx.font = tagFont
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, tx + 9, ty + 11)
    tx += tw + 8
  })

  // — Bottom section —
  const bottomY = h - 50
  // Divider
  const divGrad = ctx.createLinearGradient(pad, 0, w - pad, 0)
  divGrad.addColorStop(0, `rgba(${r},${g},${b},${hovered ? 0.5 : 0.25})`)
  divGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = divGrad
  ctx.fillRect(pad, bottomY, w - pad * 2, 1)

  // Pattern count
  ctx.fillStyle = `rgba(${r},${g},${b},0.7)`
  ctx.font = `500 15px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${total} PATTERNS`, pad, bottomY + 22)

  // Dot indicators
  const dots = Math.min(5, Math.ceil(total / 5))
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.arc(w - pad - (4 - i) * 12, bottomY + 22, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = i < dots
      ? (hovered ? cat.color : `rgba(${r},${g},${b},0.7)`)
      : `rgba(${r},${g},${b},0.15)`
    ctx.fill()
  }

  // — Hover gloss overlay —
  if (hovered) {
    const gloss = ctx.createLinearGradient(0, 0, 0, h * 0.5)
    gloss.addColorStop(0, 'rgba(255,255,255,0.07)')
    gloss.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gloss
    ctx.beginPath()
    // @ts-ignore
    ctx.roundRect(0, 0, w, h * 0.5, [18, 18, 0, 0])
    ctx.fill()
  }

  // — Glow border pulse (brighter corners) —
  if (hovered) {
    const cornerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 80)
    cornerGlow.addColorStop(0, `rgba(${r},${g},${b},0.3)`)
    cornerGlow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = cornerGlow
    ctx.fillRect(0, 0, w, h)
  }
}

function countDescendants(id: string): number {
  const node = PATTERNS.find(p => p.id === id)
  if (!node || node.childIds.length === 0) return 0
  return node.childIds.reduce((sum, cid) => sum + 1 + countDescendants(cid), 0)
}

function getCardPos(index: number): THREE.Vector3 {
  const col = index % 4
  const row = Math.floor(index / 4)
  const x = (col - 1.5) * COL_GAP
  const y = (1.5 - row) * ROW_GAP
  const z = -Math.pow(Math.abs(col - 1.5), 1.5) * 1.8
  return new THREE.Vector3(x, y, z)
}

function getCardRotY(index: number): number {
  const col = index % 4
  return -(col - 1.5) * 0.1
}

// ---- Single card component ----
interface CardProps {
  cat: PatternNode
  index: number
  formingT: number
}

function HologramCard({ cat, index, formingT }: CardProps) {
  const router = useRouter()
  const setFocused = useGraphStore(s => s.setFocused)
  const setCameraTarget = useGraphStore(s => s.setCameraTarget)
  const meshRef = useRef<THREE.Mesh>(null!)
  const [isHovered, setIsHovered] = useState(false)

  const basePos = useMemo(() => getCardPos(index), [index])
  const rotY = useMemo(() => getCardRotY(index), [index])

  // Stagger per row
  const row = Math.floor(index / 4)
  const staggerStart = 0.05 + row * 0.14

  // Canvas texture
  const { texture, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = TEX_W
    canvas.height = TEX_H
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return { texture, canvas }
  }, [])

  const directChildren = useMemo(() => PATTERNS.filter(p => p.parentId === cat.id), [cat.id])
  const total = useMemo(() => countDescendants(cat.id), [cat.id])

  // Redraw canvas when hover changes
  useEffect(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCard(ctx, cat, directChildren, total, isHovered, TEX_W, TEX_H)
    texture.needsUpdate = true
  }, [isHovered, cat, directChildren, total, canvas, texture])

  // Smooth scale and z animation
  const scaleRef = useRef(0)
  const zRef = useRef(basePos.z)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const localT = Math.max(0, Math.min(1, (formingT - staggerStart) / 0.3))
    const targetScale = localT
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, delta * 8)

    const targetZ = basePos.z + (isHovered ? 2.5 : 0)
    zRef.current += (targetZ - zRef.current) * Math.min(1, delta * 10)

    meshRef.current.scale.setScalar(scaleRef.current)
    meshRef.current.position.z = zRef.current
  })

  return (
    <mesh
      ref={meshRef}
      position={[basePos.x, basePos.y, basePos.z]}
      rotation={[0, rotY, 0]}
      onPointerEnter={(e) => { e.stopPropagation(); setIsHovered(true) }}
      onPointerLeave={(e) => { e.stopPropagation(); setIsHovered(false) }}
      onClick={(e) => {
        e.stopPropagation()
        setFocused(cat.id)
        setCameraTarget(new THREE.Vector3(basePos.x, basePos.y, basePos.z + 14))
        router.push(`/pattern/${cat.id}`)
      }}
    >
      <planeGeometry args={[CARD_W, CARD_H]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

// ---- Main export ----
interface Props {
  formingT: number
}

export function HologramCards({ formingT }: Props) {
  return (
    <>
      {CATEGORIES.map((cat, i) => (
        <HologramCard key={cat.id} cat={cat} index={i} formingT={formingT} />
      ))}
    </>
  )
}
