// src/components/ui/Breadcrumb.tsx
import Link from 'next/link'

interface Crumb { label: string; href?: string }

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>›</span>}
          {c.href ? (
            <Link href={c.href} style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
              className="hover:text-[var(--text-primary)] transition-colors">
              {c.label}
            </Link>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
