// src/components/ui/PlatformBadge.tsx
import type { Platform } from '@/data/problems'

const META: Record<Platform, { color: string; label: string }> = {
  LeetCode:   { color: '#FF8000', label: 'LeetCode' },
  CodeChef:   { color: '#5B4638', label: 'CodeChef' },
  SPOJ:       { color: '#228B22', label: 'SPOJ' },
  HackerRank: { color: '#00EA64', label: 'HackerRank' },
  GFG:        { color: '#2F8D46', label: 'GFG' },
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const { color, label } = META[platform]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      background: `${color}14`, border: `1px solid ${color}35`,
      color, fontSize: '11px', fontWeight: 500,
      fontFamily: 'var(--font-mono)',
    }}>
      {label}
    </span>
  )
}
