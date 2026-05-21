// src/app/pattern/[slug]/opengraph-image.tsx
//
// Dynamic 1200×630 OG card for each DSA pattern page. Generated at build
// time (we have `generateImageMetadata` indirectly via generateStaticParams
// on the page) and on-demand for any missed slugs.
//
// The card uses the pattern's category color as the accent — giving every
// share a tiny piece of brand consistency that visually links back to the
// 3D galaxy.

import { ImageResponse } from 'next/og'
import { PATTERN_MAP, PATTERNS } from '@/data/patterns'
import { CATEGORY_MAP } from '@/data/categories'
import { problemsByPatternOrSubtree } from '@/data/problems'
import {
  Brandmark,
  Chip,
  Eyebrow,
  Frame,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OG_COLORS,
} from '@/lib/og'

export const runtime     = 'nodejs'
export const size        = OG_SIZE
export const contentType = OG_CONTENT_TYPE

// Pre-render an OG for every pattern slug at build time.
export async function generateImageMetadata() {
  return PATTERNS.map(p => ({
    id: p.id,
    alt: `${p.label} — DSA Pattern · algo-n-fun`,
    size: OG_SIZE,
    contentType: OG_CONTENT_TYPE,
  }))
}

export default async function PatternOG(
  { params }: { params: { slug: string } }
) {
  const node     = PATTERN_MAP[params.slug]
  if (!node) {
    // Fall back to a generic card if someone hits an invalid slug.
    return new ImageResponse(
      (
        <Frame>
          <Brandmark />
          <div
            style={{
              display: 'flex',
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              fontWeight: 800,
              color: OG_COLORS.textHigh,
            }}
          >
            DSA Pattern
          </div>
        </Frame>
      ),
      { ...size }
    )
  }

  const category    = CATEGORY_MAP[node.category]
  const problemCount = problemsByPatternOrSubtree(node.id).length
  const accent      = `${node.color}66` // 40% opacity for the glow ring
  const depthLabel  = node.depth === 1 ? 'Family' : node.depth === 2 ? 'Pattern' : node.depth >= 3 ? 'Leaf' : 'Index'

  // Auto-fit headline size based on label length so long pattern names
  // don't overflow the canvas.
  const headlineSize =
    node.label.length > 28 ? 76 :
    node.label.length > 18 ? 92 :
    node.label.length > 12 ? 108 : 124

  return new ImageResponse(
    (
      <Frame accent={accent}>
        {/* Top: brand + depth eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Brandmark accent={accent} />
          <Eyebrow label={`${depthLabel} · depth ${node.depth}`} />
        </div>

        {/* Center: category chip + headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexGrow: 1,
            marginTop: 24,
          }}
        >
          {category && (
            <div style={{ display: 'flex', marginBottom: 22 }}>
              <Chip label={category.label} color={node.color} />
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: headlineSize,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
              color: OG_COLORS.textHigh,
              maxWidth: 1040,
            }}
          >
            {node.label}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 30,
              color: OG_COLORS.textMid,
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            {problemCount > 0
              ? `${problemCount} curated coding-interview problem${problemCount > 1 ? 's' : ''} with the pattern explained.`
              : 'A DSA pattern in the algo-n-fun atlas.'}
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 28,
            paddingTop: 24,
            borderTop: `1px solid ${OG_COLORS.stroke}`,
          }}
        >
          <span style={{ fontSize: 22, color: OG_COLORS.textDim, display: 'flex', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            algo-n-fun · DSA pattern atlas
          </span>
          <span style={{ fontSize: 22, color: node.color, display: 'flex', fontWeight: 700, letterSpacing: '0.06em' }}>
            /pattern/{node.id}
          </span>
        </div>
      </Frame>
    ),
    { ...size }
  )
}
