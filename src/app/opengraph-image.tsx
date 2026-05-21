// src/app/opengraph-image.tsx
//
// Default 1200×630 Open Graph image for the home page. Next picks this up
// by file convention and wires it to <meta property="og:image"> and the
// matching Twitter card. Generated on-demand via Satori (next/og) so we
// can pull live counts from the data layer at request time.
//
// If you want a per-route OG, drop another opengraph-image.tsx inside
// that route folder (we do that for /pattern/[slug] and /pattern/[slug]/[question]).

import { ImageResponse } from 'next/og'
import {
  Brandmark,
  Eyebrow,
  Frame,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OG_COLORS,
} from '@/lib/og'
import {
  SITE_TAGLINE,
  TOTAL_PATTERNS,
  TOTAL_PROBLEMS,
  TOTAL_CATEGORIES,
} from '@/lib/seo'

export const runtime     = 'nodejs'
export const alt         = `algo-n-fun — ${SITE_TAGLINE}`
export const size        = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <Frame>
        {/* Top row — brand + eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Brandmark />
          <Eyebrow label="Interactive DSA atlas" />
        </div>

        {/* Center stack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexGrow: 1,
            marginTop: 40,
          }}
        >
          <div
            style={{
              fontSize: 116,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: OG_COLORS.textHigh,
              display: 'flex',
            }}
          >
            Crack the Pattern.
          </div>
          <div
            style={{
              fontSize: 116,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              color: OG_COLORS.glowCyan,
              display: 'flex',
              marginTop: 6,
            }}
          >
            Own the Problem.
          </div>

          <div
            style={{
              marginTop: 38,
              fontSize: 30,
              lineHeight: 1.4,
              maxWidth: 920,
              color: OG_COLORS.textMid,
              display: 'flex',
            }}
          >
            A 3D galaxy of data-structure & algorithm patterns —
            navigate, study, and ship interview-ready solutions.
          </div>
        </div>

        {/* Bottom stat strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 56,
            marginTop: 32,
            paddingTop: 28,
            borderTop: `1px solid ${OG_COLORS.stroke}`,
          }}
        >
          <Stat value={`${TOTAL_PATTERNS}`} label="Patterns" />
          <Divider />
          <Stat value={`${TOTAL_PROBLEMS}+`} label="Curated problems" />
          <Divider />
          <Stat value={`${TOTAL_CATEGORIES}`} label="Categories" />
        </div>
      </Frame>
    ),
    { ...size }
  )
}

// ─── Local helpers ───────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: OG_COLORS.textHigh,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 18,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: OG_COLORS.textDim,
          marginTop: 4,
        }}
      >
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 56,
        background: OG_COLORS.stroke,
        display: 'flex',
      }}
    />
  )
}
