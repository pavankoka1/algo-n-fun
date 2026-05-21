// src/lib/og.tsx
//
// Shared building blocks for dynamic OG images. Every opengraph-image.tsx
// in the app uses these so the social preview visual language stays
// consistent across home, pattern, and problem cards.
//
// Constraints (Satori / next/og):
//   • Only flexbox layouts — no display: grid, no float.
//   • Every element with children MUST set `display: 'flex'`.
//   • A small CSS subset. Test changes locally before relying on them.

import type { ReactNode, CSSProperties } from 'react'

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

// ── Brand palette (mirrors globals.css) ────────────────────────────────────
const COLORS = {
  void:       '#03030A',
  surface:    '#0A0A14',
  textHigh:   '#F0F2FF',
  textMid:    'rgba(220, 226, 252, 0.78)',
  textDim:    'rgba(150, 160, 200, 0.62)',
  stroke:     'rgba(255, 255, 255, 0.08)',
  glowCyan:   'rgba(107, 169, 201, 0.32)',
  glowGold:   'rgba(245, 207, 122, 0.22)',
}

// ── <Frame> — every OG sits inside this dark space backdrop ────────────────
//
// Two soft radial glows (one cool, one warm) plus a centred dotted grid
// echo the home-page galaxy without trying to actually re-render the
// 3D scene (which Satori can't do).
//
export function Frame({
  children,
  accent = COLORS.glowCyan,
}: {
  children: ReactNode
  /** Hex / rgba accent for the pattern-specific cards. */
  accent?: string
}) {
  return (
    <div
      style={{
        width:        '100%',
        height:       '100%',
        display:      'flex',
        position:     'relative',
        background:   COLORS.void,
        fontFamily:   'sans-serif',
        color:        COLORS.textHigh,
        overflow:     'hidden',
      }}
    >
      {/* Cool radial glow (upper-left) */}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage: `radial-gradient(circle at 22% 28%, ${accent} 0%, transparent 48%)`,
          opacity: 0.85,
        }}
      />
      {/* Warm radial accent (lower-right) — subtle gold echo */}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage: `radial-gradient(circle at 82% 78%, ${COLORS.glowGold} 0%, transparent 42%)`,
        }}
      />
      {/* Dotted starfield grid */}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.35,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* Hairline border */}
      <div
        style={{
          position: 'absolute', inset: 18, display: 'flex',
          border: `1px solid ${COLORS.stroke}`,
          borderRadius: 24,
        }}
      />

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          width:    '100%',
          height:   '100%',
          display:  'flex',
          flexDirection: 'column',
          padding:  '64px 76px',
          zIndex:   1,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── <Brandmark> — top-left wordmark used in every OG ───────────────────────
export function Brandmark({ accent = COLORS.glowCyan }: { accent?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 14, height: 14, borderRadius: 999,
          background: accent,
          display: 'flex',
          boxShadow: `0 0 18px ${accent}`,
        }}
      />
      <span
        style={{
          fontSize: 24,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: COLORS.textMid,
          fontWeight: 600,
        }}
      >
        algo-n-fun
      </span>
    </div>
  )
}

// ── <Eyebrow> — small uppercase label above headline ───────────────────────
export function Eyebrow({
  label,
  color = COLORS.textDim,
  style,
}: {
  label: string
  color?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: 22,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color,
        fontWeight: 600,
        ...style,
      }}
    >
      {label}
    </div>
  )
}

// ── <Chip> — pill component for badges (difficulty, platform, depth) ───────
export function Chip({
  label,
  color,
  filled = false,
}: {
  label: string
  color: string
  filled?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderRadius: 999,
        background: filled ? color : `${color}22`,
        border: `1px solid ${color}66`,
        color: filled ? '#000' : color,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </div>
  )
}

export const OG_COLORS = COLORS
