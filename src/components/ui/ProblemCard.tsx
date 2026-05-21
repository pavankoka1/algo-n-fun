// src/components/ui/ProblemCard.tsx
import type { Problem } from '@/data/problems'
import { DifficultyBadge } from './DifficultyBadge'
import { PlatformBadge } from './PlatformBadge'

interface Props {
  problem: Problem
  accentColor?: string
}

export function ProblemCard({ problem, accentColor = '#6BA9C9' }: Props) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${accentColor}18`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.18s, box-shadow 0.18s',
    }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <DifficultyBadge difficulty={problem.difficulty} />
        <PlatformBadge platform={problem.platform} />
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
        {problem.title}
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
        {problem.whyThisPattern}
      </p>
      <a
        href={problem.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 12px',
          borderRadius: 7,
          border: `1px solid ${accentColor}30`,
          background: 'transparent',
          color: accentColor,
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          textDecoration: 'none',
          width: 'fit-content',
          transition: 'background 0.15s',
        }}
      >
        Open on {problem.platform} ↗
      </a>
    </div>
  )
}
