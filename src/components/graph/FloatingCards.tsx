'use client'
import { useState } from 'react'
import { Html } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import { PATTERNS, type PatternNode } from '@/data/patterns'

interface Props {
  formingT: number
}

const CATEGORIES = PATTERNS.filter(p => p.depth === 1)

function countDescendants(id: string): number {
  const node = PATTERNS.find(p => p.id === id)
  if (!node || node.childIds.length === 0) return 0
  return node.childIds.reduce((sum, cid) => sum + 1 + countDescendants(cid), 0)
}

function getCardTransform(index: number): { position: [number, number, number]; rotY: number } {
  const col = index % 4
  const row = Math.floor(index / 4)
  const x = (col - 1.5) * 10.5
  const y = (1.5 - row) * 9.2
  const z = -Math.pow(Math.abs(col - 1.5), 1.4) * 2.8
  const rotY = -(col - 1.5) * 0.12
  return { position: [x, y, z], rotY }
}

interface CardProps {
  cat: PatternNode
  localT: number
  position: [number, number, number]
  rotY: number
}

function FloatingCard({ cat, localT, position, rotY }: CardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const directChildren = PATTERNS.filter(p => p.parentId === cat.id).slice(0, 4)
  const total = countDescendants(cat.id)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: ny * 14, y: -nx * 14 })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  const enterY = (1 - localT) * 35
  const cardTransform = isHovered
    ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.07)`
    : 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)'

  return (
    <Html
      position={position}
      rotation={[0, rotY, 0]}
      transform
      occlude={false}
      style={{
        opacity: localT,
        transform: `translateY(${enterY}px)`,
        transition: 'opacity 0.3s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: localT > 0.6 ? 'auto' : 'none',
      }}
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => router.push(`/pattern/${cat.id}`)}
        style={{
          width: '192px',
          height: '138px',
          background: `linear-gradient(135deg, ${cat.color}1e 0%, rgba(5,5,14,0.97) 60%)`,
          border: `1px solid ${isHovered ? cat.color : cat.color + '45'}`,
          borderRadius: '16px',
          padding: '14px 15px 12px',
          cursor: 'pointer',
          boxShadow: isHovered
            ? `0 0 45px ${cat.color}55, 0 0 12px ${cat.color}28, 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)`
            : `0 0 18px ${cat.color}18, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
          transform: cardTransform,
          transition: isHovered
            ? 'box-shadow 0.15s, border-color 0.15s'
            : 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          userSelect: 'none',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          position: 'relative',
          overflow: 'hidden',
        } as React.CSSProperties & { WebkitBackdropFilter: string }}
      >

        {/* Gloss layer — top highlight when hovered */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, rgba(255,255,255,${isHovered ? '0.055' : '0.02'}) 0%, transparent 50%)`,
          borderRadius: '16px',
          pointerEvents: 'none',
          transition: 'background 0.2s',
        }} />

        {/* Row 1: badge + name + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: `${cat.color}22`,
              border: `1px solid ${cat.color}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cat.color,
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'var(--font-geist-sans, sans-serif)',
              flexShrink: 0,
              boxShadow: `0 0 12px ${cat.color}33`,
            }}>
              {cat.label[0]}
            </div>
            <span style={{
              color: '#f0f0ff',
              fontSize: '12.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-geist-sans, sans-serif)',
              letterSpacing: '0.02em',
              lineHeight: 1.25,
            }}>
              {cat.label}
            </span>
          </div>
          <span style={{
            color: cat.color,
            fontSize: '13px',
            lineHeight: 1,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translate(2px, -2px)' : 'translate(0, 0)',
            transition: 'all 0.2s ease',
          }}>↗</span>
        </div>

        {/* Row 2: sub-pattern tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, alignContent: 'flex-start' }}>
          {directChildren.map(child => (
            <span key={child.id} style={{
              background: `${cat.color}14`,
              border: `1px solid ${cat.color}30`,
              borderRadius: '5px',
              padding: '2px 6px',
              fontSize: '9.5px',
              color: `${cat.color}cc`,
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              {child.label}
            </span>
          ))}
        </div>

        {/* Row 3: count + accent bar */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px',
          }}>
            <span style={{
              color: `${cat.color}88`,
              fontSize: '9.5px',
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {total} patterns
            </span>
            <div style={{
              display: 'flex',
              gap: '2px',
              alignItems: 'center',
            }}>
              {[...Array(Math.min(5, Math.ceil(total / 5)))].map((_, i) => (
                <div key={i} style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: cat.color,
                  opacity: isHovered ? 0.9 : 0.4,
                  transition: `opacity 0.15s ${i * 0.04}s`,
                }} />
              ))}
            </div>
          </div>
          <div style={{
            height: '1.5px',
            background: `linear-gradient(90deg, ${cat.color}, ${cat.color}00)`,
            borderRadius: '2px',
            opacity: isHovered ? 0.9 : 0.45,
            transition: 'opacity 0.2s',
          }} />
        </div>
      </div>
    </Html>
  )
}

export function FloatingCards({ formingT }: Props) {
  return (
    <>
      {CATEGORIES.map((cat, i) => {
        const { position, rotY } = getCardTransform(i)
        const row = Math.floor(i / 4)
        const staggerStart = 0.06 + row * 0.13
        const localT = Math.max(0, Math.min(1, (formingT - staggerStart) / 0.32))
        return (
          <FloatingCard
            key={cat.id}
            cat={cat}
            localT={localT}
            position={position}
            rotY={rotY}
          />
        )
      })}
    </>
  )
}
