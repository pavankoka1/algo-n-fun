// src/app/pattern/[slug]/[question]/opengraph-image.tsx
//
// Dynamic 1200×630 OG card for each problem page. Shows the difficulty +
// platform badges, the problem title, the pattern lineage, and a short
// "why this pattern" excerpt — all share-worthy at a glance.

import { ImageResponse } from 'next/og'
import { PATTERN_MAP } from '@/data/patterns'
import { PROBLEMS } from '@/data/problems'
import {
  Brandmark,
  Chip,
  Frame,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OG_COLORS,
} from '@/lib/og'
import { patternSlugForProblem } from '@/lib/seo'

export const runtime     = 'nodejs'
export const size        = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const DIFFICULTY_COLOR = {
  Easy:   '#7BB89B',
  Medium: '#D4B26C',
  Hard:   '#C77B6F',
} as const

export async function generateImageMetadata() {
  return PROBLEMS.map(p => ({
    id: p.id,
    alt: `${p.title} — ${p.difficulty} ${p.platform} · algo-n-fun`,
    size: OG_SIZE,
    contentType: OG_CONTENT_TYPE,
  }))
}

export default async function ProblemOG(
  { params }: { params: Promise<{ slug: string; question: string }> }
) {
  const { question } = await params
  const problem = PROBLEMS.find(p => p.id === question)
  if (!problem) {
    return new ImageResponse(
      (
        <Frame>
          <Brandmark />
          <div
            style={{
              display: 'flex', flexGrow: 1,
              alignItems: 'center', justifyContent: 'center',
              fontSize: 64, fontWeight: 800,
              color: OG_COLORS.textHigh,
            }}
          >
            Coding Problem
          </div>
        </Frame>
      ),
      { ...size }
    )
  }

  const node       = PATTERN_MAP[problem.patternId]
  const parent     = node?.parentId ? PATTERN_MAP[node.parentId] : null
  const accent     = node?.color ?? '#6BA9C9'
  const diffColor  = DIFFICULTY_COLOR[problem.difficulty]
  const slug       = patternSlugForProblem(problem.patternId)

  // Auto-fit title size based on length.
  const titleSize =
    problem.title.length > 60 ? 56 :
    problem.title.length > 40 ? 72 :
    problem.title.length > 24 ? 88 : 104

  return new ImageResponse(
    (
      <Frame accent={`${accent}66`}>
        {/* Top: brand + breadcrumb hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Brandmark accent={`${accent}aa`} />
          <span
            style={{
              fontSize: 20,
              color: OG_COLORS.textDim,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {parent ? `${parent.label} › ` : ''}{node?.label ?? 'DSA'}
          </span>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
          <Chip label={problem.difficulty} color={diffColor} filled />
          <Chip label={problem.platform}   color={accent} />
          {node && <Chip label={node.label} color={accent} />}
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            marginTop: 26,
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.04,
            color: OG_COLORS.textHigh,
            maxWidth: 1040,
          }}
        >
          {problem.title}
        </div>

        {/* Why-this-pattern excerpt */}
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 26,
            lineHeight: 1.45,
            color: OG_COLORS.textMid,
            maxWidth: 1020,
          }}
        >
          {truncate(problem.whyThisPattern, 180)}
        </div>

        {/* Spacer pushes the footer down */}
        <div style={{ display: 'flex', flexGrow: 1 }} />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 22,
            borderTop: `1px solid ${OG_COLORS.stroke}`,
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: OG_COLORS.textDim,
              display: 'flex',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            algo-n-fun · pattern-first practice
          </span>
          <span
            style={{
              fontSize: 22,
              color: accent,
              display: 'flex',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            /{slug}/{problem.id}
          </span>
        </div>
      </Frame>
    ),
    { ...size }
  )
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text
  const cut       = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : cut.length).trimEnd()}…`
}
