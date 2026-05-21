// src/components/ui/DifficultyBadge.tsx
import type { Difficulty } from '@/data/problems'

const COLORS: Record<Difficulty, string> = {
  Easy:   '#74AE82',   // muted forest — matches palette
  Medium: '#C9A965',   // honey gold
  Hard:   '#C77B6F',   // terracotta — still reads as "warning" without screaming
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const color = COLORS[difficulty]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      background: `${color}18`, border: `1px solid ${color}40`,
      color, fontSize: '11px', fontWeight: 600,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
    }}>
      {difficulty}
    </span>
  )
}
