'use client'
import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import { PATTERNS } from '@/data/patterns'

interface Props {
  formingT: number
}

// Only the 16 depth-1 category nodes
const CATEGORIES = PATTERNS.filter(p => p.depth === 1)

// Compute how many total sub-patterns each category has (all descendants)
function countDescendants(id: string): number {
  const node = PATTERNS.find(p => p.id === id)
  if (!node || node.childIds.length === 0) return 0
  return node.childIds.reduce((sum, cid) => sum + 1 + countDescendants(cid), 0)
}

// 4x4 grid positions with gentle concave arc
// col 0-3, row 0-3
// Center cards are closer (z=0), edge cards slightly back (z=-4)
function getCardPosition(index: number): [number, number, number, number] {
  const col = index % 4
  const row = Math.floor(index / 4)
  const x = (col - 1.5) * 9.5          // -14.25, -4.75, +4.75, +14.25
  const y = (1.5 - row) * 8.5          // +12.75, +4.25, -4.25, -12.75
  const z = -Math.pow(Math.abs(col - 1.5), 1.5) * 2.5  // center=0, edge=-~2.5
  const rotY = -(col - 1.5) * 0.11     // gentle inward tilt of edge cards
  return [x, y, z, rotY]
}

export function FloatingCards({ formingT }: Props) {
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <>
      {CATEGORIES.map((cat, i) => {
        const [x, y, z, rotY] = getCardPosition(i)
        const row = Math.floor(i / 4)
        // Stagger by row: row 0 at formingT=0.1, row 1 at 0.2, row 2 at 0.35, row 3 at 0.5
        const staggerStart = 0.08 + row * 0.14
        const localT = Math.max(0, Math.min(1, (formingT - staggerStart) / 0.3))
        const isHovered = hoveredId === cat.id
        const descendantCount = countDescendants(cat.id)

        return (
          <Html
            key={cat.id}
            position={[x, y, z]}
            rotation={[0, rotY, 0]}
            transform
            occlude={false}
            style={{
              opacity: localT,
              transform: `scale(${0.6 + localT * 0.4})`,
              transition: 'opacity 0.15s',
              pointerEvents: localT > 0.5 ? 'auto' : 'none',
            }}
          >
            <div
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => router.push(`/pattern/${cat.id}`)}
              style={{
                width: '148px',
                height: '108px',
                background: isHovered
                  ? `linear-gradient(135deg, rgba(20,20,35,0.92) 0%, rgba(10,10,22,0.95) 100%)`
                  : `linear-gradient(135deg, rgba(12,12,24,0.85) 0%, rgba(8,8,18,0.9) 100%)`,
                border: `1px solid ${isHovered ? cat.color : cat.color + '55'}`,
                borderRadius: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                boxShadow: isHovered
                  ? `0 0 28px ${cat.color}55, 0 0 8px ${cat.color}33, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : `0 0 12px ${cat.color}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
                transform: isHovered ? 'scale(1.06) translateZ(6px)' : 'scale(1) translateZ(0)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                userSelect: 'none',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              } as React.CSSProperties & { WebkitBackdropFilter: string }}
            >
              {/* Color accent dot + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: cat.color,
                  boxShadow: `0 0 8px ${cat.color}, 0 0 4px ${cat.color}`,
                  flexShrink: 0,
                }} />
                <span style={{
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.2,
                }}>
                  {cat.label}
                </span>
              </div>

              {/* Pattern count */}
              <div style={{
                color: cat.color + 'bb',
                fontSize: '11px',
                fontFamily: 'var(--font-geist-mono, monospace)',
                fontWeight: 500,
              }}>
                {descendantCount} patterns
              </div>

              {/* Bottom bar — colored accent line */}
              <div style={{
                height: '2px',
                background: `linear-gradient(90deg, ${cat.color}, ${cat.color}00)`,
                borderRadius: '2px',
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }} />
            </div>
          </Html>
        )
      })}
    </>
  )
}
